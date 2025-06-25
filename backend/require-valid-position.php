<?php
session_start();

if (!isset($_SESSION['username'], $_SESSION['parking_position'])) {
    http_response_code(403);
    die("Zugriff verweigert: Keine Position reserviert.");
}

$username = $_SESSION['username'];
$position = $_SESSION['parking_position'];

try {
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("SELECT username FROM parking_slots WHERE slot_id = ?");
    $stmt->execute([$position]);
    $slot = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$slot || $slot['username'] !== $username) {
        http_response_code(403);
        die("Zugriff verweigert: Ungültige Slot-Zuweisung.");
    }

    // Optional: return the PDO object if needed in the main script
    return $db;

} catch (PDOException $e) {
    http_response_code(500);
    die("Interner Serverfehler: " . $e->getMessage());
}