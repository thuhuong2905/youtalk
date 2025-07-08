<?php
// Lớp User - Xử lý các thao tác liên quan đến người dùng

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
     * Lấy thông tin người dùng theo ID
     */
    public function getUserById($userId) {
        try {
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
                return ['success' => false, 'message' => 'Không tìm thấy người dùng'];
            }
        } catch (PDOException $e) {
            error_log('Error fetching user by ID: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Lỗi cơ sở dữ liệu'];
        }
    }
    
    /**
     * Lấy thông tin người dùng theo tên đăng nhập
     */
    public function getUserByUsername($username) {
        try {
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
     * Lấy thông tin người dùng theo email
     */
    public function getUserByEmail($email) {
        try {
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
                return ['success' => false, 'message' => 'Không tìm thấy người dùng'];
            }
        } catch (PDOException $e) {
            error_log('Error fetching user by email: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Lỗi cơ sở dữ liệu'];
        }
    }
    
    /**
     * Đăng ký người dùng mới
     */
    public function register($username, $fullName, $email, $password) {
        try {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            $stmt = $this->db->prepare("
                INSERT INTO users (username, full_name, email, password, created_at, updated_at, status, role)
                VALUES (:username, :full_name, :email, :password, NOW(), NOW(), 'active', 'user')
            ");
            
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->bindParam(':full_name', $fullName, PDO::PARAM_STR);
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
            
            $stmt->execute();
            
            $userId = $this->db->lastInsertId();
            
            return [
                'success' => true,
                'user_id' => $userId,
                'message' => 'Đăng ký tài khoản thành công'
            ];
        } catch (PDOException $e) {
            error_log('Error registering user: ' . $e->getMessage());
            if ($e->getCode() == '23000') {
                 return [
                    'success' => false,
                    'message' => 'Tên đăng nhập hoặc email đã tồn tại.'
                ];
            }
            return [
                'success' => false,
                'message' => 'Đăng ký thất bại do lỗi cơ sở dữ liệu.'
            ];
        }
    }
    
    /**
     * Tạo người dùng mới (phương thức cũ cho tính tương thích)
     */
    public function createUser($userData) {
        return $this->register(
            $userData['username'] ?? '', 
            $userData['full_name'] ?? '', 
            $userData['email'] ?? '', 
            $userData['password'] ?? ''
        );
    }
    
    /**
     * Cập nhật thông tin người dùng (phiên bản với một tham số)
     */
    public function updateUser($userData) {
        if (!isset($userData['id'])) {
            return ['success' => false, 'message' => 'Cần cung cấp ID người dùng'];
        }
        
        $userId = $userData['id'];
        unset($userData['id']);
        
        return $this->updateUserById($userId, $userData);
    }
    
    /**
     * Cập nhật thông tin người dùng (phiên bản với hai tham số)
     */
    public function updateUserById($userId, $userData) {
        try {
            $query = "UPDATE users SET updated_at = NOW()";
            $params = [];
            
            $allowedFields = ['full_name', 'bio', 'profile_picture', 'email']; 
            
            foreach ($allowedFields as $field) {
                if (isset($userData[$field])) {
                    $query .= ", $field = :$field";
                    $params[$field] = $userData[$field];
                }
            }
            
            if (isset($userData['password']) && !empty($userData['password'])) {
                $query .= ", password = :password";
                $params['password'] = password_hash($userData['password'], PASSWORD_DEFAULT);
            }
            
            $query .= " WHERE id = :id";
            $params['id'] = $userId;
            
            if (count($params) <= 1) {
                 return ['success' => false, 'message' => 'Không có trường nào được cung cấp để cập nhật'];
            }
            
            $stmt = $this->db->prepare($query);
            
            foreach ($params as $key => $value) {
                $paramType = PDO::PARAM_STR;
                if ($key === 'id') {
                    $paramType = PDO::PARAM_INT;
                }
                $stmt->bindValue(":$key", $value, $paramType);
            }
            
            $success = $stmt->execute();
            
            if ($success) {
                return ['success' => true, 'message' => 'Cập nhật người dùng thành công'];
            } else {
                return ['success' => false, 'message' => 'Cập nhật thất bại'];
            }
        } catch (PDOException $e) {
            error_log('Error updating user: ' . $e->getMessage());
             if ($e->getCode() == '23000') {
                 return [
                    'success' => false,
                    'message' => 'Cập nhật thất bại: Email có thể đã được sử dụng.'
                ];
            }
            return ['success' => false, 'message' => 'Lỗi cơ sở dữ liệu khi cập nhật'];
        }
    }
    
    /**
     * Cập nhật mật khẩu người dùng
     */
    public function updatePassword($userId, $newPassword) {
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
     * Xác thực thông tin đăng nhập của người dùng
     */
    public function verifyLogin($loginIdentifier, $password) {
        try {
            $isEmail = filter_var($loginIdentifier, FILTER_VALIDATE_EMAIL);
            
            if ($isEmail) {
                $sql = "
                    SELECT id, username, full_name, email, password, role, status, profile_picture
                    FROM users 
                    WHERE email = :identifier AND status = 'active'
                ";
                $paramName = ':identifier';
            } else {
                $sql = "
                    SELECT id, username, full_name, email, password, role, status, profile_picture
                    FROM users 
                    WHERE username = :identifier AND status = 'active'
                "; 
                $paramName = ':identifier';
            }
            
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam($paramName, $loginIdentifier, PDO::PARAM_STR);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && password_verify($password, $user['password'])) {
                unset($user['password']);
                return [
                    'success' => true,
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'full_name' => $user['full_name'] ?? null,
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'profile_picture' => $user['profile_picture'] ?? null
                ];
            }
            
            return ['success' => false, 'message' => 'Email/tên đăng nhập hoặc mật khẩu không đúng']; 
        } catch (PDOException $e) {
            error_log('Error verifying login: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Lỗi khi xác thực đăng nhập do cơ sở dữ liệu'];
        }
    }
    
    /**
     * Kiểm tra tên đăng nhập đã tồn tại chưa
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
            return false; 
        }
    }
    
    /**
     * Kiểm tra email đã tồn tại chưa
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
            return false; 
        }
    }
    
    /**
     * Đếm số người theo dõi của một người dùng
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
     * Đếm số người mà một người dùng đang theo dõi
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
     * Lấy danh sách người dùng hoạt động dựa trên số lượng bài viết và tương tác
     */
    public function getActiveUsers($limit = 5) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    u.id,
                    u.username,
                    u.full_name,
                    u.profile_picture,
                    COALESCE(pc.post_count, 0) as post_count,
                    COALESCE(cc.comment_count, 0) as comment_count,
                    COALESCE(rc.review_count, 0) as review_count,
                    COALESCE(fc.follower_count, 0) as follower_count
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
                AND (pc.post_count > 0 OR cc.comment_count > 0 OR rc.review_count > 0)
                ORDER BY pc.post_count DESC, cc.comment_count DESC, rc.review_count DESC
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
                        'follower_count' => (int)$user['follower_count']
                    ];
                }, $activeUsers)
            ];
        } catch (PDOException $e) {
            error_log('Error getting active users: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Lỗi khi lấy danh sách người dùng hoạt động'];
        }
    }
}
?>