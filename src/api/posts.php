<?php
// Posts API Endpoint
// Handles user post operations including CRUD, search, and viewing

// Include required files
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/classes/Post.php';

// Set headers
header('Content-Type: application/json');

// Handle CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get action from query string - with default action
$action = isset($_GET['action']) ? $_GET['action'] : 'list';

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Create Post instance
$post = new Post($conn);

// Get request data
$requestData = getRequestData();

// Handle requests based on method and action
switch ($action) {
    case 'get_topics': // Forum topics
        handleGetTopics($post, $_GET);
        break;
    case 'list_hot':
        handleGetHotTopics($post, $requestData);
        break;
    case 'list':
        handleListPosts($post, $_GET);
        break;
    case 'get':
        handleGetPost($post, $_GET);
        break;
    case 'create':
        handleCreatePost($post);
        break;
    case 'update':
        handleUpdatePost($post, $requestData, $_GET);
        break;
    case 'delete':
        handleDeletePost($post, $_GET);
        break;
    case 'search':
        handleSearchPosts($post, $_GET);
        break;
    case 'get_comments':
        handleGetComments($post, $_GET);
        break;
    case 'get_related':
        handleGetRelatedPosts($post, $_GET);
        break;
    case 'list_post_types':
        handleListPostTypes($post, $_GET);
        break;
    case 'list_by_user':
        handleListPostsByUser($post, $_GET);
        break;
    case 'get_recent':
        handleGetRecentPosts($post, $_GET);
        break;
    case 'get_by_category':
        handleGetPostsByCategory($post, $_GET);
        break;
    case 'help':
        handleShowHelp();
        break;
        
    default:
        sendResponse(false, 'Action không hợp lệ hoặc không được hỗ trợ', null, 404);
}

/**
 * Hiển thị trợ giúp API và các endpoint có sẵn (từ phiên bản cũ)
 */
function handleShowHelp() {
    $endpoints = [
        'list' => [
            'method' => 'GET',
            'description' => 'Liệt kê bài viết với bộ lọc và phân trang',
            'parameters' => 'category_id, user_id, product_id, post_type, search, sort, page, limit, offset, sort_by, sort_order'
        ],
        'list_hot' => [
            'method' => 'GET', 
            'description' => 'Lấy chủ đề nổi bật (xem nhiều/bình luận nhiều)',
            'parameters' => 'limit (mặc định: 3)'
        ],
        'get_recent' => [
            'method' => 'GET',
            'description' => 'Lấy bài viết gần đây',
            'parameters' => 'limit, post_type, category_id'
        ],
        'get_by_category' => [
            'method' => 'GET',
            'description' => 'Lấy bài viết theo danh mục',
            'parameters' => 'category_id (bắt buộc), limit, page, sort'
        ],
        'get' => [
            'method' => 'GET',
            'description' => 'Lấy chi tiết bài viết theo ID',
            'parameters' => 'id (bắt buộc)'
        ],
        'create' => [
            'method' => 'POST',
            'description' => 'Tạo bài viết mới (yêu cầu đăng nhập)',
            'parameters' => 'title, content, category_id, post_type, product_id, tags, media, status'
        ],
        'update' => [
            'method' => 'PUT/POST',
            'description' => 'Cập nhật bài viết (yêu cầu đăng nhập & sở hữu)',
            'parameters' => 'id (trên URL), title, content, category_id, post_type, product_id, tags, media, status'
        ],
        'delete' => [
            'method' => 'DELETE',
            'description' => 'Xóa bài viết (yêu cầu đăng nhập & sở hữu)',
            'parameters' => 'id (bắt buộc)'
        ],
        'search' => [
            'method' => 'GET',
            'description' => 'Tìm kiếm bài viết',
            'parameters' => 'query (bắt buộc), category_id, post_type, limit, offset'
        ],
        'list_by_user' => [
            'method' => 'GET',
            'description' => 'Lấy bài đăng theo user_id (tối ưu cho trang cá nhân)',
            'parameters' => 'user_id (bắt buộc), limit, page, sort'
        ],
        'list_post_types' => [
            'method' => 'GET',
            'description' => 'Lấy danh sách loại bài viết',
            'parameters' => ''
        ]
    ];

    // Sửa lỗi REQUEST_SCHEME: kiểm tra biến và fallback an toàn
    $scheme = (isset($_SERVER['REQUEST_SCHEME']) && !empty($_SERVER['REQUEST_SCHEME']))
        ? $_SERVER['REQUEST_SCHEME']
        : ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http');

    $helpData = [
        'api_name' => 'API Bài Viết',
        'version' => '1.1',
        'description' => 'API quản lý bài viết diễn đàn',
        'base_url' => $scheme . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['SCRIPT_NAME'],
        'usage' => 'Thêm ?action=<action_name> vào URL',
        'example_urls' => [
            $_SERVER['SCRIPT_NAME'] . '?action=get_recent&limit=10'
        ],
        'endpoints' => $endpoints
    ];

    sendResponse(true, 'Trợ giúp API Bài Viết', $helpData);
}

