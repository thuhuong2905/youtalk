<?php
// Endpoint API cho Danh mục
// Xử lý tất cả các thao tác liên quan đến danh mục

// Bao gồm các file cần thiết
require_once '../config/database.php';
require_once '../core/db_connect.php';
require_once '../core/api_utils.php';
require_once '../core/session_handler.php';

// Thiết lập header
header('Content-Type: application/json');

// Xử lý CORS
header('Access-Control-Allow-Origin: *'); // Điều chỉnh khi lên production
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Xử lý preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Lấy action từ tham số truy vấn
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Tạo kết nối database
$db = new Database();
$conn = $db->getConnection();

// Hàm lấy danh mục gốc với thống kê
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

// Hàm lấy danh mục con
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

// Hàm chuẩn hóa dữ liệu đầu ra
function normalizeCategories($categories) {
    foreach ($categories as &$category) {
        // Đảm bảo có các trường thống kê
        if (!isset($category['total_posts'])) {
            $category['total_posts'] = 0;
        }
        if (!isset($category['child_categories_count'])) {
            $category['child_categories_count'] = 0;
        }
        
        // Thêm trường item_count để tương thích ngược
        $category['item_count'] = $category['total_posts'];
        
        // Chuyển đổi sang kiểu số nguyên
        $category['total_posts'] = (int)$category['total_posts'];
        $category['child_categories_count'] = (int)$category['child_categories_count'];
        $category['item_count'] = (int)$category['item_count'];
        $category['id'] = (int)$category['id'];
        
        // Xử lý parent_id
        if ($category['parent_id'] !== null) {
            $category['parent_id'] = (int)$category['parent_id'];
        }
    }
    
    return $categories;
}

