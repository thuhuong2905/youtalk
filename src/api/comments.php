<?php
// API Quản lý Bình luận cho User - Xử lý các thao tác bình luận của người dùng

require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/db_connect.php';

header('Content-Type: application/json');

$db = getDbConnection();
$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = $_GET['action'] ?? null;
$userId = $_GET['user_id'] ?? null;
$postId = $_GET['post_id'] ?? null;

if (!$action) {
    sendResponse(400, ['message' => 'Tham số hành động là bắt buộc']);
    exit;
}

switch ($action) {
    // Lấy tất cả bình luận của một người dùng cụ thể
    case 'get_user_comments':
        if (!$userId) {
            sendResponse(400, ['message' => 'ID người dùng là bắt buộc cho việc lấy bình luận']);
            exit;
        }
        
        try {
            $stmt = $db->prepare("
                SELECT c.*, p.title as post_title, u.full_name, u.profile_picture
                FROM comments c 
                JOIN posts p ON c.post_id = p.id
                JOIN users u ON c.user_id = u.id
                WHERE c.user_id = :user_id AND c.status = 'active' AND p.status = 'active' AND u.status = 'active'
                ORDER BY c.created_at DESC
                LIMIT 50
            ");
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse(200, ['comments' => $comments]);
        } catch (PDOException $e) {
            error_log("Lỗi trong comments.php (get_user_comments): " . $e->getMessage());
            sendResponse(500, ['message' => 'Lỗi máy chủ khi lấy bình luận người dùng']);
        }
        break;

    // Lấy bình luận của một bài viết cụ thể
    case 'get_post_comments':
        if (!$postId) {
            sendResponse(400, ['message' => 'ID bài viết là bắt buộc']);
            exit;
        }
        
        try {
            $stmt = $db->prepare("
                SELECT c.*, u.full_name, u.profile_picture, u.username
                FROM comments c 
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = :post_id AND c.status = 'active' AND u.status = 'active'
                ORDER BY c.created_at DESC
            ");
            $stmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
            $stmt->execute();
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendResponse(200, ['comments' => $comments]);
        } catch (PDOException $e) {
            error_log("Lỗi trong comments.php (get_post_comments): " . $e->getMessage());
            sendResponse(500, ['message' => 'Lỗi máy chủ khi lấy bình luận bài viết']);
        }
        break;

    // Tạo bình luận mới cho một bài viết
    case 'create':
        if ($requestMethod === 'POST') {
            if (!isset($_SESSION['user_id'])) {
                sendResponse(401, ['message' => 'Bạn cần đăng nhập để bình luận']);
                exit;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $postId = isset($input['post_id']) ? intval($input['post_id']) : null;
            $content = isset($input['content']) ? trim($input['content']) : '';
            
            error_log('[Debug Bình luận] postId=' . var_export($postId, true) . ', user_id=' . var_export($_SESSION['user_id'], true) . ', content=' . var_export($content, true));
            
            if (!$postId || !$content) {
                sendResponse(400, ['message' => 'Thiếu ID bài viết hoặc nội dung bình luận']);
                exit;
            }
            
            try {
                $stmt = $db->prepare("INSERT INTO comments (post_id, user_id, content, status, created_at, updated_at) VALUES (:post_id, :user_id, :content, 'active', NOW(), NOW())");
                $stmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
                $stmt->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
                $stmt->bindParam(':content', $content, PDO::PARAM_STR);
                $stmt->execute();
                sendResponse(201, ['message' => 'Bình luận đã được thêm thành công']);
            } catch (PDOException $e) {
                error_log('[Lỗi Thêm Bình luận] ' . $e->getMessage());
                sendResponse(500, ['message' => 'Lỗi khi lưu bình luận', 'error' => $e->getMessage()]);
            }
        } else {
            sendResponse(405, ['message' => 'Phương thức không được phép']);
        }
        exit;

    // Xóa bình luận (xóa mềm - chuyển trạng thái thành 'deleted')
    case 'delete':
        if ($requestMethod === 'DELETE') {
            if (!isset($_SESSION['user_id'])) {
                sendResponse(401, ['message' => 'Bạn cần đăng nhập để xóa bình luận']);
                exit;
            }
            
            $commentId = isset($_GET['id']) ? intval($_GET['id']) : null;
            if (!$commentId) {
                sendResponse(400, ['message' => 'ID bình luận là bắt buộc']);
                exit;
            }
            
            try {
                // Kiểm tra bình luận có tồn tại và thuộc quyền sở hữu
                $stmt = $db->prepare("SELECT user_id FROM comments WHERE id = :id AND status = 'active'");
                $stmt->bindParam(':id', $commentId, PDO::PARAM_INT);
                $stmt->execute();
                $comment = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$comment) {
                    sendResponse(404, ['message' => 'Không tìm thấy bình luận']);
                    exit;
                }
                
                // Kiểm tra quyền sở hữu (chỉ user có thể xóa bình luận của chính mình)
                if ($comment['user_id'] != $_SESSION['user_id']) {
                    sendResponse(403, ['message' => 'Bạn không có quyền xóa bình luận này']);
                    exit;
                }
                
                // Xóa mềm bình luận
                $stmt = $db->prepare("UPDATE comments SET status = 'deleted', updated_at = NOW() WHERE id = :id");
                $stmt->bindParam(':id', $commentId, PDO::PARAM_INT);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    sendResponse(200, ['message' => 'Xóa bình luận thành công']);
                } else {
                    sendResponse(500, ['message' => 'Không thể xóa bình luận']);
                }
                
            } catch (PDOException $e) {
                error_log('[Lỗi Xóa Bình luận] ' . $e->getMessage());
                sendResponse(500, ['message' => 'Lỗi khi xóa bình luận', 'error' => $e->getMessage()]);
            }
        } else {
            sendResponse(405, ['message' => 'Phương thức không được phép']);
        }
        exit;

    // Hành động không được hỗ trợ
    default:
        sendResponse(400, ['message' => 'Hành động không hợp lệ cho bình luận']);
        break;
}

?>
