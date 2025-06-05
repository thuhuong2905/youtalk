<?php
// debug_api.php - Place this in your /src/api/ directory
// Access via: http://localhost:3000/src/api/debug_api.php

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>API Debug Information</h2>";

// Test 1: Check if api_utils.php can be loaded
echo "<h3>1. Testing /src/api_utils.php</h3>";
try {
    if (file_exists('/src/core/api_utils.php')) {
        echo "✓ api_utils.php exists<br>";
        include_once '/src/core/api_utils.php';
        echo "✓ api_utils.php loaded successfully<br>";
        
        // Test sendResponse function
        if (function_exists('sendResponse')) {
            echo "✓ sendResponse function available<br>";
        } else {
            echo "✗ sendResponse function not found<br>";
        }
    } else {
        echo "✗ api_utils.php not found<br>";
    }
} catch (Exception $e) {
    echo "✗ Error loading api_utils.php: " . $e->getMessage() . "<br>";
}

// Test 2: Check if other required files exist
echo "<h3>2. Checking API Files</h3>";
$api_files = ['products.php', 'auth.php', 'reviews.php', 'posts.php'];
foreach ($api_files as $file) {
    if (file_exists($file)) {
        echo "✓ $file exists<br>";
    } else {
        echo "✗ $file not found<br>";
    }
}

// Test 3: Check database config
echo "<h3>3. Testing Database Connection</h3>";
$db_files = ['config.php', 'database.php', '../config/database.php', '../includes/config.php'];
$db_found = false;

foreach ($db_files as $file) {
    if (file_exists($file)) {
        echo "✓ Found potential DB config: $file<br>";
        $db_found = true;
        
        try {
            include_once $file;
            echo "✓ $file loaded successfully<br>";
        } catch (Exception $e) {
            echo "✗ Error loading $file: " . $e->getMessage() . "<br>";
        }
        break;
    }
}

if (!$db_found) {
    echo "✗ No database config file found<br>";
}

// Test 4: Test specific API endpoints
echo "<h3>4. Testing API Endpoints (Basic Syntax Check)</h3>";

$endpoints = [
    'products.php' => '?action=get_categories',
    'auth.php' => '?action=status',
    'reviews.php' => '?action=get_by_product',
    'posts.php' => '?action=get_recent&limit=5'
];

foreach ($endpoints as $file => $params) {
    echo "<h4>Testing $file$params</h4>";
    
    if (!file_exists($file)) {
        echo "✗ File not found<br>";
        continue;
    }
    
    // Test syntax by parsing the file
    $syntax_check = shell_exec("php -l $file 2>&1");
    if (strpos($syntax_check, 'No syntax errors') !== false) {
        echo "✓ Syntax OK<br>";
    } else {
        echo "✗ Syntax Error:<br><pre>$syntax_check</pre>";
    }
    
    // Try to include and catch errors
    ob_start();
    try {
        $_GET = [];
        parse_str(ltrim($params, '?'), $_GET);
        
        // Capture any output/errors
        include $file;
        $output = ob_get_contents();
        
        if (!empty($output)) {
            // Check if output is JSON
            $json = json_decode($output, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                echo "✓ Returns valid JSON<br>";
                if (isset($json['success'])) {
                    echo "Response: " . ($json['success'] ? 'Success' : 'Error: ' . ($json['message'] ?? 'Unknown')) . "<br>";
                }
            } else {
                echo "✗ Output is not valid JSON:<br><pre>" . htmlspecialchars(substr($output, 0, 200)) . "</pre>";
            }
        }
        
    } catch (Exception $e) {
        echo "✗ Runtime Error: " . $e->getMessage() . "<br>";
    } catch (Error $e) {
        echo "✗ Fatal Error: " . $e->getMessage() . "<br>";
    }
    ob_end_clean();
    
    echo "<hr>";
}

// Test 5: Environment Info
echo "<h3>5. Environment Information</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Server: " . $_SERVER['SERVER_SOFTWARE'] . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Current Directory: " . __DIR__ . "<br>";
echo "Include Path: " . get_include_path() . "<br>";

// Test 6: Check for common issues
echo "<h3>6. Common Issues Check</h3>";

// Check if short tags are enabled
if (ini_get('short_open_tag')) {
    echo "⚠️ Short open tags enabled (may cause issues)<br>";
} else {
    echo "✓ Short open tags disabled<br>";
}

// Check if output buffering is on
if (ob_get_level() > 0) {
    echo "⚠️ Output buffering is active (level: " . ob_get_level() . ")<br>";
} else {
    echo "✓ No output buffering<br>";
}

// Check memory limit
echo "Memory Limit: " . ini_get('memory_limit') . "<br>";
echo "Max Execution Time: " . ini_get('max_execution_time') . "s<br>";

echo "<h3>Debug Complete</h3>";
echo "If you see any ✗ errors above, those need to be fixed first.";
?>