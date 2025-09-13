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

    // --- Read input ---
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['action'])) {
        echo json_encode(['success' => false, 'error' => 'Missing action']);
        exit;
    }

    if ($input['action'] === 'apply') {
        $hours = intval($input['hours'] ?? 0);
        $minutes = intval($input['minutes'] ?? 0);

        if ($hours === 0 && $minutes === 0) {
            echo json_encode(['success' => false, 'error' => 'Timer must be > 0']);
            exit;
        }

        // Compute end time
        $endTime = new DateTime('now', new DateTimeZone('UTC'));
        $endTime->modify("+$hours hours");
        $endTime->modify("+$minutes minutes");

        $stmt = $db->prepare("UPDATE users
                              SET timer_end = :end, timer_active = 1
                              WHERE username = :username");
        $stmt->execute([
            ':end' => $endTime->format('Y-m-d H:i:s'),
            ':username' => $username
        ]);

        echo json_encode([
            'success' => true,
            'timer_end' => $endTime->format('Y-m-d H:i:s')
        ]);

    } elseif ($input['action'] === 'cancel') {
        $stmt = $db->prepare("UPDATE users
                              SET timer_end = NULL, timer_active = 0
                              WHERE username = :username");
        $stmt->execute([':username' => $username]);

        echo json_encode(['success' => true, 'message' => 'Timer cancelled']);

    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
