<?php
// User Class - Handles user-related operations

require_once __DIR__ . '/../db_connect.php';

class User {
    private $db;
    
    public function __construct($connection = null) {
        if ($connection) {
            $this->db = $connection;
        } else {
            $this->db = getDbConnection();
        }
    }
    
    /**
     * Get user by ID
     * 
     * @param int $userId The user ID to retrieve
     * @return array User data with success/data structure
     */
    public function getUserById($userId) {
        try {
            // Removed 'location' from SELECT
            $stmt = $this->db->prepare("
                SELECT id, username, full_name, email, bio, profile_picture, 
                       created_at, updated_at, role, status
                FROM users 
                WHERE id = :id AND status = 'active'
            ");
            $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                return ['success' => true, 'data' => $user];
            } else {
                return ['success' => false, 'message' => 'User not found'];
            }
        } catch (PDOException $e) {
            error_log('Error fetching user by ID: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Database error'];
        }
    }
    
    /**
     * Get user by username
     * 
     * @param string $username The username to retrieve
     * @return array|null User data or null if not found
     */
    public function getUserByUsername($username) {
        try {
            // Removed 'location' from SELECT
            $stmt = $this->db->prepare("
                SELECT id, username, full_name, email, bio, profile_picture, 
                       created_at, updated_at, role, status
                FROM users 
                WHERE username = :username AND status = 'active'
            ");
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $user ?: null;
        } catch (PDOException $e) {
            error_log('Error fetching user by username: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get user by email
     * 
     * @param string $email The email to retrieve
     * @return array User data with success/data structure
     */
    public function getUserByEmail($email) {
        try {
            // Removed 'location' from SELECT
            $stmt = $this->db->prepare("
                SELECT id, username, full_name, email, bio, profile_picture, 
                       created_at, updated_at, role, status
                FROM users 
                WHERE email = :email AND status = 'active'
            ");
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                return ['success' => true, 'data' => $user];
            } else {
                return ['success' => false, 'message' => 'User not found'];
            }
        } catch (PDOException $e) {
            error_log('Error fetching user by email: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Database error'];
        }
    }
    
    /**
     * Register a new user
     * 
     * @param string $username Username
     * @param string $fullName Full Name
     * @param string $email Email
     * @param string $password Password
     * @return array Result with success status and data
     */
    public function register($username, $fullName, $email, $password) {
        try {
            // Hash the password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            $stmt = $this->db->prepare("
                INSERT INTO users (username, full_name, email, password, created_at, updated_at, status, role)
                VALUES (:username, :full_name, :email, :password, NOW(), NOW(), 'active', 'user')
            ");
            
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->bindParam(':full_name', $fullName, PDO::PARAM_STR); // Bind full_name
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
            
            $stmt->execute();
            
            $userId = $this->db->lastInsertId();
            
            return [
                'success' => true,
                'user_id' => $userId,
                'message' => 'User registered successfully'
            ];
        } catch (PDOException $e) {
            error_log('Error registering user: ' . $e->getMessage());
            // Provide more specific error if possible (e.g., duplicate entry)
            if ($e->getCode() == '23000') { // Integrity constraint violation
                 return [
                    'success' => false,
                    'message' => 'Username or email already exists.'
                ];
            }
            return [
                'success' => false,
                'message' => 'Registration failed due to a database error.'
            ];
        }
    }
    
    /**
     * Create a new user (legacy method for backward compatibility)
     * 
     * @param array $userData User data (username, email, password, etc.)
     * @return int|false The new user ID or false on failure
     */
    public function createUser($userData) {
        // Consider deprecating or updating this to match register method signature
        return $this->register(
            $userData['username'] ?? '', 
            $userData['full_name'] ?? '', 
            $userData['email'] ?? '', 
            $userData['password'] ?? ''
        );
    }
    
    /**
     * Update user information (version with single parameter)
     * 
     * @param array $userData The user data including ID
     * @return array Result with success status
     */
    public function updateUser($userData) {
        if (!isset($userData['id'])) {
            return ['success' => false, 'message' => 'User ID is required'];
        }
        
        $userId = $userData['id'];
        unset($userData['id']); // Remove ID from update data
        
        return $this->updateUserById($userId, $userData);
    }
    
    /**
     * Update user information (version with two parameters)
     * 
     * @param int $userId The user ID to update
     * @param array $userData The user data to update
     * @return array Result with success status
     */
    public function updateUserById($userId, $userData) {
        try {
            // Start building the query
            $query = "UPDATE users SET updated_at = NOW()";
            $params = [];
            
            // Add fields to update
            // Removed 'location' from allowed fields
            $allowedFields = ['full_name', 'bio', 'profile_picture', 'email']; 
            
            foreach ($allowedFields as $field) {
                if (isset($userData[$field])) {
                    $query .= ", $field = :$field";
                    $params[$field] = $userData[$field];
                }
            }
            
            // Handle password separately if provided
            if (isset($userData['password']) && !empty($userData['password'])) {
                // Add password validation (e.g., length)
                $query .= ", password = :password";
                $params['password'] = password_hash($userData['password'], PASSWORD_DEFAULT);
            }
            
            // Add user ID condition
            $query .= " WHERE id = :id";
            $params['id'] = $userId;
            
            // Check if any fields were actually provided for update
            if (count($params) <= 1) { // Only id and updated_at
                 return ['success' => false, 'message' => 'No fields provided for update'];
            }
            
            // Prepare and execute the query
            $stmt = $this->db->prepare($query);
            
            foreach ($params as $key => $value) {
                // Determine PDO type (simplified example)
                $paramType = PDO::PARAM_STR;
                if ($key === 'id') {
                    $paramType = PDO::PARAM_INT;
                }
                $stmt->bindValue(":$key", $value, $paramType);
            }
            
            $success = $stmt->execute();
            
            if ($success) {
                return ['success' => true, 'message' => 'User updated successfully'];
            } else {
                return ['success' => false, 'message' => 'Update failed'];
            }
        } catch (PDOException $e) {
            error_log('Error updating user: ' . $e->getMessage());
             if ($e->getCode() == '23000') { // Integrity constraint violation (e.g., duplicate email)
                 return [
                    'success' => false,
                    'message' => 'Update failed: Email may already be in use.'
                ];
            }
            return ['success' => false, 'message' => 'Database error during update'];
        }
    }
    
    /**
     * Update user password
     * 
     * @param int $userId The user ID
     * @param string $newPassword The new password
     * @return bool True on success, false on failure
     */
    public function updatePassword($userId, $newPassword) {
        // Add password validation (e.g., length)
        try {
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

            $stmt = $this->db->prepare("
                UPDATE users 
                SET password = :password, updated_at = NOW()
                WHERE id = :id
            ");
            
            $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
            $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Error updating password: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Verify user credentials for login
     * 
     * @param string $loginIdentifier Username or email
     * @param string $password Password to verify
     * @return array Result with success status and user data
     */
    public function verifyLogin($loginIdentifier, $password) {
        try {
            // Check if input is email or username
            $isEmail = filter_var($loginIdentifier, FILTER_VALIDATE_EMAIL);
            
            // *** FIXED SQL and Parameter Binding ***
            if ($isEmail) {
                // Removed 'location' from SELECT
                $sql = "
                    SELECT id, username, full_name, email, password, role, status, profile_picture
                    FROM users 
                    WHERE email = :identifier AND status = 'active'
                ";
                $paramName = ':identifier'; // Use a consistent placeholder name
            } else {
                // Removed 'location' from SELECT
                $sql = "
                    SELECT id, username, full_name, email, password, role, status, profile_picture
                    FROM users 
                    WHERE username = :identifier AND status = 'active'
                "; 
                $paramName = ':identifier'; // Use a consistent placeholder name
            }
            
            $stmt = $this->db->prepare($sql);
            // Bind the correct parameter based on whether it's email or username
            $stmt->bindParam($paramName, $loginIdentifier, PDO::PARAM_STR);
            $stmt->execute();
            // *** END FIX ***
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Check if user exists and password is correct
            if ($user && password_verify($password, $user['password'])) {
                // Remove password from the returned data
                unset($user['password']);
                return [
                    'success' => true,
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'full_name' => $user['full_name'] ?? null, // Handle potential null
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'profile_picture' => $user['profile_picture'] ?? null
                ];
            }
            
            // More specific message for invalid credentials
            return ['success' => false, 'message' => 'Invalid email/username or password']; 
        } catch (PDOException $e) {
            error_log('Error verifying login: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Login failed due to a database error'];
        }
    }
    
    /**
     * Check if a username already exists
     * 
     * @param string $username The username to check
     * @param int $excludeUserId Optional user ID to exclude from check
     * @return bool True if exists, false otherwise
     */
    public function usernameExists($username, $excludeUserId = null) {
        try {
            $query = "SELECT COUNT(*) FROM users WHERE username = :username";
            $params = [':username' => $username];
            
            if ($excludeUserId !== null) {
                $query .= " AND id != :exclude_id";
                $params[':exclude_id'] = $excludeUserId;
            }
            
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            
            return (int)$stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log('Error checking username existence: ' . $e->getMessage());
            // Consider returning an error state instead of false
            return false; 
        }
    }
    
    /**
     * Check if an email already exists
     * 
     * @param string $email The email to check
     * @param int $excludeUserId Optional user ID to exclude from check
     * @return bool True if exists, false otherwise
     */
    public function emailExists($email, $excludeUserId = null) {
        try {
            $query = "SELECT COUNT(*) FROM users WHERE email = :email";
            $params = [':email' => $email];
            
            if ($excludeUserId !== null) {
                $query .= " AND id != :exclude_id";
                $params[':exclude_id'] = $excludeUserId;
            }
            
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            
            return (int)$stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log('Error checking email existence: ' . $e->getMessage());
            // Consider returning an error state instead of false
            return false; 
        }
    }
    
    /**
     * Count followers for a user
     * 
     * @param int $userId The user ID
     * @return int Number of followers
     */
    public function countFollowers($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM followers 
                WHERE following_user_id = :user_id
            ");
            $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Error counting followers: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Count users a user is following
     * 
     * @param int $userId The user ID
     * @return int Number of users being followed
     */
    public function countFollowing($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM followers 
                WHERE follower_user_id = :user_id
            ");
            $stmt->bindParam(":user_id", $userId, PDO::PARAM_INT);
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Error counting following: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get active users list based on their activity scores
     * Activity score is calculated from:
     * - Posts (10 points each)
     * - Comments (5 points each)  
     * - Reviews (8 points each)
     * - Followers (2 points each)
     * 
     * @param int $limit Number of users to return
     * @return array List of active users with activity scores
     */
    public function getActiveUsers($limit = 5) {
        try {
            // Tối ưu câu truy vấn bằng cách tách thành các subquery
            $stmt = $this->db->prepare("
                SELECT 
                    u.id,
                    u.username,
                    u.full_name,
                    u.profile_picture,
                    COALESCE(pc.post_count, 0) as post_count,
                    COALESCE(cc.comment_count, 0) as comment_count,
                    COALESCE(rc.review_count, 0) as review_count,
                    COALESCE(fc.follower_count, 0) as follower_count,
                    (COALESCE(pc.post_count, 0) * 10 + 
                     COALESCE(cc.comment_count, 0) * 5 + 
                     COALESCE(rc.review_count, 0) * 8 + 
                     COALESCE(fc.follower_count, 0) * 2) as activity_score
                FROM users u
                LEFT JOIN (
                    SELECT user_id, COUNT(*) as post_count 
                    FROM posts 
                    WHERE status = 'active' 
                    GROUP BY user_id
                ) pc ON u.id = pc.user_id
                LEFT JOIN (
                    SELECT user_id, COUNT(*) as comment_count 
                    FROM comments 
                    WHERE status = 'active' 
                    GROUP BY user_id
                ) cc ON u.id = cc.user_id
                LEFT JOIN (
                    SELECT user_id, COUNT(*) as review_count 
                    FROM reviews 
                    WHERE status = 'active' 
                    GROUP BY user_id
                ) rc ON u.id = rc.user_id
                LEFT JOIN (
                    SELECT following_user_id, COUNT(*) as follower_count 
                    FROM followers 
                    GROUP BY following_user_id
                ) fc ON u.id = fc.following_user_id
                WHERE u.status = 'active'
                HAVING activity_score > 0
                ORDER BY activity_score DESC, post_count DESC
                LIMIT :limit
            ");
            
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $activeUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'users' => array_map(function($user) {
                    return [
                        'id' => (int)$user['id'],
                        'username' => $user['username'],
                        'full_name' => $user['full_name'] ?: $user['username'],
                        'profile_picture' => $user['profile_picture'],
                        'post_count' => (int)$user['post_count'],
                        'comment_count' => (int)$user['comment_count'],
                        'review_count' => (int)$user['review_count'],
                        'follower_count' => (int)$user['follower_count'],
                        'activity_score' => (int)$user['activity_score']
                    ];
                }, $activeUsers)
            ];
        } catch (PDOException $e) {
            error_log('Error getting active users: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Database error'];
        }
    }
}
?>