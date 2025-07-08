<?php
require_once __DIR__ . '/../core/session_handler.php';
require_once __DIR__ . '/../core/api_utils.php';
require_once __DIR__ . '/../core/admin_middleware.php';
require_once __DIR__ . '/../core/db_connect.php';

// Set header to return JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

// Handle different actions
switch ($action) {
    case 'stats':
        getSystemStats($db);
        break;
    case 'recent_activity':
        getRecentActivity($db);
        break;
    case 'system_info':
        getSystemInfo($db);
        break;
    case 'reports':
        getReportsData($db);
        break;
    case 'activity_chart':
        getActivityChartData($db);
        break;
    case 'top_categories':
        getTopCategories($db);
        break;
    case 'user_growth':
        getUserGrowthData($db);
        break;
    default:
        sendResponse(400, ['message' => 'Invalid action']);
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
        
        // Return success response with 200 status
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $stats,
            'message' => 'Statistics retrieved successfully'
        ]);
        exit;
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
                    created_at as timestamp, id as entity_id
             FROM users 
             ORDER BY created_at DESC LIMIT ?)
            UNION ALL
            (SELECT 'post' as type, CONCAT('Bài viết mới: ', title) as description, 
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
        
        // Return success response with 200 status
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $activities,
            'message' => 'Recent activity retrieved successfully'
        ]);
        exit;
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
 * Get comprehensive reports data
 */
function getReportsData($db) {
    try {
        $reports = [];
        
        // Visits today (simulated - would need actual tracking)
        $reports['visits_today'] = rand(800, 1500);
        
        // New users this week
        $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        $stmt->execute();
        $reports['new_users_week'] = $stmt->fetchColumn();
        
        // New posts this week
        $stmt = $db->prepare("SELECT COUNT(*) FROM posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status = 'active'");
        $stmt->execute();
        $reports['new_posts_week'] = $stmt->fetchColumn();
        
        // New comments this week
        $stmt = $db->prepare("SELECT COUNT(*) FROM comments WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status = 'active'");
        $stmt->execute();
        $reports['new_comments_week'] = $stmt->fetchColumn();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $reports,
            'message' => 'Reports data retrieved successfully'
        ]);
        exit;
    } catch (Exception $e) {
        error_log("Error fetching reports data: " . $e->getMessage());
        sendResponse(500, ['message' => 'Internal Server Error']);
    }
}

/**
 * Get activity chart data for the last 7 days
 */
function getActivityChartData($db) {
    try {
        $chartData = [];
        $labels = [];
        $userData = [];
        $postData = [];
        $commentData = [];
        
        // Get data for last 7 days
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $dateLabel = date('d/m', strtotime("-$i days"));
            $labels[] = $dateLabel;
            
            // Users registered on this day
            $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE DATE(created_at) = ?");
            $stmt->execute([$date]);
            $userData[] = $stmt->fetchColumn();
            
            // Posts created on this day
            $stmt = $db->prepare("SELECT COUNT(*) FROM posts WHERE DATE(created_at) = ? AND status = 'active'");
            $stmt->execute([$date]);
            $postData[] = $stmt->fetchColumn();
            
            // Comments created on this day
            $stmt = $db->prepare("SELECT COUNT(*) FROM comments WHERE DATE(created_at) = ? AND status = 'active'");
            $stmt->execute([$date]);
            $commentData[] = $stmt->fetchColumn();
        }
        
        $chartData = [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Người dùng mới',
                    'data' => $userData,
                    'borderColor' => '#3b82f6',
                    'backgroundColor' => 'rgba(59, 130, 246, 0.1)',
                    'tension' => 0.4
                ],
                [
                    'label' => 'Bài viết mới',
                    'data' => $postData,
                    'borderColor' => '#10b981',
                    'backgroundColor' => 'rgba(16, 185, 129, 0.1)',
                    'tension' => 0.4
                ],
                [
                    'label' => 'Bình luận mới',
                    'data' => $commentData,
                    'borderColor' => '#f59e0b',
                    'backgroundColor' => 'rgba(245, 158, 11, 0.1)',
                    'tension' => 0.4
                ]
            ]
        ];
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $chartData,
            'message' => 'Activity chart data retrieved successfully'
        ]);
        exit;
    } catch (Exception $e) {
        error_log("Error fetching activity chart data: " . $e->getMessage());
        sendResponse(500, ['message' => 'Internal Server Error']);
    }
}

/**
 * Get top categories by post count
 */
function getTopCategories($db) {
    try {
        $stmt = $db->prepare("
            SELECT c.name, COUNT(p.id) as post_count
            FROM categories c
            LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'active'
            WHERE c.status = 'active'
            GROUP BY c.id, c.name
            ORDER BY post_count DESC
            LIMIT 10
        ");
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate percentages
        $totalPosts = array_sum(array_column($categories, 'post_count'));
        if ($totalPosts > 0) {
            foreach ($categories as &$category) {
                $category['percentage'] = round(($category['post_count'] / $totalPosts) * 100, 1);
            }
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $categories,
            'message' => 'Top categories retrieved successfully'
        ]);
        exit;
    } catch (Exception $e) {
        error_log("Error fetching top categories: " . $e->getMessage());
        sendResponse(500, ['message' => 'Internal Server Error']);
    }
}

/**
 * Get user growth data for the last 30 days
 */
function getUserGrowthData($db) {
    try {
        $stmt = $db->prepare("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_users,
                SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_users
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        ");
        $stmt->execute();
        $growthData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $growthData,
            'message' => 'User growth data retrieved successfully'
        ]);
        exit;
    } catch (Exception $e) {
        error_log("Error fetching user growth data: " . $e->getMessage());
        sendResponse(500, ['message' => 'Internal Server Error']);
    }
}
