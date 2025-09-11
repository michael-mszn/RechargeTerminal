<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['reply']) || empty(trim($data['reply']))) {
        echo json_encode(['status' => 'error', 'message' => 'Missing reply']);
        exit;
    }

    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("INSERT INTO key_value (`key`, `value`) VALUES ('chatgpt_reply', :value)
                          ON CONFLICT(`key`) DO UPDATE SET `value` = :value");
    $stmt->execute(['value' => $data['reply']]);

    echo json_encode(['status' => 'ok']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'details' => $e->getMessage()
    ]);
}
?>
