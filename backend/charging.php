<?php
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("DB connection failed: " . $e->getMessage());
    exit;
}

// Step 1: Get all currently charging cars
$stmt = $pdo->query("SELECT slot_id, username, amperes, session_kwh FROM parking_slots WHERE status = 'charging'");
$cars = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($cars as $car) {
    $username = $car['username'];
    $slotId = $car['slot_id'];
    $amperes = (int)$car['amperes'];
    $sessionKwh = (float)$car['session_kwh'];

    if (!$username || $amperes <= 0) continue;

    // Step 2: Fetch user info
    $userStmt = $pdo->prepare("SELECT credit, total_kwh FROM users WHERE username = :username");
    $userStmt->execute([':username' => $username]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) continue;

    $credit = (float)$user['credit'];
    $kwhCharged = (float)$user['total_kwh'];
    $costPerKwh = defined('CHARGING_COSTS') ? (float)CHARGING_COSTS : 50;
    $voltage = defined('SIMULATED_VOLTAGE') ? (float)SIMULATED_VOLTAGE : 500;

    // Step 3: Energy calculation per second (Wh converted to kWh)
    $energyKWh = ($voltage * $amperes) / (1000 * 3600); // kWh per second
    $costNow = $energyKWh * $costPerKwh;

    if ($credit < $costNow) {
        // Insufficient funds → stop charging
        $pdo->prepare("UPDATE parking_slots SET status = 'error' WHERE slot_id = :slot_id")
            ->execute([':slot_id' => $slotId]);
        continue;
    }

    // Step 4: Update credit, total kWh, and session_kwh
    $newCredit = $credit - $costNow;
    $newTotalKwh = $kwhCharged + $energyKWh;
    $newSessionKwh = $sessionKwh + $energyKWh;

    $pdo->beginTransaction();

    $updateUser = $pdo->prepare("
        UPDATE users
        SET credit = :credit, total_kwh = :kwh
        WHERE username = :username
    ");
    $updateUser->execute([
        ':credit' => $newCredit,
        ':kwh' => $newTotalKwh,
        ':username' => $username
    ]);

    $updateSlot = $pdo->prepare("
        UPDATE parking_slots
        SET session_kwh = :session_kwh
        WHERE slot_id = :slot_id
    ");
    $updateSlot->execute([
        ':session_kwh' => $newSessionKwh,
        ':slot_id' => $slotId
    ]);

    $pdo->commit();

    error_log("Slot $slotId charged $energyKWh kWh to $username. New credit: $newCredit. Session kWh: $newSessionKwh");
}

echo "Charging update complete.\n";
