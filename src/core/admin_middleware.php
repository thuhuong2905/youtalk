<?php
/**
 * Admin Middleware - Kiểm tra quyền admin và bảo mật
 * Tận dụng session_handler.php và api_utils.php hiện có
 */

// Tận dụng session handler và api utils đã có
require_once __DIR__ . '/session_handler.php';
require_once __DIR__ . '/api_utils.php';

/**
 * Kiểm tra quyền admin - Tận dụng isUserLoggedIn() từ session_handler.php
 */
function requireAdminRole($send_response = true) {
    // Tận dụng hàm isUserLoggedIn() đã có
    if (!isUserLoggedIn()) {
        if ($send_response) {
            sendResponse(false, 'Yêu cầu đăng nhập để truy cập chức năng này', null, 401);
        }
        return false;
    }
    
    // Kiểm tra role admin
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        if ($send_response) {
            sendResponse(false, 'Bạn không có quyền truy cập chức năng admin', null, 403);
        }
        return false;
    }
    
    return true;
}

/**
 * Kiểm tra quyền admin hoặc chủ sở hữu content
 * Tận dụng getCurrentUserId() từ session_handler.php
 */
function requireAdminOrOwner($content_user_id, $send_response = true) {
    // Tận dụng hàm isUserLoggedIn() đã có
    if (!isUserLoggedIn()) {
        if ($send_response) {
            sendResponse(false, 'Yêu cầu đăng nhập để thực hiện hành động này', null, 401);
        }
        return false;
    }
    
    $current_user_id = getCurrentUserId(); // Tận dụng hàm đã có
    $is_admin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
    $is_owner = $current_user_id == $content_user_id;
    
    if (!$is_admin && !$is_owner) {
        if ($send_response) {
            sendResponse(false, 'Bạn không có quyền thực hiện hành động này', null, 403);
        }
        return false;
    }
    
    return true;
}

/**
 * Lấy thông tin admin hiện tại - Tận dụng session hiện có
 */
function getCurrentAdmin() {
    if (!requireAdminRole(false)) {
        return null;
    }
    
    return [
        'user_id' => getCurrentUserId(), // Tận dụng hàm đã có
        'username' => $_SESSION['username'] ?? null,
        'email' => $_SESSION['email'] ?? null,
        'full_name' => $_SESSION['full_name'] ?? null,
        'role' => $_SESSION['role']
    ];
}

/**
 * Kiểm tra quyền admin cho API endpoint - Wrapper tối ưu
 */
function adminApiGuard() {
    // Set headers cho API - tận dụng pattern từ api_utils.php
    if (!headers_sent()) {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
    
    // Handle preflight requests - pattern từ các API file hiện có
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
    
    // Kiểm tra quyền admin
    return requireAdminRole(true);
}

/**
 * Log hoạt động admin - Tận dụng error_log pattern hiện có
 */
function logAdminAction($action, $details = null, $success = true, $error_message = null) {
    $admin = getCurrentAdmin();
    if (!$admin) return;
    
    $status = $success ? 'SUCCESS' : 'FAILED';
    $log_message = sprintf(
        '[Admin Action] %s | User: %s (ID: %d) | Action: %s',
        $status,
        $admin['username'] ?? 'Unknown',
        $admin['user_id'],
        $action
    );
    
    if ($details) {
        $log_message .= ' | Details: ' . (is_array($details) ? json_encode($details) : $details);
    }
    
    if (!$success && $error_message) {
        $log_message .= ' | Error: ' . $error_message;
    }
    
    // Tận dụng error_log pattern từ session_handler.php
    error_log($log_message);
}

/**
 * Validate admin request data - Tận dụng pattern từ api_utils.php
 */
function validateAdminRequest($required_fields = [], $data = null) {
    if ($data === null) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            $data = $_POST;
        }
    }
    
    // Tận dụng validateRequiredParams() nếu có, hoặc implement tương tự
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
            sendResponse(false, "Thiếu tham số bắt buộc: $field", null, 400);
            return false;
        }
    }
    
    return $data;
}

/**
 * Wrapper để bảo vệ admin endpoint - Tất cả trong một
 */
function protectAdminEndpoint($required_fields = []) {
    // Setup API headers và kiểm tra quyền
    adminApiGuard();
    
    // Validate request data nếu cần
    if (!empty($required_fields)) {
        return validateAdminRequest($required_fields);
    }
    
    return true;
}

/**
 * Helper function để kiểm tra permission cụ thể
 */
function checkAdminPermission($permission_type, $context = []) {
    if (!requireAdminRole(false)) {
        return false;
    }
    
    // Có thể mở rộng cho fine-grained permissions sau này
    switch ($permission_type) {
        case 'manage_users':
        case 'manage_content':
        case 'manage_categories':
        case 'view_dashboard':
            return true; // Admin có tất cả quyền hiện tại
            
        default:
            return false;
    }
}

/**
 * Rate limiting cho admin actions (để tránh abuse)
 */
function checkAdminRateLimit($action, $limit = 100, $window = 3600) {
    if (!requireAdminRole(false)) {
        return false;
    }
    
    $admin = getCurrentAdmin();
    $key = "admin_rate_limit_{$admin['user_id']}_{$action}";
    
    // Đơn giản hóa: dùng file-based rate limiting
    $rate_file = sys_get_temp_dir() . "/{$key}.txt";
    $current_time = time();
    
    if (file_exists($rate_file)) {
        $data = json_decode(file_get_contents($rate_file), true);
        $window_start = $current_time - $window;
        
        // Lọc ra những request trong window hiện tại
        $recent_requests = array_filter($data['requests'] ?? [], function($timestamp) use ($window_start) {
            return $timestamp > $window_start;
        });
        
        if (count($recent_requests) >= $limit) {
            sendResponse(false, 'Quá nhiều request. Vui lòng thử lại sau.', null, 429);
            return false;
        }
        
        $recent_requests[] = $current_time;
        file_put_contents($rate_file, json_encode(['requests' => $recent_requests]));
    } else {
        file_put_contents($rate_file, json_encode(['requests' => [$current_time]]));
    }
    
    return true;
}

?>
