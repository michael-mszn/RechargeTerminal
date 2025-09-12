<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // --- Find current user ---
    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_user'");
    $stmt->execute();
    $username = $stmt->fetchColumn();

    if (!$username) {
        echo json_encode(['success' => false, 'error' => 'No user logged in']);
        exit;
    }

    // --- Find active parking slot for this user ---
    $stmt = $db->prepare("SELECT slot_id FROM parking_slots WHERE username = :username LIMIT 1");
    $stmt->execute([':username' => $username]);
    $slotId = $stmt->fetchColumn();

    if (!$slotId) {
        echo json_encode(['success' => false, 'error' => 'No active slot for this user']);
        exit;
    }

    // --- Read desired status from frontend ---
    $input = json_decode(file_get_contents('php://input'), true);
    $status = $input['status'] ?? null;

    $allowed = ['empty', 'charging', 'auth_required', 'error', 'fully_charged'];
    if (!$status || !in_array($status, $allowed, true)) {
        echo json_encode(['success' => false, 'error' => 'Invalid or missing status']);
        exit;
    }

    // --- Update slot status ---
    $stmt = $db->prepare("UPDATE parking_slots SET status = :status WHERE slot_id = :slot_id");
    $stmt->execute([
        ':status' => $status,
        ':slot_id' => $slotId
    ]);

    echo json_encode(['success' => true, 'status' => $status, 'slot_id' => $slotId]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
