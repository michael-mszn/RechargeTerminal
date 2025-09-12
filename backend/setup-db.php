<?php

//Windows / Linux respectively
$db = new PDO('sqlite:./tokens.db');
//$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');

$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("CREATE TABLE IF NOT EXISTS key_value (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$db->exec("CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    last_login TEXT,
    name TEXT,
    remember_token TEXT,
    surname TEXT,
    email TEXT,
    credit REAL DEFAULT 0.0,
    total_kwh REAL DEFAULT 0.0,
    timer_end TEXT DEFAULT NULL,
    timer_active INTEGER DEFAULT 0
)");

$db->exec("CREATE TABLE IF NOT EXISTS parking_slots (
    slot_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'charging', 'auth_required', 'error', 'fully_charged')),
    username TEXT,
    charging_start_time TEXT,
    session_kwh REAL DEFAULT 0,
    amperes INTEGER DEFAULT 0,
    niceness REAL DEFAULT 0 CHECK (niceness >= 0 AND niceness <= 0.5)
)");

$db->exec("INSERT OR IGNORE INTO parking_slots (slot_id, status)
    VALUES
    (1, 'empty'), (2, 'empty'), (3, 'empty'), (4, 'empty'),
    (5, 'empty'), (6, 'empty'), (7, 'empty'), (8, 'empty'),
    (9, 'empty'), (10, 'empty'), (11, 'empty'), (12, 'empty'),
    (13, 'empty'), (14, 'empty'), (15, 'empty'), (16, 'empty')");

$db->exec("CREATE TABLE IF NOT EXISTS charging_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    kwh REAL,
    cost REAL,
    start_time TEXT,
    end_time TEXT,
    duration_seconds INTEGER
)");

$db->exec("CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remember_token TEXT NOT NULL,
    subscription_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)");


echo "Created tables";