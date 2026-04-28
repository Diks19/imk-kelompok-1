<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OllamaService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.ollama.url', 'http://127.0.0.1:11434');
    }

    public function chat(array $messages, string $model = 'llama3'): string
    {
        $response = Http::post("{$this->baseUrl}/api/chat", [
            'model' => $model,
            'messages' => $messages,
            'stream' => false,
        ])->throw();

        return $response->json('message.content') ?? '';
    }
}
