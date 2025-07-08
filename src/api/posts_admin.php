<?php
// Admin Posts API Endpoint
// Handles admin-specific post management functionality

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/admin_middleware.php';
require_once __DIR__ . '/../core/classes/Post.php';

// Set headers
header('Content-Type: application/json');

// Handle CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Require admin role for all endpoints
requireAdminRole();

// Get the database connection
$db = new Database();
$conn = $db->getConnection();

// Get request method and action
$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = $_GET['action'] ?? null;

// Get request data
$requestData = getRequestData();

// Handle different actions
switch ($action) {
    case 'get_all':
        handleGetAllPostsForAdmin($conn, $_GET);
        break;
    case 'update_status':
        handleUpdatePostStatus($conn, $requestData);
        break;
    case 'get_stats':
        handleGetPostStats($conn);
        break;
    case 'delete_post':
        handleDeletePostByAdmin($conn, $_GET);
        break;
    case 'bulk_update':
        handleBulkUpdatePosts($conn, $requestData);
        break;
    default:
        sendResponse(false, 'Invalid action specified', null, 400);
        break;
}

/**
 * Handle getting all posts for admin panel
 */
function handleGetAllPostsForAdmin($conn, $params) {
    $page = isset($params['page']) ? (int)$params['page'] : 1;
    $limit = isset($params['limit']) ? (int)$params['limit'] : 20;
    $offset = ($page - 1) * $limit;
    $search = isset($params['search']) ? $params['search'] : '';
    $status = isset($params['status']) ? $params['status'] : '';
    $category_id = isset($params['category_id']) ? (int)$params['category_id'] : null;
    $post_type = isset($params['post_type']) ? $params['post_type'] : '';

    try {
        // Build WHERE conditions
        $whereConditions = [];
        $bindParams = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(p.title LIKE :search OR p.content LIKE :search OR u.username LIKE :search)";
            $bindParams[':search'] = "%$search%";
        }
        
        if (!empty($status)) {
            $whereConditions[] = "p.status = :status";
            $bindParams[':status'] = $status;
        }
        
        if ($category_id) {
            $whereConditions[] = "p.category_id = :category_id";
            $bindParams[':category_id'] = $category_id;
        }
        
        if (!empty($post_type)) {
            $whereConditions[] = "p.post_type = :post_type";
            $bindParams[':post_type'] = $post_type;
        }

        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM posts p 
                      LEFT JOIN users u ON p.user_id = u.id 
                      LEFT JOIN categories c ON p.category_id = c.id 
                      $whereClause";
        $countStmt = $conn->prepare($countQuery);
        foreach ($bindParams as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get posts
        $query = "SELECT p.*, 
                         u.username, 
                         u.full_name, 
                         c.name as category_name,
                         COALESCE(comment_counts.comment_count, 0) as comment_count
                  FROM posts p 
                  LEFT JOIN users u ON p.user_id = u.id 
                  LEFT JOIN categories c ON p.category_id = c.id
                  LEFT JOIN (
                      SELECT post_id, COUNT(*) as comment_count 
                      FROM comments 
                      WHERE status = 'active' 
                      GROUP BY post_id
                  ) comment_counts ON p.id = comment_counts.post_id
                  $whereClause
                  ORDER BY p.created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $conn->prepare($query);
        foreach ($bindParams as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process media fields for each post
        foreach ($posts as &$post) {
            if (!empty($post['media'])) {
                $post['media'] = json_decode($post['media'], true) ?: [];
            } else {
                $post['media'] = [];
            }
            
            if (!empty($post['tags'])) {
                $post['tags'] = json_decode($post['tags'], true) ?: [];
            } else {
                $post['tags'] = [];
            }
        }

        sendResponse(true, 'Lấy danh sách bài viết thành công', [
            'posts' => $posts,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);

    } catch (PDOException $e) {
        error_log("Error fetching all posts for admin: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi lấy danh sách bài viết: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle updating post status (active/inactive/hidden/deleted) for admin
 */
function handleUpdatePostStatus($conn, $data) {
    try {
        if (!isset($data['post_id']) || !isset($data['status'])) {
            sendResponse(false, 'Thiếu thông tin bài viết hoặc trạng thái', null, 400);
            return;
        }

        $postId = (int)$data['post_id'];
        $status = $data['status'];
        $reason = isset($data['reason']) ? $data['reason'] : '';        // Validate status
        $validStatuses = ['active', 'inactive', 'deleted'];
        if (!in_array($status, $validStatuses)) {
            sendResponse(false, 'Trạng thái không hợp lệ', null, 400);
            return;
        }

        // Update post status
        $query = "UPDATE posts SET status = :status, updated_at = NOW() WHERE id = :post_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
          if ($stmt->execute()) {
            // Log the action
            logAdminAction('update_post_status', [
                'post_id' => $postId,
                'status' => $status,
                'reason' => $reason
            ]);
            
            sendResponse(true, 'Cập nhật trạng thái bài viết thành công');
        } else {
            sendResponse(false, 'Lỗi khi cập nhật trạng thái bài viết', null, 500);
        }
        
    } catch (PDOException $e) {
        logAdminAction('update_post_status', $data, false, $e->getMessage());
        sendResponse(false, 'Lỗi khi cập nhật trạng thái bài viết: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle getting post statistics for admin
 */
function handleGetPostStats($conn) {
    try {
        $query = "SELECT 
                    COUNT(*) as total_posts,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_posts,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_posts,
                    SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) as hidden_posts,
                    SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) as deleted_posts,
                    SUM(CASE WHEN post_type = 'review' THEN 1 ELSE 0 END) as review_posts,
                    SUM(CASE WHEN post_type = 'discussion' THEN 1 ELSE 0 END) as discussion_posts,
                    SUM(CASE WHEN post_type = 'question' THEN 1 ELSE 0 END) as question_posts,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as posts_this_week,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as posts_this_month
                  FROM posts";
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get category breakdown
        $categoryQuery = "SELECT c.name, COUNT(p.id) as post_count 
                         FROM categories c 
                         LEFT JOIN posts p ON c.id = p.category_id 
                         GROUP BY c.id, c.name 
                         ORDER BY post_count DESC 
                         LIMIT 10";
        $categoryStmt = $conn->prepare($categoryQuery);
        $categoryStmt->execute();
        $categoryStats = $categoryStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get recent activity
        $activityQuery = "SELECT 
                            'post' as type,
                            CONCAT('Bài viết mới: ', title) as description,
                            created_at as timestamp,
                            id as entity_id,
                            status
                          FROM posts 
                          ORDER BY created_at DESC 
                          LIMIT 10";
        $activityStmt = $conn->prepare($activityQuery);
        $activityStmt->execute();
        $recentActivity = $activityStmt->fetchAll(PDO::FETCH_ASSOC);
          logAdminAction('get_post_stats');
        
        sendResponse(true, 'Lấy thống kê bài viết thành công', [
            'stats' => $stats,
            'category_breakdown' => $categoryStats,
            'recent_activity' => $recentActivity
        ]);
        
    } catch (PDOException $e) {
        logAdminAction('get_post_stats', null, false, $e->getMessage());
        sendResponse(false, 'Lỗi khi lấy thống kê bài viết: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle deleting post by admin (hard delete)
 */
function handleDeletePostByAdmin($conn, $params) {
    try {
        if (!isset($params['id']) || empty($params['id'])) {
            sendResponse(false, 'ID bài viết là bắt buộc', null, 400);
            return;
        }

        $postId = (int)$params['id'];
        $reason = isset($params['reason']) ? $params['reason'] : '';

        // Get post info before deletion for logging
        $getPostQuery = "SELECT title, user_id FROM posts WHERE id = :post_id";
        $getPostStmt = $conn->prepare($getPostQuery);
        $getPostStmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
        $getPostStmt->execute();
        $postInfo = $getPostStmt->fetch(PDO::FETCH_ASSOC);

        if (!$postInfo) {
            sendResponse(false, 'Bài viết không tồn tại', null, 404);
            return;
        }

        // Start transaction
        $conn->beginTransaction();

        try {
            // Delete comments first (foreign key constraint)
            $deleteCommentsQuery = "DELETE FROM comments WHERE post_id = :post_id";
            $deleteCommentsStmt = $conn->prepare($deleteCommentsQuery);
            $deleteCommentsStmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
            $deleteCommentsStmt->execute();

            // Delete post
            $deletePostQuery = "DELETE FROM posts WHERE id = :post_id";
            $deletePostStmt = $conn->prepare($deletePostQuery);
            $deletePostStmt->bindParam(':post_id', $postId, PDO::PARAM_INT);
            $deletePostStmt->execute();

            $conn->commit();            // Log the action
            logAdminAction('delete_post', [
                'post_id' => $postId,
                'post_title' => $postInfo['title'],
                'original_user_id' => $postInfo['user_id'],
                'reason' => $reason
            ]);

            sendResponse(true, 'Xóa bài viết thành công');

        } catch (Exception $e) {
            $conn->rollBack();
            throw $e;
        }

    } catch (PDOException $e) {
        logAdminAction('delete_post', ['post_id' => $postId ?? 0, 'reason' => $reason ?? ''], false, $e->getMessage());
        sendResponse(false, 'Lỗi khi xóa bài viết: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle bulk update posts (status, category, etc.)
 */
function handleBulkUpdatePosts($conn, $data) {
    try {
        if (!isset($data['post_ids']) || !is_array($data['post_ids']) || empty($data['post_ids'])) {
            sendResponse(false, 'Danh sách ID bài viết là bắt buộc', null, 400);
            return;
        }

        if (!isset($data['action'])) {
            sendResponse(false, 'Hành động cập nhật là bắt buộc', null, 400);
            return;
        }

        $postIds = array_map('intval', $data['post_ids']);
        $action = $data['action'];
        $value = isset($data['value']) ? $data['value'] : null;

        $placeholders = str_repeat('?,', count($postIds) - 1) . '?';
        
        switch ($action) {
            case 'update_status':
                if (!$value || !in_array($value, ['active', 'inactive', 'hidden', 'deleted'])) {
                    sendResponse(false, 'Trạng thái không hợp lệ', null, 400);
                    return;
                }
                
                $query = "UPDATE posts SET status = ?, updated_at = NOW() WHERE id IN ($placeholders)";
                $params = array_merge([$value], $postIds);
                break;
                
            case 'update_category':
                if (!$value || !is_numeric($value)) {
                    sendResponse(false, 'ID danh mục không hợp lệ', null, 400);
                    return;
                }
                
                $query = "UPDATE posts SET category_id = ?, updated_at = NOW() WHERE id IN ($placeholders)";
                $params = array_merge([(int)$value], $postIds);
                break;
                
            case 'delete':
                // Start transaction for bulk delete
                $conn->beginTransaction();
                
                try {
                    // Delete comments first
                    $deleteCommentsQuery = "DELETE FROM comments WHERE post_id IN ($placeholders)";
                    $deleteCommentsStmt = $conn->prepare($deleteCommentsQuery);
                    $deleteCommentsStmt->execute($postIds);
                    
                    // Delete posts
                    $query = "DELETE FROM posts WHERE id IN ($placeholders)";
                    $params = $postIds;
                    
                } catch (Exception $e) {
                    $conn->rollBack();
                    throw $e;
                }
                break;
                
            default:
                sendResponse(false, 'Hành động không được hỗ trợ', null, 400);
                return;
        }

        $stmt = $conn->prepare($query);
        $result = $stmt->execute($params);

        if ($action === 'delete') {
            $conn->commit();
        }        if ($result) {
            // Log the action
            logAdminAction('bulk_update_posts', [
                'action' => $action,
                'post_ids' => $postIds,
                'value' => $value,
                'affected_count' => $stmt->rowCount()
            ]);

            sendResponse(true, "Cập nhật {$stmt->rowCount()} bài viết thành công");
        } else {
            sendResponse(false, 'Lỗi khi cập nhật bài viết', null, 500);
        }

    } catch (PDOException $e) {
        if (isset($conn) && $conn->inTransaction()) {
            $conn->rollBack();
        }
        logAdminAction('bulk_update_posts', $data, false, $e->getMessage());
        sendResponse(false, 'Lỗi khi cập nhật bài viết: ' . $e->getMessage(), null, 500);
    }
}

?>
