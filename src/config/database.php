<?php
// Định nghĩa các hằng số cho thông tin kết nối cơ sở dữ liệu
define('DB_HOST', 'localhost'); // Địa chỉ máy chủ MySQL
define('DB_NAME', 'youtalk_db'); // Tên cơ sở dữ liệu
define('DB_USER', 'root'); // Tên người dùng MySQL - Thay đổi nếu sử dụng tên khác
define('DB_PASS', ''); // Mật khẩu MySQL - Thay đổi nếu đã đặt mật khẩu
define('DB_CHARSET', 'utf8mb4'); // Bộ ký tự khuyến nghị cho cơ sở dữ liệu

// Lớp Database để quản lý kết nối tới cơ sở dữ liệu MySQL
class Database {
    private $conn; // Biến lưu trữ kết nối PDO
    
    // Hàm lấy kết nối tới cơ sở dữ liệu
    public function getConnection() {
        // Khởi tạo biến kết nối là null
        $this->conn = null;
        
        try {
            // Tạo kết nối PDO sử dụng các hằng số đã định nghĩa
            $this->conn = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
                DB_USER,
                DB_PASS
            );
            // Cấu hình PDO để báo lỗi chi tiết khi có vấn đề
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            // In ra thông báo lỗi nếu kết nối thất bại
            echo "Lỗi kết nối: " . $exception->getMessage();
        }
        
        // Trả về đối tượng kết nối
        return $this->conn;
    }
}
?>
