<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_COOKIE['current_qr_code']) || empty($_COOKIE['current_qr_code'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No remember_token provided.']);
    exit;
}

$rememberToken = $_COOKIE['current_qr_code'];

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed.']);
    exit;
}

// Get the username associated with the token
$stmt = $pdo->prepare("SELECT username FROM users WHERE remember_token = :token");
$stmt->execute([':token' => $rememberToken]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid remember_token.']);
    exit;
}

$username = $user['username'];

// Get the charging slot for this user
$stmt = $pdo->prepare("SELECT slot_id, charging_start_time FROM parking_slots WHERE username = :username AND status = 'charging'");
$stmt->execute([':username' => $username]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row['charging_start_time'])) {
    echo json_encode(['status' => 'not_charging', 'message' => 'No active charging session found.']);
    exit;
}

$startTime = strtotime($row['charging_start_time']);
if (!$startTime) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid start time format.']);
    exit;
}

$now = time();
$diffSeconds = $now - $startTime;
$hours = floor($diffSeconds / 3600);
$minutes = floor(($diffSeconds % 3600) / 60);

echo json_encode([
    'status' => 'charging',
    'slot_id' => $row['slot_id'],
    'since' => "{$hours}h {$minutes}min"
]);
