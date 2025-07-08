<?php
// API tải lên ảnh đại diện
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(405, ['message' => 'Phương thức không được phép. Chỉ chấp nhận POST.']);
    exit;
}

$loggedInUserId = $_SESSION['user_id'] ?? null;
if (!$loggedInUserId) {
    sendResponse(401, ['message' => 'Yêu cầu đăng nhập để cập nhật ảnh đại diện.']);
    exit;
}

$uploadDir = __DIR__ . '/../../public/images/profiles/';
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxFileSize = 5 * 1024 * 1024;

// Kiểm tra file tải lên
if (!isset($_FILES['avatarFile']) || $_FILES['avatarFile']['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => "Tệp quá lớn (cấu hình máy chủ).",
        UPLOAD_ERR_FORM_SIZE  => "Tệp quá lớn (biểu mẫu).",
        UPLOAD_ERR_PARTIAL    => "Tệp chỉ được tải lên một phần.",
        UPLOAD_ERR_NO_FILE    => "Không có tệp nào được tải lên.",
        UPLOAD_ERR_NO_TMP_DIR => "Thiếu thư mục tạm.",
        UPLOAD_ERR_CANT_WRITE => "Không thể ghi tệp vào đĩa.",
        UPLOAD_ERR_EXTENSION  => "Phần mở rộng PHP đã dừng việc tải lên tệp.",
    ];
    $errorCode = $_FILES['avatarFile']['error'] ?? UPLOAD_ERR_NO_FILE;
    $errorMessage = $uploadErrors[$errorCode] ?? 'Lỗi tải lên không xác định.';
    sendResponse(400, ['message' => 'Lỗi tải lên tệp: ' . $errorMessage]);
    exit;
}

$file = $_FILES['avatarFile'];
$fileType = mime_content_type($file['tmp_name']);
$fileSize = $file['size'];

if (!in_array($fileType, $allowedTypes)) {
    sendResponse(400, ['message' => 'Loại tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, GIF, WEBP.']);
    exit;
}

if ($fileSize > $maxFileSize) {
    sendResponse(400, ['message' => 'Kích thước tệp quá lớn. Tối đa 5MB.']);
    exit;
}

// Tạo thư mục lưu trữ
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
    error_log("Không thể tạo thư mục tải lên: " . $uploadDir);
    sendResponse(500, ['message' => 'Không thể tạo thư mục lưu trữ ảnh đại diện.']);
    exit;
}

// Tạo tên file duy nhất
$fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
$safeExtension = strtolower($fileExtension);
$validExtensions = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp'];
if (!array_key_exists($safeExtension, $validExtensions) || $validExtensions[$safeExtension] !== $fileType) {
    $mimeToExt = array_flip($validExtensions);
    if (isset($mimeToExt[$fileType])) {
        $safeExtension = $mimeToExt[$fileType];
    } else {
        sendResponse(400, ['message' => 'Không thể xác định phần mở rộng tệp hợp lệ từ loại MIME.']);
        exit;
    }
}

$newFileName = 'user_' . $loggedInUserId . '_' . uniqid() . '.' . $safeExtension;
$destinationPath = $uploadDir . $newFileName;

if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
    error_log("Không thể di chuyển file từ {$file['tmp_name']} đến {$destinationPath}");
    sendResponse(500, ['message' => 'Không thể lưu tệp ảnh đại diện đã tải lên.']);
    exit;
}

// Cập nhật cơ sở dữ liệu
$db = getDbConnection();
$relativePath = 'images/profiles/' . $newFileName;

try {
    $stmtOld = $db->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmtOld->execute([$loggedInUserId]);
    $oldAvatarPath = $stmtOld->fetchColumn();
    if ($oldAvatarPath && strpos($oldAvatarPath, 'default') === false) {
        $oldFullPath = __DIR__ . '/../../public/' . $oldAvatarPath;
        if (file_exists($oldFullPath)) {
            unlink($oldFullPath);
        }
    }

    $stmt = $db->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
    $success = $stmt->execute([$relativePath, $loggedInUserId]);

    if ($success) {
        sendResponse(200, [
            'message' => 'Ảnh đại diện đã được cập nhật thành công.',
            'avatar_url' => '/' . $relativePath
        ]);
    } else {
        if (file_exists($destinationPath)) {
            unlink($destinationPath);
        }
        sendResponse(500, ['message' => 'Không thể cập nhật đường dẫn ảnh đại diện trong cơ sở dữ liệu.']);
    }
} catch (PDOException $e) {
    if (file_exists($destinationPath)) {
        unlink($destinationPath);
    }
    error_log("Lỗi cơ sở dữ liệu khi cập nhật ảnh đại diện: " . $e->getMessage());
    sendResponse(500, ['message' => 'Lỗi cơ sở dữ liệu khi cập nhật ảnh đại diện.']);
}

?>
