<?php
// Lớp Product - Xử lý sản phẩm và dịch vụ

require_once __DIR__ . '/../../core/db_connect.php';

class Product {
    private $db;
    public $conn;    
    public function __construct($dbConnection = null) {
        $this->conn = $dbConnection ?: getDbConnection();
        $this->db = $this->conn;
    }
    
    /**
     * Lấy sản phẩm theo ID
     */
    public function getProductById($productId) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, c.name as category_name, u.username as creator_username
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN users u ON p.creator_id = u.id
                WHERE p.id = :id AND p.status = 'active'
            ");
            $stmt->bindParam(':id', $productId, PDO::PARAM_INT);
            $stmt->execute();
            
            $product = $stmt->fetch();
            
            return $product ?: null;
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy sản phẩm theo ID: ' . $e->getMessage());
            return null;
        }    }
    
    /**
     * Lấy sản phẩm theo danh mục
     */
    public function getProductsByCategory($categoryId, $limit = 10, $offset = 0, $sortBy = 'created_at', $sortOrder = 'DESC') {
        try {
            $allowedSortFields = ['name', 'price', 'created_at', 'avg_rating'];
            $sortBy = in_array($sortBy, $allowedSortFields) ? $sortBy : 'created_at';
            $sortOrder = strtoupper($sortOrder) === 'ASC' ? 'ASC' : 'DESC';
            
            $stmt = $this->db->prepare("
                SELECT p.*, c.name as category_name, u.username as creator_username,
                       (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
                       (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN users u ON p.creator_id = u.id
                WHERE p.category_id = :category_id AND p.status = 'active'
                ORDER BY $sortBy $sortOrder
                LIMIT :limit OFFSET :offset
            ");
            
            $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy sản phẩm theo danh mục: ' . $e->getMessage());
            return [];
        }    }
    
    /**
     * Tìm kiếm sản phẩm
     */
    public function searchProducts($query, $limit = 10, $offset = 0) {
        try {
            $searchTerm = '%' . $query . '%';
            
            $stmt = $this->db->prepare("
                SELECT p.*, c.name as category_name, u.username as creator_username,
                       (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
                       (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN users u ON p.creator_id = u.id
                WHERE (p.name LIKE :search OR p.description LIKE :search) AND p.status = 'active'
                ORDER BY p.created_at DESC
                LIMIT :limit OFFSET :offset
            ");
            
            $stmt->bindParam(':search', $searchTerm, PDO::PARAM_STR);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('Lỗi khi tìm kiếm sản phẩm: ' . $e->getMessage());
            return [];
        }    }
    
    /**
     * Lấy sản phẩm nổi bật
     */
    public function getFeaturedProducts($limit = 6) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, c.name as category_name, u.username as creator_username,
                       (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
                       (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN users u ON p.creator_id = u.id
                WHERE p.status = 'active' AND p.is_featured = 1
                ORDER BY p.created_at DESC
                LIMIT :limit
            ");
            
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy sản phẩm nổi bật: ' . $e->getMessage());
            return [];
        }    }
    
    /**
     * Lấy sản phẩm liên quan
     */
    public function getRelatedProducts($productId, $limit = 4) {
        try {
            $stmt = $this->db->prepare("
                SELECT category_id FROM products WHERE id = :id
            ");
            $stmt->bindParam(':id', $productId, PDO::PARAM_INT);
            $stmt->execute();
            
            $product = $stmt->fetch();
            
            if (!$product) {
                return [];
            }
            
            $categoryId = $product['category_id'];
            
            $stmt = $this->db->prepare("
                SELECT p.*, c.name as category_name, u.username as creator_username,
                       (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
                       (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN users u ON p.creator_id = u.id
                WHERE p.category_id = :category_id AND p.id != :product_id AND p.status = 'active'
                ORDER BY RAND()
                LIMIT :limit
            ");
            
            $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
            $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy sản phẩm liên quan: ' . $e->getMessage());
            return [];
        }    }
    
    /**
     * Tạo sản phẩm mới
     */
    public function createProduct($productData) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO products (
                    name, description, price, category_id, creator_id, 
                    brand, location, images, specs, created_at, updated_at, status
                ) VALUES (
                    :name, :description, :price, :category_id, :creator_id,
                    :brand, :location, :images, :specs, NOW(), NOW(), 'active'
                )
            ");
            
            $stmt->bindParam(':name', $productData['name'], PDO::PARAM_STR);
            $stmt->bindParam(':description', $productData['description'], PDO::PARAM_STR);
            $stmt->bindParam(':price', $productData['price'], PDO::PARAM_STR);
            $stmt->bindParam(':category_id', $productData['category_id'], PDO::PARAM_INT);
            $stmt->bindParam(':creator_id', $productData['creator_id'], PDO::PARAM_INT);
            $stmt->bindParam(':brand', $productData['brand'], PDO::PARAM_STR);
            $stmt->bindParam(':location', $productData['location'], PDO::PARAM_STR);
            
            $images = isset($productData['images']) ? json_encode($productData['images']) : null;
            $specs = isset($productData['specs']) ? json_encode($productData['specs']) : null;
            
            $stmt->bindParam(':images', $images, PDO::PARAM_STR);
            $stmt->bindParam(':specs', $specs, PDO::PARAM_STR);
            
            $stmt->execute();
            
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log('Lỗi khi tạo sản phẩm: ' . $e->getMessage());
            return false;
        }    }
    
    /**
     * Cập nhật sản phẩm
     */
    public function updateProduct($productId, $productData) {
        try {
            $query = "UPDATE products SET updated_at = NOW()";
            $params = [];
            
            $allowedFields = ['name', 'description', 'price', 'category_id', 'brand', 'location', 'status'];
            
            foreach ($allowedFields as $field) {
                if (isset($productData[$field])) {
                    $query .= ", $field = :$field";
                    $params[$field] = $productData[$field];
                }
            }
            
            if (isset($productData['images'])) {
                $query .= ", images = :images";
                $params['images'] = json_encode($productData['images']);
            }
            
            if (isset($productData['specs'])) {
                $query .= ", specs = :specs";
                $params['specs'] = json_encode($productData['specs']);
            }
            
            $query .= " WHERE id = :id";
            $params['id'] = $productId;
            
            $stmt = $this->db->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Lỗi khi cập nhật sản phẩm: ' . $e->getMessage());
            return false;
        }
    }    /**
     * Lấy tất cả danh mục
     */
    public function getAllCategories() {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM categories ORDER BY name ASC
            ");
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy danh mục: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Lấy danh mục theo ID
     */
    public function getCategoryById($categoryId) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM categories WHERE id = :id
            ");
            $stmt->bindParam(':id', $categoryId, PDO::PARAM_INT);
            $stmt->execute();
            
            $category = $stmt->fetch();
            
            return $category ?: null;
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy danh mục theo ID: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Tăng số lượt xem sản phẩm
     */
    public function incrementViewCount($productId) {
        try {
            $stmt = $this->db->prepare("UPDATE products SET view_count = IFNULL(view_count,0) + 1 WHERE id = :id");
            $stmt->bindParam(':id', $productId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Lỗi khi tăng số lượt xem sản phẩm: ' . $e->getMessage());
            return false;
        }
    }
}
?>
