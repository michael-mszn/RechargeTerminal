<?php
//require_once 'auto-disconnect.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch current_user (username)
    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_user'");
    $stmt->execute();
    $username = $stmt->fetchColumn();

    if ($username) {
        // Fetch the name from users table
        $stmt = $db->prepare("SELECT name FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $name = $stmt->fetchColumn();
    }

    echo json_encode(['name' => $name ?? null]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}