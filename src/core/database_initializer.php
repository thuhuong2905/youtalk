<?php

require_once __DIR__ . '/../config/database.php';

class DatabaseInitializer {
    private $pdo;

    public function __construct() {
        // Kết nối MySQL không chỉ định database để kiểm tra
        $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
        $this->pdo = new PDO($dsn, DB_USER, DB_PASS);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    // Kiểm tra database youtalk_db có tồn tại không
    public function databaseExists() {
        $stmt = $this->pdo->query("SHOW DATABASES LIKE 'youtalk_db'");
        return $stmt->rowCount() > 0;
    }

    // Tạo database + bảng + dữ liệu mẫu
    public function createEverything() {
        // Bước 1: Tạo database youtalk_db
        $this->pdo->exec("CREATE DATABASE youtalk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        
        // Bước 2: Chọn database vừa tạo
        $this->pdo->exec("USE youtalk_db");
        
        // Bước 3: Tạo bảng từ file SQL
        $this->runSQLFile(__DIR__ . '/../create_table.sql');
        
        // Bước 4: Nhập dữ liệu mẫu từ file SQL
        $this->runSQLFile(__DIR__ . '/../sample_data.sql');
    }

    // Thực thi file SQL
    private function runSQLFile($file) {
        $sql = file_get_contents($file);
        
        // Tách các câu lệnh SQL bằng dấu ;
        $statements = explode(';', $sql);
        
        foreach ($statements as $stmt) {
            $stmt = trim($stmt);
            if (!empty($stmt)) {
                $this->pdo->exec($stmt);
            }
        }
    }
}
?>