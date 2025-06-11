<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

//Windows / Linux respectively
//$pdo = new PDO('sqlite:./tokens.db');
$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');

// Get token from query
$token = $_GET['token'] ?? '';

if (!$token) {
  echo json_encode(['valid' => false]);
  exit;
}

// Fetch current and previous tokens
$stmt = $pdo->query("SELECT key, value FROM key_value WHERE key IN ('current_qr_code', 'previous_qr_code')");
$tokens = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $tokens[$row['key']] = $row['value'];
}

if (in_array($token, $tokens)) {
    echo json_encode(['valid' => true, 'token' => $token]);
} else {
    echo json_encode(['valid' => false]);
}