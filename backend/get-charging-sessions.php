<?php
header('Content-Type: application/json');

// Check if cookie is set
if (!isset($_COOKIE['current_qr_code'])) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated.']);
    exit;
}

$rememberToken = $_COOKIE['current_qr_code'];

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Look up user by remember_token
    $userStmt = $pdo->prepare("SELECT username FROM users WHERE remember_token = :token");
    $userStmt->execute([':token' => $rememberToken]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'Ungültiges Token.']);
        exit;
    }

    $username = $user['username'];

    // Fetch charging logs
    $logStmt = $pdo->prepare("
        SELECT kwh, cost, start_time, end_time, duration_seconds
        FROM charging_logs
        WHERE username = :username
        ORDER BY end_time DESC
    ");
    $logStmt->execute([':username' => $username]);
    $sessions = $logStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'sessions' => $sessions]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error', 'details' => $e->getMessage()]);
}

