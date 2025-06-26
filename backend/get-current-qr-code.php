<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_qr_code' LIMIT 1");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$result || !isset($result['value'])) {
        echo json_encode(['error' => 'QR code not found']);
        exit;
    }

    $token = $result['value'];
    $fullUrl = "https://10.127.0.38/terminalserver/redirect.php?code=" . urlencode($token);

    echo json_encode([
        'current_qr_code' => $fullUrl
    ]);
} catch (Exception $e) {
    error_log("QR fetch error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    exit;
}