/**
 * Xử lý việc lấy các chủ đề nổi bật
 */
function handleGetHotTopics($post, $params) {
    // Lấy và validate limit parameter từ query string
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5; // Default to 5 instead of 3
    $limit = max(1, min($limit, 10)); // Giới hạn từ 1-10 bài

    try {
        global $conn;
        // Lấy các chủ đề nổi bật dựa trên view_count và số bình luận, join users và categories để lấy full_name và category_name
        $queryHot = "SELECT p.*, u.full_name, c.name as category_name, (
                SELECT COUNT(*) FROM comments cmt WHERE cmt.post_id = p.id AND cmt.status = 'active'
            ) AS comment_count
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active' AND u.status = 'active'
            ORDER BY (p.view_count * 0.7 + comment_count * 0.3) DESC, p.created_at DESC
            LIMIT :limit";
        
        $stmt = $conn->prepare($queryHot);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Nếu không tìm thấy bài viết nổi bật, chuyển sang lấy bài viết gần đây
        if (empty($posts)) {
             $queryRecent = "SELECT 
                            p.*, 
                            u.full_name,
                            c.name as category_name,
                            (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id AND cm.status = 'active') as comment_count
                          FROM posts p
                          JOIN users u ON p.user_id = u.id
                          LEFT JOIN categories c ON p.category_id = c.id
                          WHERE p.status = 'active' AND u.status = 'active' 
                          ORDER BY p.created_at DESC
                          LIMIT :limit";
            
            $stmtRecent = $conn->prepare($queryRecent);
            $stmtRecent->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmtRecent->execute();
            $posts = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);
            $message = 'Không tìm thấy chủ đề nổi bật, đã lấy các chủ đề gần đây thay thế.';
        } else {
            $message = 'Lấy chủ đề nổi bật thành công';
        }

        sendResponse(true, $message, ['posts' => $posts]);

    } catch (PDOException $e) {
        sendResponse(false, 'Lỗi khi lấy chủ đề nổi bật: ' . $e->getMessage(), null, 500);
    }
}

/**
 * Xử lý việc liệt kê các bài viết
 * Hỗ trợ cả hai phương thức phân trang cũ và mới
 */
