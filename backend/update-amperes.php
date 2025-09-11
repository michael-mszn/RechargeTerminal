<?php
require_once __DIR__ . '/config.php';

function recalculateAmperes(PDO $pdo, int $slotId): void {
    $groupStart = (floor(($slotId - 1) / 4) * 4) + 1;
    $groupEnd = $groupStart + 3;

    $stmt = $pdo->prepare("
        SELECT slot_id, niceness
        FROM parking_slots
        WHERE slot_id BETWEEN :start AND :end
          AND status = 'charging'
    ");
    $stmt->execute([':start' => $groupStart, ':end' => $groupEnd]);
    $chargingSlots = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $chargingCount = count($chargingSlots);
    if ($chargingCount === 0) {
        $stmt = $pdo->prepare("
            UPDATE parking_slots
            SET amperes = 0
            WHERE slot_id BETWEEN :start AND :end
        ");
        $stmt->execute([':start' => $groupStart, ':end' => $groupEnd]);
        return;
    }

    $baseAmp = TERMINAL_TOTAL_AMPERES / $chargingCount;
    $amps = [];
    $totalForfeit = 0;
    $forfeitSlots = [];
    $receivingSlots = [];

    // Step 1 & 2: calculate base and forfeited amps
    foreach ($chargingSlots as $slot) {
        $niceness = $slot['niceness'];
        if ($niceness > 0) {
            $forfeit = $baseAmp * $niceness;
            $amps[$slot['slot_id']] = $baseAmp - $forfeit;
            $totalForfeit += $forfeit;
            $forfeitSlots[] = $slot['slot_id'];
        } else {
            $amps[$slot['slot_id']] = $baseAmp;
            $receivingSlots[] = $slot['slot_id'];
        }
    }

    // Step 3: distribute forfeited amps among slots with niceness=0
    $receivingCount = count($receivingSlots);
    if ($receivingCount > 0 && $totalForfeit > 0) {
        $bonusPerCar = $totalForfeit / $receivingCount;
        foreach ($receivingSlots as $slotId) {
            $amps[$slotId] += $bonusPerCar;
        }
    }

    // Step 4: rounding and adjustment to match TERMINAL_TOTAL_AMPERES exactly
    $roundedAmps = [];
    $sumRounded = 0;
    foreach ($amps as $slotId => $amp) {
        $roundedAmps[$slotId] = floor($amp); // initial rounding down
        $sumRounded += $roundedAmps[$slotId];
    }

    $diff = TERMINAL_TOTAL_AMPERES - $sumRounded; // remaining amps to distribute

    if ($diff != 0) {
        // sort slots by fractional remainder descending
        $fractions = [];
        foreach ($amps as $slotId => $amp) {
            $fractions[$slotId] = $amp - floor($amp);
        }
        arsort($fractions);
        $slotIds = array_keys($fractions);

        // distribute remaining amps one by one to top fractional slots
        for ($i = 0; $i < abs($diff); $i++) {
            $adjustSlot = $slotIds[$i % count($slotIds)];
            $roundedAmps[$adjustSlot] += ($diff > 0 ? 1 : -1);
        }
    }

    // Step 5: update DB
    $updateStmt = $pdo->prepare("UPDATE parking_slots SET amperes = :amp WHERE slot_id = :slot_id");
    foreach ($roundedAmps as $slotId => $amp) {
        $updateStmt->execute([':amp' => $amp, ':slot_id' => $slotId]);
    }
}
