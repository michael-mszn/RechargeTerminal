<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec("PRAGMA busy_timeout = 5000");

    // Fetch current user
    $current_user = $db->query("SELECT value FROM key_value WHERE key = 'current_user'")->fetchColumn();

    // Fetch last activity timestamp
    $stmt = $db->prepare("SELECT updated_at FROM key_value WHERE key = 'last_activity'");
    $stmt->execute();
    $last_time = $stmt->fetchColumn();

    if ($current_user && $last_time) {
        $last_ts = strtotime($last_time);
        $now = time();

        if (($now - $last_ts) > 300) {
            // Timeout reached
            $db->beginTransaction();
            $db->exec("UPDATE key_value SET value = null WHERE key = 'current_user'");
            $db->exec("UPDATE key_value SET value = null WHERE key = 'last_activity'");
            $db->commit();

            http_response_code(401);
            echo json_encode(["error" => "Session expired"]);
            $db = null;
            exit;
        }
    }

    $db = null; // Release the connection
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}