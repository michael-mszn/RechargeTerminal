<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

header('Content-Type: application/json');

// Validate input
if (!isset($_POST['username']) || !isset($_POST['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing username or password']);
    exit;
}

$ldap_host = 'ldaps://adldap.hs-regensburg.de';
$ldap_dn   = 'DC=hs-regensburg,DC=de';
$ldap_user = $_POST['username'];
$ldap_pass = $_POST['password'];
$samAccountName = explode('@', $ldap_user)[0];

// Connect LDAP
$ldap_conn = ldap_connect($ldap_host);
if (!$ldap_conn) {
    http_response_code(500);
    echo json_encode(['error' => 'LDAP server connection failed']);
    exit;
}

ldap_set_option($ldap_conn, LDAP_OPT_PROTOCOL_VERSION, 3);
ldap_set_option($ldap_conn, LDAP_OPT_REFERRALS, 0);

// Bind user
if (!@ldap_bind($ldap_conn, $ldap_user, $ldap_pass)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

// Search LDAP
$filter = "(samAccountName=$samAccountName)";
$attributes = ['givenName', 'sn', 'mail'];
$search = ldap_search($ldap_conn, $ldap_dn, $filter, $attributes);
if (!$search) {
    http_response_code(500);
    echo json_encode(['error' => 'LDAP search failed']);
    exit;
}

$entries = ldap_get_entries($ldap_conn, $search);
ldap_unbind($ldap_conn);

session_start();

// Store user info
$_SESSION['username'] = $ldap_user;
unset($_SESSION['parking_position']);

if ($entries['count'] < 1) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

$givenName = $entries[0]['givenname'][0] ?? '';
$sn        = $entries[0]['sn'][0] ?? '';
$email     = $entries[0]['mail'][0] ?? '';
$fullName  = trim("$givenName $sn");
if ($fullName === '') $fullName = $samAccountName;

// SQLite DB operations
$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Get current QR code
$stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_qr_code'");
$stmt->execute();
$currentToken = $stmt->fetchColumn();

// Save current user & last activity
$stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('current_user', ?, CURRENT_TIMESTAMP)");
$stmt->execute([$ldap_user]);

$stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('last_activity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
$stmt->execute();

// Force refresh token
require_once __DIR__ . '/generate-token.php';
$newToken = generateNewToken(true);
$newToken = generateNewToken(true);

// Insert or update user
$stmt = $db->prepare("
    INSERT INTO users (username, name, surname, email, last_login, remember_token)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(username) DO UPDATE SET
        last_login = CURRENT_TIMESTAMP,
        name = excluded.name,
        surname = excluded.surname,
        email = excluded.email,
        remember_token = excluded.remember_token
");
$stmt->execute([$ldap_user, $givenName, $sn, $email, $currentToken]);

// Set cookie for 14 days
setcookie('current_qr_code', $currentToken, [
    'expires' => time() + (14 * 24 * 60 * 60),
    'path' => '/',
    'secure' => true,
    'httponly' => false,
    'samesite' => 'Lax'
]);

// Return success
echo json_encode([
    'username' => $ldap_user,
    'fullName' => $fullName,
    'email'    => $email,
    'token'    => $currentToken
]);
exit;
