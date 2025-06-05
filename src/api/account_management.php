<?php
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/db_connect.php';

// Set header to return JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production
header('Access-Control-Allow-Methods: POST, OPTIONS'); // Use POST for these actions
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(405, ['message' => 'Phương thức không được phép. Chỉ chấp nhận POST.']);
    exit;
}

// --- Authentication ---
$loggedInUserId = $_SESSION['user_id'] ?? null;
if (!$loggedInUserId) {
    sendResponse(401, ['message' => 'Yêu cầu đăng nhập để quản lý tài khoản.']);
    exit;
}

// --- Input Handling ---
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? null;
$password = $data['password'] ?? null; // Require password confirmation for sensitive actions

// --- Validation ---
if (!$action || !in_array($action, ['deactivate_account', 'delete_account'])) {
    sendResponse(400, ['message' => 'Hành động không hợp lệ. Chỉ hỗ trợ deactivate_account hoặc delete_account.']);
    exit;
}

if (!$password) {
    sendResponse(400, ['message' => 'Yêu cầu xác nhận mật khẩu để thực hiện hành động này.']);
    exit;
}

// --- Database Interaction ---
$db = getDbConnection();

try {
    // 1. Fetch current password hash from DB to verify
    $stmt = $db->prepare("SELECT password, status FROM users WHERE id = ?");
    $stmt->execute([$loggedInUserId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendResponse(404, ['message' => 'Không tìm thấy người dùng.']);
        exit;
    }

    // Check if account is already inactive or banned
    if ($user['status'] !== 'active') {
         sendResponse(400, ['message' => 'Tài khoản này không ở trạng thái hoạt động.']);
         exit;
    }

    $currentPasswordHash = $user['password'];

    // 2. Verify provided password
    if (!password_verify($password, $currentPasswordHash)) {
        sendResponse(403, ['message' => 'Mật khẩu xác nhận không chính xác.']);
        exit;
    }

    // 3. Perform the requested action
    $newStatus = null;
    $successMessage = '';

    if ($action === 'deactivate_account') {
        $newStatus = 'inactive';
        $successMessage = 'Tài khoản đã được vô hiệu hóa thành công.';
    } elseif ($action === 'delete_account') {
        // Option 1: Mark as deleted (Safer)
        $newStatus = 'deleted'; // Requires adding 'deleted' to the ENUM in create_table.sql
        // Option 2: Actually delete (More complex due to foreign keys)
        // For now, we use 'inactive' as 'deleted' is not in the original schema provided
        // $newStatus = 'inactive'; // Using inactive as a proxy for deletion for now
        // $successMessage = 'Tài khoản đã được đánh dấu xóa thành công.';
        
        // Let's stick to 'inactive' as 'deleted' wasn't in the provided schema for users.status
        $newStatus = 'inactive'; 
        $successMessage = 'Tài khoản đã được vô hiệu hóa (thay cho xóa).'; 
        // If 'deleted' status is added later, change this line.
    }

    if ($newStatus) {
        $updateStmt = $db->prepare("UPDATE users SET status = ? WHERE id = ?");
        $success = $updateStmt->execute([$newStatus, $loggedInUserId]);

        if ($success) {
            // Destroy the session to log the user out
            session_destroy();
            sendResponse(200, ['message' => $successMessage]);
        } else {
            sendResponse(500, ['message' => 'Không thể cập nhật trạng thái tài khoản trong cơ sở dữ liệu.']);
        }
    } else {
         // Should not happen due to initial action check, but as a safeguard
         sendResponse(500, ['message' => 'Lỗi logic nội bộ: không xác định được trạng thái mới.']);
    }

} catch (PDOException $e) {
    error_log("Account Management Error ($action): " . $e->getMessage());
    sendResponse(500, ['message' => 'Lỗi cơ sở dữ liệu khi thực hiện quản lý tài khoản.']);
}

?>