function handleListPosts($post, $params) {
    // Lấy các tham số tùy chọn (hỗ trợ cả tên tham số cũ và mới)
    $category_id = isset($params['category_id']) ? intval($params['category_id']) : null;
    $user_id = isset($params['user_id']) ? intval($params['user_id']) : null;
    $post_type = isset($params['post_type']) ? $params['post_type'] : null;
    
    // Hỗ trợ cả hai phương thức phân trang
    $page = isset($params['page']) ? intval($params['page']) : 1;
    $limit = isset($params['limit']) ? intval($params['limit']) : 10;
    $offset = isset($params['offset']) ? intval($params['offset']) : ($page - 1) * $limit;
    
    // Hỗ trợ cả hai phương thức sắp xếp
    $sort = isset($params['sort']) ? $params['sort'] : null;
    $sort_by = isset($params['sort_by']) ? $params['sort_by'] : ($sort === 'newest' ? 'created_at' : 'view_count');
    $sort_order = isset($params['sort_order']) ? $params['sort_order'] : ($sort === 'newest' ? 'DESC' : 'ASC');
    
    // Hỗ trợ bộ lọc product_id từ phiên bản cũ
    $product_id = isset($params['product_id']) ? intval($params['product_id']) : null;
    
    // Hỗ trợ tìm kiếm từ phiên bản cũ
    $search = isset($params['search']) ? $params['search'] : null;
    
    // Lấy bài viết
    $result = $post->getPosts($category_id, $user_id, $post_type, $limit, $offset, $sort_by, $sort_order, $product_id, $search);
    
    if ($result['success']) {
        // Định dạng lại dữ liệu phản hồi cho tương thích với cả hai phiên bản
        $responseData = $result['data'];
        
        // Thêm thông tin phân trang nếu chưa có
        if (!isset($responseData['pagination'])) {
            $responseData['pagination'] = [
                'page' => $page,
                'limit' => $limit,
                'total' => isset($responseData['total']) ? $responseData['total'] : count($responseData['posts']),
                'pages' => isset($responseData['total']) ? ceil($responseData['total'] / $limit) : 1
            ];
        }
        
        sendResponse(true, 'Lấy bài viết thành công', $responseData);
    } else {
        sendResponse(false, $result['message']);
    }
}

/**
 * Lấy bài đăng theo user_id (tối ưu cho trang cá nhân)
 */
function handleListPostsByUser($post, $params) {
    if (!isset($params['user_id']) || empty($params['user_id'])) {
        sendResponse(false, 'Thiếu user_id', null, 400);
        return;
    }
    $user_id = intval($params['user_id']);
    $page = isset($params['page']) ? intval($params['page']) : 1;
    $limit = isset($params['limit']) ? intval($params['limit']) : 10;
    $sort = isset($params['sort']) ? $params['sort'] : 'newest';
    // Gọi getPosts với chỉ user_id, status=active
    $result = $post->getPosts(null, $user_id, null, null, null, $sort, $page, $limit);
    if ($result['success']) {
        sendResponse(true, 'Lấy bài đăng theo user thành công', $result['data']);
    } else {
        sendResponse(false, $result['message']);
    }
}

/**
 * Xử lý việc lấy các bài viết gần đây (từ phiên bản cũ)
 */
function handleGetRecentPosts($post, $params) {
    $limit = isset($params['limit']) ? intval($params['limit']) : 5;
    $post_type = isset($params['post_type']) ? $params['post_type'] : null;
    $category_id = isset($params['category_id']) ? intval($params['category_id']) : null;

    // Lấy bài viết gần đây bằng cách sử dụng phương thức getPosts hiện có với sắp xếp 'newest'
    $result = $post->getPosts($category_id, null, $post_type, $limit, 0, 'created_at', 'DESC');

    if ($result['success']) {
        sendResponse(true, 'Lấy bài viết gần đây thành công', ['posts' => $result['data']['posts']]);
    } else {
        sendResponse(false, $result['message']);
    }
}

/**
 * Xử lý việc lấy bài viết theo danh mục (từ phiên bản cũ)
 */
function handleGetPostsByCategory($post, $params) {
    // Lấy ID danh mục
    $category_id = isset($params['category_id']) ? intval($params['category_id']) : null;

    if (!$category_id) {
        sendResponse(false, 'ID danh mục là bắt buộc', null, 400);
        return;
    }

    $limit = isset($params['limit']) ? intval($params['limit']) : 10;
    $page = isset($params['page']) ? intval($params['page']) : 1;
    $offset = ($page - 1) * $limit;
    $sort = isset($params['sort']) ? $params['sort'] : 'newest';
    
    // Ánh xạ sort thành sort_by và sort_order
    $sort_by = 'created_at';
    $sort_order = 'DESC';
    
    if ($sort === 'oldest') {
        $sort_order = 'ASC';
    } elseif ($sort === 'views') {
        $sort_by = 'view_count';
        $sort_order = 'DESC';
    } elseif ($sort === 'comments') {
        $sort_by = 'comment_count';
        $sort_order = 'DESC';
    }

    // Lấy bài viết theo danh mục bằng phương thức của lớp Post
    $result = $post->getPosts($category_id, null, null, $limit, $offset, $sort_by, $sort_order);

    if ($result['success']) {
        // Định dạng lại dữ liệu phản hồi để khớp với phiên bản cũ
        $responseData = [
            'posts' => $result['data']['posts'],
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => isset($result['data']['total']) ? $result['data']['total'] : count($result['data']['posts']),
                'pages' => isset($result['data']['total']) ? ceil($result['data']['total'] / $limit) : 1
            ]
        ];
        
        sendResponse(true, 'Lấy bài viết theo danh mục thành công', $responseData);
    } else {
        sendResponse(false, $result['message']);
    }
}

