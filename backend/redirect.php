<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

require_once __DIR__ . '/config.php';

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $cookieToken = $_GET['code'] ?? ($_COOKIE['current_qr_code'] ?? '');

    // If blocking remote access, validate QR token
    if (defined('BLOCK_REMOTE_ACCESS') && BLOCK_REMOTE_ACCESS === 1) {
        if (!$cookieToken) {
            http_response_code(403);
            echo "<h1>Access Denied</h1><p>Please scan the QR code at the terminal.</p>";
            exit;
        }

        // Get current and previous tokens
        $stmt = $db->query("SELECT key, value FROM key_value WHERE key IN ('current_qr_code', 'previous_qr_code')");
        $validTokens = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $validTokens[] = $row['value'];
        }

        if (!in_array($cookieToken, $validTokens, true)) {
            http_response_code(403);
            echo "<h1>Access Denied</h1><p>Please scan the QR code at the terminal.</p>";
            exit;
        }
    }

    // Check if token maps to a user
    $stmt = $db->prepare("SELECT username FROM users WHERE remember_token = ?");
    $stmt->execute([$cookieToken]);
    $matchedUser = $stmt->fetchColumn();

    if ($matchedUser) {
        $_SESSION['username'] = $matchedUser;

        // Restore parking position if available
        $stmt = $db->prepare("SELECT slot_id FROM parking_slots WHERE username = ?");
        $stmt->execute([$matchedUser]);
        $parkingPosition = $stmt->fetchColumn();

        if ($parkingPosition !== false) {
            $_SESSION['parking_position'] = $parkingPosition;
        }

        // Optional: Log active user
        $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('current_user', ?, CURRENT_TIMESTAMP)");
        $stmt->execute([$matchedUser]);

        $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('last_activity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
        $stmt->execute();

        header("Location: /charging");
        exit;
    }

    // Token is valid but no matching user → redirect to login
    header("Location: /login");
    exit;

} catch (Exception $e) {
    error_log("Error in redirect.php: " . $e->getMessage());
    // On any exception, redirect to login
    header("Location: /login");
    exit;
}
