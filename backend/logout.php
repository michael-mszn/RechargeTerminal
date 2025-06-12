<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Method Not Allowed";
    exit;
}

$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Clear 'current_user' key (active session)
$stmt = $db->prepare("DELETE FROM key_value WHERE key = 'current_user'");
$stmt->execute();

// Get token from cookie
$token = $_COOKIE['current_qr_code'] ?? null;

if ($token) {
    // Clear token in users table
    $stmt = $db->prepare("UPDATE users SET remember_token = NULL WHERE remember_token = ?");
    $stmt->execute([$token]);
}

// Expire the cookie on client side
setcookie('current_qr_code', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax'
]);

// Redirect to login
header('Location: /terminalserver/ldap.php');
exit;
