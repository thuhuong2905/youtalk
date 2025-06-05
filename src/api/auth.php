<?php
// Authentication API Endpoint
// Handles user registration, login, logout, and status check

// Include necessary files
require_once '../config/database.php';
require_once '../core/db_connect.php';
require_once '../core/api_utils.php';
require_once '../core/session_handler.php';
require_once '../core/classes/User.php';

// Session is already started in session_handler.php, no need to start it again

// Set headers
header('Content-Type: application/json');

// Handle CORS
header('Access-Control-Allow-Origin: *'); // Adjust for production
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

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

// Create User instance
$user = new User($conn);

// Handle different actions
switch ($action) {
    case 'register':
        // Get POST data
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            // Try to get from $_POST if JSON decoding fails
            $data = $_POST;
        }
        
        // Validate required fields
        if (!isset($data['username']) || empty(trim($data['username']))) {
            sendResponse(false, 'Username is required', null, 400);
            break;
        }
        if (!isset($data['email']) || empty(trim($data['email']))) {
            sendResponse(false, 'Email is required', null, 400);
            break;
        }
        if (!isset($data['password']) || empty($data['password'])) {
            sendResponse(false, 'Password is required', null, 400);
            break;
        }
        if (!isset($data['full_name']) || empty(trim($data['full_name']))) {
            sendResponse(false, 'Full name is required', null, 400);
            break;
        }
        
        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            sendResponse(false, 'Invalid email format', null, 400);
            break;
        }
        
        // Check if username already exists
        if ($user->usernameExists($data['username'])) {
            sendResponse(false, 'Username already exists', null, 409); // 409 Conflict
            break;
        }
        
        // Check if email already exists
        if ($user->emailExists($data['email'])) {
            sendResponse(false, 'Email already exists', null, 409); // 409 Conflict
            break;
        }
        
        // Register user
        $result = $user->register($data['username'], $data['full_name'], $data['email'], $data['password']);
        
        if ($result['success']) {
            // Auto login after registration
            $_SESSION['user_id'] = $result['user_id'];
            $_SESSION['username'] = $data['username'];
            $_SESSION['email'] = $data['email'];
            $_SESSION['role'] = 'user'; // Default role
            
            session_regenerate_id(true);

            sendResponse(true, 'Registration successful', [
                'user_id' => $result['user_id'],
                'username' => $data['username'],
                'email' => $data['email'],
                'role' => 'user'
            ]);
        } else {
            sendResponse(false, $result['message'], null, 500); // Internal Server Error
        }
        break;
        
    case 'login':
        // Get POST data
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            // Try to get from $_POST if JSON decoding fails
            $data = $_POST;
        }

        // *** MODIFIED LOGIN LOGIC ***
        // Check if either email or username is provided
        $loginIdentifier = null;
        if (isset($data['email']) && !empty(trim($data['email']))) {
            $loginIdentifier = trim($data['email']);
        } elseif (isset($data['username']) && !empty(trim($data['username']))) {
            $loginIdentifier = trim($data['username']);
        }

        // Validate required fields
        if ($loginIdentifier === null) {
            sendResponse(false, 'Email or Username is required', null, 400);
            break;
        }
        
        if (!isset($data['password']) || empty($data['password'])) {
            sendResponse(false, 'Password is required', null, 400);
            break;
        }
        
        // Login user using the provided identifier (email or username)
        $result = $user->verifyLogin($loginIdentifier, $data['password']);
        // *** END MODIFIED LOGIN LOGIC ***
        
        if ($result['success']) {
            // Set session variables
            $_SESSION['user_id'] = $result['user_id'];
            $_SESSION['username'] = $result['username'];
            $_SESSION['email'] = $result['email'];
            $_SESSION['role'] = $result['role'];
            if (isset($result['full_name'])) {
                $_SESSION['full_name'] = $result['full_name'];
            }
            session_regenerate_id(true);

            // Optionally handle 'remember_me'
            if (isset($data['remember_me']) && $data['remember_me']) {
                // Extend session lifetime or set a persistent cookie
                // Example: Set cookie for 30 days
                $lifetime = 60 * 60 * 24 * 30; // 30 days in seconds
                session_set_cookie_params($lifetime);
                session_regenerate_id(true); // Regenerate ID to prevent fixation
            }
            sendResponse(true, 'Login successful', [
                'user_id' => $result['user_id'],
                'username' => $result['username'],
                'email' => $result['email'],
                'full_name' => $result['full_name'] ?? null,
                'role' => $result['role'],
                'profile_picture' => $result['profile_picture'] ?? null // Handle potential null value
            ]);
        } else {
            sendResponse(false, $result['message'], null, 401); // 401 Unauthorized for invalid credentials
        }
        break;
        
    case 'logout':
        // Destroy session
        session_unset();
        session_destroy();
        
        // Clear session cookie (optional but good practice)
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        sendResponse(true, 'Logout successful');
        break;
        
    case 'status':
        // Check if user is logged in
        if (isUserLoggedIn()) {
            // Get user info
            $user_id = $_SESSION['user_id'];
            $result = $user->getUserById($user_id);
            
            if ($result['success']) {
                sendResponse(true, 'User is authenticated', [
                    'authenticated' => true,
                    'user' => [
                        'user_id' => $result['data']['id'],
                        'username' => $result['data']['username'],
                        'email' => $result['data']['email'],
                        'full_name' => $result['data']['full_name'] ?? null, // Added full_name
                        'role' => $result['data']['role'],
                        'profile_picture' => $result['data']['profile_picture'] ?? null
                    ]
                ]);
            } else {
                // Session exists but user not found in database (e.g., deleted)
                session_unset();
                session_destroy();
                
                sendResponse(true, 'User is not authenticated', [
                    'authenticated' => false
                ]);
            }
        } else {
            sendResponse(true, 'User is not authenticated', [
                'authenticated' => false
            ]);
        }
        break;
        
    case 'update_profile':
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            sendResponse(false, 'You must be logged in to update your profile', null, 401);
            break;
        }
        
        // Get POST data
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            // Try to get from $_POST
            $data = $_POST;
        }
        
        // Prepare user data
        $userData = [
            'id' => $_SESSION['user_id']
        ];
        
        // Add optional fields if provided
        if (isset($data['email']) && !empty(trim($data['email']))) {
            $newEmail = trim($data['email']);
            // Validate email format
            if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
                sendResponse(false, 'Invalid email format', null, 400);
                break;
            }
            
            // Check if email already exists (except for current user)
            if ($user->emailExists($newEmail, $_SESSION['user_id'])) {
                sendResponse(false, 'Email already exists', null, 409);
                break;
            }
            
            $userData['email'] = $newEmail;
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
             // Add password length validation if needed
            $userData['password'] = $data['password'];
        }
        
        if (isset($data['profile_picture'])) {
            // Add validation for URL or path if needed
            $userData['profile_picture'] = $data['profile_picture'];
        }
        
        if (isset($data['bio'])) {
            // Add length validation if needed
            $userData['bio'] = trim($data['bio']);
        }
         if (isset($data['full_name']) && !empty(trim($data['full_name']))) {
            $userData['full_name'] = trim($data['full_name']);
        }
        
        // Update user profile
        $result = $user->updateUser($userData);    
        
        if ($result['success']) {
            // Update session if email or username was changed
            if (isset($userData['email'])) {
                $_SESSION['email'] = $userData['email'];
            }
            if (isset($userData['full_name'])) {
                $_SESSION['full_name'] = $userData['full_name'];
            }
            sendResponse(true, 'Profile updated successfully');
        } else {
            sendResponse(false, $result['message'], null, 500);
        }
        break;
        
    default:
        sendResponse(false, 'Invalid action specified', null, 400);
        break;
}

