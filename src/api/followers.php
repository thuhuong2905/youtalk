<?php
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/classes/User.php'; // Needed for user details in lists

// Set header to return JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the database connection
$db = getDbConnection();
$userHandler = new User($db);

// Get request method and action
$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = $_GET['action'] ?? null;

// Get logged-in user ID from session (ensure session_handler.php sets this)
$loggedInUserId = $_SESSION['user_id'] ?? null;

// --- Helper Functions ---

/**
 * Follow a user.
 */
function followUser($db, $followerId, $followingId) {
    if ($followerId == $followingId) {
        return sendResponse(400, ['message' => 'Bạn không thể tự theo dõi chính mình.']);
    }
    try {
        $stmt = $db->prepare("INSERT INTO followers (follower_user_id, following_user_id) VALUES (?, ?)");
        $stmt->execute([$followerId, $followingId]);
        if ($stmt->rowCount() > 0) {
            // Optionally: Add notification logic here
            return sendResponse(201, ['message' => 'Đã theo dõi thành công.']);
        } else {
            return sendResponse(409, ['message' => 'Đã theo dõi người dùng này rồi hoặc có lỗi xảy ra.']);
        }
    } catch (PDOException $e) {
        // Handle potential unique constraint violation (already following)
        if ($e->getCode() == 23000) { 
            return sendResponse(409, ['message' => 'Bạn đã theo dõi người dùng này rồi.']);
        }
        error_log("Follow Error: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ nội bộ khi theo dõi.']);
    }
}

/**
 * Unfollow a user.
 */
function unfollowUser($db, $followerId, $followingId) {
    try {
        $stmt = $db->prepare("DELETE FROM followers WHERE follower_user_id = ? AND following_user_id = ?");
        $stmt->execute([$followerId, $followingId]);
        if ($stmt->rowCount() > 0) {
            // Optionally: Add notification logic here
            return sendResponse(200, ['message' => 'Đã hủy theo dõi thành công.']);
        } else {
            return sendResponse(404, ['message' => 'Bạn chưa theo dõi người dùng này hoặc có lỗi xảy ra.']);
        }
    } catch (PDOException $e) {
        error_log("Unfollow Error: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ nội bộ khi hủy theo dõi.']);
    }
}

/**
 * Get list of followers for a user.
 */
function getFollowers($db, $userId) {
    try {
        // Select user details of those who are following $userId
        $stmt = $db->prepare("
            SELECT u.id, u.username, u.full_name, u.profile_picture
            FROM users u
            JOIN followers f ON u.id = f.follower_user_id
            WHERE f.following_user_id = ?
            ORDER BY f.created_at DESC
        ");
        $stmt->execute([$userId]);
        $followers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return sendResponse(200, ['followers' => $followers]);
    } catch (PDOException $e) {
        error_log("Get Followers Error: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ nội bộ khi lấy danh sách người theo dõi.']);
    }
}

/**
 * Get list of users a user is following.
 */
function getFollowing($db, $userId) {
    try {
        // Select user details of those whom $userId is following
        $stmt = $db->prepare("
            SELECT u.id, u.username, u.full_name, u.profile_picture
            FROM users u
            JOIN followers f ON u.id = f.following_user_id
            WHERE f.follower_user_id = ?
            ORDER BY f.created_at DESC
        ");
        $stmt->execute([$userId]);
        $following = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return sendResponse(200, ['following' => $following]);
    } catch (PDOException $e) {
        error_log("Get Following Error: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ nội bộ khi lấy danh sách đang theo dõi.']);
    }
}

/**
 * Check if the logged-in user is following a target user.
 */
function checkFollowStatus($db, $followerId, $followingId) {
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM followers WHERE follower_user_id = ? AND following_user_id = ?");
        $stmt->execute([$followerId, $followingId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $isFollowing = ($result['count'] > 0);
        return sendResponse(200, ['is_following' => $isFollowing]);
    } catch (PDOException $e) {
        error_log("Check Follow Status Error: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ nội bộ khi kiểm tra trạng thái theo dõi.']);
    }
}

// --- API Endpoint Logic ---

// Authentication check for actions requiring login
if (in_array($action, ['follow', 'unfollow', 'check_follow_status']) && !$loggedInUserId) {
    sendResponse(401, ['message' => 'Yêu cầu đăng nhập để thực hiện hành động này.']);
    exit;
}

switch ($requestMethod) {
    case 'POST': // Follow action
        if ($action === 'follow') {
            $data = json_decode(file_get_contents('php://input'), true);
            $followingId = $data['following_user_id'] ?? null;
            if (!$followingId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng cần theo dõi (following_user_id).']);
                exit;
            }
            followUser($db, $loggedInUserId, $followingId);
        } else {
            sendResponse(400, ['message' => 'Hành động POST không hợp lệ.']);
        }
        break;

    case 'DELETE': // Unfollow action
        if ($action === 'unfollow') {
            // Get target user ID from query parameters for DELETE
            $followingId = $_GET['following_user_id'] ?? null; 
            if (!$followingId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng cần hủy theo dõi (following_user_id) trong query parameter.']);
                exit;
            }
            unfollowUser($db, $loggedInUserId, $followingId);
        } else {
            sendResponse(400, ['message' => 'Hành động DELETE không hợp lệ.']);
        }
        break;

    case 'GET': // Get lists or check status
        $targetUserId = $_GET['user_id'] ?? null; // User whose followers/following list we want
        $checkTargetId = $_GET['target_user_id'] ?? null; // User to check if logged-in user is following

        if ($action === 'get_followers') {
            if (!$targetUserId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng (user_id) để lấy danh sách người theo dõi.']);
                exit;
            }
            getFollowers($db, $targetUserId);
        } elseif ($action === 'get_following') {
            if (!$targetUserId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng (user_id) để lấy danh sách đang theo dõi.']);
                exit;
            }
            getFollowing($db, $targetUserId);
        } elseif ($action === 'check_follow_status') {
             if (!$loggedInUserId) { // Re-check auth specifically for this action
                sendResponse(401, ['message' => 'Yêu cầu đăng nhập để kiểm tra trạng thái theo dõi.']);
                exit;
            }
            if (!$checkTargetId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng mục tiêu (target_user_id) để kiểm tra trạng thái theo dõi.']);
                exit;
            }
            checkFollowStatus($db, $loggedInUserId, $checkTargetId);
        } else {
            sendResponse(400, ['message' => 'Hành động GET không hợp lệ.']);
        }
        break;

    default:
        sendResponse(405, ['message' => 'Phương thức yêu cầu không được hỗ trợ.']);
        break;
}

?>
