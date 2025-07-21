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
$stmt = $pdo->query("SELECT slot_id, username, amperes FROM parking_slots WHERE status = 'charging'");
$cars = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($cars as $car) {
    $username = $car['username'];
    $slotId = $car['slot_id'];
    $amperes = (int)$car['amperes'];

    if (!$username || $amperes <= 0) continue;

    // Step 2: Fetch user info
    $userStmt = $pdo->prepare("SELECT credit, total_kwh FROM users WHERE username = :username");
    $userStmt->execute([':username' => $username]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) continue;

    $credit = (int)$user['credit'];
    $kwhCharged = (float)$user['total_kwh']; // now float for precision
    $costPerKwh = defined('CHARGING_COSTS') ? (int)CHARGING_COSTS : 50;
    $voltage = defined('SIMULATED_VOLTAGE') ? (int)SIMULATED_VOLTAGE : 500;

    // Step 3: Energy calculation per second (Wh converted to kWh)
    $energyKWh = ($voltage * $amperes) / (1000 * 3600); // kWh per second
    $costNow = $energyKWh * $costPerKwh;

    if ($credit < $costNow) {
        // Insufficient funds → stop charging
        $pdo->prepare("UPDATE parking_slots SET status = 'error' WHERE slot_id = :slot_id")
            ->execute([':slot_id' => $slotId]);
        continue;
    }

    // Step 4: Update credit and kWh
    $newCredit = $credit - $costNow;
    $newKwh = $kwhCharged + $energyKWh;

    $updateUser = $pdo->prepare("
        UPDATE users
        SET credit = :credit, total_kwh = :kwh
        WHERE username = :username
    ");
    $updateUser->execute([
        ':credit' => $newCredit,
        ':kwh' => $newKwh,
        ':username' => $username
    ]);

    // (Optional) logging
    error_log("Slot $slotId charged $energyKWh kWh to $username. Remaining credit: $newCredit");
}

echo "Charging update complete.\n";
