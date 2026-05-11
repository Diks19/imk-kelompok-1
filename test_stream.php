<?php
require __DIR__.'/vendor/autoload.php';

$client = new \GuzzleHttp\Client();
$response = $client->post('http://127.0.0.1:11434/api/chat', [
    'json' => [
        'model' => 'deepseek-r1:8b',
        'messages' => [['role' => 'user', 'content' => 'Why is the sky blue? Explain in 2 sentences.']],
        'stream' => true,
    ],
    'stream' => true,
]);

$body = $response->getBody();
while (!$body->eof()) {
    echo $body->read(100);
}
