<?php
require 'vendor/autoload.php';
require 'config.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

$username = $_GET['username'] ?? null;

if (!$username) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing username.']);
    exit;
}

try {
    $pdo = new PDO('sqlite:' . __DIR__ . '/tokens.db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("SELECT subscription_json FROM push_subscriptions WHERE remember_token = (SELECT remember_token FROM users WHERE username = :username)");
    $stmt->execute([':username' => $username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo "No subscription found for user: $username\n";
        exit;
    }

    $subscriptionData = json_decode($row['subscription'], true);

    $webPush = new WebPush([
        'VAPID' => [
            'subject' => 'mailto:you@example.com',
            'publicKey' => VAPID_PUBLIC_KEY,
            'privateKey' => VAPID_PRIVATE_KEY,
        ],
    ]);

    $subscription = Subscription::create($subscriptionData);

    $webPush->queueNotification(
        $subscription,
        json_encode([
            'title' => 'Slot Status Changed',
            'body' => 'Your car’s slot status has changed. Check the app for details.',
        ])
    );

    foreach ($webPush->flush() as $report) {
        $endpoint = $report->getRequest()->getUri()->__toString();
        if ($report->isSuccess()) {
            echo "Message sent to {$endpoint}\n";
        } else {
            echo "Message failed for {$endpoint}: {$report->getReason()}\n";
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB error.', 'details' => $e->getMessage()]);
}
