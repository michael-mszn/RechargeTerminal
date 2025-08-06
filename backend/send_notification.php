<?php
// send_notification.php
require 'vendor/autoload.php';
require 'config.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

$file = 'subscriptions.json';
$lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

$webPush = new WebPush([
    'VAPID' => [
        'subject' => 'mailto:you@example.com',
        'publicKey' => VAPID_PUBLIC_KEY,
        'privateKey' => VAPID_PRIVATE_KEY,
    ],
]);

$validSubscriptions = [];

foreach ($lines as $line) {
    $data = json_decode($line, true);
    if (!$data) continue;

    $subscription = Subscription::create($data);

    $webPush->queueNotification(
        $subscription,
        json_encode([
            'title' => 'Test Notification',
            'body' => 'This is a push from PHP backend!',
        ])
    );

    $validSubscriptions[] = $data;
}

// Send all notifications and filter out invalid subscriptions
$results = $webPush->flush();

$newSubscriptions = [];
foreach ($results as $report) {
    $endpoint = $report->getRequest()->getUri()->__toString();
    if ($report->isSuccess()) {
        echo "Message sent to {$endpoint}\n";
        // Keep valid subscription
        foreach ($validSubscriptions as $sub) {
            if ($sub['endpoint'] === $endpoint) {
                $newSubscriptions[] = $sub;
                break;
            }
        }
    } else {
        echo "Message failed for {$endpoint}: {$report->getReason()}\n";
    }
}

// Overwrite subscriptions file with only valid ones
file_put_contents($file, '');
foreach ($newSubscriptions as $sub) {
    file_put_contents($file, json_encode($sub) . PHP_EOL, FILE_APPEND);
}
