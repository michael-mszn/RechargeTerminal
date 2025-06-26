<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not connect to database.']);
    exit;
}

// Allowed status values
$allowedStatuses = ['empty', 'charging', 'auth_required', 'error', 'fully_charged'];

// Get POST values
$slotId = isset($_POST['slot_id']) ? intval($_POST['slot_id']) : null;
$status = isset($_POST['status']) ? $_POST['status'] : null;

// Validate slot_id
if (!$slotId || $slotId < 1 || $slotId > 16) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid slot_id. Must be between 1 and 16.']);
    exit;
}

// Validate status
if (!in_array($status, $allowedStatuses)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid status value.']);
    exit;
}

try {
    if ($status === 'charging') {
        // Set charging_start_time to now
        $stmt = $pdo->prepare("UPDATE parking_slots SET status = :status, charging_start_time = datetime('now') WHERE slot_id = :slot_id");
    } else {
        // Clear charging_start_time
        $stmt = $pdo->prepare("UPDATE parking_slots SET status = :status, charging_start_time = NULL WHERE slot_id = :slot_id");
    }

    $stmt->execute([
        ':status' => $status,
        ':slot_id' => $slotId
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => "Slot $slotId updated to '$status'."]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No update made. Slot may not exist.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error.', 'details' => $e->getMessage()]);
}
