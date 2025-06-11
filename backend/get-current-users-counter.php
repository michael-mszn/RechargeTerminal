<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

if (!isset($_GET['user'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user']);
    exit;
}

$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->prepare("SELECT counter FROM users WHERE username = ?");
$stmt->execute([$_GET['user']]);
$counter = $stmt->fetchColumn();

if ($counter !== false) {
    echo json_encode(['counter' => $counter]);
} else {
    echo json_encode(['counter' => 0]);
}
?>