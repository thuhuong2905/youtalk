<?php
// Quản lý phiên làm việc bảo mật

ini_set('session.save_path', 'C:/xampp/tmp');
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0);

session_name('YOUTALK_SESSION');

if (session_status() == PHP_SESSION_NONE) {
    session_start();
    if (defined('DEBUG_SESSION') && ('DEBUG_SESSION')) {
        error_log('[Session Handler] Phiên đã bắt đầu. Đường dẫn: ' . session_save_path() . ', Trạng thái: ' . session_status() . ', ID: ' . session_id());
        error_log('[Session Handler] Dữ liệu phiên hiện tại: ' . print_r($_SESSION, true));
        error_log('[Session Handler] Dữ liệu cookie hiện tại: ' . print_r($_COOKIE, true));
    }
}


/**
 * Tạo lại ID phiên để ngăn chặn tấn công session fixation
 */
function regenerateSessionId() {
    if (session_status() == PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
        if (defined('DEBUG_SESSION') && ('DEBUG_SESSION')) {
            error_log('[Session Handler] ID phiên đã được tạo lại. ID mới: ' . session_id());
        }
    }
}

/**
 * Kiểm tra người dùng có đang đăng nhập không
 */
function isUserLoggedIn() {
    $isLoggedIn = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    if (defined('DEBUG_SESSION') && ('DEBUG_SESSION')) {
        error_log('[Session Handler] Kiểm tra trạng thái đăng nhập. User ID đã đặt: ' . (isset($_SESSION['user_id']) ? 'Có' : 'Không') . ', Không rỗng: ' . (!empty($_SESSION['user_id']) ? 'Có' : 'Không') . ', Kết quả: ' . ($isLoggedIn ? 'Đã đăng nhập' : 'Chưa đăng nhập'));
    }
    return $isLoggedIn;
}

/**
 * Lấy ID người dùng hiện tại từ phiên
 */
function getCurrentUserId() {
    return isUserLoggedIn() ? $_SESSION['user_id'] : null;
}

/**
 * Hủy phiên hiện tại và tất cả dữ liệu liên quan
 */
function destroySession() {
    if (session_status() == PHP_SESSION_ACTIVE) {
        $sessionId = session_id();
        $sessionData = print_r($_SESSION, true);
        error_log('[Session Handler] Đang hủy phiên. ID: ' . $sessionId . ', Dữ liệu: ' . $sessionData);

        $_SESSION = array();

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
             error_log('[Session Handler] Cookie phiên đã được xóa.');
        }

        session_destroy();
        error_log('[Session Handler] Phiên đã được hủy.');
    } else {
         error_log('[Session Handler] Cố gắng hủy phiên, nhưng không tìm thấy phiên hoạt động.');
    }
}
?>

