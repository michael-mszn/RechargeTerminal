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
    counter INTEGER DEFAULT 0,
    remember_token TEXT,
    surname TEXT,
    email TEXT
)");

$db->exec("CREATE TABLE IF NOT EXISTS parking_slots (
    slot_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'charging', 'auth_required', 'error', 'fully_charged'))
)");

$db->exec("INSERT OR IGNORE INTO parking_slots (slot_id, status)
    VALUES
    (1, 'empty'), (2, 'empty'), (3, 'empty'), (4, 'empty'),
    (5, 'empty'), (6, 'empty'), (7, 'empty'), (8, 'empty'),
    (9, 'empty'), (10, 'empty'), (11, 'empty'), (12, 'empty'),
    (13, 'empty'), (14, 'empty'), (15, 'empty'), (16, 'empty')");

echo "Created tables";