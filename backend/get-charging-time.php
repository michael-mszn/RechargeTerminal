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
$stmt = $pdo->prepare("SELECT slot_id, charging_start_time FROM parking_slots WHERE username = :username AND status = 'charging'");
$stmt->execute([':username' => $username]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row['charging_start_time'])) {
    echo json_encode(['status' => 'not_charging', 'message' => 'No active charging session found.']);
    exit;
}

$slotId = (int)$row['slot_id'];
$startTime = strtotime($row['charging_start_time']);
if (!$startTime) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid charging_start_time format.']);
    exit;
}

// 3. Determine group range (every 4 slots share one terminal)
$groupStart = (floor(($slotId - 1) / 4) * 4) + 1;
$groupEnd = $groupStart + 3;

// 4. Get charging cars in the group
$stmt = $pdo->prepare("SELECT slot_id FROM parking_slots WHERE slot_id BETWEEN :start AND :end AND status = 'charging'");
$stmt->execute([':start' => $groupStart, ':end' => $groupEnd]);
$chargingSlots = $stmt->fetchAll(PDO::FETCH_COLUMN);

$chargingCount = count($chargingSlots);
$amperesPerCar = $chargingCount > 0 ? floor(TERMINAL_TOTAL_AMPERES / $chargingCount) : 0;

// 5. Update amperes for all cars charging in this group
if ($chargingCount > 0) {
    $updateStmt = $pdo->prepare("UPDATE parking_slots SET amperes = :amp WHERE slot_id = :slot_id");
    foreach ($chargingSlots as $sId) {
        $updateStmt->execute([
            ':amp' => $amperesPerCar,
            ':slot_id' => $sId
        ]);
    }
}

// 6. Format charging time
$now = time();
$elapsedSeconds = $now - $startTime;
$hours = floor($elapsedSeconds / 3600);
$minutes = floor(($elapsedSeconds % 3600) / 60);

// 7. Respond
echo json_encode([
    'status' => 'charging',
    'slot_id' => $slotId,
    'since' => "{$hours}h {$minutes}min",
    'amperes' => $amperesPerCar
]);
