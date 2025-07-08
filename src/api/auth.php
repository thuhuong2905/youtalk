<?php
// API xác thực - Xử lý đăng ký, đăng nhập, đăng xuất và kiểm tra trạng thái

require_once '../config/database.php';
require_once '../core/db_connect.php';
require_once '../core/api_utils.php';
require_once '../core/session_handler.php';
require_once '../core/classes/User.php';

header('Content-Type: application/json');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Xử lý preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

$db = new Database();
$conn = $db->getConnection();

$user = new User($conn);

// Xử lý các hành động khác nhau
switch ($action) {
    case 'register':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $data = $_POST;
        }
        
        // Xác thực các trường bắt buộc
        if (!isset($data['username']) || empty(trim($data['username']))) {
            sendResponse(false, 'Tên người dùng là bắt buộc', null, 400);
            break;
        }
        if (!isset($data['email']) || empty(trim($data['email']))) {
            sendResponse(false, 'Email là bắt buộc', null, 400);
            break;
        }
        if (!isset($data['password']) || empty($data['password'])) {
            sendResponse(false, 'Mật khẩu là bắt buộc', null, 400);
            break;
        }
        if (!isset($data['full_name']) || empty(trim($data['full_name']))) {
            sendResponse(false, 'Họ tên là bắt buộc', null, 400);
            break;
        }
        
        // Xác thực định dạng email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            sendResponse(false, 'Định dạng email không hợp lệ', null, 400);
            break;
        }
        
        // Kiểm tra tên người dùng đã tồn tại
        if ($user->usernameExists($data['username'])) {
            sendResponse(false, 'Tên đăng nhập đã tồn tại', null, 409);
            break;
        }
        
        // Kiểm tra email đã tồn tại
        if ($user->emailExists($data['email'])) {
            sendResponse(false, 'Email đã tồn tại', null, 409);
            break;
        }
        
        // Đăng ký người dùng
        $result = $user->register($data['username'], $data['full_name'], $data['email'], $data['password']);
        
        if ($result['success']) {
            // Tự động đăng nhập sau khi đăng ký
            $_SESSION['user_id'] = $result['user_id'];
            $_SESSION['username'] = $data['username'];
            $_SESSION['email'] = $data['email'];
            $_SESSION['role'] = 'user';
            
            session_regenerate_id(true);

            sendResponse(true, 'Đăng ký thành công', [
                'user_id' => $result['user_id'],
                'username' => $data['username'],
                'email' => $data['email'],
                'role' => 'user'
            ]);
        } else {
            sendResponse(false, $result['message'], null, 500);
        }
        break;
        
    case 'login':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $data = $_POST;
        }

        // Kiểm tra email hoặc tên người dùng
        $loginIdentifier = null;
        if (isset($data['email']) && !empty(trim($data['email']))) {
            $loginIdentifier = trim($data['email']);
        } elseif (isset($data['username']) && !empty(trim($data['username']))) {
            $loginIdentifier = trim($data['username']);
        }

        // Xác thực các trường bắt buộc
        if ($loginIdentifier === null) {
            sendResponse(false, 'Email hoặc tên người dùng là bắt buộc', null, 400);
            break;
        }
        
        if (!isset($data['password']) || empty($data['password'])) {
            sendResponse(false, 'Mật khẩu là bắt buộc', null, 400);
            break;
        }
        
        // Đăng nhập người dùng
        $result = $user->verifyLogin($loginIdentifier, $data['password']);
        
        if ($result['success']) {
            $_SESSION['user_id'] = $result['user_id'];
            $_SESSION['username'] = $result['username'];
            $_SESSION['email'] = $result['email'];
            $_SESSION['role'] = $result['role'];
            if (isset($result['full_name'])) {
                $_SESSION['full_name'] = $result['full_name'];
            }
            session_regenerate_id(true);

            // Xử lý 'nhớ tôi'
            if (isset($data['remember_me']) && $data['remember_me']) {
                $lifetime = 60 * 60 * 24 * 30;
                session_set_cookie_params($lifetime);
                session_regenerate_id(true);
            }
            sendResponse(true, 'Đăng nhập thành công', [
                'user_id' => $result['user_id'],
                'username' => $result['username'],
                'email' => $result['email'],
                'full_name' => $result['full_name'] ?? null,
                'role' => $result['role'],
                'profile_picture' => $result['profile_picture'] ?? null
            ]);
        } else {
            sendResponse(false, $result['message'], null, 401);
        }
        break;
        
    case 'logout':
        session_unset();
        session_destroy();
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        sendResponse(true, 'Đăng xuất thành công');
        break;
        
    case 'status':
        // Kiểm tra người dùng có đăng nhập không
        if (isUserLoggedIn()) {
            $user_id = $_SESSION['user_id'];
            $result = $user->getUserById($user_id);
            
            if ($result['success']) {
                sendResponse(true, 'Người dùng đã được xác thực', [
                    'authenticated' => true,
                    'user' => [
                        'user_id' => $result['data']['id'],
                        'username' => $result['data']['username'],
                        'email' => $result['data']['email'],
                        'full_name' => $result['data']['full_name'] ?? null,
                        'role' => $result['data']['role'],
                        'profile_picture' => $result['data']['profile_picture'] ?? null
                    ]
                ]);
            } else {
                session_unset();
                session_destroy();
                
                sendResponse(true, 'Người dùng chưa được xác thực', [
                    'authenticated' => false
                ]);
            }
        } else {
            sendResponse(true, 'Người dùng chưa được xác thực', [
                'authenticated' => false
            ]);
        }
        break;
        
    case 'update_profile':
        // Kiểm tra người dùng có đăng nhập không
        if (!isUserLoggedIn()) {
            sendResponse(false, 'Bạn phải đăng nhập để cập nhật hồ sơ', null, 401);
            break;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $data = $_POST;
        }
        
        $userData = [
            'id' => $_SESSION['user_id']
        ];
        
        // Thêm các trường tùy chọn nếu được cung cấp
        if (isset($data['email']) && !empty(trim($data['email']))) {
            $newEmail = trim($data['email']);
            // Xác thực định dạng email
            if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
                sendResponse(false, 'Định dạng email không hợp lệ', null, 400);
                break;
            }
            
            // Kiểm tra email đã tồn tại
            if ($user->emailExists($newEmail, $_SESSION['user_id'])) {
                sendResponse(false, 'Email đã tồn tại', null, 409);
                break;
            }
            
            $userData['email'] = $newEmail;
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            $userData['password'] = $data['password'];
        }
        
        if (isset($data['profile_picture'])) {
            $userData['profile_picture'] = $data['profile_picture'];
        }
        
        if (isset($data['bio'])) {
            $userData['bio'] = trim($data['bio']);
        }
         if (isset($data['full_name']) && !empty(trim($data['full_name']))) {
            $userData['full_name'] = trim($data['full_name']);
        }
        
        // Cập nhật hồ sơ người dùng
        $result = $user->updateUser($userData);    
        
        if ($result['success']) {
            // Cập nhật session nếu email hoặc username thay đổi
            if (isset($userData['email'])) {
                $_SESSION['email'] = $userData['email'];
            }
            if (isset($userData['full_name'])) {
                $_SESSION['full_name'] = $userData['full_name'];
            }
            sendResponse(true, 'Hồ sơ đã được cập nhật thành công');
        } else {
            sendResponse(false, $result['message'], null, 500);
        }
        break;
        
    case 'reset_password':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            $data = $_POST;
        }
        
        // Xác thực các trường bắt buộc
        if (!isset($data['email']) || empty(trim($data['email']))) {
            sendResponse(false, 'Email là bắt buộc', null, 400);
            break;
        }
        
        if (!isset($data['new_password']) || empty($data['new_password'])) {
            sendResponse(false, 'Mật khẩu mới là bắt buộc', null, 400);
            break;
        }
        
        if (!isset($data['confirm_password']) || empty($data['confirm_password'])) {
            sendResponse(false, 'Xác nhận mật khẩu là bắt buộc', null, 400);
            break;
        }
        
        $email = trim($data['email']);
        $newPassword = $data['new_password'];
        $confirmPassword = $data['confirm_password'];
        
        // Xác thực định dạng email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendResponse(false, 'Định dạng email không hợp lệ', null, 400);
            break;
        }
        
        // Xác thực mật khẩu khớp
        if ($newPassword !== $confirmPassword) {
            sendResponse(false, 'Mật khẩu không khớp', null, 400);
            break;
        }
        
        // Xác thực độ mạnh mật khẩu
        if (strlen($newPassword) < 8) {
            sendResponse(false, 'Mật khẩu phải có ít nhất 8 ký tự', null, 400);
            break;
        }
        
        if (!preg_match('/[A-Z]/', $newPassword) || !preg_match('/[a-z]/', $newPassword) || !preg_match('/[0-9]/', $newPassword)) {
            sendResponse(false, 'Mật khẩu phải chứa chữ hoa, chữ thường và số', null, 400);
            break;
        }
        
        // Kiểm tra người dùng có tồn tại với email này không
        $existingUser = $user->getUserByEmail($email);
        if (!$existingUser['success']) {
            sendResponse(false, 'Không tìm thấy tài khoản với email này', null, 404);
            break;
        }
        
        $userId = $existingUser['data']['id'];
        
        // Cập nhật mật khẩu
        $result = $user->updateUserById($userId, ['password' => $newPassword]);
        
        if ($result['success']) {
            sendResponse(true, 'Đặt lại mật khẩu thành công');
        } else {
            sendResponse(false, $result['message'], null, 500);
        }
        break;
        
    default:
        sendResponse(false, 'Hành động không hợp lệ được chỉ định', null, 400);
        break;
}