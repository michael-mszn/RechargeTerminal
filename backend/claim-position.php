<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
session_start();

try {
    if (!isset($_SESSION['username'])) {
        throw new Exception("Nicht angemeldet.");
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['position']) || !is_numeric($input['position'])) {
        throw new Exception("Ungültige Positionsnummer.");
    }

    $position = (int)$input['position'];
    $username = $_SESSION['username'];

    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->beginTransaction();

    // Check if the slot is still free
    $stmt = $pdo->prepare("SELECT status FROM parking_slots WHERE slot_id = :position");
    $stmt->execute([':position' => $position]);
    $status = $stmt->fetchColumn();

    if ($status !== 'empty') {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Position bereits belegt.']);
        exit;
    }

    $update = $pdo->prepare("UPDATE parking_slots SET status = 'auth_required', username = :username WHERE slot_id = :position");
    $update->execute([
        ':username' => $username,
        ':position' => $position
    ]);

    $pdo->commit();
    $_SESSION['parking_position'] = $position;
    echo json_encode(['status' => 'ok', 'message' => 'Position erfolgreich reserviert.']);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
