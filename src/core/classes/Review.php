<?php
// Review Class - Handles review-related operations

require_once __DIR__ . '/../../core/db_connect.php';

class Review {
    private $db;
    // Make connection accessible within the class instance
    public $conn; // Changed from private $db to public $conn to match API usage

    public function __construct($db = null) {
        $this->conn = $db ?: getDbConnection(); // Assign to public $conn
        $this->db = $this->conn; // Keep private reference if needed internally, though redundant now
    }

    // Add a getter if we want to keep $conn private but allow access (Alternative Fix)
    /*
    public function getConnection() {
        return $this->conn;
    }
    */

    /**
     * Get reviews for a product
     * 
     * @param int $productId The product ID
     * @param int $limit Maximum number of reviews to return
     * @param int $offset Offset for pagination
     * @param string $sortBy Field to sort by
     * @param string $sortOrder Sort order (ASC or DESC)
     * @return array Reviews for the product
     */
    public function getReviewsByProduct($productId, $limit = 10, $offset = 0, $sortBy = 'created_at', $sortOrder = 'DESC') {
        try {
            // Validate sort parameters to prevent SQL injection
            $allowedSortFields = ['created_at', 'rating', 'helpful_count'];
            $sortBy = in_array($sortBy, $allowedSortFields) ? $sortBy : 'created_at';
            $sortOrder = strtoupper($sortOrder) === 'ASC' ? 'ASC' : 'DESC';
            
            // Use $this->conn (now public)
            $stmt = $this->conn->prepare("
                SELECT r.*, u.username, u.profile_picture
                FROM reviews r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.product_id = :product_id AND r.status = 'active'
                ORDER BY $sortBy $sortOrder
                LIMIT :limit OFFSET :offset
            ");
            
            $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC); // Use FETCH_ASSOC for consistency
            
            // Process any JSON fields
            foreach ($reviews as &$review) {
                if (isset($review['media']) && !empty($review['media'])) {
                    $review['media'] = json_decode($review['media'], true);
                }
            }
            
            return $reviews;
        } catch (PDOException $e) {
            error_log('Error fetching reviews by product: ' . $e->getMessage());
            return [];
        }
    }
    
    // ... (rest of the methods using $this->conn) ...

