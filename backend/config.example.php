<?php
// Block direct access via browser to this file
if (php_sapi_name() !== 'cli' && basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    exit('Forbidden');
}

define("API_KEY", "YOUR_API_KEY_HERE");
define("TERMINAL_TOTAL_AMPERES", 60);