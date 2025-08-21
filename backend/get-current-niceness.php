<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (!isset($_COOKIE['current_qr_code']) || empty($_COOKIE['current_qr_code'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'No remember_token provided.']);
    exit;
}

$rememberToken = $_COOKIE['current_qr_code'];

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

// 1. Get the user based on remember_token
$stmt = $pdo->prepare("SELECT username FROM users WHERE remember_token = :token");
$stmt->execute([':token' => $rememberToken]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Invalid remember_token.']);
    exit;
}

$username = $user['username'];

// 2. Get user's slot with niceness
$stmt = $pdo->prepare("SELECT slot_id, niceness
                       FROM parking_slots
                       WHERE username = :username
                       ORDER BY slot_id ASC
                       LIMIT 1");
$stmt->execute([':username' => $username]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    echo json_encode(['status' => 'not_found', 'message' => 'No slot found for this user.']);
    exit;
}

$slotId = (int)$row['slot_id'];
$niceness = (float)$row['niceness'];

// 3. Respond
echo json_encode([
    'status' => 'success',
    'slot_id' => $slotId,
    'username' => $username,
    'niceness' => $niceness
]);
