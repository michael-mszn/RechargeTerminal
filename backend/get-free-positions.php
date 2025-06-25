<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT slot_id FROM parking_slots WHERE status = 'empty' ORDER BY slot_id ASC");
    $stmt->execute();
    $free_positions = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'free_positions' => $free_positions
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'details' => $e->getMessage()
    ]);
}
?>
