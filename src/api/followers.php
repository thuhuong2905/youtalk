<?php
// API Quản lý Theo dõi - Xử lý các thao tác follow/unfollow và lấy danh sách người theo dõi

require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/classes/User.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db = getDbConnection();
$userHandler = new User($db);
$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = $_GET['action'] ?? null;
$loggedInUserId = $_SESSION['user_id'] ?? null;

// Các hàm hỗ trợ

// Theo dõi người dùng
function followUser($db, $followerId, $followingId) {
    if ($followerId == $followingId) {
        return sendResponse(400, ['message' => 'Bạn không thể tự theo dõi chính mình']);
    }
    try {
        $stmt = $db->prepare("INSERT INTO followers (follower_user_id, following_user_id) VALUES (?, ?)");
        $stmt->execute([$followerId, $followingId]);
        if ($stmt->rowCount() > 0) {
            return sendResponse(201, ['message' => 'Đã theo dõi thành công']);
        } else {
            return sendResponse(409, ['message' => 'Đã theo dõi người dùng này rồi hoặc có lỗi xảy ra']);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { 
            return sendResponse(409, ['message' => 'Bạn đã theo dõi người dùng này rồi']);
        }
        error_log("Lỗi theo dõi: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ khi theo dõi']);
    }
}

// Hủy theo dõi người dùng
function unfollowUser($db, $followerId, $followingId) {
    try {
        $stmt = $db->prepare("DELETE FROM followers WHERE follower_user_id = ? AND following_user_id = ?");
        $stmt->execute([$followerId, $followingId]);
        if ($stmt->rowCount() > 0) {
            return sendResponse(200, ['message' => 'Đã hủy theo dõi thành công']);
        } else {
            return sendResponse(404, ['message' => 'Bạn chưa theo dõi người dùng này hoặc có lỗi xảy ra']);
        }
    } catch (PDOException $e) {
        error_log("Lỗi hủy theo dõi: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ khi hủy theo dõi']);
    }
}

// Lấy danh sách người theo dõi của một người dùng
function getFollowers($db, $userId) {
    try {
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
        error_log("Lỗi lấy danh sách người theo dõi: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ khi lấy danh sách người theo dõi']);
    }
}

// Lấy danh sách người mà một người dùng đang theo dõi
function getFollowing($db, $userId) {
    try {
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
        error_log("Lỗi lấy danh sách đang theo dõi: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ khi lấy danh sách đang theo dõi']);
    }
}

// Kiểm tra trạng thái theo dõi giữa hai người dùng
function checkFollowStatus($db, $followerId, $followingId) {
    try {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM followers WHERE follower_user_id = ? AND following_user_id = ?");
        $stmt->execute([$followerId, $followingId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $isFollowing = ($result['count'] > 0);
        return sendResponse(200, ['is_following' => $isFollowing]);
    } catch (PDOException $e) {
        error_log("Lỗi kiểm tra trạng thái theo dõi: " . $e->getMessage());
        return sendResponse(500, ['message' => 'Lỗi máy chủ khi kiểm tra trạng thái theo dõi']);
    }
}

// Xử lý logic API endpoint

// Kiểm tra xác thực cho các hành động yêu cầu đăng nhập
if (in_array($action, ['follow', 'unfollow', 'check_follow_status']) && !$loggedInUserId) {
    sendResponse(401, ['message' => 'Yêu cầu đăng nhập để thực hiện hành động này']);
    exit;
}

switch ($requestMethod) {
    // Hành động theo dõi
    case 'POST':
        if ($action === 'follow') {
            $data = json_decode(file_get_contents('php://input'), true);
            $followingId = $data['following_user_id'] ?? null;
            if (!$followingId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng cần theo dõi (following_user_id)']);
                exit;
            }
            followUser($db, $loggedInUserId, $followingId);
        } else {
            sendResponse(400, ['message' => 'Hành động POST không hợp lệ']);
        }
        break;

    // Hành động hủy theo dõi
    case 'DELETE':
        if ($action === 'unfollow') {
            $followingId = $_GET['following_user_id'] ?? null; 
            if (!$followingId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng cần hủy theo dõi (following_user_id) trong tham số truy vấn']);
                exit;
            }
            unfollowUser($db, $loggedInUserId, $followingId);
        } else {
            sendResponse(400, ['message' => 'Hành động DELETE không hợp lệ']);
        }
        break;

    // Lấy danh sách hoặc kiểm tra trạng thái
    case 'GET':
        $targetUserId = $_GET['user_id'] ?? null;
        $checkTargetId = $_GET['target_user_id'] ?? null;

        if ($action === 'get_followers') {
            if (!$targetUserId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng (user_id) để lấy danh sách người theo dõi']);
                exit;
            }
            getFollowers($db, $targetUserId);
        } elseif ($action === 'get_following') {
            if (!$targetUserId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng (user_id) để lấy danh sách đang theo dõi']);
                exit;
            }
            getFollowing($db, $targetUserId);
        } elseif ($action === 'check_follow_status') {
             if (!$loggedInUserId) {
                sendResponse(401, ['message' => 'Yêu cầu đăng nhập để kiểm tra trạng thái theo dõi']);
                exit;
            }
            if (!$checkTargetId) {
                sendResponse(400, ['message' => 'Thiếu ID người dùng mục tiêu (target_user_id) để kiểm tra trạng thái theo dõi']);
                exit;
            }
            checkFollowStatus($db, $loggedInUserId, $checkTargetId);
        } else {
            sendResponse(400, ['message' => 'Hành động GET không hợp lệ']);
        }
        break;

    default:
        sendResponse(405, ['message' => 'Phương thức yêu cầu không được hỗ trợ']);
        break;
}

?>
