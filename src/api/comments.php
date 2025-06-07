<?php
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
// require_once __DIR__ . '/../core/classes/Comment.php'; // Will be needed later
require_once __DIR__ . '/../core/db_connect.php'; // Direct DB access for now

// Set header to return JSON
header('Content-Type: application/json');

// Get the database connection
$db = getDbConnection();

// Instantiate Comment class (when created)
// $commentHandler = new Comment($db);

// Get request method and action
$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = $_GET['action'] ?? null;
$userId = $_GET['user_id'] ?? null;
$postId = $_GET['post_id'] ?? null; // For potential future actions

// Basic input validation
// (Đã loại bỏ kiểm tra method toàn cục để cho phép POST cho action create)
if (!$action) {
    sendResponse(400, ['message' => 'Action parameter is required']);
    exit;
}

switch ($action) {
    case 'get_user_comments':
        if (!$userId) {
            sendResponse(400, ['message' => 'User ID parameter is required for get_user_comments']);
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
            error_log("Error in comments.php (get_user_comments): " . $e->getMessage());
            sendResponse(500, ['message' => 'Internal Server Error fetching user comments']);
        }
        break;

    case 'create':
        if ($requestMethod === 'POST') {
            // Check login
            if (!isset($_SESSION['user_id'])) {
                sendResponse(401, ['message' => 'Bạn cần đăng nhập để bình luận.']);
                exit;
            }
            // Parse JSON body
            $input = json_decode(file_get_contents('php://input'), true);
            $postId = isset($input['post_id']) ? intval($input['post_id']) : null;
            $content = isset($input['content']) ? trim($input['content']) : '';
            
            // Log dữ liệu đầu vào để debug
            error_log('[Comment Debug] postId=' . var_export($postId, true) . ', user_id=' . var_export($_SESSION['user_id'], true) . ', content=' . var_export($content, true));
            
            if (!$postId || !$content) {
                sendResponse(400, ['message' => 'Thiếu post_id hoặc nội dung bình luận.']);
                exit;
            }
            try {
                $stmt = $db->prepare("INSERT INTO comments (post_id, user_id, content, status, created_at, updated_at) VALUES (:post_id, :user_id, :content, 'active', NOW(), NOW())");
                $stmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
                $stmt->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
                $stmt->bindParam(':content', $content, PDO::PARAM_STR);
                $stmt->execute();
                sendResponse(201, ['message' => 'Bình luận đã được thêm thành công.']);
            } catch (PDOException $e) {
                error_log('[Comment Insert Error] ' . $e->getMessage());
                sendResponse(500, ['message' => 'Lỗi khi lưu bình luận.', 'error' => $e->getMessage()]);
            }
        } else {
            sendResponse(405, ['message' => 'Method Not Allowed']);
        }
        exit;

    case 'delete':
        if ($requestMethod === 'DELETE') {
            // Check login
            if (!isset($_SESSION['user_id'])) {
                sendResponse(401, ['message' => 'Bạn cần đăng nhập để xóa bình luận.']);
                exit;
            }
            
            // Get comment ID from URL parameter
            $commentId = isset($_GET['id']) ? intval($_GET['id']) : null;
            if (!$commentId) {
                sendResponse(400, ['message' => 'ID bình luận là bắt buộc.']);
                exit;
            }
            
            try {
                // Check if comment exists and user owns it
                $stmt = $db->prepare("SELECT user_id FROM comments WHERE id = :id AND status = 'active'");
                $stmt->bindParam(':id', $commentId, PDO::PARAM_INT);
                $stmt->execute();
                $comment = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$comment) {
                    sendResponse(404, ['message' => 'Không tìm thấy bình luận.']);
                    exit;
                }
                
                // Check ownership (allow admin to delete any comment if needed)
                if ($comment['user_id'] != $_SESSION['user_id'] && (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin')) {
                    sendResponse(403, ['message' => 'Bạn không có quyền xóa bình luận này.']);
                    exit;
                }
                
                // Soft delete the comment
                $stmt = $db->prepare("UPDATE comments SET status = 'deleted', updated_at = NOW() WHERE id = :id");
                $stmt->bindParam(':id', $commentId, PDO::PARAM_INT);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    sendResponse(200, ['message' => 'Xóa bình luận thành công.']);
                } else {
                    sendResponse(500, ['message' => 'Không thể xóa bình luận.']);
                }
                
            } catch (PDOException $e) {
                error_log('[Comment Delete Error] ' . $e->getMessage());
                sendResponse(500, ['message' => 'Lỗi khi xóa bình luận.', 'error' => $e->getMessage()]);
            }
        } else {
            sendResponse(405, ['message' => 'Method Not Allowed']);
        }
        exit;

    // Add other comment actions here (e.g., get_post_comments, create_comment)

    default:
        sendResponse(400, ['message' => 'Invalid action specified for comments']);
        break;
}

?>
