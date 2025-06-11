<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Check if force refresh requested
$forceRotate = isset($_GET['force']) && $_GET['force'] == '1';

// Check if rotation is due
$shouldRotate = $forceRotate;

if (!$forceRotate) {
    $stmt = $db->prepare("SELECT updated_at FROM key_value WHERE key = 'current_qr_code'");
    $stmt->execute();
    $lastUpdated = $stmt->fetchColumn();

    if ($lastUpdated) {
        $lastTimestamp = strtotime($lastUpdated);
        $shouldRotate = (time() - $lastTimestamp) >= 60;
    } else {
        $shouldRotate = true;
    }
}

if ($shouldRotate) {
    // Save old token
    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_qr_code'");
    $stmt->execute();
    $currentToken = $stmt->fetchColumn();

    if ($currentToken) {
        $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('previous_qr_code', ?, CURRENT_TIMESTAMP)");
        $stmt->execute([$currentToken]);
    }

    // Generate new token
    $newToken = bin2hex(random_bytes(8));
    $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('current_qr_code', ?, CURRENT_TIMESTAMP)");
    $stmt->execute([$newToken]);
}

// Return token
$stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_qr_code'");
$stmt->execute();
$current = $stmt->fetchColumn();

header('Content-Type: application/json');
echo json_encode(['token' => $current]);
?>
