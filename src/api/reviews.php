<?php
// API Endpoint Đánh giá - Phiên bản đã sửa
// Xử lý danh sách đánh giá, tạo mới, cập nhật và thống kê

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/classes/Review.php';

// Thiết lập headers
header('Content-Type: application/json');

// Xử lý CORS
header('Access-Control-Allow-Origin: *'); // Điều chỉnh trong production
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Xử lý yêu cầu preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Debug: Ghi log chi tiết yêu cầu
error_log("Phương thức yêu cầu: " . $_SERVER['REQUEST_METHOD']);
error_log("Tham số GET: " . print_r($_GET, true));
error_log("Dữ liệu POST: " . file_get_contents('php://input'));

// Lấy action từ tham số query
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Debug: Ghi log action
error_log("Action nhận được: " . $action);

// Xác thực action tồn tại
if (empty($action)) {
    sendResponse(false, 'Tham số action là bắt buộc trong URL (?action=...)', null, 400);
    exit;
}

// Tạo kết nối cơ sở dữ liệu
try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Kết nối cơ sở dữ liệu thất bại");
    }
} catch (Exception $e) {
    sendResponse(false, 'Lỗi kết nối cơ sở dữ liệu: ' . $e->getMessage(), null, 500);
    exit;
}

// Tạo instance Review
$review = new Review($conn);

// Lấy dữ liệu yêu cầu - xử lý các phương thức HTTP khác nhau
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'DELETE') {
    // Đối với yêu cầu DELETE, lấy dữ liệu từ tham số query
    $requestData = array_merge($_GET, getRequestData('GET'));
} else {
    $requestData = getRequestData();
}

// Debug: Ghi log dữ liệu yêu cầu
error_log("Dữ liệu yêu cầu: " . print_r($requestData, true));

// Danh sách các action hợp lệ để xác thực
$validActions = [
    'list_featured',
    'get_by_product', 
    'get_by_id',
    'get_by_user',
    'create',
    'update', 
    'delete',
    'get_stats',
    'mark_helpful'
];

// Xác thực action
if (!in_array($action, $validActions)) {
    sendResponse(false, 'Action không hợp lệ. Các action hợp lệ: ' . implode(', ', $validActions), null, 400);
    exit;
}

// Xử lý dựa trên action được yêu cầu
switch ($action) {
    case 'list_featured':
        handleGetFeaturedReviews($review, $requestData);
        break;
    case 'get_by_product':
        handleGetReviewsByProduct($review, $requestData);
        break;
    case 'get_by_id':
        handleGetReviewById($review, $requestData);
        break;
    case 'get_by_user':
        handleGetReviewsByUser($review, $requestData);
        break;
    case 'create':
        handleCreateReview($review, $requestData);
        break;
    case 'update':
        handleUpdateReview($review, $requestData);
        break;
    case 'delete':
        handleDeleteReview($review, $requestData);
        break;
    case 'get_stats':
        handleGetReviewStats($review, $requestData);
        break;
    case 'mark_helpful':
        handleMarkReviewHelpful($review, $requestData);
        break;
    default:
        // Đây sẽ không bao giờ được đạt tới do xác thực ở trên
        sendResponse(false, 'Action không hợp lệ', null, 400);
        break;
}

/**
 * Xử lý lấy đánh giá nổi bật (top 3 theo helpful_count)
 */
