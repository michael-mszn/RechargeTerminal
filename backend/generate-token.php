<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Allow requests from Vite frontend
//header('Access-Control-Allow-Origin: http://localhost:5173');
header("Access-Control-Allow-Origin: *");

// Allow additional headers/methods (optional)
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

//Windows / Linux respectively
//$db = new PDO('sqlite:./tokens.db');
$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');

$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Get last update time for current_qr_code
$stmt = $db->prepare("SELECT updated_at FROM key_value WHERE key = 'current_qr_code'");
$stmt->execute();
$lastUpdated = $stmt->fetchColumn();

// Determine if it's time to rotate (every 60 seconds)
$shouldRotate = true;
if ($lastUpdated) {
    $lastTimestamp = strtotime($lastUpdated);
    $shouldRotate = (time() - $lastTimestamp) >= 60;
}

if ($shouldRotate) {
    // Move current → previous
    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_qr_code'");
    $stmt->execute();
    $currentToken = $stmt->fetchColumn();

    if ($currentToken) {
        $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('previous_qr_code', ?, CURRENT_TIMESTAMP)");
        $stmt->execute([$currentToken]);
    }

    // Create new token
    $newToken = bin2hex(random_bytes(8));
    $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('current_qr_code', ?, CURRENT_TIMESTAMP)");
    $stmt->execute([$newToken]);
}

// Return current QR token
$stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_qr_code'");
$stmt->execute();
$current = $stmt->fetchColumn();


// Return JSON response
header('Content-Type: application/json');
echo json_encode(['token' => $current]);
?>
