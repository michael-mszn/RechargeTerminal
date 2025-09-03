<?php

// CORS for your production domain
header("Access-Control-Allow-Origin: https://ellioth.othdb.de");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS safely
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function generateNewToken($forceRotate = false) {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if (!$forceRotate) {
        $stmt = $db->prepare("SELECT updated_at FROM key_value WHERE key = 'current_qr_code'");
        $stmt->execute();
        $lastUpdated = $stmt->fetchColumn();
        $shouldRotate = true;

        if ($lastUpdated) {
            $lastTimestamp = strtotime($lastUpdated);
            $shouldRotate = (time() - $lastTimestamp) >= 60;
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

// Return JSON for HTTP requests
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
    echo json_encode([
        'token' => generateNewToken(isset($_GET['force']) && $_GET['force'] === '1')
    ]);
}
