<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_SESSION['username'])) {
    echo json_encode(['position' => null]);
    exit;
}

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT slot_id AS position FROM parking_slots WHERE username = ?");
    $stmt->execute([$_SESSION['username']]);
    $position = $stmt->fetchColumn();

    echo json_encode(['position' => $position ?: null]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}