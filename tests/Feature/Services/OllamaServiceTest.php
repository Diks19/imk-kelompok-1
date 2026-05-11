<?php

use App\Services\OllamaService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

it('calls the ollama chat api', function () {
    Http::fake([
        'http://127.0.0.1:11434/api/chat' => Http::response(['message' => ['content' => 'Response']], 200),
    ]);

    $service = new OllamaService;
    $response = $service->chat([['role' => 'user', 'content' => 'Hello']]);

    expect($response)->toBe('Response');

    Http::assertSent(function (Illuminate\Http\Client\Request $request) {
        return $request->url() == 'http://127.0.0.1:11434/api/chat' &&
               $request['messages'][0]['content'] == 'Hello';
    });
});
