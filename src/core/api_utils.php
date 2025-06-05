<?php
// Core API Utilities
// Provides common functions for API responses and error handling

// Set error handling to prevent PHP errors from being output as HTML
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Prevent multiple registrations
if (!defined('API_UTILS_LOADED')) {
    define('API_UTILS_LOADED', true);

    // Register a custom error handler to convert PHP errors to JSON responses
    set_error_handler(function($errno, $errstr, $errfile, $errline) {
        // Only handle errors that are part of the current error reporting level
        if (!(error_reporting() & $errno)) {
            return false;
        }
        
        $error_type = 'Unknown Error';
        switch ($errno) {
            case E_ERROR:
            case E_USER_ERROR:
                $error_type = 'Fatal Error';
                $status_code = 500;
                break;
            case E_WARNING:
            case E_USER_WARNING:
                $error_type = 'Warning';
                $status_code = 500;
                break;
            case E_NOTICE:
            case E_USER_NOTICE:
                $error_type = 'Notice';
                // Changed from 500 to 200 for notices - they shouldn't cause server errors
                $status_code = 200;
                // Just log the notice and continue execution
                error_log("PHP $error_type: $errstr in $errfile on line $errline");
                return true; // Continue execution
                break;
            default:
                $error_type = 'Error';
                $status_code = 500;
                break;
        }
        
        // Log the error for debugging
        error_log("PHP $error_type: $errstr in $errfile on line $errline");
        
        // Clear any output buffer before sending JSON
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        
        // Send JSON response instead of HTML error
        header('Content-Type: application/json');
        http_response_code($status_code);
        echo json_encode([
            'success' => false,
            'message' => "Server error occurred. Please try again later.",
            'debug' => [
                'type' => $error_type,
                'message' => $errstr,
                'file' => basename($errfile),
                'line' => $errline
            ]
        ]);
        
        exit; // Stop execution after error
    });

    // Register a shutdown function to catch fatal errors
    register_shutdown_function(function() {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_COMPILE_ERROR, E_CORE_ERROR])) {
            // Clear any output that might have been sent
            if (ob_get_level() > 0) {
                ob_end_clean();
            }
            
            // Log the error for debugging
            error_log("PHP Fatal Error: {$error['message']} in {$error['file']} on line {$error['line']}");
            
            // Send JSON response instead of HTML error
            if (!headers_sent()) {
                header('Content-Type: application/json');
                http_response_code(500);
            }
            
            echo json_encode([
                'success' => false,
                'message' => "Server error occurred. Please try again later.",
                'debug' => [
                    'type' => 'Fatal Error',
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
 * Send a JSON response with appropriate HTTP status code
 * 
 * @param bool $success Whether the request was successful
 * @param string $message Message to include in the response
 * @param mixed $data Optional data to include in the response
 * @param int $status_code HTTP status code (default: 200 for success, 400 for failure)
 */
function sendResponse($success, $message, $data = null, $status_code = null) {
    // Clear any output buffer before sending JSON
    if (ob_get_level() > 0) {
        ob_end_clean();
    }
    
    // Set default status code based on success
    if ($status_code === null) {
        $status_code = $success ? 200 : 400;
    }
    
    // Set HTTP status code and content type (only if headers not sent)
    if (!headers_sent()) {
        http_response_code($status_code);
        header('Content-Type: application/json');
    }
    
    // Prepare response data
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    // Add data if provided
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    // Output JSON response
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Handle API errors and return appropriate response
 * 
 * @param Exception $e The exception that occurred
 * @param string $context Context where the error occurred
 */
function handleApiError($e, $context = '') {
    $error_message = $context ? "$context: " . $e->getMessage() : $e->getMessage();
    
    // Log error for debugging
    error_log($error_message . " in " . $e->getFile() . " on line " . $e->getLine());
    
    // Determine status code based on exception type
    $status_code = 500; // Default to internal server error
    
    if ($e instanceof PDOException) {
        // Database errors
        $status_code = 500;
        $error_message = "Database error occurred. Please try again later.";
    } elseif ($e instanceof InvalidArgumentException) { // Fixed: use elseif
        // Invalid input
        $status_code = 400;
    } elseif ($e instanceof RuntimeException) { // Fixed: use elseif
        // Runtime errors
        $status_code = 500;
    }
    
    // Send error response
    sendResponse(false, $error_message, null, $status_code);
}

/**
 * Validate required parameters in request
 * 
 * @param array $required_params List of required parameter names
 * @param array $data Data to check for required parameters
 * @return bool True if all required parameters are present and not empty
 */
function validateRequiredParams($required_params, $data) {
    foreach ($required_params as $param) {
        if (!isset($data[$param]) || (is_string($data[$param]) && trim($data[$param]) === '')) {
            sendResponse(false, "Missing required parameter: $param", null, 400);
            return false;
        }
    }
    
    return true;
}

/**
 * Get request data from either JSON input or POST/GET parameters
 * 
 * @param string $method Request method to check (POST or GET)
 * @return array Request data
 */
function getRequestData($method = 'POST') {
    // Try to get JSON input first
    $json_data = file_get_contents('php://input');
    
    if (!empty($json_data)) {
        $data = json_decode($json_data, true);
        
        // If JSON parsing was successful, return it
        if (json_last_error() === JSON_ERROR_NONE) {
            return $data;
        }
    }
    
    // If JSON parsing failed or no JSON data, use POST or GET data
    return $method === 'POST' ? $_POST : $_GET;
}

/**
 * Debug function to check if we're outputting JSON correctly
 */
function debugApiResponse($data) {
    error_log("API Response Debug: " . json_encode($data));
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON Encoding Error: " . json_last_error_msg());
        sendResponse(false, "JSON encoding error occurred", null, 500);
    }
}
?>
