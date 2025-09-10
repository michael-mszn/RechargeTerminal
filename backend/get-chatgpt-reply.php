<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch reply
    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'chatgpt_reply'");
    $stmt->execute();
    $reply = $stmt->fetchColumn();

    if ($reply) {
        // Consume reply immediately after reading
        $delete = $db->prepare("DELETE FROM key_value WHERE key = 'chatgpt_reply'");
        $delete->execute();

        echo json_encode(['reply' => $reply]);
    } else {
        echo json_encode(['reply' => '']);
    }

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