/**
 * Xử lý việc lấy một bài viết
 */
function handleGetPost($post, $params) {
    // Lấy ID bài viết từ tham số URL
    if (!isset($params['id']) || empty($params['id'])) {
        sendResponse(false, 'ID bài viết là bắt buộc', null, 400);
        return;
    }
    
    $post_id = intval($params['id']);
    
    // Lấy bài viết
    $result = $post->getPostById($post_id);
    
    if ($result['success']) {
        // Tăng số lượt xem
        $post->incrementViewCount($post_id);
        
        sendResponse(true, 'Lấy bài viết thành công', $result['data']);
    } else {
        sendResponse(false, $result['message'], null, 404);
    }
}

/**
 * Xử lý tìm kiếm bài viết
 */
function handleSearchPosts($post, $params) {
    // Lấy truy vấn tìm kiếm
    if (!isset($params['query']) || empty($params['query'])) {
        sendResponse(false, 'Truy vấn tìm kiếm là bắt buộc', null, 400);
        return;
    }
    $query = $params['query'];
    $category_id = isset($params['category_id']) ? intval($params['category_id']) : null;
    $post_type = isset($params['post_type']) ? $params['post_type'] : null;
    // Hỗ trợ cả hai phương thức phân trang
    $page = isset($params['page']) ? intval($params['page']) : 1;
    $limit = isset($params['limit']) ? intval($params['limit']) : 10;
    $offset = isset($params['offset']) ? intval($params['offset']) : ($page - 1) * $limit;
    // Sử dụng getPosts để tìm kiếm
    $result = $post->getPosts(null, null, null, $post_type, $query, 'newest', $page, $limit);
    if ($result['success']) {
        $responseData = $result['data'];
        if (!isset($responseData['pagination'])) {
            $responseData['pagination'] = [
                'page' => $page,
                'limit' => $limit,
                'offset' => $offset
            ];
        }
        sendResponse(true, 'Lấy kết quả tìm kiếm thành công', $responseData);
    } else {
        sendResponse(false, $result['message']);
    }
}

/**
 * Xử lý tạo một bài viết
 */
