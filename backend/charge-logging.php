<?php
require_once __DIR__ . '/config.php';

$logFile = __DIR__ . '/charge-logging-debug.log';

function debug_log($message) {
    global $logFile;
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] $message\n", FILE_APPEND);
}

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    debug_log("Connected to SQLite database.");
} catch (PDOException $e) {
    debug_log("Database connection failed: " . $e->getMessage());
    exit;
}

// Get all slots that were charging but now aren't
try {
    $stmt = $pdo->query("
        SELECT slot_id, username, charging_start_time, status, session_kwh
        FROM parking_slots
        WHERE status != 'charging' AND charging_start_time IS NOT NULL
    ");
    $endedSessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    debug_log("Found " . count($endedSessions) . " ended sessions to process.");
} catch (PDOException $e) {
    debug_log("Failed to fetch ended sessions: " . $e->getMessage());
    exit;
}

foreach ($endedSessions as $session) {
    $username = $session['username'];
    $slotId = $session['slot_id'];
    $kwh = (float)$session['session_kwh'];
    $cost = $kwh * CHARGING_COSTS;
    $start = strtotime($session['charging_start_time']);
    $end = time();
    $duration = $end - $start;

    debug_log("Processing slot $slotId for user $username: $kwh kWh, cost $cost, duration $duration seconds.");

    // Save to logs
    try {
        $logStmt = $pdo->prepare("
            INSERT INTO charging_logs (username, kwh, cost, start_time, end_time, duration_seconds)
            VALUES (:username, :kwh, :cost, :start_time, :end_time, :duration)
        ");
        $logStmt->execute([
            ':username' => $username,
            ':kwh' => $kwh,
            ':cost' => $cost,
            ':start_time' => date('Y-m-d H:i:s', $start),
            ':end_time' => date('Y-m-d H:i:s', $end),
            ':duration' => $duration,
        ]);
        debug_log("Inserted charging log for user $username.");
    } catch (PDOException $e) {
        debug_log("Failed to insert charging log for slot $slotId: " . $e->getMessage());
        continue;
    }

    // Reset the session data in parking_slots
    try {
        $resetStmt = $pdo->prepare("
            UPDATE parking_slots
            SET charging_start_time = NULL, session_kwh = 0
            WHERE slot_id = :slot_id
        ");
        $resetStmt->execute([':slot_id' => $slotId]);
        debug_log("Reset session data for slot $slotId.");
    } catch (PDOException $e) {
        debug_log("Failed to reset parking slot $slotId: " . $e->getMessage());
    }
}
