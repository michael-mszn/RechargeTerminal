<?php
require_once 'auto-disconnect.php';
require_once 'require-valid-position.php';

$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Get current user
$stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_user'");
$stmt->execute();
$username = $stmt->fetchColumn();

if ($username) {
    // Increment counter
    $stmt = $db->prepare("UPDATE users SET counter = counter + 1, last_login = CURRENT_TIMESTAMP WHERE username = ?");
    $stmt->execute([$username]);

    // Get updated counter
    $stmt = $db->prepare("SELECT counter FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $counter = $stmt->fetchColumn();

    echo json_encode(['status' => 'success', 'counter' => $counter]);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Timeout. Scanne den QR code erneut']);
}
?>
