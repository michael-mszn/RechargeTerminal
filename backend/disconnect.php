<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');

// A disconnect occurs when the current user key is set to null
$stmt = $db->prepare("UPDATE key_value SET value = NULL, updated_at = CURRENT_TIMESTAMP WHERE key = 'current_user'");
$stmt->execute();

echo json_encode(["status" => "success"]);