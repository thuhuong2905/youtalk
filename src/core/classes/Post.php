<?php
// Class Post - Xử lý các bài viết và thảo luận trên diễn đàn

require_once __DIR__ . '/../../core/db_connect.php';

class Post {
    private $db; // Giữ tham chiếu private nếu cần cho các phương thức nội bộ
    public $conn; // Tạo kết nối public để khớp với cách sử dụng API

    public function __construct($db = null) { // Chấp nhận kết nối db tùy chọn
        $this->conn = $db ?: getDbConnection(); // Gán cho $conn public
        $this->db = $this->conn; // Giữ tham chiếu private nếu cần
    }

    // Thêm getter nếu muốn giữ $conn private nhưng vẫn cho phép truy cập (Cách khắc phục thay thế)
    /*
    public function getConnection() {
        return $this->conn;
    }
    */

    /**
     * Lấy bài viết theo ID
     * 
     * @param int $postId ID bài viết cần lấy
     * @return array Phản hồi với trạng thái thành công và dữ liệu/thông báo
     */
    public function getPostById($postId) {
        try {
            // Sử dụng $this->conn (hiện tại là public)
            $stmt = $this->conn->prepare("
                SELECT p.*, u.username, u.full_name AS full_name, u.bio AS user_bio, u.profile_picture, u.created_at AS user_created_at,
                       c.name as category_name,
                       (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id AND cm.status = 'active') as comment_count,
                       (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND status = 'active') AS user_comment_count
                FROM posts p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = :id
            "); // Đã xóa điều kiện p.status = 'active' ở đây để cho phép lấy các bài viết inactive/draft theo ID nếu cần bởi admin/owner
            $stmt->bindParam(':id', $postId, PDO::PARAM_INT);
            $stmt->execute();
            
            $post = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($post) {
                // Đếm số bài đăng của tác giả (user_id)
                $userPostCount = $this->countByUserId($post['user_id']);
                $post['user_post_count'] = $userPostCount;
                // Xử lý các trường JSON
                if (!empty($post['media'])) {
                    $post['media'] = json_decode($post['media'], true);
                    // Xử lý đường dẫn ảnh trên server
                    if (is_array($post['media'])) {
                        $post['media'] = $this->processImagePaths($post['media']);
                    }
                }
                if (!empty($post['tags'])) {
                    $post['tags'] = json_decode($post['tags'], true);
                }
                 return ['success' => true, 'data' => $post];
            } else {
                return ['success' => false, 'message' => 'Không tìm thấy bài viết'];
            }
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy bài viết theo ID: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Lỗi cơ sở dữ liệu khi lấy bài viết'];
        }
    }

    /**
    * Lấy bài viết với lọc linh hoạt và phân trang
    * 
    * @param int|null $categoryId Lọc theo ID danh mục
    * @param int|null $userId Lọc theo ID người dùng  
    * @param int|null $productId Lọc theo ID sản phẩm
    * @param string|null $postType Lọc theo loại bài viết
    * @param string|null $search Tìm kiếm trong tiêu đề và nội dung
    * @param string $sort Thứ tự sắp xếp (newest, oldest, comments, views)
    * @param int $page Số trang cho phân trang
    * @param int $limit Số bài viết mỗi trang
    * @return array Phản hồi với trạng thái thành công và dữ liệu
    *
    * Lưu ý: Để tìm kiếm, truyền từ khóa vào tham số $search. Không cần gọi searchPosts riêng.
    */
    public function getPosts($categoryId = null, $userId = null, $productId = null, $postType = null, $search = null, $sort = 'newest', $page = 1, $limit = 10) {
        try {
            // Ép kiểu và kiểm tra giá trị hợp lệ để tránh lỗi
            $page = (int)$page;
            $limit = (int)$limit;
            
            // Đảm bảo các giá trị tối thiểu hợp lệ
            if ($page < 1) $page = 1;
            if ($limit < 1) $limit = 10; // Mặc định 10 nếu limit <= 0
            
            // Tính toán offset
            $offset = ($page - 1) * $limit;
            
            // Xây dựng điều kiện WHERE
            $whereConditions = ["p.status = 'active'", "u.status = 'active'"]; // Đảm bảo bài viết và người dùng đang hoạt động
            $params = [];
            
            if ($categoryId !== null) {
                $whereConditions[] = "p.category_id = :category_id";
                $params['category_id'] = $categoryId;
            }
            
            if ($userId !== null) {
                $whereConditions[] = "p.user_id = :user_id";
                $params['user_id'] = $userId;
            }
            
            if ($productId !== null) {
                $whereConditions[] = "p.product_id = :product_id";
                $params['product_id'] = $productId;
            }
            
            if ($postType !== null) {
                $whereConditions[] = "p.post_type = :post_type";
                $params['post_type'] = $postType;
            }
            
            if ($search !== null && !empty($search)) {
                $whereConditions[] = "(p.title LIKE :search OR p.content LIKE :search)";
                $params['search'] = '%' . $search . '%';
            }
            
            // Xây dựng mệnh đề ORDER BY
            $orderBy = 'p.created_at DESC'; // mặc định
            switch ($sort) {
                case 'oldest':
                    $orderBy = 'p.created_at ASC';
                    break;
                case 'comments': // Sắp xếp theo số lượng bình luận
                    $orderBy = 'comment_count DESC, p.created_at DESC';
                    break;
                case 'views':
                    $orderBy = 'p.view_count DESC, p.created_at DESC';
                    break;
                case 'newest':
                default:
                    $orderBy = 'p.created_at DESC';
                    break;
            }
            
            // Xây dựng truy vấn chính
            $whereClause = implode(' AND ', $whereConditions);
            
            $query = "
                SELECT p.*, u.full_name, u.username, u.profile_picture, c.name as category_name,
                    (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id AND cm.status = 'active') as comment_count
                FROM posts p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE $whereClause
                ORDER BY $orderBy
                LIMIT :limit OFFSET :offset
            ";
            
            // Sử dụng $this->conn (hiện tại là public)
            $stmt = $this->conn->prepare($query);
            
            // Bind parameters
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Xử lý các trường JSON
            foreach ($posts as &$post) {
                if (!empty($post['media'])) {
                    $post['media'] = json_decode($post['media'], true);
                    // Xử lý đường dẫn ảnh trên server
                    if (is_array($post['media'])) {
                        $post['media'] = $this->processImagePaths($post['media']);
                    }
                }
                if (!empty($post['tags'])) {
                    $post['tags'] = json_decode($post['tags'], true);
                }
            }
            
            // Lấy tổng số để phân trang
            $countQuery = "
                SELECT COUNT(*) as total
                FROM posts p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE $whereClause
            ";
            
            $countStmt = $this->conn->prepare($countQuery);
            foreach ($params as $key => $value) {
                $countStmt->bindValue(":$key", $value);
            }
            $countStmt->execute();
            $totalCount = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            return [
                'success' => true,
                'data' => [
                    'posts' => $posts,
                    'total' => $totalCount,
                    'pagination' => [
                        'current_page' => $page,
                        'per_page' => $limit,
                        'total' => $totalCount,
                        'total_pages' => $limit > 0 ? ceil($totalCount / $limit) : 0
                    ]
                ]
            ];
            
        } catch (PDOException $e) {
            error_log('Lỗi khi lấy bài viết: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Không thể lấy bài viết: ' . $e->getMessage() // Bao gồm thông báo lỗi để debug
            ];
        }
    }

    /**
     * Tạo bài viết mới
     * 
     * @param array $postData Dữ liệu bài viết
     * @return array Phản hồi với trạng thái thành công và post_id/thông báo
     */
    public function createPost($postData) {
        // Validate dữ liệu đầu vào
        if (empty($postData['title']) || mb_strlen($postData['title']) > 100) {
            return ['success' => false, 'message' => 'Tiêu đề là bắt buộc và tối đa 100 ký tự.'];
        }
        if (empty($postData['content'])) {
            return ['success' => false, 'message' => 'Nội dung là bắt buộc.'];
        }
        if (empty($postData['user_id']) || empty($postData['category_id']) || empty($postData['post_type'])) {
            return ['success' => false, 'message' => 'Thiếu thông tin bắt buộc (user, danh mục, loại bài viết).'];
        }
        // Validate tags
        $tags = [];
        if (!empty($postData['tags'])) {
            if (is_string($postData['tags'])) {
                $tags = json_decode($postData['tags'], true);
            } elseif (is_array($postData['tags'])) {
                $tags = $postData['tags'];
            }
            if (!is_array($tags)) $tags = [];
            if (count($tags) > 5) {
                return ['success' => false, 'message' => 'Chỉ cho phép tối đa 5 thẻ.'];
            }
            foreach ($tags as $tag) {
                if (!is_string($tag) || mb_strlen($tag) > 30) {
                    return ['success' => false, 'message' => 'Mỗi thẻ phải là chuỗi tối đa 30 ký tự.'];
                }
            }
        }
        // Chuẩn hóa tags: nếu rỗng thì NULL, nếu có thì JSON string
        $tagsJson = (is_array($tags) && count($tags) > 0) ? json_encode($tags) : null;

        // Validate media (chỉ nhận mảng chuỗi hoặc null, tối đa 10 ảnh)
        $media = [];
        if (!empty($postData['media'])) {
            if (is_string($postData['media'])) {
                $media = json_decode($postData['media'], true);
            } elseif (is_array($postData['media'])) {
                $media = $postData['media'];
            }
            if (!is_array($media)) $media = [];
            if (count($media) > 10) {
                return ['success' => false, 'message' => 'Chỉ cho phép tối đa 10 hình ảnh.'];
            }
            foreach ($media as $img) {
                if (!is_string($img) || mb_strlen($img) > 255) {
                    return ['success' => false, 'message' => 'Đường dẫn ảnh không hợp lệ.'];
                }
            }
        }
        // Chuẩn hóa media: nếu rỗng thì NULL, nếu có thì JSON string
        $mediaJson = (is_array($media) && count($media) > 0) ? json_encode($media) : null;

        try {
            $stmt = $this->conn->prepare("
                INSERT INTO posts 
                    (title, content, user_id, category_id, post_type, status, product_id, media, tags, created_at, updated_at)
                VALUES 
                    (:title, :content, :user_id, :category_id, :post_type, :status, :product_id, :media, :tags, NOW(), NOW())
            ");
            $stmt->bindParam(':title', $postData['title'], PDO::PARAM_STR);
            $stmt->bindParam(':content', $postData['content'], PDO::PARAM_STR);
            $stmt->bindParam(':user_id', $postData['user_id'], PDO::PARAM_INT);
            $stmt->bindParam(':category_id', $postData['category_id'], PDO::PARAM_INT);
            $stmt->bindParam(':post_type', $postData['post_type'], PDO::PARAM_STR);
            $stmt->bindParam(':status', $postData['status'], PDO::PARAM_STR);
            $productId = isset($postData['product_id']) ? $postData['product_id'] : null;
            $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
            $stmt->bindParam(':media', $mediaJson, PDO::PARAM_STR);
            $stmt->bindParam(':tags', $tagsJson, PDO::PARAM_STR);
            if ($stmt->execute()) {
                return ['success' => true, 'post_id' => $this->conn->lastInsertId()];
            } else {
                return ['success' => false, 'message' => 'Không thể tạo bài viết.'];
            }
        } catch (PDOException $e) {
            error_log('Lỗi khi tạo bài viết: ' . $e->getMessage());
            if ($e->getCode() == 23000) {
                return ['success' => false, 'message' => 'Bài viết bị trùng lặp hoặc dữ liệu không hợp lệ.'];
            }
            return ['success' => false, 'message' => 'Lỗi cơ sở dữ liệu khi tạo bài viết'];
        }
    }

    /**
     * Cập nhật bài viết
     * 
     * @param int $postId ID bài viết cần cập nhật
     * @param array $updateData Dữ liệu bài viết cần cập nhật
     * @return array Phản hồi với trạng thái thành công và thông báo
     */
    public function updatePost($postId, $updateData) {
        if (empty($updateData)) {
            return ['success' => true, 'message' => 'Không có trường nào được cung cấp để cập nhật.'];
        }
        // Validate dữ liệu đầu vào
        if (isset($updateData['title']) && mb_strlen($updateData['title']) > 100) {
            return ['success' => false, 'message' => 'Tiêu đề tối đa 100 ký tự.'];
        }
        if (isset($updateData['tags'])) {
            $tags = is_string($updateData['tags']) ? json_decode($updateData['tags'], true) : $updateData['tags'];
            if (!is_array($tags)) $tags = [];
            if (count($tags) > 5) {
                return ['success' => false, 'message' => 'Chỉ cho phép tối đa 5 thẻ.'];
            }
            $updateData['tags'] = json_encode($tags);
        }
        if (isset($updateData['media'])) {
            $media = is_string($updateData['media']) ? json_decode($updateData['media'], true) : $updateData['media'];
            if (!is_array($media)) $media = [];
            $updateData['media'] = json_encode($media);
        }
        try {
            $setClauses = [];
            $params = [':id' => $postId];
            foreach ($updateData as $key => $value) {
                $setClauses[] = "$key = :$key";
                $params[":$key"] = $value;
            }
            $setSql = implode(', ', $setClauses);
            $stmt = $this->conn->prepare("
                UPDATE posts 
                SET $setSql, updated_at = NOW()
                WHERE id = :id
            ");
            foreach ($params as $key => $value) {
                $paramType = PDO::PARAM_STR;
                if (is_int($value)) {
                    $paramType = PDO::PARAM_INT;
                }
                $stmt->bindValue($key, $value, $paramType);
            }
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    return ['success' => true, 'message' => 'Bài viết đã được cập nhật thành công'];
                } else {
                    $checkStmt = $this->conn->prepare("SELECT id FROM posts WHERE id = :id");
                    $checkStmt->bindParam(':id', $postId, PDO::PARAM_INT);
                    $checkStmt->execute();
                    if ($checkStmt->fetch()) {
                        return ['success' => true, 'message' => 'Không phát hiện thay đổi hoặc bài viết đã được cập nhật.'];
                    } else {
                        return ['success' => false, 'message' => 'Không tìm thấy bài viết để cập nhật.'];
                    }
                }
            } else {
                return ['success' => false, 'message' => 'Không thể cập nhật bài viết'];
            }
        } catch (PDOException $e) {
            error_log('Lỗi khi cập nhật bài viết: ' . $e->getMessage());
            if ($e->getCode() == 23000) {
                return ['success' => false, 'message' => 'ID danh mục hoặc sản phẩm không hợp lệ để cập nhật.'];
            }
            return ['success' => false, 'message' => 'Lỗi cơ sở dữ liệu khi cập nhật bài viết'];
        }
    }

    /**
     * Xóa bài viết (xóa mềm bằng cách đặt status thành 'deleted')
     * 
     * @param int $postId ID bài viết cần xóa
     * @return array Phản hồi với trạng thái thành công và thông báo
     */
    public function deletePost($postId) {
        try {
            $stmt = $this->conn->prepare("
                UPDATE posts SET status = 'deleted', updated_at = NOW()
                WHERE id = :id
            ");
            $stmt->bindParam(':id', $postId, PDO::PARAM_INT);
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    return ['success' => true, 'message' => 'Bài viết đã được xóa thành công'];
                } else {
                    return ['success' => false, 'message' => 'Không tìm thấy bài viết hoặc đã bị xóa'];
                }
            } else {
                return ['success' => false, 'message' => 'Không thể xóa bài viết'];
            }
        } catch (PDOException $e) {
            error_log('Lỗi khi xóa bài viết: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Lỗi cơ sở dữ liệu khi xóa bài viết'];
        }
    }

