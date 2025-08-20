<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/update-amperes.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Get POST JSON
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['niceness'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing niceness value.']);
    exit;
}
$niceness = floatval($input['niceness']); // 0–0.5

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

// Get user
$stmt = $pdo->prepare("SELECT username FROM users WHERE remember_token = :token");
$stmt->execute([':token' => $rememberToken]);
$username = $stmt->fetchColumn();
if (!$username) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Invalid remember_token.']);
    exit;
}

// Get user's charging slot
$stmt = $pdo->prepare("SELECT slot_id FROM parking_slots WHERE username = :username AND status = 'charging'");
$stmt->execute([':username' => $username]);
$slotId = $stmt->fetchColumn();
if (!$slotId) {
    echo json_encode(['status' => 'error', 'message' => 'No active charging session.']);
    exit;
}

// Update niceness
$updateStmt = $pdo->prepare("UPDATE parking_slots SET niceness = :niceness WHERE slot_id = :slot_id");
$updateStmt->execute([':niceness' => $niceness, ':slot_id' => $slotId]);

// Recalculate amperes for this group
recalculateAmperes($pdo, intval($slotId));

echo json_encode(['status' => 'ok', 'message' => 'Niceness updated.']);
