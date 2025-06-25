<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start(); // <-- Start the session here

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $cookieToken = $_COOKIE['current_qr_code'] ?? '';

    // If no cookie, redirect to LDAP login
    if (!$cookieToken) {
        header("Location: /terminalserver/ldap.php");
        exit;
    }

    // Check if token matches any user
    $stmt = $db->prepare("SELECT username FROM users WHERE remember_token = ?");
    $stmt->execute([$cookieToken]);
    $matchedUser = $stmt->fetchColumn();

    if ($matchedUser) {
        // Set session username for guard file and app
        $_SESSION['username'] = $matchedUser;

        // Optionally fetch parking position for the user to restore session fully
        $stmt = $db->prepare("SELECT slot_id FROM parking_slots WHERE username = ?");
        $stmt->execute([$matchedUser]);
        $parkingPosition = $stmt->fetchColumn();

        if ($parkingPosition !== false) {
            $_SESSION['parking_position'] = $parkingPosition;
        }

        // Also update your key_value table (optional)
        $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('current_user', ?, CURRENT_TIMESTAMP)");
        $stmt->execute([$matchedUser]);

        $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('last_activity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
        $stmt->execute();

        header("Location: /terminalserver/success.html");
        exit;
    }

    // Cookie exists but no user found
    header("Location: /terminalserver/ldap.php");
    exit;

} catch (Exception $e) {
    // Optionally handle errors or redirect to error page
    error_log("Error in redirect.php: " . $e->getMessage());
    header("Location: /terminalserver/ldap.php");
    exit;
}
