<?php
// API Quản lý Danh mục - Xử lý tất cả các thao tác CRUD cho danh mục

require_once '../config/database.php';
require_once '../core/db_connect.php';
require_once '../core/api_utils.php';
require_once '../core/session_handler.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$db = new Database();
$conn = $db->getConnection();

// Lấy danh mục gốc kèm thống kê
function getRootCategoriesWithStats($conn, $include_count) {
    $query = "SELECT 
        parent.id,
        parent.name,
        parent.description,
        parent.image,
        parent.status,
        parent.parent_id";
    
    if ($include_count) {
        $query .= ",
        COUNT(DISTINCT p.id) as total_posts,
        COUNT(DISTINCT child.id) as child_categories_count";
    }
    
    $query .= " FROM categories parent";
    
    if ($include_count) {
        $query .= " 
        LEFT JOIN categories child ON (
            child.parent_id = parent.id 
            AND child.status = 'active'
        ) 
        LEFT JOIN posts p ON (
            (p.category_id = parent.id OR p.category_id = child.id)
            AND p.status = 'active'
        )";
    }    
    $query .= " 
    WHERE parent.parent_id IS NULL 
        AND parent.status = 'active'";
    
    if ($include_count) {
        $query .= " 
        GROUP BY 
            parent.id,
            parent.name,
            parent.description,
            parent.image,
            parent.status,
            parent.parent_id";
    }
    
    $query .= " ORDER BY parent.name ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Lấy danh mục con
function getChildCategories($conn, $parent_id, $include_count) {
    $query = "SELECT 
        c.id,
        c.name,
        c.description,
        c.image,
        c.status,
        c.parent_id";
    
    if ($include_count) {
        $query .= ",
        (SELECT COUNT(*) FROM posts po 
         WHERE po.category_id = c.id AND po.status = 'active') as total_posts,
        0 as child_categories_count";
    }
    
    $query .= " FROM categories c 
    WHERE c.status = 'active' 
        AND c.parent_id = ?
    ORDER BY c.name ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute([$parent_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Lấy tất cả danh mục kèm thống kê (cho admin panel)
function getAllCategoriesWithStats($conn, $include_count) {
    $query = "SELECT 
        c.id,
        c.name,
        c.description,
        c.image,
        c.status,
        c.parent_id,
        pc.name as parent_name";
    
    if ($include_count) {
        $query .= ",
        COUNT(DISTINCT p.id) as total_posts,
        COUNT(DISTINCT pr.id) as total_products";
    }
    
    $query .= " FROM categories c
        LEFT JOIN categories pc ON c.parent_id = pc.id";
    
    if ($include_count) {
        $query .= " 
        LEFT JOIN posts p ON (p.category_id = c.id AND p.status = 'active')
        LEFT JOIN products pr ON (pr.category_id = c.id AND pr.status = 'active')";
    }
    
    $query .= " WHERE c.status = 'active'";
    
    if ($include_count) {
        $query .= " 
        GROUP BY 
            c.id,
            c.name,
            c.description,
            c.image,
            c.status,
            c.parent_id,
            pc.name";
    }
    
    $query .= " ORDER BY c.parent_id ASC, c.name ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Chuẩn hóa dữ liệu trả về
function normalizeCategories($categories) {
    foreach ($categories as &$category) {
        // Đảm bảo có các trường thống kê
        if (!isset($category['total_posts'])) {
            $category['total_posts'] = 0;
        }
        if (!isset($category['child_categories_count'])) {
            $category['child_categories_count'] = 0;
        }
        
        // Thêm trường tương thích ngược
        $category['item_count'] = $category['total_posts'];
        
        // Chuyển đổi kiểu dữ liệu
        $category['total_posts'] = (int)$category['total_posts'];
        $category['child_categories_count'] = (int)$category['child_categories_count'];
        $category['item_count'] = (int)$category['item_count'];
        $category['id'] = (int)$category['id'];
        
        if ($category['parent_id'] !== null) {
            $category['parent_id'] = (int)$category['parent_id'];
        }
    }
    
    return $categories;
}

// Xử lý các hành động khác nhau
switch ($action) {
    case 'get_all':
        try {
            $query = "SELECT 
                c.id,
                c.name,
                c.description,
                c.image,
                c.status,
                c.parent_id,
                c.icon,
                COALESCE(product_count.count, 0) as product_count
            FROM categories c
            LEFT JOIN (
                SELECT category_id, COUNT(*) as count 
                FROM products 
                WHERE status = 'active' 
                GROUP BY category_id
            ) product_count ON c.id = product_count.category_id
            WHERE c.status = 'active'
            ORDER BY c.parent_id ASC, c.name ASC";
              $stmt = $conn->prepare($query);
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($categories as &$category) {
                $category['id'] = (int)$category['id'];
                $category['parent_id'] = $category['parent_id'] ? (int)$category['parent_id'] : null;
                $category['product_count'] = (int)$category['product_count'];
                $category['icon'] = $category['icon'] ?: 'fas fa-folder';
            }
            
            sendResponse(true, 'Lấy tất cả danh mục thành công', $categories);
            
        } catch (PDOException $e) {
            sendResponse(false, 'Lỗi khi lấy danh mục: ' . $e->getMessage());
        }        break;

    case 'get_category':
        $category_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if (!$category_id) {
            sendResponse(false, 'ID danh mục là bắt buộc');
            break;
        }
        
        try {
            $query = "SELECT 
                c.id,
                c.name,
                c.description,
                c.image,
                c.status,
                c.parent_id,
                c.icon,
                COALESCE(product_count.count, 0) as product_count,
                COALESCE(subcategory_count.count, 0) as subcategory_count
            FROM categories c
            LEFT JOIN (
                SELECT category_id, COUNT(*) as count 
                FROM products 
                WHERE status = 'active' 
                GROUP BY category_id
            ) product_count ON c.id = product_count.category_id
            LEFT JOIN (
                SELECT parent_id, COUNT(*) as count 
                FROM categories 
                WHERE status = 'active' AND parent_id IS NOT NULL
                GROUP BY parent_id
            ) subcategory_count ON c.id = subcategory_count.parent_id
            WHERE c.id = ? AND c.status = 'active'";
            
            $stmt = $conn->prepare($query);
            $stmt->execute([$category_id]);            $category = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($category) {
                $category['id'] = (int)$category['id'];
                $category['parent_id'] = $category['parent_id'] ? (int)$category['parent_id'] : null;
                $category['product_count'] = (int)$category['product_count'];
                $category['subcategory_count'] = (int)$category['subcategory_count'];
                $category['icon'] = $category['icon'] ?: 'fas fa-folder';
                
                sendResponse(true, 'Lấy thông tin danh mục thành công', $category);
            } else {
                sendResponse(false, 'Không tìm thấy danh mục', null, 404);
            }
            
        } catch (PDOException $e) {
            sendResponse(false, 'Lỗi khi lấy thông tin danh mục: ' . $e->getMessage());
        }        break;    case 'list':
        $parent_id = isset($_GET['parent_id']) ? intval($_GET['parent_id']) : null;
        $only_root = isset($_GET['root']) && $_GET['root'] === 'true';
        $include_count = isset($_GET['count']) && $_GET['count'] === 'true';
        $get_all = isset($_GET['all']) && $_GET['all'] === 'true';

        try {
            if ($get_all) {
                // Lấy tất cả danh mục (admin panel)
                $categories = getAllCategoriesWithStats($conn, $include_count);
            } else {
                $is_root_categories = $only_root || ($parent_id === null);
                
                if ($is_root_categories) {
                    $categories = getRootCategoriesWithStats($conn, $include_count);
                } else {
                    $categories = getChildCategories($conn, $parent_id, $include_count);
                }
            }

            $categories = normalizeCategories($categories);

            sendResponse(true, 'Lấy danh mục thành công', ['categories' => $categories]);
            
        } catch (PDOException $e) {
            sendResponse(false, 'Lỗi khi lấy danh mục: ' . $e->getMessage());
        }break;

    case 'get':
        if (!isset($_GET['id'])) {
            sendResponse(false, 'ID danh mục là bắt buộc');
            break;
        }

        $category_id = intval($_GET['id']);
        $query = "SELECT * FROM categories WHERE id = ? AND status = 'active'";

        try {
            $stmt = $conn->prepare($query);
            $stmt->execute([$category_id]);

            $category = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($category) {
                sendResponse(true, 'Lấy danh mục thành công', ['category' => $category]);
            } else {
                sendResponse(false, 'Không tìm thấy danh mục', null, 404);
            }
        } catch (PDOException $e) {
            sendResponse(false, 'Lỗi khi lấy danh mục: ' . $e->getMessage());
        }        break;

    case 'create':
        if (!isUserLoggedIn() || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse(false, 'Bạn không có quyền tạo danh mục', null, 403);
            break;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) $data = $_POST;

        if (!isset($data['name']) || empty(trim($data['name']))) {
            sendResponse(false, 'Tên danh mục là bắt buộc');
            break;
        }

        $categoryData = [
            'name' => trim($data['name']),
            'description' => isset($data['description']) ? trim($data['description']) : null,
            'parent_id' => isset($data['parent_id']) && !empty($data['parent_id']) ? intval($data['parent_id']) : null,
            'image' => isset($data['image']) ? trim($data['image']) : null,
            'status' => 'active'
        ];

        try {
            $query = "INSERT INTO categories (name, description, parent_id, image, status) VALUES (:name, :description, :parent_id, :image, :status)";
            $stmt = $conn->prepare($query);
            $stmt->execute($categoryData);
            $category_id = $conn->lastInsertId();            sendResponse(true, 'Tạo danh mục thành công', ['category_id' => $category_id], 201);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                 sendResponse(false, 'Tên danh mục đã tồn tại hoặc danh mục cha không hợp lệ');
            } else {
                 sendResponse(false, 'Lỗi khi tạo danh mục: ' . $e->getMessage());
            }
        }
        break;

    case 'update':
        if (!isUserLoggedIn() || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse(false, 'Bạn không có quyền cập nhật danh mục', null, 403);
            break;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) parse_str(file_get_contents('php://input'), $data);
        if (!$data) $data = $_POST;

        if (!isset($_GET['id']) || empty($_GET['id'])) {
             if (!isset($data['id']) || empty($data['id'])) {
                 sendResponse(false, 'ID danh mục là bắt buộc');
                 break;
             }
             $category_id = intval($data['id']);
        } else {
             $category_id = intval($_GET['id']);
        }        if (!isset($data['name']) || empty(trim($data['name']))) {
            sendResponse(false, 'Tên danh mục là bắt buộc');
            break;
        }

        $categoryData = [
            'id' => $category_id,
            'name' => trim($data['name']),
            'description' => isset($data['description']) ? trim($data['description']) : null,
            'parent_id' => isset($data['parent_id']) && $data['parent_id'] !== '' ? intval($data['parent_id']) : null,
            'image' => isset($data['image']) ? trim($data['image']) : null
        ];

        try {
            $query = "UPDATE categories SET name = :name, description = :description, parent_id = :parent_id, image = :image WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->execute($categoryData);            if ($stmt->rowCount() > 0) {
                sendResponse(true, 'Cập nhật danh mục thành công');
            } else {
                $checkStmt = $conn->prepare("SELECT id FROM categories WHERE id = ?");
                $checkStmt->execute([$category_id]);
                if ($checkStmt->fetch()) {
                    sendResponse(true, 'Không có thay đổi nào với danh mục');
                } else {
                    sendResponse(false, 'Không tìm thấy danh mục để cập nhật', null, 404);
                }
            }
        } catch (PDOException $e) {
             if ($e->getCode() == 23000) {
                 sendResponse(false, 'Tên danh mục đã tồn tại hoặc danh mục cha không hợp lệ');
            } else {
                 sendResponse(false, 'Lỗi khi cập nhật danh mục: ' . $e->getMessage());
            }
        }
        break;

    case 'delete':
        if (!isUserLoggedIn() || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse(false, 'Bạn không có quyền xóa danh mục', null, 403);
            break;
        }

        if (!isset($_GET['id'])) {
            sendResponse(false, 'ID danh mục là bắt buộc');
            break;
        }
        $category_id = intval($_GET['id']);

        try {
            $query = "UPDATE categories SET status = 'inactive' WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->execute([$category_id]);            if ($stmt->rowCount() > 0) {
                sendResponse(true, 'Xóa danh mục thành công');
            } else {
                $checkStmt = $conn->prepare("SELECT id FROM categories WHERE id = ? AND status = 'active'");
                $checkStmt->execute([$category_id]);
                if ($checkStmt->fetch()) {
                     sendResponse(false, 'Xóa danh mục thất bại');
                } else {
                     sendResponse(false, 'Không tìm thấy danh mục hoặc đã bị xóa', null, 404);
                }
            }
        } catch (PDOException $e) {
            sendResponse(false, 'Lỗi khi xóa danh mục: ' . $e->getMessage());
        }
        break;

    default:
        sendResponse(false, 'Hành động không hợp lệ', null, 400);
        break;
}

