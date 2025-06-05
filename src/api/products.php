<?php
// Products API Endpoint
// Handles product listing, details, search, and management

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/db_connect.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/classes/Product.php';

// Session is already started in session_handler.php, no need to start it again

// Set headers
header('Content-Type: application/json');

// Handle CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get action from query parameters
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Create database connection
$db = new Database();
$conn = $db->getConnection();

// Create Product instance
$product = new Product($conn);

// Get the request data
$requestData = getRequestData();

/**
 * Handle getting a product by ID
 */
function handleGetProductById($product, $requestData) {
    // Validate required parameters
    if (!isset($requestData['id']) || empty($requestData['id'])) {
        sendResponse(false, 'Product ID is required', null, 400);
        return;
    }
    
    $productId = (int)$requestData['id'];
    
    $productData = $product->getProductById($productId);
    
    if ($productData) {
        // Process any JSON fields
        if (isset($productData['images']) && !empty($productData['images'])) {
            $productData['images'] = json_decode($productData['images'], true);
        }
        
        if (isset($productData['specs']) && !empty($productData['specs'])) {
            $productData['specs'] = json_decode($productData['specs'], true);
        }
        
        sendResponse(true, 'Product retrieved successfully', ['product' => $productData]);
    } else {
        sendResponse(false, 'Product not found', null, 404);
    }
}

/**
 * Handle getting products by category
 */
function handleGetProductsByCategory($product, $requestData) {
    // Validate required parameters
    if (!isset($requestData['category_id']) || empty($requestData['category_id'])) {
        sendResponse(false, 'Category ID is required', null, 400);
        return;
    }
    
    $categoryId = (int)$requestData['category_id'];
    $limit = isset($requestData['limit']) ? (int)$requestData['limit'] : 10;
    $offset = isset($requestData['offset']) ? (int)$requestData['offset'] : 0;
    $sortBy = isset($requestData['sort_by']) ? $requestData['sort_by'] : 'created_at';
    $sortOrder = isset($requestData['sort_order']) ? $requestData['sort_order'] : 'DESC';
    
    $products = $product->getProductsByCategory($categoryId, $limit, $offset, $sortBy, $sortOrder);
    
    // Process any JSON fields in each product
    foreach ($products as &$productItem) {
        if (isset($productItem['images']) && !empty($productItem['images'])) {
            $productItem['images'] = json_decode($productItem['images'], true);
        }
        
        if (isset($productItem['specs']) && !empty($productItem['specs'])) {
            $productItem['specs'] = json_decode($productItem['specs'], true);
        }
    }
    
    sendResponse(true, 'Products retrieved successfully', [
        'products' => $products,
        'pagination' => [
            'limit' => $limit,
            'offset' => $offset,
            'total' => count($products) // This is not accurate for total count, would need a separate count query
        ]
    ]);
}

/**
 * Handle searching products
 */
function handleSearchProducts($product, $requestData) {
    // Validate required parameters
    if (!isset($requestData['query']) || empty($requestData['query'])) {
        sendResponse(false, 'Search query is required', null, 400);
        return;
    }
    
    $query = $requestData['query'];
    $limit = isset($requestData['limit']) ? (int)$requestData['limit'] : 10;
    $offset = isset($requestData['offset']) ? (int)$requestData['offset'] : 0;
    
    $products = $product->searchProducts($query, $limit, $offset);
    
    // Process any JSON fields in each product
    foreach ($products as &$productItem) {
        if (isset($productItem['images']) && !empty($productItem['images'])) {
            $productItem['images'] = json_decode($productItem['images'], true);
        }
        
        if (isset($productItem['specs']) && !empty($productItem['specs'])) {
            $productItem['specs'] = json_decode($productItem['specs'], true);
        }
    }
    
    sendResponse(true, 'Search results retrieved successfully', [
        'products' => $products,
        'pagination' => [
            'limit' => $limit,
            'offset' => $offset,
            'total' => count($products) // This is not accurate for total count, would need a separate count query
        ]
    ]);
}

/**
 * Handle getting featured products
 */
function handleGetFeaturedProducts($product, $requestData) {
    $limit = isset($requestData['limit']) ? (int)$requestData['limit'] : 6;
    
    $products = $product->getFeaturedProducts($limit);
    
    // Process any JSON fields in each product
    foreach ($products as &$productItem) {
        if (isset($productItem['images']) && !empty($productItem['images'])) {
            $productItem['images'] = json_decode($productItem['images'], true);
        }
        
        if (isset($productItem['specs']) && !empty($productItem['specs'])) {
            $productItem['specs'] = json_decode($productItem['specs'], true);
        }
    }
    
    sendResponse(true, 'Featured products retrieved successfully', ['products' => $products]);
}

/**
 * Handle getting related products
 */
