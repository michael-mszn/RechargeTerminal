<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/update-amperes.php';
require_once __DIR__ . '/vendor/autoload.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not connect to database.']);
    exit;
}

$allowedStatuses = ['empty', 'charging', 'auth_required', 'error', 'fully_charged'];

$slotId = isset($_POST['slot_id']) ? intval($_POST['slot_id']) : null;
$status = isset($_POST['status']) ? $_POST['status'] : null;

if (!$slotId || $slotId < 1 || $slotId > 16) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid slot_id. Must be 1-16.']);
    exit;
}

if (!in_array($status, $allowedStatuses)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid status value.']);
    exit;
}

try {
    if ($status === 'charging') {
        $stmt = $pdo->prepare("UPDATE parking_slots SET status = :status, charging_start_time = datetime('now') WHERE slot_id = :slot_id");
    } else {
        $stmt = $pdo->prepare("UPDATE parking_slots SET status = :status WHERE slot_id = :slot_id");
    }

    $stmt->execute([':status' => $status, ':slot_id' => $slotId]);

    // Recalculate amperes whenever a car joins/leaves charging
    recalculateAmperes($pdo, $slotId);

    $userStmt = $pdo->prepare("SELECT username FROM parking_slots WHERE slot_id = :slot_id");
    $userStmt->execute([':slot_id' => $slotId]);
    $username = $userStmt->fetchColumn();

    if ($username) {
        $tokenStmt = $pdo->prepare("SELECT remember_token FROM users WHERE username = :username");
        $tokenStmt->execute([':username' => $username]);
        $rememberToken = $tokenStmt->fetchColumn();

        if ($rememberToken) {
            $subsStmt = $pdo->prepare("SELECT subscription_json FROM push_subscriptions WHERE remember_token = :remember_token");
            $subsStmt->execute([':remember_token' => $rememberToken]);
            $subscriptions = $subsStmt->fetchAll(PDO::FETCH_COLUMN);

            if ($subscriptions) {
                $webPush = new WebPush([
                    'VAPID' => [
                        'subject' => 'mailto:you@example.com',
                        'publicKey' => VAPID_PUBLIC_KEY,
                        'privateKey' => VAPID_PRIVATE_KEY,
                    ]
                ]);

                $messages = [
                    'charging' => '🔌 Your car has started charging.',
                    'fully_charged' => '✅ Your car is fully charged!',
                    'auth_required' => '🔒 Please authenticate to start charging.',
                    'error' => '⚠️ There was an error with your charging session.',
                    'empty' => 'ℹ️ Your car has been unplugged.',
                ];

                $body = $messages[$status] ?? 'Your parking slot status has changed.';

                foreach ($subscriptions as $subJson) {
                    $subscription = Subscription::create(json_decode($subJson, true));
                    $webPush->queueNotification($subscription, json_encode([
                        'title' => 'Parking Slot Update',
                        'body' => $body,
                    ]));
                }

                foreach ($webPush->flush() as $report) {
                    if (!$report->isSuccess()) {
                        error_log('Push failed: ' . $report->getReason());
                    }
                }
            }
        }
    }

    echo json_encode(['success' => true, 'message' => "Slot $slotId updated to '$status'."]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error.', 'details' => $e->getMessage()]);
}
