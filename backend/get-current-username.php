<?php
require_once 'auto-disconnect.php';

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");
try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_user'");
    $stmt->execute();
    $username = $stmt->fetchColumn();

    echo json_encode(['username' => $username ?: null]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}