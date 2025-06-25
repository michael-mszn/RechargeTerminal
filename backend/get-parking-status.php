<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT slot_id AS slot, status FROM parking_slots ORDER BY slot_id ASC");
    $stmt->execute();
    $slots = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($slots);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}