<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // --- Find current user ---
    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_user'");
    $stmt->execute();
    $username = $stmt->fetchColumn();

    if (!$username) {
        echo json_encode(['success' => false, 'error' => 'No user logged in']);
        exit;
    }

    // --- Load timer state ---
    $stmt = $db->prepare("SELECT timer_end, timer_active FROM users WHERE username = :username");
    $stmt->execute([':username' => $username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'timer_end' => $row['timer_end'],
        'timer_active' => (bool)$row['timer_active']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
