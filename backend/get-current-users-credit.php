<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

if (!isset($_GET['user'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user']);
    exit;
}

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT credit FROM users WHERE remember_token = ?");
    $stmt->execute([$_GET['user']]);
    $credit = $stmt->fetchColumn();

    if ($credit !== false) {
        echo json_encode(['balance' => (float)$credit]);
    } else {
        echo json_encode(['balance' => 0.0]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
}
?>
