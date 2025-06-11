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
    remember_token TEXT
)");

echo "Created tables";