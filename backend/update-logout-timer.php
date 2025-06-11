<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');

$db->exec("UPDATE key_value SET value = CURRENT_TIMESTAMP WHERE key = 'last_activity'");
echo json_encode(["status" => "updated"]);

