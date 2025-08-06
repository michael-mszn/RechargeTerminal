<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Method Not Allowed";
    exit;
}

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // If user session exists and parking position set, free the slot
    if (isset($_SESSION['username'], $_SESSION['parking_position'])) {
        $username = $_SESSION['username'];
        $slot_id = $_SESSION['parking_position'];

        // Clear the slot: set username=NULL, status='empty'
        $stmt = $db->prepare("UPDATE parking_slots SET username = NULL, status = 'empty' WHERE slot_id = ?");
        $stmt->execute([$slot_id]);

        // Optionally unset session parking position
        unset($_SESSION['parking_position']);
    }

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

    // Clear all session data and destroy session
    $_SESSION = [];
    session_destroy();

    // Expire the cookie on client side
    setcookie('current_qr_code', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    // Redirect to login
    header('Location: /ldap.php');
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo "Server error during logout.";
    exit;
}
