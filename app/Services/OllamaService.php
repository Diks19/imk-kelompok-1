<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OllamaService
{
    protected string $baseUrl;
    protected string $model;

    public function __construct()
    {
        $this->baseUrl = config('services.ollama.url', 'http://127.0.0.1:11434');
        $this->model = config('services.ollama.model', 'deepseek-r1:8b');
    }

    public function chat(array $messages, ?string $model = null): string
    {
        $response = Http::timeout(300)->post("{$this->baseUrl}/api/chat", [
            'model' => $model ?? $this->model,
            'messages' => $messages,
            'stream' => false,
        ])->throw();

        $content = $response->json('message.content') ?? '';
        $thinking = $response->json('message.thinking') ?? '';

        if (!empty($thinking)) {
            return "<think>\n" . $thinking . "\n</think>\n\n" . $content;
        }

        return $content;
    }

    public function streamChat(array $messages, callable $onToken, ?string $model = null): void
    {
        $response = Http::timeout(300)->withOptions([
            'stream' => true,
        ])->post("{$this->baseUrl}/api/chat", [
            'model' => $model ?? $this->model,
            'messages' => $messages,
            'stream' => true,
        ])->throw();

        $body = $response->toPsrResponse()->getBody();
        $buffer = '';
        $isThinking = false;
        $finishedThinking = false;

        while (!$body->eof()) {
            $chunk = $body->read(1);
            $buffer .= $chunk;

            while (($pos = strpos($buffer, "\n")) !== false) {
                $line = substr($buffer, 0, $pos);
                $buffer = substr($buffer, $pos + 1);

                if (empty(trim($line))) continue;

                $data = json_decode($line, true);
                if (isset($data['message'])) {
                    // Handle thinking tokens for any model that provides them
                    if (isset($data['message']['thinking']) && $data['message']['thinking'] !== '') {
                        if (!$isThinking && !$finishedThinking) {
                            $isThinking = true;
                            $onToken("<think>\n");
                        }
                        $onToken($data['message']['thinking']);
                    }
                    
                    // Handle regular content tokens
                    if (isset($data['message']['content']) && $data['message']['content'] !== '') {
                        if ($isThinking) {
                            $isThinking = false;
                            $finishedThinking = true;
                            $onToken("\n</think>\n\n");
                        }
                        $onToken($data['message']['content']);
                    }
                }
            }
        }

        // Close the think tag if the stream ended abruptly while thinking
        if ($isThinking) {
            $onToken("\n</think>\n\n");
        }
    }

    public function getEmbedding(string $prompt, string $model = 'nomic-embed-text'): array
    {
        $response = Http::post("{$this->baseUrl}/api/embeddings", [
            'model' => $model,
            'prompt' => $prompt,
        ])->throw();

        return $response->json('embedding') ?? [];
    }

    public function listModels(): array
    {
        try {
            $response = Http::get("{$this->baseUrl}/api/tags")->throw();
            return $response->json('models') ?? [];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Ollama listModels error: ' . $e->getMessage());
            return [];
        }
    }
}