function handleGetRelatedProducts($product, $requestData) {
    // Validate required parameters
    if (!isset($requestData['product_id']) || empty($requestData['product_id'])) {
        sendResponse(false, 'Product ID is required', null, 400);
        return;
    }
    
    $productId = (int)$requestData['product_id'];
    $limit = isset($requestData['limit']) ? (int)$requestData['limit'] : 4;
    
    $products = $product->getRelatedProducts($productId, $limit);
    
    // Process any JSON fields in each product
    foreach ($products as &$productItem) {
        if (isset($productItem['images']) && !empty($productItem['images'])) {
            $productItem['images'] = json_decode($productItem['images'], true);
        }
        
        if (isset($productItem['specs']) && !empty($productItem['specs'])) {
            $productItem['specs'] = json_decode($productItem['specs'], true);
        }
    }
    
    sendResponse(true, 'Related products retrieved successfully', ['products' => $products]);
}

/**
 * Handle creating a new product
 */
function handleCreateProduct($product, $requestData) {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        sendResponse(false, 'Authentication required', null, 401);
        return;
    }
    
    // Validate required parameters
    if (!isset($requestData['name']) || empty($requestData['name'])) {
        sendResponse(false, 'Product name is required', null, 400);
        return;
    }
    
    if (!isset($requestData['description']) || empty($requestData['description'])) {
        sendResponse(false, 'Product description is required', null, 400);
        return;
    }
    
    if (!isset($requestData['category_id']) || empty($requestData['category_id'])) {
        sendResponse(false, 'Category ID is required', null, 400);
        return;
    }
    
    // Add creator ID from session
    $requestData['creator_id'] = $_SESSION['user_id'];
    
    // Create the product
    $productId = $product->createProduct($requestData);
    
    if ($productId) {
        sendResponse(true, 'Product created successfully', ['product_id' => $productId], 201);
    } else {
        sendResponse(false, 'Failed to create product', null, 500);
    }
}

/**
 * Handle updating a product
 */
function handleUpdateProduct($product, $requestData) {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        sendResponse(false, 'Authentication required', null, 401);
        return;
    }
    
    // Validate required parameters
    if (!isset($requestData['id']) || empty($requestData['id'])) {
        sendResponse(false, 'Product ID is required', null, 400);
        return;
    }
    
    $productId = (int)$requestData['id'];
    
    // Get the product to check ownership
    $productData = $product->getProductById($productId);
    
    if (!$productData) {
        sendResponse(false, 'Product not found', null, 404);
        return;
    }
    
    // Check if user is the creator or an admin
    if ($productData['creator_id'] != $_SESSION['user_id'] && $_SESSION['role'] !== 'admin') {
        sendResponse(false, 'Permission denied', null, 403);
        return;
    }
    
    // Update the product
    $success = $product->updateProduct($productId, $requestData);
    
    if ($success) {
        sendResponse(true, 'Product updated successfully');
    } else {
        sendResponse(false, 'Failed to update product', null, 500);
    }
}

/**
 * Handle getting all categories
 */
function handleGetCategories($product) {
    $categories = $product->getAllCategories();
    
    sendResponse(true, 'Categories retrieved successfully', ['categories' => $categories]);
}

/**
 * Handle getting a category by ID
 */
function handleGetCategoryById($product, $requestData) {
    // Validate required parameters
    if (!isset($requestData['id']) || empty($requestData['id'])) {
        sendResponse(false, 'Category ID is required', null, 400);
        return;
    }
    
    $categoryId = (int)$requestData['id'];
    
    $category = $product->getCategoryById($categoryId);
    
    if ($category) {
        sendResponse(true, 'Category retrieved successfully', ['category' => $category]);
    } else {
        sendResponse(false, 'Category not found', null, 404);
    }
}

/**
 * Handle incrementing product view count
 */
function handleIncrementProductView($product, $requestData) {
    // Accept product_id from either POST body or GET
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
        $db = new Database();
        $conn = $db->getConnection();
        $stmt = $conn->prepare("UPDATE products SET view_count = IFNULL(view_count,0) + 1 WHERE id = :id");
        $stmt->bindParam(':id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        sendResponse(true, 'Product view count incremented');
    } catch (PDOException $e) {
        error_log('Error incrementing product view count: ' . $e->getMessage());
        sendResponse(false, 'Error incrementing product view count: ' . $e->getMessage(), null, 500);
    }
}

// Get action from query parameters
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Process based on the requested action
switch ($action) {
    case 'view':
        handleIncrementProductView($product, $requestData);
        break;
    case 'get_by_id':
        handleGetProductById($product, $requestData);
        break;
    case 'get_by_category':
        handleGetProductsByCategory($product, $requestData);
        break;
    case 'search':
        handleSearchProducts($product, $requestData);
        break;
    case 'get_featured':
        handleGetFeaturedProducts($product, $requestData);
        break;
    case 'get_related':
        handleGetRelatedProducts($product, $requestData);
        break;
    case 'create':
        handleCreateProduct($product, $requestData);
        break;
    case 'update':
        handleUpdateProduct($product, $requestData);
        break;
    case 'get_categories':
        handleGetCategories($product);
        break;
    case 'get_category':
        handleGetCategoryById($product, $requestData);
        break;
    default:
        sendResponse(false, 'Invalid action specified', null, 400);
        break;
}
