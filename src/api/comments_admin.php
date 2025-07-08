<?php
// API Quản lý Bình luận cho Admin - Xử lý tất cả các thao tác admin cho bình luận

require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/admin_middleware.php';

header('Content-Type: application/json');

// Check for admin access
requireAdminRole();

$db = getDbConnection();
$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = $_GET['action'] ?? null;

if (!$action) {
    sendResponse(400, ['message' => 'Tham số hành động là bắt buộc']);
    exit;
}

switch ($action) {
    // Get all comments for admin panel
    case 'list':
    case 'get_all_comments':
        handleGetAllCommentsForAdmin($db, $_GET);
        break;

    // Update comment status
    case 'update_status':
        handleUpdateCommentStatus($db, getRequestData());
        break;

    // Get comment statistics
    case 'get_comment_stats':
        handleGetCommentStats($db);
        break;

    // Delete comment (hard delete for admin)
    case 'delete':
        if ($requestMethod === 'DELETE') {
            $commentId = isset($_GET['id']) ? intval($_GET['id']) : null;
            if (!$commentId) {
                sendResponse(400, ['message' => 'ID bình luận là bắt buộc']);
                exit;
            }
            
            try {
                // Hard delete for admin
                $stmt = $db->prepare("DELETE FROM comments WHERE id = :id");
                $stmt->bindParam(':id', $commentId, PDO::PARAM_INT);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    logAdminAction('delete_comment', ['comment_id' => $commentId]);
                    sendResponse(200, ['message' => 'Xóa bình luận thành công']);
                } else {
                    sendResponse(404, ['message' => 'Không tìm thấy bình luận']);
                }
                
            } catch (PDOException $e) {
                logAdminAction('delete_comment', ['comment_id' => $commentId], false, $e->getMessage());
                error_log('[Lỗi Xóa Bình luận Admin] ' . $e->getMessage());
                sendResponse(500, ['message' => 'Lỗi khi xóa bình luận', 'error' => $e->getMessage()]);
            }
        } else {
            sendResponse(405, ['message' => 'Phương thức không được phép']);
        }
        break;

    // Get comments by post ID for admin
    case 'get_by_post':
        $postId = isset($_GET['post_id']) ? intval($_GET['post_id']) : null;
        if (!$postId) {
            sendResponse(400, ['message' => 'ID bài viết là bắt buộc']);
            exit;
        }
        
        try {
            $stmt = $db->prepare("
                SELECT c.*, u.username, u.full_name, u.profile_picture, u.email
                FROM comments c 
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = :post_id
                ORDER BY c.created_at DESC
            ");
            $stmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
            $stmt->execute();
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            logAdminAction('get_comments_by_post', ['post_id' => $postId]);
            sendResponse(200, ['comments' => $comments]);
        } catch (PDOException $e) {
            logAdminAction('get_comments_by_post', ['post_id' => $postId], false, $e->getMessage());
            error_log("Lỗi trong comments_admin.php (get_by_post): " . $e->getMessage());
            sendResponse(500, ['message' => 'Lỗi máy chủ khi lấy bình luận theo bài viết']);
        }
        break;

    // Bulk actions for admin
    case 'bulk_action':
        if ($requestMethod === 'POST') {
            $input = getRequestData();
            $commentIds = isset($input['comment_ids']) ? $input['comment_ids'] : [];
            $bulkAction = isset($input['bulk_action']) ? $input['bulk_action'] : '';
            
            if (empty($commentIds) || empty($bulkAction)) {
                sendResponse(400, ['message' => 'Thiếu danh sách ID bình luận hoặc hành động']);
                exit;
            }
            
            try {
                $placeholders = str_repeat('?,', count($commentIds) - 1) . '?';
                
                switch ($bulkAction) {
                    case 'activate':
                        $stmt = $db->prepare("UPDATE comments SET status = 'active', updated_at = NOW() WHERE id IN ($placeholders)");
                        break;
                    case 'deactivate':
                        $stmt = $db->prepare("UPDATE comments SET status = 'inactive', updated_at = NOW() WHERE id IN ($placeholders)");
                        break;
                    case 'hide':
                        $stmt = $db->prepare("UPDATE comments SET status = 'hidden', updated_at = NOW() WHERE id IN ($placeholders)");
                        break;
                    case 'delete':
                        $stmt = $db->prepare("UPDATE comments SET status = 'deleted', updated_at = NOW() WHERE id IN ($placeholders)");
                        break;
                    case 'hard_delete':
                        $stmt = $db->prepare("DELETE FROM comments WHERE id IN ($placeholders)");
                        break;
                    default:
                        sendResponse(400, ['message' => 'Hành động không hợp lệ']);
                        exit;
                }
                
                $stmt->execute($commentIds);
                $affectedRows = $stmt->rowCount();
                
                logAdminAction('bulk_comment_action', [
                    'action' => $bulkAction,
                    'comment_ids' => $commentIds,
                    'affected_rows' => $affectedRows
                ]);
                
                sendResponse(200, ['message' => "Đã thực hiện hành động cho $affectedRows bình luận"]);
                
            } catch (PDOException $e) {
                logAdminAction('bulk_comment_action', [
                    'action' => $bulkAction,
                    'comment_ids' => $commentIds
                ], false, $e->getMessage());
                error_log('[Lỗi Bulk Action Bình luận] ' . $e->getMessage());
                sendResponse(500, ['message' => 'Lỗi khi thực hiện hành động hàng loạt']);
            }
        } else {
            sendResponse(405, ['message' => 'Phương thức không được phép']);
        }
        break;

    // Hành động không được hỗ trợ
    default:
        sendResponse(400, ['message' => 'Hành động không hợp lệ cho quản lý bình luận admin']);
        break;
}

