<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'require-valid-position.php';

try {
    // === Read input ===
    $input = json_decode(file_get_contents('php://input'), true);
    $prompt = trim($input['prompt'] ?? '');

    if (!$prompt) {
        http_response_code(400);
        echo json_encode(['error' => 'No prompt provided.']);
        exit;
    }

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
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));

    // Basic Auth
    curl_setopt($ch, CURLOPT_USERPWD, DEEPSEEK_USERNAME . ':' . DEEPSEEK_PASSWORD);

    // Timeouts to prevent hanging
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);         // total execution timeout
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 120);  // connection timeout

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

    // Parse reply (OpenAI-like or fallback)
    $reply = $responseData['choices'][0]['message']['content']
          ?? $responseData['reply']
          ?? 'No response from model.';

    // === Save to SQLite DB ===
    $db = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Avoid lock errors
    $db->exec('PRAGMA busy_timeout = 5000');
    $db->exec('PRAGMA journal_mode = WAL');

    $stmt = $db->prepare("
        INSERT INTO key_value (key, value)
        VALUES ('chatgpt_reply', :reply)
        ON CONFLICT(key) DO UPDATE SET value = :reply
    ");
    $stmt->execute([':reply' => $reply]);

    echo json_encode(['status' => 'ok']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}
