<?php
// Kết nối cơ sở dữ liệu cốt lõi

require_once __DIR__ . '/../config/database.php';

/**
 * Tạo và trả về kết nối PDO database
 */
function getDbConnection(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log('Lỗi kết nối cơ sở dữ liệu: ' . $e->getMessage());
            throw $e; 
        }
    }

    return $pdo;
}
?>
