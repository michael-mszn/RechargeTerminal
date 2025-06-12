<?php

function generateNewToken($forceRotate = false) {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (!$forceRotate) {
        $stmt = $db->prepare("SELECT updated_at FROM key_value WHERE key = 'current_qr_code'");
        $stmt->execute();
        $lastUpdated = $stmt->fetchColumn();

        if ($lastUpdated) {
            $lastTimestamp = strtotime($lastUpdated);
            $shouldRotate = (time() - $lastTimestamp) >= 60;
        } else {
            $shouldRotate = true;
        }
    } else {
        $shouldRotate = true;
    }

    if ($shouldRotate) {
        $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_qr_code'");
        $stmt->execute();
        $currentToken = $stmt->fetchColumn();

        if ($currentToken) {
            $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('previous_qr_code', ?, CURRENT_TIMESTAMP)");
            $stmt->execute([$currentToken]);
        }

        $newToken = bin2hex(random_bytes(8));
        $stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('current_qr_code', ?, CURRENT_TIMESTAMP)");
        $stmt->execute([$newToken]);
        return $newToken;
    }

    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_qr_code'");
    $stmt->execute();
    return $stmt->fetchColumn();
}

// If called via HTTP request (e.g. directly), return JSON:
if (php_sapi_name() !== 'cli' && !debug_backtrace()) {
    header('Content-Type: application/json');
    echo json_encode(['token' => generateNewToken(isset($_GET['force']) && $_GET['force'] === '1')]);
}
