<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config.php';
//require_once 'require-valid-position.php';

const FALLBACK_REPLY = "The DeepSeek API appears to have issues, so sadly, I can't reply to you right now :(";

try {
    // === Read input ===
    $input = json_decode(file_get_contents('php://input'), true);
    $prompt = trim($input['prompt'] ?? '');

    if (!$prompt) {
        echo json_encode(['error' => 'No prompt provided.']);
        exit;
    }

    // === Initialize DB first ===
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA busy_timeout = 1000');
    $db->exec('PRAGMA journal_mode = WAL');

    // === Prepare DeepSeek API request ===
    $postData = [
        'model' => 'deepseek-r1:32b',
        'stream' => false,
        'messages' => [
            ['role' => 'user', 'content' => $prompt]
        ]
    ];

    $ch = curl_init('https://deepseek.othdb.de/api/chat');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_USERPWD, DEEPSEEK_USERNAME . ':' . DEEPSEEK_PASSWORD);
    curl_setopt($ch, CURLOPT_TIMEOUT, 1);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
    curl_setopt($ch, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        throw new Exception("cURL error: " . curl_error($ch));
    }

    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("DeepSeek API returned status $httpCode: $response");
    }

    $responseData = json_decode($response, true);

    // Parse reply
    $reply = $responseData['choices'][0]['message']['content']
          ?? $responseData['reply']
          ?? FALLBACK_REPLY;

    // === Save reply to DB ===
    $stmt = $db->prepare("
        INSERT INTO key_value (key, value)
        VALUES ('chatgpt_reply', :reply)
        ON CONFLICT(key) DO UPDATE SET value = :reply
    ");
    $stmt->execute([':reply' => $reply]);

    echo json_encode(['status' => 'ok']);

} catch (Exception $e) {
    // If anything fails, save fallback reply
    try {
        if (!isset($db)) {
            $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db->exec('PRAGMA busy_timeout = 1000');
            $db->exec('PRAGMA journal_mode = WAL');
        }

        $stmt = $db->prepare("
            INSERT INTO key_value (key, value)
            VALUES ('chatgpt_reply', :reply)
            ON CONFLICT(key) DO UPDATE SET value = :reply
        ");
        $stmt->execute([':reply' => FALLBACK_REPLY]);
    } catch (Exception $inner) {
        // Last resort: log error to file
        file_put_contents(__DIR__ . '/chatgpt-error.log', $inner->getMessage(), FILE_APPEND);
    }

    // Return normal JSON, do NOT break frontend
    echo json_encode(['status' => 'ok']);
}
