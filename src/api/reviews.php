<?php
// Reviews API Endpoint - Fixed Version
// Handles review listing, creation, updating, and statistics

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/classes/Review.php';

// Set headers
header('Content-Type: application/json');

// Handle CORS
header('Access-Control-Allow-Origin: *'); // Adjust in production
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Debug: Log request details
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("GET params: " . print_r($_GET, true));
error_log("POST data: " . file_get_contents('php://input'));

// Get action from query parameters
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Debug: Log the action
error_log("Action received: " . $action);

// Validate action exists
if (empty($action)) {
    sendResponse(false, 'Action parameter is required in URL (?action=...)', null, 400);
    exit;
}

// Create database connection
try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
} catch (Exception $e) {
    sendResponse(false, 'Database connection error: ' . $e->getMessage(), null, 500);
    exit;
}

// Create Review instance
$review = new Review($conn);

// Get the request data
$requestData = getRequestData();

// Debug: Log request data
error_log("Request data: " . print_r($requestData, true));

// List of valid actions for validation
$validActions = [
    'list_featured',
    'get_by_product', 
    'get_by_id',
    'get_by_user',
    'create',
    'update', 
    'delete',
    'get_stats'
];

// Validate action
if (!in_array($action, $validActions)) {
    sendResponse(false, 'Invalid action specified. Valid actions: ' . implode(', ', $validActions), null, 400);
    exit;
}

// Process based on the requested action
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
    default:
        // This should never be reached now due to validation above
        sendResponse(false, 'Invalid action specified', null, 400);
        break;
}

/**
 * Handle getting featured reviews (top 3 by helpful_count)
 */
function handleGetFeaturedReviews($review, $requestData) {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 3;

    try {
        // Query to get top unique product reviews with 5 stars, ordered by helpful_count
        $query = "WITH RankedReviews AS (
                    SELECT 
                        r.*, 
                        p.name AS product_name, 
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

        sendResponse(true, 'Featured reviews retrieved successfully', [
            'reviews' => $reviews
        ]);

    } catch (PDOException $e) {
        error_log("Featured reviews error: " . $e->getMessage());
        sendResponse(false, 'Error retrieving featured reviews: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle getting reviews for a product
 */
function handleGetReviewsByProduct($review, $requestData) {
    // Accept product_id from either GET or POST/body
    $productId = null;
    if (isset($requestData['product_id']) && !empty($requestData['product_id'])) {
        $productId = (int)$requestData['product_id'];
    } elseif (isset($_GET['product_id']) && !empty($_GET['product_id'])) {
        $productId = (int)$_GET['product_id'];
    }
    if (empty($productId)) {
        sendResponse(false, 'Product ID is required (in POST body or URL parameter)', null, 400);
        return;
    }
    $limit = isset($requestData['limit']) ? (int)$requestData['limit'] : (isset($_GET['limit']) ? (int)$_GET['limit'] : 10);
    $offset = isset($requestData['offset']) ? (int)$requestData['offset'] : (isset($_GET['offset']) ? (int)$_GET['offset'] : 0);
    $sortBy = isset($requestData['sort_by']) ? $requestData['sort_by'] : (isset($_GET['sort_by']) ? $_GET['sort_by'] : 'created_at');
    $sortOrder = isset($requestData['sort_order']) ? $requestData['sort_order'] : (isset($_GET['sort_order']) ? $_GET['sort_order'] : 'DESC');

    // Basic validation for sort columns to prevent SQL injection
    $allowedSortColumns = ['created_at', 'rating', 'helpful_count'];
    if (!in_array($sortBy, $allowedSortColumns)) {
        $sortBy = 'created_at';
    }
    $sortOrder = strtoupper($sortOrder) === 'ASC' ? 'ASC' : 'DESC';

    try {
        // Get total count for pagination
        $countQuery = "SELECT COUNT(*) FROM reviews WHERE product_id = :product_id AND status = 'active'";
        $countStmt = $review->conn->prepare($countQuery);
        $countStmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
        $countStmt->execute();
        $totalCount = $countStmt->fetchColumn();

        // Get reviews with user info
        $query = "SELECT r.*, u.username 
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

        sendResponse(true, 'Reviews retrieved successfully', [
            'reviews' => $reviewsData,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'total' => $totalCount
            ]
        ]);
    } catch (PDOException $e) {
        error_log("Get reviews by product error: " . $e->getMessage());
        sendResponse(false, 'Error retrieving reviews: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Handle getting a review by ID
 */
function handleGetReviewById($review, $requestData) {
    // Validate required parameters
    if (!isset($_GET['id']) || empty($_GET['id'])) {
        sendResponse(false, 'Review ID is required in URL parameter (?id=...)', null, 400);
        return;
    }

    $reviewId = (int)$_GET['id'];

    try {
        $query = "SELECT r.*, u.username, p.name as product_name 
                  FROM reviews r 
                  JOIN users u ON r.user_id = u.id 
                  JOIN products p ON r.product_id = p.id
                  WHERE r.id = :id AND r.status = 'active' AND u.status = 'active' AND p.status = 'active'";
        $stmt = $review->conn->prepare($query);
        $stmt->bindParam(':id', $reviewId, PDO::PARAM_INT);
        $stmt->execute();
        $reviewData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($reviewData) {
            sendResponse(true, 'Review retrieved successfully', [
                'review' => $reviewData
            ]);
        } else {
            sendResponse(false, 'Review not found or inactive', null, 404);
        }
    } catch (PDOException $e) {
        error_log("Get review by ID error: " . $e->getMessage());
        sendResponse(false, 'Error retrieving review: ' . $e->getMessage(), null, 500);
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
    // Accept product_id from either GET or POST/body
    $productId = null;
    if (isset($requestData['product_id']) && !empty($requestData['product_id'])) {
        $productId = (int)$requestData['product_id'];
    } elseif (isset($_GET['product_id']) && !empty($_GET['product_id'])) {
        $productId = (int)$_GET['product_id'];
    }
    if (empty($productId)) {
        sendResponse(false, 'Product ID is required (in POST body or URL parameter)', null, 400);
        return;
    }
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

?>