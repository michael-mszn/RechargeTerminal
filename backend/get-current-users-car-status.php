<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 1. Check for the remember_token cookie
if (!isset($_COOKIE['current_qr_code']) || empty($_COOKIE['current_qr_code'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'No remember_token provided.']);
    exit;
}

$rememberToken = $_COOKIE['current_qr_code'];

// 2. Connect to the database
try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

// 3. Get the user by remember_token
$stmt = $pdo->prepare("SELECT username FROM users WHERE remember_token = :token");
$stmt->execute([':token' => $rememberToken]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Invalid remember_token.']);
    exit;
}

$username = $user['username'];

// 4. Get the user's parking slot status
$stmt = $pdo->prepare("SELECT slot_id, status, charging_start_time, amperes
                       FROM parking_slots
                       WHERE username = :username
                       ORDER BY slot_id ASC
                       LIMIT 1");
$stmt->execute([':username' => $username]);
$slot = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$slot) {
    echo json_encode(['status' => 'no_slot', 'message' => 'User has no parking slot assigned.']);
    exit;
}

// 5. Build response dynamically based on status
$response = [
    'status' => $slot['status'],
    'slot_id' => (int)$slot['slot_id'],
];

if ($slot['status'] === 'charging') {
    $response['since'] = $slot['charging_start_time'] ?? null;
    $response['amperes'] = isset($slot['amperes']) ? (int)$slot['amperes'] : null;
}

echo json_encode($response);
