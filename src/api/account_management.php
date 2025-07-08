<?php
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Xử lý preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Kiểm tra phương thức request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(405, ['message' => 'Phương thức không được phép. Chỉ chấp nhận POST.']);
    exit;
}

// Xác thực người dùng
$loggedInUserId = $_SESSION['user_id'] ?? null;
if (!$loggedInUserId) {
    sendResponse(401, ['message' => 'Yêu cầu đăng nhập để quản lý tài khoản.']);
    exit;
}

// Xử lý dữ liệu đầu vào
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? null;
$password = $data['password'] ?? null;

// Xác thực dữ liệu
if (!$action || !in_array($action, ['deactivate_account', 'delete_account'])) {
    sendResponse(400, ['message' => 'Hành động không hợp lệ. Chỉ hỗ trợ deactivate_account hoặc delete_account.']);
    exit;
}

if (!$password) {
    sendResponse(400, ['message' => 'Yêu cầu xác nhận mật khẩu để thực hiện hành động này.']);
    exit;
}

// Kết nối cơ sở dữ liệu
$db = getDbConnection();

try {
    // Lấy thông tin người dùng hiện tại
    $stmt = $db->prepare("SELECT password, status FROM users WHERE id = ?");
    $stmt->execute([$loggedInUserId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendResponse(404, ['message' => 'Không tìm thấy người dùng.']);
        exit;
    }

    // Kiểm tra trạng thái tài khoản
    if ($user['status'] !== 'active') {
         sendResponse(400, ['message' => 'Tài khoản này không ở trạng thái hoạt động.']);
         exit;
    }

    $currentPasswordHash = $user['password'];

    // Xác minh mật khẩu
    if (!password_verify($password, $currentPasswordHash)) {
        sendResponse(403, ['message' => 'Mật khẩu xác nhận không chính xác.']);
        exit;
    }

    // Thực hiện hành động được yêu cầu
    $newStatus = null;
    $successMessage = '';

    if ($action === 'deactivate_account') {
        $newStatus = 'inactive';
        $successMessage = 'Tài khoản đã được vô hiệu hóa thành công.';
    } elseif ($action === 'delete_account') {
        $newStatus = 'inactive'; 
        $successMessage = 'Tài khoản đã được vô hiệu hóa (thay cho xóa).'; 
    }

    if ($newStatus) {
        $updateStmt = $db->prepare("UPDATE users SET status = ? WHERE id = ?");
        $success = $updateStmt->execute([$newStatus, $loggedInUserId]);

        if ($success) {
            session_destroy();
            sendResponse(200, ['message' => $successMessage]);
        } else {
            sendResponse(500, ['message' => 'Không thể cập nhật trạng thái tài khoản trong cơ sở dữ liệu.']);
        }
    } else {
         sendResponse(500, ['message' => 'Lỗi logic nội bộ: không xác định được trạng thái mới.']);
    }

} catch (PDOException $e) {
    error_log("Lỗi quản lý tài khoản ($action): " . $e->getMessage());
    sendResponse(500, ['message' => 'Lỗi cơ sở dữ liệu khi thực hiện quản lý tài khoản.']);
}

?>