function handleCreatePost($post) {
    // Kiểm tra đăng nhập
    if (!isUserLoggedIn()) {
        sendResponse(false, 'Bạn cần đăng nhập để đăng bài.', null, 401);
        exit;
    }

    // Kiểm tra multipart/form-data
    $isMultipart = isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;
    if ($isMultipart) {
        $requestData = $_POST;
        // Nếu $_POST rỗng, thử lấy từ $_GET (trường hợp submit lỗi, chỉ để debug)
        if (empty($requestData) && !empty($_GET['title'])) {
            $requestData = $_GET;
        }
        // Xử lý media nếu có upload file
        $media = [];
        if (!empty($_FILES['media']['name'][0])) {
            foreach ($_FILES['media']['name'] as $idx => $name) {
                if ($_FILES['media']['error'][$idx] === UPLOAD_ERR_OK) {
                    $tmpName = $_FILES['media']['tmp_name'][$idx];
                    $ext = pathinfo($name, PATHINFO_EXTENSION);
                    $newName = uniqid('img_') . '.' . $ext;
                    $uploadDir = __DIR__ . '/../../public/images/posts/';
                    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                    $dest = $uploadDir . $newName;
                    if (move_uploaded_file($tmpName, $dest)) {
                        $media[] = 'images/posts/' . $newName;
                    }
                }
            }
        }
        // Nếu không có file nào, media là null
        $requestData['media'] = (is_array($media) && count($media) > 0) ? $media : null;
        // Chuẩn hóa tags nếu là chuỗi rỗng hoặc mảng rỗng
        if (isset($requestData['tags'])) {
            $tags = $requestData['tags'];
            if (is_string($tags)) {
                $tags = json_decode($tags, true);
            }
            if (!is_array($tags) || count($tags) === 0) {
                $requestData['tags'] = null;
            } else {
                $requestData['tags'] = $tags;
            }
        } else {
            $requestData['tags'] = null;
        }
    } else {
        // JSON hoặc x-www-form-urlencoded
        $raw = file_get_contents('php://input');
        $requestData = json_decode($raw, true);
        if (!is_array($requestData)) $requestData = [];
        if (!isset($requestData['media']) || empty($requestData['media'])) $requestData['media'] = null;
    }

    // Validate các trường bắt buộc
    if (!isset($requestData['title']) || empty(trim($requestData['title']))) {
        error_log('DEBUG POST CREATE: requestData thiếu title. requestData=' . print_r($requestData, true));
        sendResponse(false, 'Vui lòng nhập tiêu đề bài viết.');
        exit;
    }
    if (!isset($requestData['content']) || empty(trim($requestData['content']))) {
        sendResponse(false, 'Vui lòng nhập nội dung bài viết.');
        exit;
    }
    if (!isset($requestData['category_id']) || !is_numeric($requestData['category_id'])) {
        sendResponse(false, 'Vui lòng chọn danh mục hợp lệ.');
        exit;
    }
    $validPostTypes = ['discussion', 'question', 'review', 'news']; // Thêm 'news' nếu muốn hỗ trợ
    $postType = isset($requestData['post_type']) ? $requestData['post_type'] : 'discussion';
    if (!in_array($postType, $validPostTypes)) {
        sendResponse(false, 'Loại bài viết không hợp lệ.');
        exit;
    }
    // Xử lý thẻ
    $tags = [];
    if (isset($requestData['tags'])) {
        if (is_string($requestData['tags'])) {
            $tags = json_decode($requestData['tags'], true);
            if (!is_array($tags)) $tags = [];
        } elseif (is_array($requestData['tags'])) {
            $tags = $requestData['tags'];
        }
    }
    if (empty($tags)) {
        $tags = null;
    }
    $requestData['tags'] = $tags;
    // Gán user_id từ session
    $requestData['user_id'] = $_SESSION['user_id'];
    // Trạng thái mặc định
    $requestData['status'] = 'active';

    // Chuẩn hóa dữ liệu truyền vào createPost
    $postData = [
        'title' => trim($requestData['title']),
        'content' => trim($requestData['content']),
        'user_id' => $requestData['user_id'],
        'category_id' => (int)$requestData['category_id'],
        'post_type' => $postType,
        'status' => $requestData['status'],
        'product_id' => isset($requestData['product_id']) ? (int)$requestData['product_id'] : null,
        'media' => $requestData['media'],
        'tags' => $tags
    ];

    $result = $post->createPost($postData);
    if (is_array($result) && isset($result['success']) && $result['success']) {
        sendResponse(true, 'Tạo bài viết thành công', ['post_id' => $result['post_id']], 201);
    } else {
        $msg = is_array($result) && isset($result['message']) ? $result['message'] : 'Không thể tạo bài viết.';
        sendResponse(false, $msg);
    }
}

/**
 * Xử lý cập nhật một bài viết
 */
