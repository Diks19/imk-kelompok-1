<?php

namespace App\Jobs;

use App\Models\Conversation;
use App\Models\Message;
use App\Services\OllamaService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RespondToChat implements ShouldQueue
{
    use Queueable;

    public $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $conversationId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(OllamaService $ollama, \App\Services\StableDiffusionService $sd): void
    {
        Log::info('Responding to chat', ['conversation_id' => $this->conversationId]);
        
        $conversation = Conversation::with(['messages', 'messages.attachments', 'messages.attachments.documentChunks'])->findOrFail($this->conversationId);
        $lastUserMessage = $conversation->messages->where('role', 'user')->last();
        $model = $conversation->model ?? config('services.ollama.model', 'deepseek-r1:8b');

        // Handle Image Generation
        if ($lastUserMessage && str_starts_with(trim($lastUserMessage->content), '/imagine')) {
            $this->handleImageGeneration($conversation, $lastUserMessage, $sd);
            return;
        }

        // RAG Retrieval Phase
        $ragContext = '';
        if ($lastUserMessage && !empty($lastUserMessage->content)) {
            // Find the most recent attachment in the conversation to use as context
            $latestAttachment = $conversation->messages->flatMap(fn($m) => $m->attachments)
                ->filter(fn($a) => $a->documentChunks->count() > 0)
                ->last();
                
            $allChunks = $latestAttachment ? $latestAttachment->documentChunks : collect([]);
            
            if ($allChunks->count() > 0) {
                try {
                    $queryEmbedding = $ollama->getEmbedding($lastUserMessage->content);
                    
                    $similarities = $allChunks->map(function ($chunk) use ($queryEmbedding) {
                        return [
                            'content' => $chunk->content,
                            'similarity' => $this->cosineSimilarity($queryEmbedding, $chunk->embedding)
                        ];
                    })->sortByDesc('similarity')->take(3);

                    if ($similarities->count() > 0) {
                        $ragContext = "Context from uploaded documents:\n" . $similarities->pluck('content')->implode("\n---\n");
                    }
                } catch (\Exception $e) {
                    Log::error('RAG Retrieval error: ' . $e->getMessage());
                }
            }
        }

        $messages = $conversation->messages->map(function ($msg) {
            // Strip thinking process from history to prevent model confusion/imitation
            $cleanContent = preg_replace('/<think>[\s\S]*?<\/think>/i', '', $msg->content ?? '');
            
            $data = [
                'role' => $msg->role,
                'content' => trim($cleanContent),
            ];

            if ($msg->attachments->count() > 0) {
                $images = $msg->attachments->filter(fn($a) => in_array(strtolower(pathinfo($a->path, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif', 'webp']));
                if ($images->count() > 0) {
                    $data['images'] = $images->map(function ($att) {
                        $relativePath = str_replace('/storage/', '', $att->path);
                        $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($relativePath);
                        return file_exists($fullPath) ? base64_encode(file_get_contents($fullPath)) : null;
                    })->filter()->values()->toArray();
                }
            }

            return $data;
        })->toArray();

        // Inject RAG context into the latest user message
        if (!empty($ragContext)) {
            $lastIdx = count($messages) - 1;
            $messages[$lastIdx]['content'] = "Using the following context, please answer the user's question.\n\n" . $ragContext . "\n\nUser Question: " . $messages[$lastIdx]['content'];
        }

        $assistantMessage = Message::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => '',
            'status' => 'streaming',
        ]);

        try {
            $fullContent = '';
            $ollama->streamChat($messages, function ($token) use ($assistantMessage, $conversation, &$fullContent) {
                $fullContent .= $token;
                \App\Events\MessageTokenStreamed::dispatch(
                    $assistantMessage->id,
                    $fullContent,
                    $conversation->id
                );
            }, $model);

            $assistantMessage->update([
                'content' => $fullContent,
                'status' => 'completed',
            ]);

            \App\Events\MessageUpdated::dispatch($assistantMessage);

            Log::info('Ollama response completed');
        } catch (\Exception $e) {
            Log::error('Ollama error: ' . $e->getMessage());
            $assistantMessage->update([
                'content' => 'Sorry, I encountered an error while connecting to the local AI service. Please make sure Ollama is running.',
                'status' => 'error',
            ]);
            return;
        }
        
        // Auto-title if it's the first assistant response
        if ($conversation->messages()->where('role', 'assistant')->count() === 1) {
            $titlePrompt = [
                ['role' => 'user', 'content' => "Summarize the following user request into a very short 3-5 word title without any punctuation or preamble: " . $conversation->messages->first()->content]
            ];
            try {
                $title = $ollama->chat($titlePrompt);
                // Strip <think> blocks if the model returned them
                $title = preg_replace('/<think>[\s\S]*?<\/think>/i', '', $title);
                $conversation->update(['title' => trim($title, " \n\r\t\v\0\"'")]);
            } catch (\Exception $e) {}
        }
    }

    protected function cosineSimilarity(array $vec1, array $vec2): float
    {
        $dotProduct = 0;
        $norm1 = 0;
        $norm2 = 0;

        foreach ($vec1 as $i => $val) {
            $dotProduct += $val * ($vec2[$i] ?? 0);
            $norm1 += $val * $val;
            $norm2 += ($vec2[$i] ?? 0) * ($vec2[$i] ?? 0);
        }

        $divisor = sqrt($norm1) * sqrt($norm2);
        return $divisor == 0 ? 0 : $dotProduct / $divisor;
    }

    protected function handleImageGeneration(Conversation $conversation, Message $userMessage, \App\Services\StableDiffusionService $sd)
    {
        $prompt = trim(str_replace('/imagine', '', $userMessage->content));
        
        $assistantMessage = Message::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => 'Generating your image: "' . $prompt . '"...',
            'status' => 'streaming',
        ]);

        try {
            try {
                $imagePath = $sd->generate($prompt);
            } catch (\Exception $e) {
                Log::warning('SD failed, falling back to pollinations API: ' . $e->getMessage());
                
                $response = Http::timeout(60)->get('https://image.pollinations.ai/prompt/' . urlencode($prompt));
                
                if ($response->successful()) {
                    $fileName = 'generated/' . Str::random(40) . '.jpg';
                    Storage::disk('public')->put($fileName, $response->body());
                    $imagePath = '/storage/' . $fileName;
                } else {
                    throw new \Exception('Pollinations API failed');
                }
            }
            
            \App\Models\Attachment::create([
                'message_id' => $assistantMessage->id,
                'path' => $imagePath,
                'type' => 'generated_output',
            ]);

            $assistantMessage->update([
                'content' => 'Here is the image I generated for you:',
                'status' => 'completed',
            ]);

            $assistantMessage->load('attachments');
            \App\Events\MessageUpdated::dispatch($assistantMessage);

        } catch (\Exception $e) {
            Log::error('Image generation error: ' . $e->getMessage());
            $assistantMessage->update([
                'content' => 'Sorry, I encountered an error while generating the image.',
                'status' => 'error',
            ]);
            \App\Events\MessageUpdated::dispatch($assistantMessage);
        }
    }
}