    /**
     * Tăng số lượt xem cho bài viết
     * 
     * @param int $postId ID bài viết
     * @return bool True nếu thành công, false nếu thất bại
     */
    public function incrementViewCount($postId) {
        try {
            $stmt = $this->conn->prepare("
                UPDATE posts SET view_count = view_count + 1
                WHERE id = :id
            ");
            $stmt->bindParam(':id', $postId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Lỗi khi tăng số lượt xem: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Đếm số bài viết theo ID người dùng
     * 
     * @param int $userId ID người dùng
     * @return int Số lượng bài viết hoạt động của người dùng
     */
    public function countByUserId($userId) {
        try {
            $stmt = $this->conn->prepare("
                SELECT COUNT(*) 
                FROM posts 
                WHERE user_id = :user_id AND status = 'active'
            ");
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log('Lỗi khi đếm bài viết theo ID người dùng: ' . $e->getMessage());
            return 0; // Trả về 0 khi có lỗi
        }
    }

    /**
     * Xử lý đường dẫn ảnh - thêm prefix /public/ và đảm bảo extension đúng
     * 
     * @param array $imagePaths Mảng các đường dẫn ảnh từ database
     * @return array Mảng đường dẫn ảnh đã được xử lý
     */
    private function processImagePaths($imagePaths) {
        if (!is_array($imagePaths)) {
            return [];
        }

        $processedPaths = [];
        foreach ($imagePaths as $imagePath) {
            if (!is_string($imagePath) || empty($imagePath)) {
                continue;
            }

            // Thêm prefix /public/ nếu chưa có
            $fullPath = $imagePath;
            if (!str_starts_with($fullPath, '/public/')) {
                if (str_starts_with($fullPath, '/')) {
                    $fullPath = '/public' . $fullPath;
                } else {
                    $fullPath = '/public/' . $fullPath;
                }
            }

            // Kiểm tra file có tồn tại không với extension hiện tại
            $serverPath = $_SERVER['DOCUMENT_ROOT'] . $fullPath;
            if (file_exists($serverPath)) {
                $processedPaths[] = $fullPath;
                continue;
            }

            // Nếu file không tồn tại, thử thay đổi extension từ .jpg thành .png
            $pathInfo = pathinfo($fullPath);
            if (isset($pathInfo['extension']) && strtolower($pathInfo['extension']) === 'jpg') {
                $pngPath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '.png';
                $serverPngPath = $_SERVER['DOCUMENT_ROOT'] . $pngPath;
                
                if (file_exists($serverPngPath)) {
                    $processedPaths[] = $pngPath;
                    continue;
                }
            }

            // Nếu cả .jpg và .png đều không tồn tại, giữ nguyên đường dẫn gốc
            $processedPaths[] = $fullPath;
        }

        return $processedPaths;
    }
}
?>