<?php
// API Quản lý Danh mục dành cho Admin
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

$action = $_GET['action'] ?? '';
$db = new Database();
$conn = $db->getConnection();

switch ($action) {
    case 'list':
        // Lấy tham số phân trang
        $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 20;
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $offset = ($page - 1) * $limit;

        // Đếm tổng số danh mục
        $countStmt = $conn->prepare('SELECT COUNT(*) FROM categories');
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();
        $total_pages = $limit > 0 ? ceil($total / $limit) : 1;

        // Lấy danh sách danh mục có phân trang
        $stmt = $conn->prepare('SELECT * FROM categories ORDER BY id DESC LIMIT :limit OFFSET :offset');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Lấy id các danh mục để đếm số bài viết/sản phẩm
        $categoryIds = array_column($categories, 'id');
        $postCounts = [];
        $productCounts = [];
        if (!empty($categoryIds)) {
            // Đếm số bài viết cho từng danh mục
            $inQuery = implode(',', array_fill(0, count($categoryIds), '?'));
            $postStmt = $conn->prepare("SELECT category_id, COUNT(*) as post_count FROM posts WHERE category_id IN ($inQuery) GROUP BY category_id");
            $postStmt->execute($categoryIds);
            foreach ($postStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $postCounts[$row['category_id']] = (int)$row['post_count'];
            }
            // Đếm số sản phẩm cho từng danh mục
            $productStmt = $conn->prepare("SELECT category_id, COUNT(*) as product_count FROM products WHERE category_id IN ($inQuery) GROUP BY category_id");
            $productStmt->execute($categoryIds);
            foreach ($productStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $productCounts[$row['category_id']] = (int)$row['product_count'];
            }
        }
        // Gán số lượng vào từng danh mục
        foreach ($categories as &$cat) {
            $cat['post_count'] = $postCounts[$cat['id']] ?? 0;
            $cat['product_count'] = $productCounts[$cat['id']] ?? 0;
        }
        unset($cat);

        echo json_encode([
            'success' => true,
            'data' => [
                'categories' => $categories,
                'total' => $total,
                'page' => $page,
                'total_pages' => $total_pages,
                'limit' => $limit
            ]
        ]);
        break;
    case 'add':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare('INSERT INTO categories (name, description, parent_id, status) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $data['name'],
            $data['description'] ?? '',
            $data['parent_id'] ?? null,
            $data['status'] ?? 'active'
        ]);
        echo json_encode(['success' => true]);
        break;
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare('UPDATE categories SET name=?, description=?, parent_id=?, status=? WHERE id=?');
        $stmt->execute([
            $data['name'],
            $data['description'] ?? '',
            $data['parent_id'] ?? null,
            $data['status'] ?? 'active',
            $data['id']
        ]);
        echo json_encode(['success' => true]);
        break;
    case 'delete':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $conn->prepare('DELETE FROM categories WHERE id=?');
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
