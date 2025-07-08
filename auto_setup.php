<?php
// Tự động tạo database youtalk_db

error_reporting(0);
require_once 'src/core/database_initializer.php';

try {
    $init = new DatabaseInitializer();
    
    // Kiểm tra database youtalk_db có tồn tại chưa
    if (!$init->databaseExists()) {
        // Chưa có -> tạo database + bảng + dữ liệu mẫu
        $init->createEverything();
    }
    
    // Chuyển đến trang chủ
    header('Location: public/index.html');
    
} catch (Exception $e) {
    header('Location: setup.php?error=' . $e->getMessage());
}
?>