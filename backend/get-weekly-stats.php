<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get current user
    $stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_user'");
    $stmt->execute();
    $username = $stmt->fetchColumn();

    if (!$username) {
        echo json_encode(['error' => 'No user logged in']);
        exit;
    }

    // Accept start and end dates (YYYY-MM-DD)
    $start = $_GET['start'] ?? null;
    $end   = $_GET['end'] ?? null;

    if (!$start || !$end) {
        echo json_encode(['error' => 'Missing start or end date']);
        exit;
    }

    // Initialize empty result for Monday-Sunday
    $dates = [];
    $dateObj = new DateTime($start);
    for ($i = 0; $i < 7; $i++) {
        $dates[$dateObj->format('Y-m-d')] = 0; // duration in minutes
        $dateObj->modify('+1 day');
    }

    // Fetch charging logs for user within range
    $stmt = $db->prepare("
        SELECT start_time, duration_seconds
        FROM charging_logs
        WHERE username = ?
          AND DATE(start_time) BETWEEN ? AND ?
    ");
    $stmt->execute([$username, $start, $end]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as $row) {
        $day = substr($row['start_time'], 0, 10); // YYYY-MM-DD
        if (isset($dates[$day])) {
            $dates[$day] += round($row['duration_seconds'] / 60); // convert to minutes
        }
    }

    // Format keys as MM/DD/YYYY for frontend
    $formatted = [];
    foreach ($dates as $yMd => $minutes) {
        $d = new DateTime($yMd);
        $key = $d->format('m/d/Y');
        $formatted[$key] = $minutes;
    }

    echo json_encode(['stats' => $formatted]);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
