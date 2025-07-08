<?php
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/admin_middleware.php';
require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/classes/User.php';
require_once __DIR__ . '/../core/classes/Post.php';
require_once __DIR__ . '/../core/classes/Review.php';

// Set header to return JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_log("Debug - GET params: " . print_r($_GET, true));

// Get the database connection
$db = getDbConnection();

// Instantiate classes
$userHandler = new User($db);
$postHandler = new Post($db);
$reviewHandler = new Review($db);

// Get request method and action
$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = $_GET['action'] ?? $_POST['action'] ?? null; // Allow action via POST for update
$userId = $_GET['user_id'] ?? null;

// Check for admin access
$isAdmin = isset($_GET['admin']) && $_GET['admin'] == '1';
if ($isAdmin) {
    // Use admin middleware instead of duplicate code
    requireAdminRole();
}

// --- Helper Functions (Moved from bottom for clarity) ---

/**
 * Helper function to get post count by user ID
 */
function getPostCountByUserId($db, $userId) {
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND status = 'active'");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] ?? 0;
    } catch (Exception $e) {
        error_log("Error counting posts for user $userId: " . $e->getMessage());
        return 0;
    }
}

/**
 * Helper function to get review count by user ID
 */
function getReviewCountByUserId($db, $userId) {
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM reviews WHERE user_id = ? AND status = 'active'"); // Assuming active reviews
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] ?? 0;
    } catch (Exception $e) {
        error_log("Error counting reviews for user $userId: " . $e->getMessage());
        return 0;
    }
}

/**
 * Helper function to get comment count by user ID
 */
function getCommentCountByUserId($db, $userId) {
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM comments WHERE user_id = ? AND status = 'active'"); // Assuming active comments
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] ?? 0;
    } catch (Exception $e) {
        error_log("Error counting comments for user $userId: " . $e->getMessage());
        return 0;
    }
}

/**
 * Helper function to get follower count (Actual Implementation)
 */
function getFollowerCountByUserId($db, $userId) {
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM followers WHERE following_user_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] ?? 0;
    } catch (Exception $e) {
        error_log("Error counting followers for user $userId: " . $e->getMessage());
        return 0;
    }
}

/**
 * Helper function to get following count (Actual Implementation)
 */
function getFollowingCountByUserId($db, $userId) {
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM followers WHERE follower_user_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] ?? 0;
    } catch (Exception $e) {
        error_log("Error counting following for user $userId: " . $e->getMessage());
        return 0;
    }
}

// --- API Endpoint Logic ---

