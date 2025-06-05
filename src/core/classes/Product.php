<?php
// Product Class - Handles product/service-related operations

require_once __DIR__ . '/../../core/db_connect.php';

class Product {
    private $db;
    
    public function __construct() {
        $this->db = getDbConnection();
    }
    
    /**
     * Get product by ID
     * 
     * @param int $productId The product ID to retrieve
     * @return array|null Product data or null if not found
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
            error_log('Error fetching product by ID: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get products by category
     * 
     * @param int $categoryId The category ID
     * @param int $limit Maximum number of products to return
     * @param int $offset Offset for pagination
     * @param string $sortBy Field to sort by
     * @param string $sortOrder Sort order (ASC or DESC)
     * @return array Products in the category
     */
    public function getProductsByCategory($categoryId, $limit = 10, $offset = 0, $sortBy = 'created_at', $sortOrder = 'DESC') {
        try {
            // Validate sort parameters to prevent SQL injection
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
            error_log('Error fetching products by category: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Search products
     * 
     * @param string $query Search query
     * @param int $limit Maximum number of products to return
     * @param int $offset Offset for pagination
     * @return array Matching products
     */
    public function searchProducts($query, $limit = 10, $offset = 0) {
        try {
            // Prepare search terms
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
            error_log('Error searching products: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get featured products
     * 
     * @param int $limit Maximum number of products to return
     * @return array Featured products
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
            error_log('Error fetching featured products: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get related products
     * 
     * @param int $productId The product ID
     * @param int $limit Maximum number of products to return
     * @return array Related products
     */
    public function getRelatedProducts($productId, $limit = 4) {
        try {
            // First get the category of the current product
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
            
            // Then get other products in the same category
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
            error_log('Error fetching related products: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Create a new product
     * 
     * @param array $productData Product data
     * @return int|false The new product ID or false on failure
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
            
            // Convert arrays to JSON for storage
            $images = isset($productData['images']) ? json_encode($productData['images']) : null;
            $specs = isset($productData['specs']) ? json_encode($productData['specs']) : null;
            
            $stmt->bindParam(':images', $images, PDO::PARAM_STR);
            $stmt->bindParam(':specs', $specs, PDO::PARAM_STR);
            
            $stmt->execute();
            
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log('Error creating product: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update a product
     * 
     * @param int $productId The product ID to update
     * @param array $productData The product data to update
     * @return bool True on success, false on failure
     */
    public function updateProduct($productId, $productData) {
        try {
            // Start building the query
            $query = "UPDATE products SET updated_at = NOW()";
            $params = [];
            
            // Add fields to update
            $allowedFields = ['name', 'description', 'price', 'category_id', 'brand', 'location', 'status'];
            
            foreach ($allowedFields as $field) {
                if (isset($productData[$field])) {
                    $query .= ", $field = :$field";
                    $params[$field] = $productData[$field];
                }
            }
            
            // Handle special fields (JSON)
            if (isset($productData['images'])) {
                $query .= ", images = :images";
                $params['images'] = json_encode($productData['images']);
            }
            
            if (isset($productData['specs'])) {
                $query .= ", specs = :specs";
                $params['specs'] = json_encode($productData['specs']);
            }
            
            // Add product ID condition
            $query .= " WHERE id = :id";
            $params['id'] = $productId;
            
            // Prepare and execute the query
            $stmt = $this->db->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Error updating product: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get all categories
     * 
     * @return array All categories
     */
    public function getAllCategories() {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM categories ORDER BY name ASC
            ");
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('Error fetching categories: ' . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get category by ID
     * 
     * @param int $categoryId The category ID
     * @return array|null Category data or null if not found
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
            error_log('Error fetching category by ID: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Increment product view count
     * @param int $productId
     * @return bool
     */
    public function incrementViewCount($productId) {
        try {
            $stmt = $this->db->prepare("UPDATE products SET view_count = IFNULL(view_count,0) + 1 WHERE id = :id");
            $stmt->bindParam(':id', $productId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Error incrementing product view count: ' . $e->getMessage());
            return false;
        }
    }
}
?>
