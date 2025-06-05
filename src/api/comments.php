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
            // TODO: Implement logic using Comment class or direct query
            // Example direct query (needs refinement and Comment class is better)
            $stmt = $db->prepare("
                SELECT c.*, p.title as post_title 
                FROM comments c 
                JOIN posts p ON c.post_id = p.id
                WHERE c.user_id = :user_id AND c.status = 'active' AND p.status = 'active'
                ORDER BY c.created_at DESC
                LIMIT 50 -- Add pagination later if needed
            ");
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            sendResponse(200, ['comments' => $comments]); // Adjust structure as needed by frontend

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
            $parentId = array_key_exists('parent_id', $input) ? $input['parent_id'] : null;
            // Log dữ liệu đầu vào để debug
            error_log('[Comment Debug] postId=' . var_export($postId, true) . ', user_id=' . var_export($_SESSION['user_id'], true) . ', content=' . var_export($content, true) . ', parentId=' . var_export($parentId, true));
            if (!$postId || !$content) {
                sendResponse(400, ['message' => 'Thiếu post_id hoặc nội dung bình luận.']);
                exit;
            }
            try {
                $stmt = $db->prepare("INSERT INTO comments (post_id, user_id, content, parent_id, status, created_at, updated_at) VALUES (:post_id, :user_id, :content, :parent_id, 'active', NOW(), NOW())");
                $stmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
                $stmt->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
                $stmt->bindParam(':content', $content, PDO::PARAM_STR);
                // Luôn bind parent_id (có thể là null hoặc số)
                if ($parentId === null || $parentId === '' || strtolower($parentId) === 'null') {
                    $stmt->bindValue(':parent_id', null, PDO::PARAM_NULL);
                } else {
                    $stmt->bindValue(':parent_id', (int)$parentId, PDO::PARAM_INT);
                }
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

    // Add other comment actions here (e.g., get_post_comments, create_comment)

    default:
        sendResponse(400, ['message' => 'Invalid action specified for comments']);
        break;
}

?>