function handleUpdatePost($post, $requestData, $getParams) {
    if (!isUserLoggedIn()) {
        sendResponse(false, 'Bạn phải đăng nhập để cập nhật bài viết', null, 401);
        return;
    }
    
    // Lấy ID bài viết từ tham số URL
    if (!isset($getParams['id']) || empty($getParams['id'])) {
        sendResponse(false, 'ID bài viết là bắt buộc trong tham số URL', null, 400);
        return;
    }
    
    $post_id = intval($getParams['id']);
    
    // Check ownership for updates
    $currentPost = $post->getPostById($post_id);
    if (!$currentPost['success']) {
        sendResponse(false, 'Không tìm thấy bài viết', null, 404);
        return;
    }
    
    if ($currentPost['data']['user_id'] !== $_SESSION['user_id']) {
        sendResponse(false, 'Bạn không có quyền cập nhật bài viết này', null, 403);
        return;
    }
    
    // Xác thực các trường bắt buộc cho việc cập nhật (ít nhất tiêu đề và nội dung nên có)
    if (!isset($requestData['title']) || empty(trim($requestData['title']))) {
        sendResponse(false, 'Tiêu đề là bắt buộc', null, 400);
        return;
    }
    
    if (!isset($requestData['content']) || empty(trim($requestData['content']))) {
        sendResponse(false, 'Nội dung là bắt buộc', null, 400);
        return;
    }
    
    // Xử lý thẻ
    $tags = null;
    if (isset($requestData['tags'])) {
        if (is_string($requestData['tags'])) {
            $tags = json_encode(json_decode($requestData['tags'], true));
        } else {
            $tags = json_encode($requestData['tags']);
        }
    }
    
    // Chuẩn bị dữ liệu cập nhật (chỉ cập nhật các trường được cung cấp trong request)
    $updateData = [
        'title' => trim($requestData['title']),
        'content' => trim($requestData['content']),
        'category_id' => isset($requestData['category_id']) && !empty($requestData['category_id']) ? intval($requestData['category_id']) : $currentPost['data']['category_id'],
        'post_type' => isset($requestData['post_type']) && !empty($requestData['post_type']) ? $requestData['post_type'] : $currentPost['data']['post_type'],
        'product_id' => isset($requestData['product_id']) && !empty($requestData['product_id']) ? intval($requestData['product_id']) : $currentPost['data']['product_id'],
        'tags' => $tags !== null ? $tags : $currentPost['data']['tags'],
        'media' => isset($requestData['media']) ? $requestData['media'] : $currentPost['data']['media'],
        'status' => isset($requestData['status']) ? $requestData['status'] : 'active'
    ];
    
    // Cập nhật bài viết bằng phương thức của lớp Post
    $result = $post->updatePost($post_id, $updateData);
    if ($result['success']) {
        sendResponse(true, 'Cập nhật bài viết thành công');
    } else {
        sendResponse(false, $result['message']);
    }
}

/**
 * Xử lý xóa một bài viết (xóa mềm)
 */
function handleDeletePost($post, $params) {
    if (!isUserLoggedIn()) {
        sendResponse(false, 'Bạn phải đăng nhập để xóa bài viết', null, 401);
        return;
    }
    
    // Lấy ID bài viết từ tham số URL
    if (!isset($params['id']) || empty($params['id'])) {
        sendResponse(false, 'ID bài viết là bắt buộc trong tham số URL', null, 400);
        return;
    }
    
    $post_id = intval($params['id']);
    
    // Check ownership for deletion
    $currentPost = $post->getPostById($post_id);
    if (!$currentPost['success']) {
        sendResponse(false, 'Không tìm thấy bài viết', null, 404);
        return;
    }
    
    if ($currentPost['data']['user_id'] !== $_SESSION['user_id']) {
        sendResponse(false, 'Bạn không có quyền xóa bài viết này', null, 403);
        return;
    }
    
    // Xóa bài viết bằng phương thức của lớp Post (xóa mềm)
    $result = $post->deletePost($post_id);
    if ($result['success']) {
        sendResponse(true, 'Xóa bài viết thành công');
    } else {
        sendResponse(false, $result['message']);
    }
}

/**
 * Xử lý việc lấy danh sách loại bài viết từ ENUM posts.post_type
 */
function handleListPostTypes() {
    // Lấy ENUM từ cấu trúc bảng posts
    global $conn;
    $sql = "SHOW COLUMNS FROM posts WHERE Field = 'post_type'";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $types = [];
    if ($row && preg_match("/enum\((.*)\)/", $row['Type'], $matches)) {
        $enum = str_getcsv($matches[1], ',', "'");
        // Map value -> label
        $labelMap = [
            'discussion' => 'Thảo luận',
            'question' => 'Câu hỏi',
            'review' => 'Đánh giá sản phẩm',
            'news' => 'Tin tức'
        ];
        foreach ($enum as $val) {
            $types[] = [
                'value' => $val,
                'label' => isset($labelMap[$val]) ? $labelMap[$val] : ucfirst($val)
            ];
        }
    }
    sendResponse(true, 'Danh sách loại bài viết', $types);
}

