<?php
// Tiện ích API cốt lõi - Cung cấp các hàm phổ biến cho phản hồi API

ini_set('display_errors', 0);
error_reporting(E_ALL);

// Ngăn chặn đăng ký nhiều lần
if (!defined('API_UTILS_LOADED')) {
    define('API_UTILS_LOADED', true);

    // Đăng ký xử lý lỗi tùy chỉnh để chuyển đổi lỗi PHP thành phản hồi JSON
    set_error_handler(function($errno, $errstr, $errfile, $errline) {
        if (!(error_reporting() & $errno)) {
            return false;
        }
        
        $error_type = 'Lỗi không xác định';
        switch ($errno) {
            case E_ERROR:
            case E_USER_ERROR:
                $error_type = 'Lỗi nghiêm trọng';
                $status_code = 500;
                break;
            case E_WARNING:
            case E_USER_WARNING:
                $error_type = 'Cảnh báo';
                $status_code = 500;
                break;
            case E_NOTICE:
            case E_USER_NOTICE:
                $error_type = 'Thông báo';
                $status_code = 200;
                error_log("PHP $error_type: $errstr trong $errfile tại dòng $errline");
                return true;
                break;
            default:
                $error_type = 'Lỗi';
                $status_code = 500;
                break;
        }
        
        error_log("PHP $error_type: $errstr trong $errfile tại dòng $errline");
        
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        
        header('Content-Type: application/json');
        http_response_code($status_code);
        echo json_encode([
            'success' => false,
            'message' => "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.",
            'debug' => [
                'type' => $error_type,
                'message' => $errstr,
                'file' => basename($errfile),
                'line' => $errline
            ]
        ]);
        
        exit;
    });

    // Đăng ký hàm shutdown để bắt lỗi nghiêm trọng
    register_shutdown_function(function() {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_COMPILE_ERROR, E_CORE_ERROR])) {
            if (ob_get_level() > 0) {
                ob_end_clean();
            }
            
            error_log("PHP Lỗi nghiêm trọng: {$error['message']} trong {$error['file']} tại dòng {$error['line']}");
            
            if (!headers_sent()) {
                header('Content-Type: application/json');
                http_response_code(500);
            }
            
            echo json_encode([
                'success' => false,
                'message' => "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.",
                'debug' => [
                    'type' => 'Lỗi nghiêm trọng',
                    'message' => $error['message'],
                    'file' => basename($error['file']),
                    'line' => $error['line']
                ]
            ]);
            
            exit;
        }
    });
}

/**
 * Gửi phản hồi JSON với mã trạng thái HTTP phù hợp
 */
function sendResponse($success, $message, $data = null, $status_code = null) {
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    
    if ($status_code === null) {
        $status_code = $success ? 200 : 400;
    }
    
    if (!headers_sent()) {
        http_response_code($status_code);
        header('Content-Type: application/json');
    }
    
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Xử lý lỗi API và trả về phản hồi phù hợp
 */
function handleApiError($e, $context = '') {
    $error_message = $context ? "$context: " . $e->getMessage() : $e->getMessage();
    
    error_log($error_message . " trong " . $e->getFile() . " tại dòng " . $e->getLine());
    
    $status_code = 500;
    
    if ($e instanceof PDOException) {
        $status_code = 500;
        $error_message = "Đã xảy ra lỗi cơ sở dữ liệu. Vui lòng thử lại sau.";
    } elseif ($e instanceof InvalidArgumentException) {
        $status_code = 400;
    } elseif ($e instanceof RuntimeException) {
        $status_code = 500;
    }
    
    sendResponse(false, $error_message, null, $status_code);
}

/**
 * Xác thực các tham số bắt buộc trong yêu cầu
 */
function validateRequiredParams($required_params, $data) {
    foreach ($required_params as $param) {
        if (!isset($data[$param]) || (is_string($data[$param]) && trim($data[$param]) === '')) {
            sendResponse(false, "Thiếu tham số bắt buộc: $param", null, 400);
            return false;
        }
    }
    
    return true;
}

/**
 * Lấy dữ liệu yêu cầu từ JSON input hoặc POST/GET parameters
 */
function getRequestData($method = 'POST') {
    $json_data = file_get_contents('php://input');
    
    if (!empty($json_data)) {
        $data = json_decode($json_data, true);
        
        if (json_last_error() === JSON_ERROR_NONE) {
            return $data;
        }
    }
    
    return $method === 'POST' ? $_POST : $_GET;
}

/**
 * Hàm debug để kiểm tra phản hồi JSON
 */
function debugApiResponse($data) {
    error_log("Debug phản hồi API: " . json_encode($data));
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Lỗi mã hóa JSON: " . json_last_error_msg());
        sendResponse(false, "Đã xảy ra lỗi mã hóa JSON", null, 500);
    }
}
?>