    /**
     * Get review by ID
     * 
     * @param int $reviewId The review ID
     * @return array|null Review data or null if not found
     */
    public function getReviewById($reviewId) {
        try {
            $stmt = $this->conn->prepare("
                SELECT r.*, u.username, u.profile_picture
                FROM reviews r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.id = :id AND r.status = 'active'
            ");
            $stmt->bindParam(':id', $reviewId, PDO::PARAM_INT);
            $stmt->execute();
            
            $review = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($review && isset($review['media']) && !empty($review['media'])) {
                $review['media'] = json_decode($review['media'], true);
            }
            
            return $review ?: null;
        } catch (PDOException $e) {
            error_log('Error fetching review by ID: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get reviews by user
     * 
     * @param int $userId The user ID
     * @param int $limit Maximum number of reviews to return
     * @param int $offset Offset for pagination
     * @return array Reviews by the user
     */
    public function getReviewsByUser($userId, $limit = 10, $offset = 0) {
        try {
            $stmt = $this->conn->prepare("
                SELECT r.*, p.name as product_name, p.images as product_images
                FROM reviews r
                LEFT JOIN products p ON r.product_id = p.id
                WHERE r.user_id = :user_id AND r.status = 'active'
                ORDER BY r.created_at DESC
                LIMIT :limit OFFSET :offset
            ");
            
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process any JSON fields
            foreach ($reviews as &$review) {
                if (isset($review['media']) && !empty($review['media'])) {
                    $review['media'] = json_decode($review['media'], true);
                }
                if (isset($review['product_images']) && !empty($review['product_images'])) {
                    $review['product_images'] = json_decode($review['product_images'], true);
                }
            }
            
            return $reviews;
        } catch (PDOException $e) {
            error_log('Error fetching reviews by user: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Create a new review
     * 
     * @param array $reviewData Review data
     * @return int|false The new review ID or false on failure
     */
    public function createReview($reviewData) {
        try {
            $stmt = $this->conn->prepare("
                INSERT INTO reviews (
                    product_id, user_id, rating, comment, media, created_at, updated_at, status
                ) VALUES (
                    :product_id, :user_id, :rating, :comment, :media, NOW(), NOW(), 'active'
                )
            ");
            
            $stmt->bindParam(':product_id', $reviewData['product_id'], PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $reviewData['user_id'], PDO::PARAM_INT);
            $stmt->bindParam(':rating', $reviewData['rating'], PDO::PARAM_INT);
            $stmt->bindParam(':comment', $reviewData['comment'], PDO::PARAM_STR);
            
            // Convert media array to JSON for storage
            $media = isset($reviewData['media']) ? json_encode($reviewData['media']) : null;
            $stmt->bindParam(':media', $media, PDO::PARAM_STR);
            
            $stmt->execute();
            
            return $this->conn->lastInsertId();
        } catch (PDOException $e) {
            error_log('Error creating review: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update a review
     * 
     * @param int $reviewId The review ID to update
     * @param array $reviewData The review data to update
     * @return bool True on success, false on failure
     */
    public function updateReview($reviewId, $reviewData) {
        try {
            // Start building the query
            $query = "UPDATE reviews SET updated_at = NOW()";
            $params = [];
            
            // Add fields to update
            $allowedFields = ['rating', 'comment', 'status'];
            
            foreach ($allowedFields as $field) {
                if (isset($reviewData[$field])) {
                    $query .= ", $field = :$field";
                    $params[$field] = $reviewData[$field];
                }
            }
            
            // Handle media field (JSON)
            if (isset($reviewData['media'])) {
                $query .= ", media = :media";
                $params['media'] = json_encode($reviewData['media']);
            }
            
            // Add review ID condition
            $query .= " WHERE id = :id";
            $params['id'] = $reviewId;
            
            // Prepare and execute the query
            $stmt = $this->conn->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Error updating review: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete a review (soft delete by setting status to 'deleted')
     * 
     * @param int $reviewId The review ID to delete
     * @return bool True on success, false on failure
     */
    public function deleteReview($reviewId) {
        try {
            $stmt = $this->conn->prepare("
                UPDATE reviews SET status = 'deleted', updated_at = NOW()
                WHERE id = :id
            ");
            
            $stmt->bindParam(':id', $reviewId, PDO::PARAM_INT);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Error deleting review: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get review statistics for a product
     * 
     * @param int $productId The product ID
     * @return array Review statistics
     */
    public function getReviewStats($productId) {
        try {
            $stmt = $this->conn->prepare("
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(rating) as avg_rating,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
                FROM reviews
                WHERE product_id = :product_id AND status = 'active'
            ");
            
            $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
            $stmt->execute();
            
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Format the average rating to 1 decimal place
            if ($stats && $stats['avg_rating'] !== null) {
                $stats['avg_rating'] = round($stats['avg_rating'], 1);
            }
            
            return $stats;
        } catch (PDOException $e) {
            error_log('Error fetching review statistics: ' . $e->getMessage());
            return [
                'total_reviews' => 0,
                'avg_rating' => 0,
                'five_star' => 0,
                'four_star' => 0,
                'three_star' => 0,
                'two_star' => 0,
                'one_star' => 0
            ];
        }
    }
    
    /**
     * Count reviews by user ID
     * 
     * @param int $userId The user ID
     * @return int Number of active reviews by the user
     */
    public function countByUserId($userId) {
        try {
            $stmt = $this->conn->prepare("
                SELECT COUNT(*) 
                FROM reviews 
                WHERE user_id = :user_id AND status = 'active'
            ");
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log('Error counting reviews by user ID: ' . $e->getMessage());
            return 0; // Return 0 on error
        }
    }

    /**
     * Mark a review as helpful (increment helpful_count)
     * @param int $reviewId
     * @return bool
     */
    public function markReviewHelpful($reviewId) {
        $stmt = $this->conn->prepare("UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = :id");
        $stmt->bindParam(':id', $reviewId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>

