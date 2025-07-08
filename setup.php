<!DOCTYPE html>
<html>
<head>
    <title>YouTalk - Setup</title>
</head>
<body>
    <!-- Manual setup when auto setup fails -->
    <!-- Created: 2025-06-08 13:50:07 by robmar364 -->
    
    <h1>YouTalk - Setup Database</h1>
    
    <?php if (isset($_GET['error'])): ?>
        <p style="color: red;">Lỗi: <?= htmlspecialchars($_GET['error']) ?></p>
    <?php endif; ?>
    
    <p>Kiểm tra database youtalk_db...</p>
    
    <?php
    // Thử setup thủ công
    if (isset($_GET['setup'])) {
        try {
            require_once 'src/core/database_initializer.php';
            $init = new DatabaseInitializer();
            
            if (!$init->databaseExists()) {
                $init->createEverything();
                echo '<p style="color: green;">✓ Đã tạo database youtalk_db thành công!</p>';
            } else {
                echo '<p style="color: blue;">ℹ Database youtalk_db đã tồn tại!</p>';
            }
            
            echo '<p><a href="public/index.html">Vào trang chủ</a></p>';
            
        } catch (Exception $e) {
            echo '<p style="color: red;">✗ Lỗi: ' . $e->getMessage() . '</p>';
        }
    }
    ?>
    
    <p>
        <a href="?setup=1">Tạo Database</a> | 
        <a href="auto_setup.php">Thử lại Auto Setup</a>
    </p>
</body>
</html>