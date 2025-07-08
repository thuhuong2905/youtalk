<?php
// Lớp Review - Xử lý đánh giá sản phẩm

require_once __DIR__ . '/../../core/db_connect.php';

class Review {
    private $db;
    public $conn;

    public function __construct($db = null) {
        $this->conn = $db ?: getDbConnection();
        $this->db = $this->conn;
    }

    /**
     * Lấy đánh giá theo sản phẩm
     */
    public function getReviewsByProduct($productId, $limit = 10, $offset = 0, $sortBy = 'created_at', $sortOrder = 'DESC') {
        try {
            $allowedSortFields = ['created_at', 'rating', 'helpful_count'];
            $sortBy = in_array($sortBy, $allowedSortFields) ? $sortBy : 'created_at';
            $sortOrder = strtoupper($sortOrder) === 'ASC' ? 'ASC' : 'DESC';
            
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
            
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($reviews as &$review) {
                if (isset($review['media']) && !empty($review['media'])) {
                    $review['media'] = json_decode($review['media'], true);
                }
            }
            
            return $reviews;
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy đánh giá theo sản phẩm: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Lấy đánh giá theo ID
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
            error_log('Lỗi khi lấy đánh giá theo ID: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Lấy đánh giá theo người dùng
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
            error_log('Lỗi khi lấy đánh giá theo người dùng: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Tạo đánh giá mới
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
            
            $media = isset($reviewData['media']) ? json_encode($reviewData['media']) : null;
            $stmt->bindParam(':media', $media, PDO::PARAM_STR);
            
            $stmt->execute();
            
            return $this->conn->lastInsertId();
        } catch (PDOException $e) {
            error_log('Lỗi khi tạo đánh giá: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Cập nhật đánh giá
     */
    public function updateReview($reviewId, $reviewData) {
        try {
            $query = "UPDATE reviews SET updated_at = NOW()";
            $params = [];
            
            $allowedFields = ['rating', 'comment', 'status'];
            
            foreach ($allowedFields as $field) {
                if (isset($reviewData[$field])) {
                    $query .= ", $field = :$field";
                    $params[$field] = $reviewData[$field];
                }
            }
            
            if (isset($reviewData['media'])) {
                $query .= ", media = :media";
                $params['media'] = json_encode($reviewData['media']);
            }
            
            $query .= " WHERE id = :id";
            $params['id'] = $reviewId;
            
            $stmt = $this->conn->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Lỗi khi cập nhật đánh giá: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Xóa đánh giá (xóa mềm)
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
            error_log('Lỗi khi xóa đánh giá: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Lấy thống kê đánh giá của sản phẩm
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
            
            if ($stats && $stats['avg_rating'] !== null) {
                $stats['avg_rating'] = round($stats['avg_rating'], 1);
            }
            
            return $stats;
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy thống kê đánh giá: ' . $e->getMessage());
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
     * Đếm số đánh giá của người dùng
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
            error_log('Lỗi khi đếm đánh giá theo ID người dùng: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Đánh dấu đánh giá hữu ích
     */
    public function markReviewHelpful($reviewId) {
        $stmt = $this->conn->prepare("UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = :id");
        $stmt->bindParam(':id', $reviewId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>