// Admin Handler Functions
function handleGetAllCommentsForAdmin($db, $params) {
    try {
        $page = isset($params['page']) ? (int)$params['page'] : 1;
        $limit = isset($params['limit']) ? (int)$params['limit'] : 20;
        $offset = ($page - 1) * $limit;
        $search = isset($params['search']) ? $params['search'] : '';
        $status = isset($params['status']) ? $params['status'] : '';
        $post_id = isset($params['post_id']) ? (int)$params['post_id'] : 0;

        // Build WHERE clause
        $whereConditions = [];
        $bindParams = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(c.content LIKE :search OR u.username LIKE :search OR p.title LIKE :search)";
            $bindParams[':search'] = "%$search%";
        }
        
        if (!empty($status)) {
            $whereConditions[] = "c.status = :status";
            $bindParams[':status'] = $status;
        }
        
        if ($post_id > 0) {
            $whereConditions[] = "c.post_id = :post_id";
            $bindParams[':post_id'] = $post_id;
        }

        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM comments c 
                      JOIN users u ON c.user_id = u.id 
                      JOIN posts p ON c.post_id = p.id 
                      $whereClause";
        $countStmt = $db->prepare($countQuery);
        foreach ($bindParams as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get comments
        $query = "SELECT c.*, u.username, u.full_name, u.profile_picture, u.email,
                         p.title as post_title, p.id as post_id
                  FROM comments c 
                  JOIN users u ON c.user_id = u.id 
                  JOIN posts p ON c.post_id = p.id 
                  $whereClause
                  ORDER BY c.created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($query);
        foreach ($bindParams as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        logAdminAction('get_all_comments', $params);
        
        // Send response with consistent structure for admin panel
        sendResponse(true, 'Lấy danh sách bình luận thành công', [
            'comments' => $comments,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);
        
    } catch (PDOException $e) {
        logAdminAction('get_all_comments', $params, false, $e->getMessage());
        sendResponse(false, 'Lỗi khi lấy danh sách bình luận: ' . $e->getMessage());
    }
}

function handleUpdateCommentStatus($db, $data) {
    try {
        if (!isset($data['comment_id']) || !isset($data['status'])) {
            sendResponse(400, ['message' => 'Thiếu thông tin bình luận hoặc trạng thái']);
            return;
        }

        $commentId = (int)$data['comment_id'];
        $status = $data['status'];
        $reason = isset($data['reason']) ? $data['reason'] : '';

        // Validate status
        $validStatuses = ['active', 'inactive', 'hidden', 'deleted'];
        if (!in_array($status, $validStatuses)) {
            sendResponse(400, ['message' => 'Trạng thái không hợp lệ']);
            return;
        }

        // Update comment status
        $query = "UPDATE comments SET status = :status, updated_at = NOW() WHERE id = :comment_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':comment_id', $commentId, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            // Log the action
            logAdminAction('update_comment_status', [
                'comment_id' => $commentId,
                'status' => $status,
                'reason' => $reason
            ]);
            
            sendResponse(200, ['message' => 'Cập nhật trạng thái bình luận thành công']);
        } else {
            sendResponse(500, ['message' => 'Lỗi khi cập nhật trạng thái bình luận']);
        }
        
    } catch (PDOException $e) {
        logAdminAction('update_comment_status', $data, false, $e->getMessage());
        sendResponse(500, ['message' => 'Lỗi khi cập nhật trạng thái bình luận: ' . $e->getMessage()]);
    }
}

function handleGetCommentStats($db) {
    try {
        $query = "SELECT 
                    COUNT(*) as total_comments,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_comments,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_comments,
                    SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) as hidden_comments,
                    SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) as deleted_comments,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as comments_this_week,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as comments_this_month
                  FROM comments";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get top active users by comments
        $topUsersQuery = "SELECT u.username, u.full_name, COUNT(c.id) as comment_count 
                         FROM users u 
                         JOIN comments c ON u.id = c.user_id 
                         WHERE c.status = 'active'
                         GROUP BY u.id, u.username, u.full_name 
                         ORDER BY comment_count DESC 
                         LIMIT 10";
        $topUsersStmt = $db->prepare($topUsersQuery);
        $topUsersStmt->execute();
        $topUsers = $topUsersStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get comments by status for chart
        $statusQuery = "SELECT status, COUNT(*) as count FROM comments GROUP BY status";
        $statusStmt = $db->prepare($statusQuery);
        $statusStmt->execute();
        $statusStats = $statusStmt->fetchAll(PDO::FETCH_ASSOC);
        
        logAdminAction('get_comment_stats', []);
        
        sendResponse(200, [
            'message' => 'Lấy thống kê bình luận thành công',
            'stats' => $stats,
            'top_users' => $topUsers,
            'status_distribution' => $statusStats
        ]);
        
    } catch (PDOException $e) {
        logAdminAction('get_comment_stats', [], false, $e->getMessage());
        sendResponse(500, ['message' => 'Lỗi khi lấy thống kê bình luận: ' . $e->getMessage()]);
    }
}

?>
