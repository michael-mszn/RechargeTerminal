<?php
require_once 'auto-disconnect.php';

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
        // Fetch name and surname from users table
        $stmt = $db->prepare("SELECT name, surname FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $fullName = trim(($row['name'] ?? '') . ' ' . ($row['surname'] ?? ''));
        }
    }

    echo json_encode(['fullName' => $fullName ?? null]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
