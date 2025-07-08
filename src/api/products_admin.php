<?php
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/admin_middleware.php';
require_once __DIR__ . '/../core/db_connect.php';

// Set header to return JSON
header('Content-Type: application/json');
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
$db = getDbConnection();

// Get request method and action
$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = $_GET['action'] ?? null;

// Handle different actions based on request method and action
switch ($requestMethod) {
    case 'GET':
        switch ($action) {
            case 'get_all':
                getAllProducts($db);
                break;
            case 'get':
                getProduct($db);
                break;
            case 'search':
                searchProducts($db);
                break;
            case 'stats':
                getSystemStats($db);
                break;
            case 'recent_activity':
                getRecentActivity($db);
                break;
            case 'system_info':
                getSystemInfo($db);
                break;
            default:
                sendResponse(false, 'Invalid GET action');
                break;
        }
        break;
    
    case 'POST':
        switch ($action) {
            case 'create':
                createProduct($db);
                break;
            case 'toggle_status':
                toggleProductStatus($db);
                break;
            default:
                sendResponse(false, 'Invalid POST action');
                break;
        }
        break;
    
    case 'PUT':
        switch ($action) {
            case 'update':
                updateProduct($db);
                break;
            default:
                sendResponse(false, 'Invalid PUT action');
                break;
        }
        break;
    
    case 'DELETE':
        switch ($action) {
            case 'delete':
                deleteProduct($db);
                break;
            default:
                sendResponse(false, 'Invalid DELETE action');
                break;
        }
        break;
    
    default:
        sendResponse(false, 'Method not allowed', null, 405);
        break;
}

/**
 * Get system statistics
 */
function getSystemStats($db) {
    try {
        $stats = [];
        
        // Total users
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM users");
        $stmt->execute();        $stats['total_users'] = $stmt->fetchColumn();
        
        // Active users (all users with active status)
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
        $stmt->execute();
        $stats['active_users'] = $stmt->fetchColumn();
        
        // Total posts
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'active'");
        $stmt->execute();
        $stats['total_posts'] = $stmt->fetchColumn();
        
        // Total comments
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM comments WHERE status = 'active'");
        $stmt->execute();
        $stats['total_comments'] = $stmt->fetchColumn();
        
        // Total products
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM products WHERE status = 'active'");
        $stmt->execute();
        $stats['total_products'] = $stmt->fetchColumn();
        
        // Total reviews
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM reviews WHERE status = 'active'");
        $stmt->execute();
        $stats['total_reviews'] = $stmt->fetchColumn();
        
        // Today's stats
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()");
        $stmt->execute();
        $stats['today_users'] = $stmt->fetchColumn();
        
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = CURDATE() AND status = 'active'");
        $stmt->execute();
        $stats['today_posts'] = $stmt->fetchColumn();
        
        sendResponse(200, $stats);
    } catch (Exception $e) {
        error_log("Error fetching system stats: " . $e->getMessage());
        sendResponse(500, ['message' => 'Internal Server Error']);
    }
}

/**
 * Get recent activity
 */
function getRecentActivity($db) {
    try {
        $limit = $_GET['limit'] ?? 10;
        
        $stmt = $db->prepare("
            (SELECT 'user' as type, CONCAT('Người dùng mới: ', username) as description, 
                    created_at as timestamp, user_id as entity_id
             FROM users 
             ORDER BY created_at DESC LIMIT ?)
            UNION ALL            (SELECT 'post' as type, CONCAT('Bài viết mới: ', title) as description, 
                    created_at as timestamp, id as entity_id
             FROM posts 
             WHERE status = 'active' 
             ORDER BY created_at DESC LIMIT ?)
            UNION ALL
            (SELECT 'product' as type, CONCAT('Sản phẩm mới: ', name) as description, 
                    created_at as timestamp, id as entity_id
             FROM products 
             WHERE status = 'active' 
             ORDER BY created_at DESC LIMIT ?)
            ORDER BY timestamp DESC 
            LIMIT ?
        ");
        
        $stmt->execute([$limit, $limit, $limit, $limit]);
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, $activities);
    } catch (Exception $e) {
        error_log("Error fetching recent activity: " . $e->getMessage());
        sendResponse(500, ['message' => 'Internal Server Error']);
    }
}