function handleGetFeaturedReviews($review, $requestData) {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 3;

    try {
        // Truy vấn để lấy đánh giá sản phẩm duy nhất hàng đầu với 5 sao, sắp xếp theo helpful_count
        $query = "WITH RankedReviews AS (
                    SELECT 
                        r.*, 
                        p.name AS product_name,
                        p.images AS product_images, 
                        u.full_name,
                        ROW_NUMBER() OVER(PARTITION BY r.product_id ORDER BY r.helpful_count DESC, r.created_at DESC) as rn
                    FROM reviews r
                    JOIN products p ON r.product_id = p.id
                    JOIN users u ON r.user_id = u.id
                    WHERE r.status = 'active' AND u.status = 'active' AND p.status = 'active'
                )
                SELECT * FROM RankedReviews WHERE rn = 1 ORDER BY helpful_count DESC, created_at DESC LIMIT :limit";

        $stmt = $review->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(true, 'Lấy đánh giá nổi bật thành công', [
            'reviews' => $reviews
        ]);

    } catch (PDOException $e) {
        error_log("Lỗi đánh giá nổi bật: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi lấy đánh giá nổi bật: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Xử lý lấy đánh giá cho một sản phẩm
 */
function handleGetReviewsByProduct($review, $requestData) {
    // Xác thực tham số bắt buộc
    if (!isset($_GET['product_id']) || empty($_GET['product_id'])) {
        sendResponse(false, 'ID sản phẩm là bắt buộc trong tham số URL (?product_id=...)', null, 400);
        return;
    }
    $productId = (int)$_GET['product_id'];
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $sortBy = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'created_at';
    $sortOrder = isset($_GET['sort_order']) ? $_GET['sort_order'] : 'DESC';

    // Xác thực cơ bản cho các cột sắp xếp để ngăn chặn SQL injection
    $allowedSortColumns = ['created_at', 'rating', 'helpful_count'];
    if (!in_array($sortBy, $allowedSortColumns)) {
        $sortBy = 'created_at';
    }
    $sortOrder = strtoupper($sortOrder) === 'ASC' ? 'ASC' : 'DESC';

    try {
        // Lấy tổng số để phân trang
        $countQuery = "SELECT COUNT(*) FROM reviews WHERE product_id = :product_id AND status = 'active'";
        $countStmt = $review->conn->prepare($countQuery);
        $countStmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
        $countStmt->execute();
        $totalCount = $countStmt->fetchColumn();

        // Lấy đánh giá với thông tin người dùng
        $query = "SELECT r.*, u.full_name, u.profile_picture 
                  FROM reviews r 
                  JOIN users u ON r.user_id = u.id 
                  WHERE r.product_id = :product_id AND r.status = 'active' AND u.status = 'active'
                  ORDER BY r.{$sortBy} {$sortOrder}
                  LIMIT :limit OFFSET :offset";

        $stmt = $review->conn->prepare($query);
        $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $reviewsData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(true, 'Lấy đánh giá thành công', [
            'reviews' => $reviewsData,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'total' => $totalCount
            ]
        ]);
    } catch (PDOException $e) {
        error_log("Lỗi lấy đánh giá theo sản phẩm: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi lấy đánh giá: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Xử lý lấy đánh giá theo ID
 */
function handleGetReviewById($review, $requestData) {
    // Xác thực tham số bắt buộc
    if (!isset($_GET['id']) || empty($_GET['id'])) {
        sendResponse(false, 'ID đánh giá là bắt buộc trong tham số URL (?id=...)', null, 400);
        return;
    }
    $reviewId = (int)$_GET['id'];

    try {
        $query = "SELECT r.*, u.full_name, u.profile_picture, p.name as product_name 
                  FROM reviews r 
                  JOIN users u ON r.user_id = u.id 
                  JOIN products p ON r.product_id = p.id
                  WHERE r.id = :id AND r.status = 'active' AND u.status = 'active' AND p.status = 'active'";
        $stmt = $review->conn->prepare($query);
        $stmt->bindParam(':id', $reviewId, PDO::PARAM_INT);
        $stmt->execute();
        $reviewData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($reviewData) {
            sendResponse(true, 'Lấy đánh giá thành công', [
                'review' => $reviewData
            ]);
        } else {
            sendResponse(false, 'Không tìm thấy đánh giá hoặc đã bị vô hiệu hóa', null, 404);
        }
    } catch (PDOException $e) {
        error_log("Lỗi lấy đánh giá theo ID: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi lấy đánh giá: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle getting reviews by user
 */
function handleGetReviewsByUser($review, $requestData) {
    // Validate required parameters
    if (!isset($_GET['user_id']) || empty($_GET['user_id'])) {
        sendResponse(false, 'User ID is required in URL parameter (?user_id=...)', null, 400);
        return;
    }
    $userId = (int)$_GET['user_id'];
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    try {
        // Get total count for pagination
        $countQuery = "SELECT COUNT(*) FROM reviews WHERE user_id = :user_id AND status = 'active'";
        $countStmt = $review->conn->prepare($countQuery);
        $countStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $countStmt->execute();
        $totalCount = $countStmt->fetchColumn();

        // Get reviews with product info
        $query = "SELECT r.*, p.name as product_name 
                  FROM reviews r 
                  JOIN products p ON r.product_id = p.id 
                  WHERE r.user_id = :user_id AND r.status = 'active' AND p.status = 'active'
                  ORDER BY r.created_at DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = $review->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $reviewsData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(true, 'User reviews retrieved successfully', [
            'reviews' => $reviewsData,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'total' => $totalCount
            ]
        ]);
    } catch (PDOException $e) {
        error_log("Get reviews by user error: " . $e->getMessage());
        sendResponse(false, 'Error retrieving user reviews: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle creating a new review
 */
function handleCreateReview($review, $requestData) {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        sendResponse(false, 'Authentication required to create review', null, 401);
        return;
    }

    // Validate required parameters
    $requiredFields = ['product_id', 'rating', 'comment'];
    foreach ($requiredFields as $field) {
        if (!isset($requestData[$field]) || $requestData[$field] === '' || $requestData[$field] === null) {
            sendResponse(false, ucfirst($field) . ' is required', null, 400);
            return;
        }
    }

    // Validate rating range
    $rating = (int)$requestData['rating'];
    if ($rating < 1 || $rating > 5) {
        sendResponse(false, 'Rating must be between 1 and 5', null, 400);
        return;
    }

    // Prepare data for creation
    $createData = [
        'product_id' => (int)$requestData['product_id'],
        'user_id' => $_SESSION['user_id'],
        'rating' => $rating,
        'comment' => trim($requestData['comment']),
        'media' => isset($requestData['media']) ? json_encode($requestData['media']) : null,
        'status' => 'active'
    ];

    try {
        $query = "INSERT INTO reviews (product_id, user_id, rating, comment, media, status) 
                  VALUES (:product_id, :user_id, :rating, :comment, :media, :status)";
        $stmt = $review->conn->prepare($query);
        $stmt->execute($createData);
        $reviewId = $review->conn->lastInsertId();

        if ($reviewId) {
            sendResponse(true, 'Review created successfully', [
                'review_id' => $reviewId
            ], 201);
        } else {
            sendResponse(false, 'Failed to create review (database error)', null, 500);
        }
    } catch (PDOException $e) {
        error_log("Create review error: " . $e->getMessage());
        if ($e->getCode() == 23000) {
            sendResponse(false, 'Invalid product ID or user ID, or you have already reviewed this product.', null, 409);
        } else {
            sendResponse(false, 'Error creating review: ' . $e->getMessage(), null, 500);
        }
    }
}

/**
 * Handle updating a review
 */
function handleUpdateReview($review, $requestData) {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        sendResponse(false, 'Authentication required to update review', null, 401);
        return;
    }

    // Validate required parameters
    if (!isset($requestData['id']) || empty($requestData['id'])) {
        sendResponse(false, 'Review ID is required in request body', null, 400);
        return;
    }
    $reviewId = (int)$requestData['id'];

    // Check if review exists and get ownership info
    try {
        $checkQuery = "SELECT user_id FROM reviews WHERE id = :id AND status = 'active'";
        $checkStmt = $review->conn->prepare($checkQuery);
        $checkStmt->bindParam(':id', $reviewId, PDO::PARAM_INT);
        $checkStmt->execute();
        $currentReview = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$currentReview) {
            sendResponse(false, 'Review not found', null, 404);
            return;
        }

        // Check ownership or admin role
        if ($currentReview['user_id'] !== $_SESSION['user_id'] && 
            (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin')) {
            sendResponse(false, 'You do not have permission to update this review', null, 403);
            return;
        }

        // Prepare update data
        $updateData = [];
        $allowedFields = ['rating', 'comment', 'media', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($requestData[$field])) {
                if ($field === 'rating') {
                    $rating = (int)$requestData[$field];
                    if ($rating >= 1 && $rating <= 5) {
                        $updateData[$field] = $rating;
                    }
                } elseif ($field === 'comment') {
                    $updateData[$field] = trim($requestData[$field]);
                } elseif ($field === 'media') {
                    $updateData[$field] = json_encode($requestData[$field]);
                } elseif ($field === 'status') {
                    if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
                        if (in_array($requestData[$field], ['active', 'inactive', 'pending'])) {
                            $updateData[$field] = $requestData[$field];
                        }
                    }
                }
            }
        }

        if (empty($updateData)) {
            sendResponse(true, 'No fields provided for update.', null, 200);
            return;
        }

        // Update the review
        $setClauses = [];
        $params = [':id' => $reviewId];
        foreach ($updateData as $key => $value) {
            $setClauses[] = "{$key} = :{$key}";
            $params[":{$key}"] = $value;
        }
        $setSql = implode(', ', $setClauses);

        $query = "UPDATE reviews SET {$setSql} WHERE id = :id";
        $stmt = $review->conn->prepare($query);
        $success = $stmt->execute($params);

        if ($success && $stmt->rowCount() > 0) {
            sendResponse(true, 'Review updated successfully');
        } elseif ($success) {
            sendResponse(true, 'No changes detected for the review.');
        } else {
            sendResponse(false, 'Failed to update review (database error)', null, 500);
        }
    } catch (PDOException $e) {
        error_log("Update review error: " . $e->getMessage());
        sendResponse(false, 'Error updating review: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle deleting a review (soft delete)
 */
function handleDeleteReview($review, $requestData) {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        sendResponse(false, 'Authentication required to delete review', null, 401);
        return;
    }

    // Validate required parameters
    if (!isset($requestData['id']) || empty($requestData['id'])) {
        sendResponse(false, 'Review ID is required in request body', null, 400);
        return;
    }
    $reviewId = (int)$requestData['id'];

    try {
        // Check if review exists and get ownership info
        $checkQuery = "SELECT user_id FROM reviews WHERE id = :id AND status = 'active'";
        $checkStmt = $review->conn->prepare($checkQuery);
        $checkStmt->bindParam(':id', $reviewId, PDO::PARAM_INT);
        $checkStmt->execute();
        $currentReview = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$currentReview) {
            sendResponse(false, 'Review not found', null, 404);
            return;
        }

        // Check ownership or admin role
        if ($currentReview['user_id'] !== $_SESSION['user_id'] && 
            (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin')) {
            sendResponse(false, 'You do not have permission to delete this review', null, 403);
            return;
        }

        // Perform soft delete
        $query = "UPDATE reviews SET status = 'inactive' WHERE id = :id";
        $stmt = $review->conn->prepare($query);
        $stmt->bindParam(':id', $reviewId, PDO::PARAM_INT);
        $success = $stmt->execute();

        if ($success && $stmt->rowCount() > 0) {
            sendResponse(true, 'Review deleted successfully');
        } else {
            sendResponse(false, 'Failed to delete review', null, 500);
        }
    } catch (PDOException $e) {
        error_log("Delete review error: " . $e->getMessage());
        sendResponse(false, 'Error deleting review: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle getting review statistics for a product
 */
function handleGetReviewStats($review, $requestData) {
    // Validate required parameters
    if (!isset($_GET['product_id']) || empty($_GET['product_id'])) {
        sendResponse(false, 'Product ID is required in URL parameter (?product_id=...)', null, 400);
        return;
    }
    $productId = (int)$_GET['product_id'];

    try {
        $query = "SELECT 
                    COUNT(*) as total_reviews, 
                    AVG(rating) as average_rating, 
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
                  FROM reviews 
                  WHERE product_id = :product_id AND status = 'active'";
        $stmt = $review->conn->prepare($query);
        $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // Format average rating
        if ($stats && $stats['average_rating'] !== null) {
            $stats['average_rating'] = round((float)$stats['average_rating'], 1);
        }

        sendResponse(true, 'Review statistics retrieved successfully', ['stats' => $stats]);
    } catch (PDOException $e) {
        error_log("Get review stats error: " . $e->getMessage());
        sendResponse(false, 'Error retrieving review statistics: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle marking a review as helpful (increment helpful_count)
 */
function handleMarkReviewHelpful($review, $requestData) {
    // Accept review_id from POST or GET
    $reviewId = isset($requestData['review_id']) ? (int)$requestData['review_id'] : (isset($_GET['review_id']) ? (int)$_GET['review_id'] : 0);
    if (!$reviewId) {
        sendResponse(false, 'review_id is required', null, 400);
        return;
    }
    try {
        $success = $review->markReviewHelpful($reviewId);
        if ($success) {
            // Get the updated helpful count
            $updatedReview = $review->getReviewById($reviewId);
            if ($updatedReview) {
                sendResponse(true, 'Marked as helpful', ['helpful_count' => (int)$updatedReview['helpful_count']]);
            } else {
                sendResponse(true, 'Marked as helpful', ['helpful_count' => 0]);
            }
        } else {
            sendResponse(false, 'Failed to update helpful count', null, 500);
        }
    } catch (Exception $e) {
        sendResponse(false, 'Error: ' . $e->getMessage(), null, 500);
    }
}
?>