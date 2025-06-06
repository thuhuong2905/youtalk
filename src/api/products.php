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

// Process based on the requested action
switch ($action) {
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
        
    case 'view':
        handleIncrementProductView($product, $requestData);
        break;
        
    case 'get_details':
        handleGetProductDetails($product, $requestData);
        break;
        
    case 'get_related':
        handleGetRelatedProducts($product, $requestData);
        break;
        
    default:
        sendResponse(false, 'Invalid action specified', null, 400);
        break;
}

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
    // Accept both product_id and id for compatibility
    $productId = null;
    if (isset($requestData['product_id']) && !empty($requestData['product_id'])) {
        $productId = (int)$requestData['product_id'];
    } elseif (isset($requestData['id']) && !empty($requestData['id'])) {
        $productId = (int)$requestData['id'];
    }
    if (!$productId) {
        sendResponse(false, 'Product ID is required', null, 400);
        return;
    }
    $success = $product->incrementViewCount($productId);
    if ($success) {
        sendResponse(true, 'View count incremented');
    } else {
        sendResponse(false, 'Failed to increment view count', null, 500);
    }
}

/**
 * Handle getting detailed product information with ratings
 */
function handleGetProductDetails($product, $requestData) {
    if (!isset($requestData['id']) || empty($requestData['id'])) {
        sendResponse(false, 'Product ID is required', null, 400);
        return;
    }
    
    $productId = (int)$requestData['id'];
    
    // Get basic product data
    $productData = $product->getProductById($productId);
    
    if (!$productData) {
        sendResponse(false, 'Product not found', null, 404);
        return;
    }
    
    // Process JSON fields
    if (isset($productData['images']) && !empty($productData['images'])) {
        $productData['images'] = json_decode($productData['images'], true);
    }
    if (isset($productData['specs']) && !empty($productData['specs'])) {
        $productData['specs'] = json_decode($productData['specs'], true);
    }
    if (isset($productData['tags']) && !empty($productData['tags'])) {
        $productData['tags'] = json_decode($productData['tags'], true);
    }
    
    // Get review statistics
    try {
        $stmt = $product->conn->prepare("
            SELECT 
                COUNT(*) as review_count,
                AVG(rating) as avg_rating
            FROM reviews 
            WHERE product_id = :product_id AND status = 'active'
        ");
        $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        $reviewStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $productData['review_count'] = (int)$reviewStats['review_count'];
        $productData['avg_rating'] = $reviewStats['avg_rating'] ? round((float)$reviewStats['avg_rating'], 1) : 0;
        
    } catch (PDOException $e) {
        // If reviews table doesn't exist or there's an error, set defaults
        $productData['review_count'] = 0;
        $productData['avg_rating'] = 0;
    }
    
    sendResponse(true, 'Product details retrieved successfully', [
        'product' => $productData
    ]);
}

/**
 * Handle getting related products
 */
function handleGetRelatedProducts($product, $requestData) {
    if (!isset($requestData['id']) || empty($requestData['id'])) {
        sendResponse(false, 'Product ID is required', null, 400);
        return;
    }
    
    $productId = (int)$requestData['id'];
    $limit = isset($requestData['limit']) ? (int)$requestData['limit'] : 4;
    
    // Get the current product's category
    $currentProduct = $product->getProductById($productId);
    if (!$currentProduct) {
        sendResponse(false, 'Product not found', null, 404);
        return;
    }
    
    $categoryId = $currentProduct['category_id'];
    
    try {
        // Get related products from the same category, excluding the current product
        $stmt = $product->conn->prepare("
            SELECT 
                p.id, p.name, p.price, p.images, p.view_count,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = :category_id 
            AND p.id != :product_id 
            AND p.status = 'active'
            ORDER BY p.view_count DESC, p.created_at DESC
            LIMIT :limit
        ");
        
        $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $relatedProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process images for each product
        foreach ($relatedProducts as &$relatedProduct) {
            if (isset($relatedProduct['images']) && !empty($relatedProduct['images'])) {
                $relatedProduct['images'] = json_decode($relatedProduct['images'], true);
            } else {
                $relatedProduct['images'] = [];
            }
        }
        
        sendResponse(true, 'Related products retrieved successfully', [
            'products' => $relatedProducts
        ]);
        
    } catch (PDOException $e) {
        error_log("Error getting related products: " . $e->getMessage());
        sendResponse(false, 'Failed to get related products', null, 500);
    }
}
