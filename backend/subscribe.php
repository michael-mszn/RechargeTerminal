<?php
// subscribe.php
require 'config.php';

$subscription = json_decode(file_get_contents('php://input'), true);

// Store to file for simplicity (use DB in production)
file_put_contents('subscriptions.json', json_encode($subscription) . PHP_EOL, FILE_APPEND);

echo json_encode(['success' => true]);
