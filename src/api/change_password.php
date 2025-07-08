<?php
// API Đổi Mật Khẩu - Cho phép người dùng thay đổi mật khẩu

require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(405, ['message' => 'Phương thức không được phép. Chỉ chấp nhận POST.']);
    exit;
}

if (!isUserLoggedIn()) {
    sendResponse(false, 'Bạn phải đăng nhập để đổi mật khẩu', null, 401);
    exit;
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    $data = $_POST;
}

$current_password = isset($data['current_password']) ? $data['current_password'] : '';
$new_password = isset($data['new_password']) ? $data['new_password'] : '';
$confirm_password = isset($data['confirm_password']) ? $data['confirm_password'] : '';

// Kiểm tra các trường bắt buộc
if (!$current_password || !$new_password || !$confirm_password) {
    sendResponse(false, 'Vui lòng nhập đầy đủ các trường');
    exit;
}

// Kiểm tra độ dài mật khẩu
if (strlen($new_password) < 8) {
    sendResponse(false, 'Mật khẩu mới phải có ít nhất 8 ký tự');
    exit;
}

// Kiểm tra độ mạnh mật khẩu
if (!preg_match('/[A-Z]/', $new_password) || !preg_match('/[a-z]/', $new_password) || !preg_match('/[0-9]/', $new_password)) {
    sendResponse(false, 'Mật khẩu mới phải có chữ hoa, chữ thường và số');
    exit;
}

// Kiểm tra xác nhận mật khẩu
if ($new_password !== $confirm_password) {
    sendResponse(false, 'Xác nhận mật khẩu không khớp');
    exit;
}
// Xác thực mật khẩu hiện tại
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->prepare('SELECT password FROM users WHERE id = :id');
$stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($current_password, $user['password'])) {
    sendResponse(false, 'Mật khẩu hiện tại không đúng');
    exit;
}

// Cập nhật mật khẩu mới
$new_hash = password_hash($new_password, PASSWORD_DEFAULT);
$stmt2 = $conn->prepare('UPDATE users SET password = :password WHERE id = :id');
$stmt2->bindParam(':password', $new_hash);
$stmt2->bindParam(':id', $user_id, PDO::PARAM_INT);

if ($stmt2->execute()) {
    sendResponse(true, 'Đổi mật khẩu thành công');
} else {
    sendResponse(false, 'Lỗi khi đổi mật khẩu');
}
?>
