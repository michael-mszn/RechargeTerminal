<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'chatgpt_reply'");
    $stmt->execute();
    $reply = $stmt->fetchColumn();

    echo json_encode(['reply' => $reply ?: '']);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

//"Consumes" the reply
//$reply = $stmt->fetchColumn();
//if ($reply) {
//    $delete = $db->prepare("DELETE FROM key_value WHERE key = 'chatgpt_reply'");
//    $delete->execute();
//}