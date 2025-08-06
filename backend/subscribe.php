<?php
require 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['remember_token'], $input['subscription'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

$remember_token = $input['remember_token'];
$subscription_json = json_encode($input['subscription']);

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Insert or update subscription for the user token
    $stmt = $pdo->prepare("REPLACE INTO push_subscriptions (remember_token, subscription_json, created_at) VALUES (:remember_token, :subscription_json, datetime('now'))");
    $stmt->execute([
        ':remember_token' => $remember_token,
        ':subscription_json' => $subscription_json,
    ]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