/**
 * Get system information
 */
function getSystemInfo($db) {
    try {
        $info = [];
        
        // Database version
        $stmt = $db->prepare("SELECT VERSION() as version");
        $stmt->execute();
        $info['mysql_version'] = $stmt->fetchColumn();
        
        // PHP version
        $info['php_version'] = phpversion();
        
        // Server info
        $info['server_software'] = $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown';
        
        // Database size (approximate)
        $stmt = $db->prepare("
            SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
        ");
        $stmt->execute();
        $info['database_size_mb'] = $stmt->fetchColumn();
        
        // Memory usage
        $info['memory_usage'] = [
            'current' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'peak' => round(memory_get_peak_usage() / 1024 / 1024, 2) . ' MB'
        ];
        
        sendResponse(200, $info);
    } catch (Exception $e) {
        error_log("Error fetching system info: " . $e->getMessage());
        sendResponse(500, ['message' => 'Internal Server Error']);
    }
}

/**
 * Get all products for admin panel
 */
function getAllProducts($db) {
    try {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 20;
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';
        $category_id = $_GET['category_id'] ?? '';
        $status = $_GET['status'] ?? '';

        // Build WHERE clause
        $whereConditions = [];
        $bindParams = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(p.name LIKE :search OR p.description LIKE :search)";
            $bindParams[':search'] = "%$search%";
        }
        
        if (!empty($category_id)) {
            $whereConditions[] = "p.category_id = :category_id";
            $bindParams[':category_id'] = $category_id;
        }
        
        if (!empty($status)) {
            $whereConditions[] = "p.status = :status";
            $bindParams[':status'] = $status;
        }

        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM products p 
                      LEFT JOIN categories c ON p.category_id = c.id 
                      LEFT JOIN users u ON p.creator_id = u.id 
                      $whereClause";
        $countStmt = $db->prepare($countQuery);
        foreach ($bindParams as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get products
        $query = "SELECT p.*, c.name as category_name, u.username as creator_name,
                         u.full_name as creator_full_name
                  FROM products p 
                  LEFT JOIN categories c ON p.category_id = c.id 
                  LEFT JOIN users u ON p.creator_id = u.id 
                  $whereClause
                  ORDER BY p.created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($query);
        foreach ($bindParams as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse images for each product
        foreach ($products as &$product) {
            if (!empty($product['images'])) {
                $product['images'] = json_decode($product['images'], true) ?: [];
            } else {
                $product['images'] = [];
            }
            
            // Add computed fields
            $product['title'] = $product['name']; // For compatibility with frontend
        }
        
        // Send response with consistent structure for admin panel
        sendResponse(true, 'Lấy danh sách sản phẩm thành công', [
            'products' => $products,
            'total' => $total,
            'page' => (int)$page,
            'limit' => (int)$limit,
            'total_pages' => ceil($total / $limit)
        ]);
        
    } catch (PDOException $e) {
        error_log("Error fetching all products for admin: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi lấy danh sách sản phẩm: ' . $e->getMessage());
    }
}

/**
 * Get single product by ID
 */
function getProduct($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendResponse(false, 'ID sản phẩm là bắt buộc');
            return;
        }
        
        $query = "SELECT p.*, c.name as category_name, u.username as creator_name,
                         u.full_name as creator_full_name,
                         (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status = 'active') as review_count,
                         (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.status = 'active') as avg_rating
                  FROM products p 
                  LEFT JOIN categories c ON p.category_id = c.id 
                  LEFT JOIN users u ON p.creator_id = u.id 
                  WHERE p.id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            sendResponse(false, 'Không tìm thấy sản phẩm');
            return;
        }
        
        // Parse images
        if (!empty($product['images'])) {
            $product['images'] = json_decode($product['images'], true) ?: [];
        } else {
            $product['images'] = [];
        }
        
        // Add computed fields
        $product['title'] = $product['name']; // For compatibility with frontend
        
        sendResponse(true, 'Lấy thông tin sản phẩm thành công', $product);
        
    } catch (PDOException $e) {
        error_log("Error fetching product: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi lấy thông tin sản phẩm: ' . $e->getMessage());
    }
}

/**
 * Search products
 */
function searchProducts($db) {
    try {
        $query = $_GET['query'] ?? '';
        $category = $_GET['category'] ?? '';
        $limit = $_GET['limit'] ?? 20;
        $page = $_GET['page'] ?? 1;
        $offset = ($page - 1) * $limit;
        
        // Build WHERE clause
        $whereConditions = [];
        $bindParams = [];
        
        if (!empty($query)) {
            $whereConditions[] = "(p.name LIKE :query OR p.description LIKE :query)";
            $bindParams[':query'] = "%$query%";
        }
        
        if (!empty($category)) {
            $whereConditions[] = "c.name = :category";
            $bindParams[':category'] = $category;
        }

        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM products p 
                      LEFT JOIN categories c ON p.category_id = c.id 
                      $whereClause";
        $countStmt = $db->prepare($countQuery);
        foreach ($bindParams as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get products
        $searchQuery = "SELECT p.*, c.name as category_name, u.username as creator_name,
                               u.full_name as creator_full_name
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        LEFT JOIN users u ON p.creator_id = u.id 
                        $whereClause
                        ORDER BY p.created_at DESC 
                        LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($searchQuery);
        foreach ($bindParams as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse images for each product
        foreach ($products as &$product) {
            if (!empty($product['images'])) {
                $product['images'] = json_decode($product['images'], true) ?: [];
            } else {
                $product['images'] = [];
            }
            
            // Add computed fields
            $product['title'] = $product['name']; // For compatibility with frontend
        }
        
        sendResponse(true, 'Tìm kiếm sản phẩm thành công', [
            'products' => $products,
            'total' => $total,
            'page' => (int)$page,
            'limit' => (int)$limit,
            'total_pages' => ceil($total / $limit)
        ]);
        
    } catch (PDOException $e) {
        error_log("Error searching products: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi tìm kiếm sản phẩm: ' . $e->getMessage());
    }
}

/**
 * Create new product
 */
function createProduct($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required_fields = ['name', 'description', 'price', 'category_id'];
        foreach ($required_fields as $field) {
            if (empty($input[$field])) {
                sendResponse(false, "Trường $field là bắt buộc");
                return;
            }
        }
        
        // Get current user from session
        session_start();
        $creator_id = $_SESSION['user_id'] ?? null;
        
        if (!$creator_id) {
            sendResponse(false, 'Không thể xác định người tạo sản phẩm');
            return;
        }
        
        // Prepare images JSON
        $images = isset($input['images']) ? json_encode($input['images']) : '[]';
        
        $query = "INSERT INTO products (name, description, price, category_id, creator_id, images, status, created_at)
                  VALUES (:name, :description, :price, :category_id, :creator_id, :images, :status, NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':name', $input['name']);
        $stmt->bindParam(':description', $input['description']);
        $stmt->bindParam(':price', $input['price']);
        $stmt->bindParam(':category_id', $input['category_id']);
        $stmt->bindParam(':creator_id', $creator_id);
        $stmt->bindParam(':images', $images);
        $stmt->bindParam(':status', $input['status'] ?? 'active');
        
        if ($stmt->execute()) {
            $product_id = $db->lastInsertId();
            sendResponse(true, 'Tạo sản phẩm thành công', ['id' => $product_id]);
        } else {
            sendResponse(false, 'Lỗi khi tạo sản phẩm');
        }
        
    } catch (PDOException $e) {
        error_log("Error creating product: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi tạo sản phẩm: ' . $e->getMessage());
    }
}

/**
 * Update product
 */
function updateProduct($db) {
    try {
        $id = $_GET['id'] ?? null;
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$id) {
            sendResponse(false, 'ID sản phẩm là bắt buộc');
            return;
        }
        
        // Check if product exists
        $checkStmt = $db->prepare("SELECT id FROM products WHERE id = :id");
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch()) {
            sendResponse(false, 'Không tìm thấy sản phẩm');
            return;
        }
        
        // Build update query dynamically
        $updateFields = [];
        $bindParams = [':id' => $id];
        
        $allowedFields = ['name', 'description', 'price', 'category_id', 'status', 'images'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                if ($field === 'images') {
                    $updateFields[] = "$field = :$field";
                    $bindParams[":$field"] = json_encode($input[$field]);
                } else {
                    $updateFields[] = "$field = :$field";
                    $bindParams[":$field"] = $input[$field];
                }
            }
        }
        
        if (empty($updateFields)) {
            sendResponse(false, 'Không có dữ liệu để cập nhật');
            return;
        }
        
        $updateFields[] = "updated_at = NOW()";
        
        $query = "UPDATE products SET " . implode(', ', $updateFields) . " WHERE id = :id";
        
        $stmt = $db->prepare($query);
        foreach ($bindParams as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        if ($stmt->execute()) {
            sendResponse(true, 'Cập nhật sản phẩm thành công');
        } else {
            sendResponse(false, 'Lỗi khi cập nhật sản phẩm');
        }
        
    } catch (PDOException $e) {
        error_log("Error updating product: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi cập nhật sản phẩm: ' . $e->getMessage());
    }
}

/**
 * Delete product
 */
function deleteProduct($db) {
    try {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            sendResponse(false, 'ID sản phẩm là bắt buộc');
            return;
        }
        
        // Check if product exists
        $checkStmt = $db->prepare("SELECT id FROM products WHERE id = :id");
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch()) {
            sendResponse(false, 'Không tìm thấy sản phẩm');
            return;
        }
        
        // Delete product (cascade will handle related records)
        $stmt = $db->prepare("DELETE FROM products WHERE id = :id");
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            sendResponse(true, 'Xóa sản phẩm thành công');
        } else {
            sendResponse(false, 'Lỗi khi xóa sản phẩm');
        }
        
    } catch (PDOException $e) {
        error_log("Error deleting product: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi xóa sản phẩm: ' . $e->getMessage());
    }
}

/**
 * Toggle product status
 */
function toggleProductStatus($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $input['id'] ?? null;
        $status = $input['status'] ?? null;
        
        if (!$id || !$status) {
            sendResponse(false, 'ID sản phẩm và trạng thái là bắt buộc');
            return;
        }
        
        // Validate status
        $allowedStatuses = ['active', 'inactive', 'draft'];
        if (!in_array($status, $allowedStatuses)) {
            sendResponse(false, 'Trạng thái không hợp lệ');
            return;
        }
        
        // Check if product exists
        $checkStmt = $db->prepare("SELECT id FROM products WHERE id = :id");
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch()) {
            sendResponse(false, 'Không tìm thấy sản phẩm');
            return;
        }
        
        // Update status
        $stmt = $db->prepare("UPDATE products SET status = :status, updated_at = NOW() WHERE id = :id");
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            sendResponse(true, 'Cập nhật trạng thái sản phẩm thành công');
        } else {
            sendResponse(false, 'Lỗi khi cập nhật trạng thái sản phẩm');
        }
        
    } catch (PDOException $e) {
        error_log("Error toggling product status: " . $e->getMessage());
        sendResponse(false, 'Lỗi khi cập nhật trạng thái sản phẩm: ' . $e->getMessage());
    }
}
