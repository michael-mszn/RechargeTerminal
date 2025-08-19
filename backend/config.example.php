<?php
// Block direct access via browser to this file
if (php_sapi_name() !== 'cli' && basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Forbidden');
}


//DEEPSEEK API CREDENTIALS
define('DEEPSEEK_USERNAME', 'YOUR_USERNAME_HERE');
define('DEEPSEEK_PASSWORD', 'YOUR_PASSWORD_HERE');

define("VAPID_PUBLIC_KEY", "YOUR_PUBLIC_VAPID_KEY_HERE");
define("VAPID_PRIVATE_KEY", "YOUR_PRIVATE_VAPID_KEY_HERE");

define("TERMINAL_TOTAL_AMPERES", 60);

// Set this to 0 during development, or if you desire for remote access to the terminal to be possible.
define("BLOCK_REMOTE_ACCESS", 0);

// Configure the costs per kWh here (in cents)
define("CHARGING_COSTS", 50);

// Configure the simulated voltage here
$voltage = 500;
define("SIMULATED_VOLTAGE", voltage);