if ($requestMethod === 'GET') {
    if (!$action) {
        sendResponse(false, 'Action parameter is required for GET requests', null, 400);
        exit;
    }

    if ($action === 'get_active_users') {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
            $result = $userHandler->getActiveUsers($limit);
            sendResponse($result['success'], $result['message'] ?? 'Operation completed', $result['data'] ?? null);
            exit;
        } catch (Exception $e) {
            error_log("Error fetching active users: " . $e->getMessage());
            sendResponse(false, 'Internal Server Error', null, 500);
            exit;
        }
    } else if ($isAdmin && $action === 'get_all_users') {
        // Admin-only: Get all users for admin panel with pagination
        try {
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';
            $status = $_GET['status'] ?? '';

            // Build WHERE clause
            $whereConditions = [];
            $bindParams = [];
            
            // Always exclude deleted users unless specifically searching for them
            if (empty($status) || $status !== 'deleted') {
                $whereConditions[] = "u.status != 'deleted'";
            }
            
            if (!empty($search)) {
                $whereConditions[] = "(u.username LIKE :search OR u.email LIKE :search OR u.full_name LIKE :search)";
                $bindParams[':search'] = "%$search%";
            }
            
            if (!empty($status)) {
                $whereConditions[] = "u.status = :status";
                $bindParams[':status'] = $status;
            }

            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

            // Get total count
            $countQuery = "SELECT COUNT(*) as total FROM users u $whereClause";
            $countStmt = $db->prepare($countQuery);
            foreach ($bindParams as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Get users
            $query = "SELECT u.id as user_id, u.username, u.email, u.role, u.status, u.created_at,
                             u.profile_picture, u.bio, u.full_name
                      FROM users u
                      $whereClause
                      ORDER BY u.created_at DESC
                      LIMIT :limit OFFSET :offset";
            
            $stmt = $db->prepare($query);
            foreach ($bindParams as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Send response with proper structure for admin panel
            sendResponse(true, 'Users retrieved successfully', [
                'users' => $users,
                'total' => $total,
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total_pages' => ceil($total / $limit)
            ]);
        } catch (Exception $e) {
            error_log("Error fetching all users for admin: " . $e->getMessage());
            sendResponse(false, 'Internal Server Error', null, 500);
        }
    } else if ($isAdmin && $action === 'get_user_stats') {
        // Admin-only: Get user statistics
        try {
            $user_id = $_GET['user_id'] ?? null;
            if (!$user_id) {
                sendResponse(false, 'User ID is required', null, 400);
                exit;
            }
            
            // Get detailed stats for a user
            $stats = [];
            $stats['posts'] = getPostCountByUserId($db, $user_id);
            $stats['reviews'] = getReviewCountByUserId($db, $user_id);
            $stats['comments'] = getCommentCountByUserId($db, $user_id);
            $stats['followers'] = getFollowerCountByUserId($db, $user_id);
            $stats['following'] = getFollowingCountByUserId($db, $user_id);
            
            // Get recent activity
            $stmt = $db->prepare("
                SELECT 'post' as type, title as content, created_at 
                FROM posts WHERE user_id = ? AND status = 'active'
                UNION ALL
                SELECT 'review' as type, CONCAT('Review for: ', p.name) as content, r.created_at
                FROM reviews r JOIN products p ON r.product_id = p.id 
                WHERE r.user_id = ? AND r.status = 'active'
                UNION ALL
                SELECT 'comment' as type, SUBSTRING(content, 1, 50) as content, created_at
                FROM comments WHERE user_id = ? AND status = 'active'
                ORDER BY created_at DESC LIMIT 10
            ");
            $stmt->execute([$user_id, $user_id, $user_id]);
            $stats['recent_activity'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            sendResponse(true, 'User stats retrieved successfully', $stats);
            exit;
        } catch (Exception $e) {
            logAdminAction('get_user_stats', ['user_id' => $user_id ?? 'unknown'], false, $e->getMessage());
            sendResponse(false, 'Internal Server Error', null, 500);
            exit;
        }
    } else if ($isAdmin && $action === 'search_users') {
        // Admin-only: Search users by username, email, or role
        try {
            $search = $_GET['search'] ?? '';
            $role = $_GET['role'] ?? '';
            $status = $_GET['status'] ?? '';
            $limit = min((int)($_GET['limit'] ?? 20), 100); // Max 100
            $offset = (int)($_GET['offset'] ?? 0);
            
            $where_conditions = [];
            $params = [];
            
            if (!empty($search)) {
                $where_conditions[] = "(u.username LIKE ? OR u.email LIKE ?)";
                $search_param = "%{$search}%";
                $params[] = $search_param;
                $params[] = $search_param;
            }
            
            if (!empty($role)) {
                $where_conditions[] = "u.role = ?";
                $params[] = $role;
            }
            
            if (!empty($status)) {
                $where_conditions[] = "u.status = ?";
                $params[] = $status;
            }
            
            $where_clause = !empty($where_conditions) ? "WHERE " . implode(" AND ", $where_conditions) : "";
            
            $stmt = $db->prepare("
                SELECT u.id as user_id, u.username, u.email, u.role, u.status, u.created_at, 
                       u.profile_picture
                FROM users u
                {$where_clause}
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            ");
            
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get total count for pagination
            $count_stmt = $db->prepare("SELECT COUNT(*) as total FROM users u {$where_clause}");
            $count_params = array_slice($params, 0, -2); // Remove limit and offset
            $count_stmt->execute($count_params);
            $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            sendResponse(true, 'Users search completed', [
                'users' => $users,
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset
            ]);
            exit;
        } catch (Exception $e) {
            logAdminAction('search_users', $_GET, false, $e->getMessage());
            sendResponse(false, 'Internal Server Error', null, 500);
            exit;
        }
    } else if ($action === 'get_profile_details') {
        if (!$userId) {
            sendResponse(false, 'User ID parameter is required for get_profile_details', null, 400);
            exit;
        }

        try {
            // 1. Get User Details
            $userResult = $userHandler->getUserById($userId);
            if (!$userResult || !isset($userResult['success']) || !$userResult['success']) {
                sendResponse(false, 'User not found', null, 404);
                exit;
            }
            $userData = $userResult['data'];
            
            // Exclude sensitive data like password hash, maybe email depending on privacy settings (not implemented yet)
            unset($userData['password']);
            // Decide whether to show email based on if it's the user's own profile
            if ($loggedInUserId != $userId) {
                 unset($userData['email']); 
            }

            // 2. Get Counts (Using updated helper functions)
            $postCount = getPostCountByUserId($db, $userId);
            $reviewCount = getReviewCountByUserId($db, $userId);
            $commentCount = getCommentCountByUserId($db, $userId);
            $followerCount = getFollowerCountByUserId($db, $userId); // Actual count
            $followingCount = getFollowingCountByUserId($db, $userId); // Actual count

            // 3. Format the response data
            $profileData = [
                'user' => $userData, // Already contains necessary fields
                'counts' => [
                    'posts' => (int)$postCount,
                    'reviews' => (int)$reviewCount,
                    'comments' => (int)$commentCount,
                    'followers' => (int)$followerCount,
                    'following' => (int)$followingCount
                ]
            ];

            // Send response using the standardized format
            sendResponse(true, 'Profile details retrieved successfully', $profileData);

        } catch (Exception $e) {
            error_log("Error in users.php (get_profile_details): " . $e->getMessage());
            sendResponse(false, 'Internal Server Error', [
                'error' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine()
            ], 500);
        }
    } else {
        sendResponse(false, 'Invalid GET action specified', null, 400);
    }

} elseif ($requestMethod === 'POST') { // Changed from PUT for simplicity with form data
    if ($isAdmin && $action === 'create_user') {
        // Admin-only: Create new user account using User class register method
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $username = trim($data['username'] ?? '');
            $email = trim($data['email'] ?? '');
            $password = $data['password'] ?? '';
            $full_name = trim($data['full_name'] ?? '');
            $role = $data['role'] ?? 'user';
            $status = $data['status'] ?? 'active';
            
            if (empty($username) || empty($email) || empty($password)) {
                sendResponse(false, 'Tên người dùng, email và mật khẩu là bắt buộc', null, 400);
                exit;
            }
            
            if (empty($full_name)) {
                sendResponse(false, 'Họ tên là bắt buộc', null, 400);
                exit;
            }
            
            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendResponse(false, 'Định dạng email không hợp lệ', null, 400);
                exit;
            }
            
            // Validate role
            if (!in_array($role, ['user', 'admin', 'moderator'])) {
                sendResponse(false, 'Vai trò không hợp lệ', null, 400);
                exit;
            }
            
            // Check if username already exists using User class
            if ($userHandler->usernameExists($username)) {
                sendResponse(false, 'Tên đăng nhập đã tồn tại', null, 409);
                exit;
            }
            
            // Check if email already exists using User class
            if ($userHandler->emailExists($email)) {
                sendResponse(false, 'Email đã tồn tại', null, 409);
                exit;
            }
            
            // Use User class register method
            $result = $userHandler->register($username, $full_name, $email, $password);
            
            if ($result['success']) {
                $newUserId = $result['user_id'];
                
                // Update role and status if different from default
                if ($role !== 'user' || $status !== 'active') {
                    $stmt = $db->prepare("UPDATE users SET role = ?, status = ? WHERE id = ?");
                    $stmt->execute([$role, $status, $newUserId]);
                }
                
                // Log admin action
                logAdminAction('create_user', [
                    'new_user_id' => $newUserId,
                    'username' => $username,
                    'email' => $email,
                    'role' => $role,
                    'status' => $status
                ]);
                
                sendResponse(true, 'Người dùng mới đã được tạo thành công', [
                    'user_id' => $newUserId,
                    'username' => $username,
                    'email' => $email,
                    'full_name' => $full_name,
                    'role' => $role,
                    'status' => $status
                ]);
            } else {
                sendResponse(false, $result['message'], null, 500);
            }
            
        } catch (Exception $e) {
            logAdminAction('create_user', $data ?? [], false, $e->getMessage());
            error_log("Error creating user: " . $e->getMessage());
            sendResponse(false, 'Lỗi hệ thống', null, 500);
        }
        exit;
    } else if ($action === 'update_profile') {
        if (!$loggedInUserId) {
            sendResponse(false, 'Yêu cầu đăng nhập để cập nhật hồ sơ.', null, 401);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Validate input data (add more robust validation as needed)
        $updateData = [];
        if (isset($data['email']) && filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            // Check if email is already taken by another user
            $stmtCheck = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmtCheck->execute([$data['email'], $loggedInUserId]);
            if ($stmtCheck->fetch()) {
                sendResponse(false, 'Địa chỉ email này đã được sử dụng.', null, 400);
                exit;
            }
            $updateData['email'] = $data['email'];
        }
        if (isset($data['full_name'])) {
             $updateData['full_name'] = trim(htmlspecialchars($data['full_name']));
        }
        if (isset($data['bio'])) {
            $updateData['bio'] = trim(htmlspecialchars($data['bio']));
        }
        // Removed: if (isset($data['location'])) { ... }
        // Add other updatable fields here (e.g., full_name)

        if (empty($updateData)) {
            sendResponse(false, 'Không có dữ liệu hợp lệ để cập nhật.', null, 400);
            exit;
        }

        try {
            $result = $userHandler->updateUserById($loggedInUserId, $updateData);
            if ($result && $result['success']) {
                // Lấy lại thông tin user mới nhất để trả về cho frontend
                $userResult = $userHandler->getUserById($loggedInUserId);
                $userData = $userResult && $userResult['success'] ? $userResult['data'] : null;
                sendResponse(true, 'Hồ sơ đã được cập nhật thành công.', [
                    'user' => $userData
                ]);
            } else {
                sendResponse(false, $result['message'] ?? 'Không thể cập nhật hồ sơ.', null, 500);
            }
        } catch (Exception $e) {
            error_log("Error updating profile for user $loggedInUserId: " . $e->getMessage());
            sendResponse(false, 'Lỗi máy chủ nội bộ khi cập nhật hồ sơ.', null, 500);
        }
    } else if ($isAdmin && $action === 'ban_user') {
        // Admin-only: Ban/unban user
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $target_user_id = $data['user_id'] ?? null;
            $ban_duration = $data['ban_duration'] ?? null; // hours, null = permanent
            $reason = $data['reason'] ?? 'Violated community guidelines';
            
            if (!$target_user_id) {
                sendResponse(false, 'User ID is required', null, 400);
                exit;
            }
            
            // Prevent admin from banning themselves
            if ($target_user_id == getCurrentUserId()) {
                sendResponse(false, 'Cannot ban yourself', null, 400);
                exit;
            }
            
            // Simply set status to banned (no ban_until or ban_reason in database)
            $stmt = $db->prepare("
                UPDATE users 
                SET status = 'banned'
                WHERE id = ?
            ");
            $stmt->execute([$target_user_id]);
            
            logAdminAction('ban_user', [
                'target_user_id' => $target_user_id,
                'ban_duration' => $ban_duration,
                'reason' => $reason
            ]);
            
            sendResponse(true, 'User banned successfully');
            exit;
        } catch (Exception $e) {
            logAdminAction('ban_user', $data ?? [], false, $e->getMessage());
            sendResponse(false, 'Internal Server Error', null, 500);
            exit;
        }
    } else if ($isAdmin && $action === 'unban_user') {
        // Admin-only: Unban user
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $target_user_id = $data['user_id'] ?? null;
            
            if (!$target_user_id) {
                sendResponse(false, 'User ID is required', null, 400);
                exit;
            }
            
            $stmt = $db->prepare("
                UPDATE users 
                SET status = 'active'
                WHERE id = ?
            ");
            $stmt->execute([$target_user_id]);
            
            logAdminAction('unban_user', ['target_user_id' => $target_user_id]);
            
            sendResponse(true, 'User unbanned successfully');
            exit;
        } catch (Exception $e) {
            logAdminAction('unban_user', $data ?? [], false, $e->getMessage());
            sendResponse(false, 'Internal Server Error', null, 500);
            exit;
        }
    } else if ($isAdmin && $action === 'change_user_role') {
        // Admin-only: Change user role
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $target_user_id = $data['user_id'] ?? null;
            $new_role = $data['role'] ?? null;
            
            if (!$target_user_id || !$new_role) {
                sendResponse(false, 'User ID and role are required', null, 400);
                exit;
            }
            
            // Validate role
            $valid_roles = ['user', 'moderator', 'admin'];
            if (!in_array($new_role, $valid_roles)) {
                sendResponse(false, 'Invalid role specified', null, 400);
                exit;
            }
            
            // Prevent removing admin role from yourself
            if ($target_user_id == getCurrentUserId() && $new_role !== 'admin') {
                sendResponse(false, 'Cannot change your own admin role', null, 400);
                exit;
            }
            
            $stmt = $db->prepare("UPDATE users SET role = ? WHERE id = ?");
            $stmt->execute([$new_role, $target_user_id]);
            
            logAdminAction('change_user_role', [
                'target_user_id' => $target_user_id,
                'new_role' => $new_role
            ]);
            
            sendResponse(true, 'User role updated successfully');
            exit;
        } catch (Exception $e) {
            logAdminAction('change_user_role', $data ?? [], false, $e->getMessage());
            sendResponse(false, 'Internal Server Error', null, 500);
            exit;
        }
    } else if ($isAdmin && $action === 'delete_user_content') {
        // Admin-only: Delete all content from a user (posts, reviews, comments)
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $target_user_id = $data['user_id'] ?? null;
            $content_type = $data['content_type'] ?? 'all'; // 'posts', 'reviews', 'comments', 'all'
            
            if (!$target_user_id) {
                sendResponse(false, 'User ID is required', null, 400);
                exit;
            }
            
            $db->beginTransaction();
            
            try {
                if ($content_type === 'posts' || $content_type === 'all') {
                    $stmt = $db->prepare("UPDATE posts SET status = 'deleted' WHERE user_id = ?");
                    $stmt->execute([$target_user_id]);
                }
                
                if ($content_type === 'reviews' || $content_type === 'all') {
                    $stmt = $db->prepare("UPDATE reviews SET status = 'deleted' WHERE user_id = ?");
                    $stmt->execute([$target_user_id]);
                }
                
                if ($content_type === 'comments' || $content_type === 'all') {
                    $stmt = $db->prepare("UPDATE comments SET status = 'deleted' WHERE user_id = ?");
                    $stmt->execute([$target_user_id]);
                }
                
                $db->commit();
                
                logAdminAction('delete_user_content', [
                    'target_user_id' => $target_user_id,
                    'content_type' => $content_type
                ]);
                
                sendResponse(true, 'User content deleted successfully');
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            exit;
        } catch (Exception $e) {
            logAdminAction('delete_user_content', $data ?? [], false, $e->getMessage());
            sendResponse(false, 'Internal Server Error', null, 500);
            exit;
        }
    } else {
        sendResponse(false, 'Invalid POST action specified', null, 400);
    }

} elseif ($requestMethod === 'DELETE') {
    if ($isAdmin && $action === 'delete_user') {
        // Admin-only: Permanently delete user account
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $target_user_id = $data['user_id'] ?? $_GET['user_id'] ?? null;
            
            if (!$target_user_id) {
                sendResponse(false, 'User ID is required', null, 400);
                exit;
            }
            
            // Prevent admin from deleting themselves
            if ($target_user_id == getCurrentUserId()) {
                sendResponse(false, 'Cannot delete your own account', null, 400);
                exit;
            }
            
            // Get user info before deletion for logging
            $stmt = $db->prepare("SELECT username, email FROM users WHERE id = ?");
            $stmt->execute([$target_user_id]);
            $user_info = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user_info) {
                sendResponse(false, 'User not found', null, 404);
                exit;
            }
            
            $db->beginTransaction();
            
            try {
                // Delete user's content (mark as deleted, don't actually remove)
                $stmt = $db->prepare("UPDATE posts SET status = 'deleted' WHERE user_id = ?");
                $stmt->execute([$target_user_id]);
                
                $stmt = $db->prepare("UPDATE reviews SET status = 'deleted' WHERE user_id = ?");
                $stmt->execute([$target_user_id]);
                
                $stmt = $db->prepare("UPDATE comments SET status = 'deleted' WHERE user_id = ?");
                $stmt->execute([$target_user_id]);
                
                // Remove from followers/following
                $stmt = $db->prepare("DELETE FROM followers WHERE follower_user_id = ? OR following_user_id = ?");
                $stmt->execute([$target_user_id, $target_user_id]);
                
                // Actually delete the user from database
                $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$target_user_id]);
                
                $db->commit();
                
                logAdminAction('delete_user', [
                    'target_user_id' => $target_user_id,
                    'username' => $user_info['username'],
                    'email' => $user_info['email']
                ]);
                
                sendResponse(true, 'User permanently deleted from database successfully');
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            exit;
        } catch (Exception $e) {
            logAdminAction('delete_user', ['target_user_id' => $target_user_id ?? 'unknown'], false, $e->getMessage());
            sendResponse(false, 'Internal Server Error', null, 500);
            exit;
        }
    } else {
        sendResponse(false, 'Invalid DELETE action specified', null, 400);
    }

} else {
    sendResponse(false, 'Method Not Allowed', null, 405);
}

?>