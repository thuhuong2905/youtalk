<?php
// Core Database Connection Logic

require_once __DIR__ . '/../config/database.php';

/**
 * Establishes and returns a PDO database connection.
 * Uses a static variable to ensure only one connection is made per request (Singleton pattern).
 *
 * @return PDO The PDO database connection object.
 * @throws PDOException If the connection fails.
 */
function getDbConnection(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,    // Fetch results as associative arrays
            PDO::ATTR_EMULATE_PREPARES   => false,               // Use native prepared statements
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // In a real application, log this error securely instead of echoing
            error_log('Database Connection Error: ' . $e->getMessage());
            // Throwing the exception allows calling scripts to handle it, 
            // potentially returning a JSON error to the frontend.
            throw $e; 
        }
    }

    return $pdo;
}
?>
