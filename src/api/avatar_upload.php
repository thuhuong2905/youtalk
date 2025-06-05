<?php
require_once __DIR__ . 
'/../core/session_handler.php';
require_once __DIR__ . 
'/../core/api_utils.php';
require_once __DIR__ . 
'/../core/db_connect.php'; // Direct DB connection needed

// Set header to return JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *
'); // Adjust for production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 
'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 
'POST') {
    sendResponse(405, ['message' => 
'Phương thức không được phép. Chỉ chấp nhận POST.']);
    exit;
}

// --- Authentication ---
$loggedInUserId = $_SESSION['user_id'] ?? null;
if (!$loggedInUserId) {
    sendResponse(401, ['message' => 
'Yêu cầu đăng nhập để cập nhật ảnh đại diện.']);
    exit;
}

// --- File Upload Configuration ---
// Ensure this path is correct and writable by the web server
$uploadDir = __DIR__ . 
'/../../public/images/profiles/'; 
$allowedTypes = ['image/jpeg', 
'image/png', 'image/gif', 'image/webp'];
$maxFileSize = 5 * 1024 * 1024; // 5 MB

// --- File Upload Handling ---
if (!isset($_FILES['avatarFile']) || 
$_FILES['avatarFile']['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 
"Tệp quá lớn (cấu hình máy chủ).
",
        UPLOAD_ERR_FORM_SIZE  => 
"Tệp quá lớn (biểu mẫu).
",
        UPLOAD_ERR_PARTIAL    => 
"Tệp chỉ được tải lên một phần.
",
        UPLOAD_ERR_NO_FILE    => 
"Không có tệp nào được tải lên.
",
        UPLOAD_ERR_NO_TMP_DIR => 
"Thiếu thư mục tạm.
",
        UPLOAD_ERR_CANT_WRITE => 
"Không thể ghi tệp vào đĩa.
",
        UPLOAD_ERR_EXTENSION  => 
"Phần mở rộng PHP đã dừng việc tải lên tệp.
",
    ];
    $errorCode = $_FILES['avatarFile']['error'] ?? UPLOAD_ERR_NO_FILE;
    $errorMessage = $uploadErrors[$errorCode] ?? 
'Lỗi tải lên không xác định.';
    sendResponse(400, ['message' => 
'Lỗi tải lên tệp: ' . $errorMessage]);
    exit;
}

$file = $_FILES['avatarFile'];
$fileType = mime_content_type($file['tmp_name']);
$fileSize = $file['size'];

// --- Validation ---
// Check file type
if (!in_array($fileType, $allowedTypes)) {
    sendResponse(400, ['message' => 
'Loại tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, GIF, WEBP.']);
    exit;
}

// Check file size
if ($fileSize > $maxFileSize) {
    sendResponse(400, ['message' => 
'Kích thước tệp quá lớn. Tối đa 5MB.']);
    exit;
}

// --- Process and Save File ---
// Create the upload directory if it doesn't exist
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
    error_log("Failed to create upload directory: " . $uploadDir);
    sendResponse(500, ['message' => 
'Không thể tạo thư mục lưu trữ ảnh đại diện.']);
    exit;
}

// Generate unique filename
$fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
$safeExtension = strtolower($fileExtension);
// Ensure extension matches mime type for safety
$validExtensions = ['jpg' => 
'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 
'image/gif', 'webp' => 'image/webp'];
if (!array_key_exists($safeExtension, $validExtensions) || $validExtensions[$safeExtension] !== $fileType) {
    // Attempt to get extension from MIME type if original extension was misleading/missing
    $mimeToExt = array_flip($validExtensions);
    if (isset($mimeToExt[$fileType])) {
        $safeExtension = $mimeToExt[$fileType];
    } else {
        sendResponse(400, ['message' => 
'Không thể xác định phần mở rộng tệp hợp lệ từ loại MIME.']);
        exit;
    }
}

$newFileName = 'user_' . $loggedInUserId . '_' . uniqid() . '.' . $safeExtension;
$destinationPath = $uploadDir . $newFileName;

// Move the uploaded file
if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
    error_log("Failed to move uploaded file from {$file['tmp_name']} to {$destinationPath}");
    sendResponse(500, ['message' => 
'Không thể lưu tệp ảnh đại diện đã tải lên.']);
    exit;
}

// --- Update Database ---
$db = getDbConnection();
$relativePath = 'images/profiles/' . $newFileName; // Path relative to the public directory

try {
    // Optional: Delete old avatar file if it exists and is not a default avatar
    $stmtOld = $db->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $stmtOld->execute([$loggedInUserId]);
    $oldAvatarPath = $stmtOld->fetchColumn();
    if ($oldAvatarPath && strpos($oldAvatarPath, 'default') === false) { // Avoid deleting default avatars
        $oldFullPath = __DIR__ . '/../../public/' . $oldAvatarPath;
        if (file_exists($oldFullPath)) {
            unlink($oldFullPath);
        }
    }

    // Update user record with the new avatar path
    $stmt = $db->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
    $success = $stmt->execute([$relativePath, $loggedInUserId]);

    if ($success) {
        sendResponse(200, [
            'message' => 
'Ảnh đại diện đã được cập nhật thành công.',
            'avatar_url' => '/' . $relativePath // Send back the URL for frontend update
        ]);
    } else {
        // Attempt to delete the newly uploaded file if DB update failed
        if (file_exists($destinationPath)) {
            unlink($destinationPath);
        }
        sendResponse(500, ['message' => 
'Không thể cập nhật đường dẫn ảnh đại diện trong cơ sở dữ liệu.']);
    }
} catch (PDOException $e) {
    // Attempt to delete the newly uploaded file if DB update failed
    if (file_exists($destinationPath)) {
        unlink($destinationPath);
    }
    error_log("Database Error updating avatar: " . $e->getMessage());
    sendResponse(500, ['message' => 
'Lỗi cơ sở dữ liệu khi cập nhật ảnh đại diện.']);
}

?>
