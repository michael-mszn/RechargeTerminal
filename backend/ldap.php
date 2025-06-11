<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if(!isset($_POST['password']) || !isset($_POST['username'])) {
    echo <<<FORM
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LDAP Login</title>
</head>
<body>
    <form method="POST" action="">
        <label for="password">Passwort:</label>
        <input type="text" id="username" name="username" required><br>
        <input type="password" id="password" name="password" required><br>
        <input type="submit" value="Anmelden">
    </form>
</body>
</html>
FORM;
    exit;
}
// Access Data
$ldap_host = 'ldaps://adldap.hs-regensburg.de';
$ldap_dn   = 'DC=hs-regensburg,DC=de';
$ldap_user = $_POST['username'];
$ldap_pass = $_POST['password'];
$samAccountName = explode('@', $ldap_user)[0];

// Build connection
$ldap_conn = ldap_connect($ldap_host);
if (!$ldap_conn) {
    die("Verbindung zum LDAP-Server fehlgeschlagen.");
}

// Set LDAP Options
ldap_set_option($ldap_conn, LDAP_OPT_PROTOCOL_VERSION, 3);
ldap_set_option($ldap_conn, LDAP_OPT_REFERRALS, 0); // important for AD

// Bind with User
if (!@ldap_bind($ldap_conn, $ldap_user, $ldap_pass)) {
    die("Bind fehlgeschlagen: " . ldap_error($ldap_conn));
}

// Filter and Attributes
$filter = "(samAccountName=$samAccountName)";
$attributes = ['givenName', 'sn'];

// Search
$search = ldap_search($ldap_conn, $ldap_dn, $filter, $attributes, 0, 0);
if (!$search) {
    die("Suche fehlgeschlagen: " . ldap_error($ldap_conn));
}

// Get Results
$entries = ldap_get_entries($ldap_conn, $search);

// Show Results
//echo "<pre>";
//print_r($entries);
//echo "</pre>";

// Close Connection
ldap_unbind($ldap_conn);






// Extract first entry
if ($entries['count'] < 1) {
    die("Kein Benutzer gefunden.");
}

// Build a displayable full name
$givenName = $entries[0]['givenname'][0] ?? '';
$sn        = $entries[0]['sn'][0]        ?? '';
$fullName  = trim("$givenName $sn");
if ($fullName === '') {
    $fullName = $samAccountName;
}

$db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Get current QR code
$stmt = $db->prepare("SELECT value FROM key_value WHERE key = 'current_qr_code'");
$stmt->execute();
$currentToken = $stmt->fetchColumn();

// a) Save username as "current_user" in key_value
$stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('current_user', ?, CURRENT_TIMESTAMP)");
$stmt->execute([$ldap_user]);

// b) Save login as "last_activity" in key_value
$stmt = $db->prepare("INSERT OR REPLACE INTO key_value (key, value, updated_at) VALUES ('last_activity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
$stmt->execute();

// c) Update or insert into users table, include remember_token
$stmt = $db->prepare("
    INSERT INTO users (username, name, last_login, counter, remember_token)
    VALUES (?, ?, CURRENT_TIMESTAMP, 0, ?)
    ON CONFLICT(username) DO UPDATE SET last_login = CURRENT_TIMESTAMP, name = excluded.name, remember_token = excluded.remember_token
");
$stmt->execute([$ldap_user, $givenName, $currentToken]);

// d) Set cookie for 14 days
setcookie('current_qr_code', $currentToken, [
    'expires' => time() + (14 * 24 * 60 * 60),
    'path' => '/',
    'secure' => true,
    'httponly' => true, //todo
    'samesite' => 'Lax'
]);

// e) Refresh token immediately to prevent reuse
file_get_contents("https://10.127.0.38/terminalserver/generate-token.php?force=1");

// f) Redirect to success page
header("Location: /terminalserver/success.html");
exit;
?>