// Xử lý các action khác nhau
switch ($action) {
    case 'list':
        // Lấy tham số từ request
        $parent_id = isset($_GET['parent_id']) ? intval($_GET['parent_id']) : null;
        $only_root = isset($_GET['root']) && $_GET['root'] === 'true';
        $include_count = isset($_GET['count']) && $_GET['count'] === 'true';

        try {
            // Xác định loại truy vấn cần thực hiện
            $is_root_categories = $only_root || ($parent_id === null);
            
            if ($is_root_categories) {
                // Truy vấn danh mục gốc với thống kê chi tiết
                $categories = getRootCategoriesWithStats($conn, $include_count);
            } else {
                // Truy vấn danh mục con
                $categories = getChildCategories($conn, $parent_id, $include_count);
            }

            // Chuẩn hóa dữ liệu đầu ra
            $categories = normalizeCategories($categories);

            sendResponse(true, 'Lấy danh mục thành công', ['categories' => $categories]);
            
        } catch (PDOException $e) {
            sendResponse(false, 'Lỗi khi lấy danh mục: ' . $e->getMessage());
        }
        break;

    case 'get':
        // Lấy một danh mục theo ID
        if (!isset($_GET['id'])) {
            sendResponse(false, 'ID danh mục là bắt buộc');
            break;
        }

        $category_id = intval($_GET['id']);

        // Chuẩn bị truy vấn
        $query = "SELECT * FROM categories WHERE id = ? AND status = 'active'";

        // Thực thi truy vấn
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
        }
        break;

    case 'create':
        // Kiểm tra đăng nhập và quyền admin
        if (!isUserLoggedIn() || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse(false, 'Bạn không có quyền tạo danh mục', null, 403);
            break;
        }

        // Lấy dữ liệu POST
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) $data = $_POST; // Dự phòng cho dữ liệu form

        // Kiểm tra trường bắt buộc
        if (!isset($data['name']) || empty(trim($data['name']))) {
            sendResponse(false, 'Tên danh mục là bắt buộc');
            break;
        }

        // Chuẩn bị dữ liệu danh mục
        $categoryData = [
            'name' => trim($data['name']),
            'description' => isset($data['description']) ? trim($data['description']) : null,
            'parent_id' => isset($data['parent_id']) && !empty($data['parent_id']) ? intval($data['parent_id']) : null,
            'image' => isset($data['image']) ? trim($data['image']) : null,
            'status' => 'active'
        ];

        // Tạo danh mục
        try {
            $query = "INSERT INTO categories (name, description, parent_id, image, status) VALUES (:name, :description, :parent_id, :image, :status)";
            $stmt = $conn->prepare($query);
            $stmt->execute($categoryData);
            $category_id = $conn->lastInsertId();

            sendResponse(true, 'Tạo danh mục thành công', ['category_id' => $category_id], 201);
        } catch (PDOException $e) {
            // Xử lý lỗi trùng tên hoặc parent không hợp lệ
            if ($e->getCode() == 23000) { // Vi phạm ràng buộc toàn vẹn
                 sendResponse(false, 'Tên danh mục đã tồn tại hoặc parent ID không hợp lệ.');
            } else {
                 sendResponse(false, 'Lỗi khi tạo danh mục: ' . $e->getMessage());
            }
        }
        break;

    case 'update':
        // Kiểm tra đăng nhập và quyền admin
        if (!isUserLoggedIn() || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse(false, 'Bạn không có quyền cập nhật danh mục', null, 403);
            break;
        }

        // Lấy dữ liệu PUT (RESTful thường dùng PUT cho cập nhật)
        $data = json_decode(file_get_contents('php://input'), true);
        // Dự phòng cho POST nếu không dùng PUT hoặc dữ liệu gửi khác
        if (!$data) parse_str(file_get_contents('php://input'), $data);
        if (!$data) $data = $_POST;

        // Kiểm tra trường bắt buộc
        if (!isset($_GET['id']) || empty($_GET['id'])) { // Lấy ID từ URL cho RESTful
             if (!isset($data['id']) || empty($data['id'])) {
                 sendResponse(false, 'ID danh mục là bắt buộc');
                 break;
             }
             $category_id = intval($data['id']);
        } else {
             $category_id = intval($_GET['id']);
        }

        if (!isset($data['name']) || empty(trim($data['name']))) {
            sendResponse(false, 'Tên danh mục là bắt buộc');
            break;
        }

        // Chuẩn bị dữ liệu danh mục
        $categoryData = [
            'id' => $category_id,
            'name' => trim($data['name']),
            'description' => isset($data['description']) ? trim($data['description']) : null,
            'parent_id' => isset($data['parent_id']) && $data['parent_id'] !== '' ? intval($data['parent_id']) : null,
            'image' => isset($data['image']) ? trim($data['image']) : null
            // Cập nhật trạng thái có thể là action riêng hoặc thêm vào đây
        ];

        // Cập nhật danh mục
        try {
            $query = "UPDATE categories SET name = :name, description = :description, parent_id = :parent_id, image = :image WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->execute($categoryData);

            if ($stmt->rowCount() > 0) {
                sendResponse(true, 'Cập nhật danh mục thành công');
            } else {
                // Kiểm tra xem danh mục có tồn tại không
                $checkStmt = $conn->prepare("SELECT id FROM categories WHERE id = ?");
                $checkStmt->execute([$category_id]);
                if ($checkStmt->fetch()) {
                    sendResponse(true, 'Không có thay đổi nào với danh mục.'); // Hoặc false nếu không thay đổi là lỗi
                } else {
                    sendResponse(false, 'Không tìm thấy danh mục để cập nhật', null, 404);
                }
            }
        } catch (PDOException $e) {
             if ($e->getCode() == 23000) { // Vi phạm ràng buộc toàn vẹn
                 sendResponse(false, 'Tên danh mục đã tồn tại hoặc parent ID không hợp lệ.');
            } else {
                 sendResponse(false, 'Lỗi khi cập nhật danh mục: ' . $e->getMessage());
            }
        }
        break;

    case 'delete':
        // Kiểm tra đăng nhập và quyền admin
        if (!isUserLoggedIn() || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendResponse(false, 'Bạn không có quyền xóa danh mục', null, 403);
            break;
        }

        // Lấy ID danh mục từ URL (RESTful)
        if (!isset($_GET['id'])) {
            sendResponse(false, 'ID danh mục là bắt buộc');
            break;
        }
        $category_id = intval($_GET['id']);

        // Xóa mềm danh mục (chuyển trạng thái sang inactive)
        try {
            $query = "UPDATE categories SET status = 'inactive' WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->execute([$category_id]);

            if ($stmt->rowCount() > 0) {
                sendResponse(true, 'Xóa danh mục thành công');
            } else {
                 // Kiểm tra xem danh mục có tồn tại và chưa bị xóa
                $checkStmt = $conn->prepare("SELECT id FROM categories WHERE id = ? AND status = 'active'");
                $checkStmt->execute([$category_id]);
                if ($checkStmt->fetch()) {
                     sendResponse(false, 'Xóa danh mục thất bại (đã bị xóa hoặc lỗi).');
                } else {
                     sendResponse(false, 'Không tìm thấy danh mục hoặc đã bị xóa', null, 404);
                }
            }
        } catch (PDOException $e) {
            sendResponse(false, 'Lỗi khi xóa danh mục: ' . $e->getMessage());
        }
        break;

    default:
        sendResponse(false, 'Action không hợp lệ', null, 400);
        break;
}