/**
 * Xử lý lấy bình luận cho bài viết
 */
function handleGetComments($post, $params) {
    if (!isset($params['post_id']) || empty($params['post_id'])) {
        sendResponse(false, 'post_id là bắt buộc', null, 400);
        return;
    }
    $post_id = intval($params['post_id']);
    $page = isset($params['page']) ? intval($params['page']) : 1;
    $limit = isset($params['limit']) ? intval($params['limit']) : 10;
    $offset = ($page - 1) * $limit;
    global $conn;
    $stmtCount = $conn->prepare("SELECT COUNT(*) as total FROM comments WHERE post_id = :post_id AND status = 'active'");
    $stmtCount->bindParam(':post_id', $post_id, PDO::PARAM_INT);
    $stmtCount->execute();
    $total = (int)$stmtCount->fetch(PDO::FETCH_ASSOC)['total'];
    $stmt = $conn->prepare("SELECT c.*, u.full_name, u.profile_picture FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.post_id = :post_id AND c.status = 'active' ORDER BY c.created_at ASC LIMIT :limit OFFSET :offset");
    $stmt->bindParam(':post_id', $post_id, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total_pages = ceil($total / $limit);
    sendResponse(true, 'Lấy bình luận thành công', [
        'comments' => $comments,
        'total' => $total,
        'total_pages' => $total_pages
    ]);
}

/**
 * Xử lý lấy bài viết liên quan
 */
function handleGetRelatedPosts($post, $params) {
    if (!isset($params['post_id']) || empty($params['post_id'])) {
        sendResponse(false, 'post_id là bắt buộc', null, 400);
        return;
    }
    $post_id = intval($params['post_id']);
    $limit = isset($params['limit']) ? intval($params['limit']) : 3;
    global $conn;
    $stmt = $conn->prepare("SELECT category_id FROM posts WHERE id = :id");
    $stmt->bindParam(':id', $post_id, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        sendResponse(true, 'Không tìm thấy bài viết để lấy bài liên quan', ['posts' => []]);
        return;
    }
    $category_id = $row['category_id'];
    $stmt2 = $conn->prepare("SELECT p.id, p.title, p.content, p.created_at, u.username, u.full_name AS full_name FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE p.category_id = :category_id AND p.id != :post_id AND p.status = 'active' ORDER BY p.created_at DESC LIMIT :limit");
    $stmt2->bindParam(':category_id', $category_id, PDO::PARAM_INT);
    $stmt2->bindParam(':post_id', $post_id, PDO::PARAM_INT);
    $stmt2->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt2->execute();
    $posts = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(true, 'Lấy bài viết liên quan thành công', ['posts' => $posts]);
}

/**
 * Xử lý lấy danh sách topics cho trang forum
 */
function handleGetTopics($post, $params) {
    $page = isset($params['page']) ? (int)$params['page'] : 1;
    $limit = isset($params['limit']) ? (int)$params['limit'] : 10;
    $sort = isset($params['sort']) ? $params['sort'] : 'newest';
    $post_type = isset($params['post_type']) && $params['post_type'] !== 'all' ? $params['post_type'] : null;
    $search = isset($params['search']) ? $params['search'] : null;

    try {
        $result = $post->getPosts(
            null, // category_id
            null, // user_id 
            null, // product_id
            $post_type,
            $search,
            $sort,
            $page,
            $limit
        );

        if ($result['success']) {
            $responseData = [
                'topics' => $result['data']['posts'],
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => ceil($result['data']['total'] / $limit),
                    'total' => $result['data']['total'],
                    'per_page' => $limit
                ]
            ];
            sendResponse(true, 'Lấy danh sách topics thành công', $responseData);
        } else {
            sendResponse(false, $result['message']);
        }
    } catch (Exception $e) {
        error_log('Lỗi khi lấy danh sách topics: ' . $e->getMessage());
        sendResponse(false, 'Có lỗi xảy ra khi lấy danh sách topics', null, 500);
    }
}

?>
