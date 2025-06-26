<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config.php';

try {
    // Check for the remember token cookie
    if (!isset($_COOKIE['current_qr_code']) || empty($_COOKIE['current_qr_code'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'No remember_token (current_qr_code) provided.']);
        exit;
    }

    $rememberToken = $_COOKIE['current_qr_code'];

    // Connect to the database
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Step 1: Identify user from remember_token
    $stmt = $pdo->prepare("SELECT username FROM users WHERE remember_token = :token");
    $stmt->execute([':token' => $rememberToken]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Invalid remember_token.']);
        exit;
    }

    $username = $user['username'];

    // Step 2: Find the user's active charging slot
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

    // Step 3: Determine slot group range (e.g., 1–4, 5–8, etc.)
    $groupStart = (floor(($slotId - 1) / 4) * 4) + 1;
    $groupEnd = $groupStart + 3;

    // Step 4: Count actively charging cars in the same group
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM parking_slots WHERE slot_id BETWEEN :start AND :end AND status = 'charging'");
    $stmt->execute([':start' => $groupStart, ':end' => $groupEnd]);
    $chargingCount = (int)$stmt->fetchColumn();

    // Step 5: Calculate amperes per car from config value
    $amperesPerCar = $chargingCount > 0 ? floor(TERMINAL_TOTAL_AMPERES / $chargingCount) : 0;

    // Step 6: Update amperes in DB for this slot
    $stmt = $pdo->prepare("UPDATE parking_slots SET amperes = :amperes WHERE slot_id = :slot_id");
    $stmt->execute([
        ':amperes' => $amperesPerCar,
        ':slot_id' => $slotId
    ]);

    // Step 7: Calculate duration
    $now = time();
    $elapsedSeconds = $now - $startTime;
    $hours = floor($elapsedSeconds / 3600);
    $minutes = floor(($elapsedSeconds % 3600) / 60);

    // Step 8: Return successful result
    echo json_encode([
        'status' => 'charging',
        'slot_id' => $slotId,
        'since' => "{$hours}h {$minutes}min",
        'amperes' => $amperesPerCar
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Unexpected server error.', 'details' => $e->getMessage()]);
    exit;
}
