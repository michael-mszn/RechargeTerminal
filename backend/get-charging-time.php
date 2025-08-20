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

// 2. Get user's charging slot
$stmt = $pdo->prepare("SELECT slot_id, charging_start_time, amperes
                       FROM parking_slots
                       WHERE username = :username AND status = 'charging'");
$stmt->execute([':username' => $username]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row['charging_start_time'])) {
    echo json_encode(['status' => 'not_charging', 'message' => 'No active charging session found.']);
    exit;
}

$slotId = (int)$row['slot_id'];
$amperes = (int)$row['amperes'];

$startTime = strtotime($row['charging_start_time']);
if (!$startTime) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid charging_start_time format.']);
    exit;
}

// 3. Format charging time
$now = time();
$elapsedSeconds = $now - $startTime;
$hours = floor($elapsedSeconds / 3600);
$minutes = floor(($elapsedSeconds % 3600) / 60);

// 4. Respond
echo json_encode([
    'status' => 'charging',
    'slot_id' => $slotId,
    'since' => "{$hours}h {$minutes}min",
    'amperes' => $amperes
]);
