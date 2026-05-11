<?php
require __DIR__.'/vendor/autoload.php';

$client = new \GuzzleHttp\Client();
try {
    $response = $client->post('http://127.0.0.1:11434/api/chat', [
        'json' => [
            'model' => 'deepseek-r1:8b',
            'messages' => [
                [
                    'role' => 'user', 
                    'content' => 'What is in this image?',
                    'images' => [base64_encode('fake_image_data')]
                ]
            ],
            'stream' => false,
        ],
    ]);
    echo $response->getBody();
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
