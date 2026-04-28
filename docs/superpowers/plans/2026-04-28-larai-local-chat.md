# LarAI Local Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, locally-hosted web application that provides a ChatGPT-like interface interacting with Ollama and Stable Diffusion.

**Architecture:** Laravel backend providing a REST/Inertia API and WebSocket streaming (via Reverb) to a React frontend. The backend will integrate with local Ollama for text generation and dispatch background jobs for Stable Diffusion image generation.

**Tech Stack:** Laravel, React, Inertia.js, Tailwind CSS (v4), MariaDB, Laravel Reverb, Pest PHP.

---

### Task 1: Database Migrations and Models

**Files:**
- Create: `database/migrations/2026_04_28_000000_create_chat_tables.php`
- Create: `app/Models/Conversation.php`
- Create: `app/Models/Message.php`
- Create: `app/Models/Attachment.php`
- Create: `tests/Feature/Models/ChatModelsTest.php`

- [ ] **Step 1: Write the failing test for models**

```php
// tests/Feature/Models/ChatModelsTest.php
<?php

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Attachment;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can create a conversation with messages and attachments', function () {
    $user = User::factory()->create();
    
    $conversation = Conversation::create([
        'user_id' => $user->id,
        'title' => 'Test Chat',
    ]);
    
    $message = Message::create([
        'conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'Hello',
        'type' => 'text',
        'status' => 'completed',
    ]);
    
    $attachment = Attachment::create([
        'message_id' => $message->id,
        'path' => '/tmp/image.png',
        'type' => 'uploaded_vision',
    ]);
    
    expect($conversation->user_id)->toBe($user->id)
        ->and($message->conversation_id)->toBe($conversation->id)
        ->and($attachment->message_id)->toBe($message->id);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Models/ChatModelsTest.php`
Expected: FAIL with "Class 'App\Models\Conversation' not found"

- [ ] **Step 3: Create Migrations**

```php
// database/migrations/2026_04_28_000000_create_chat_tables.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('role'); // 'user', 'assistant', 'system'
            $table->text('content')->nullable();
            $table->string('type')->default('text'); // 'text', 'image_generation_prompt'
            $table->string('status')->default('completed'); // 'sending', 'streaming', 'completed', 'error'
            $table->timestamps();
        });

        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('type'); // 'uploaded_vision', 'generated_output'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
```

- [ ] **Step 4: Create Models**

```php
// app/Models/Conversation.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    protected $guarded = [];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
```

```php
// app/Models/Message.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected $guarded = [];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }
}
```

```php
// app/Models/Attachment.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    protected $guarded = [];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}
```

- [ ] **Step 5: Run migrations and test to verify it passes**

Run: `php artisan migrate`
Run: `php artisan test --compact tests/Feature/Models/ChatModelsTest.php`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add database/migrations app/Models tests/Feature/Models
git commit -m "feat: add database migrations and models for chat"
```

### Task 2: Reverb Configuration and Token Stream Event

**Files:**
- Modify: `.env`
- Create: `app/Events/MessageTokenStreamed.php`
- Create: `tests/Feature/Events/MessageTokenStreamedTest.php`

- [ ] **Step 1: Write failing test for the event**

```php
// tests/Feature/Events/MessageTokenStreamedTest.php
<?php

use App\Events\MessageTokenStreamed;
use Illuminate\Support\Facades\Event;
use App\Models\Message;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('dispatches the token streamed event to the correct channel', function () {
    Event::fake();
    
    $user = User::factory()->create();
    $conversation = Conversation::create(['user_id' => $user->id, 'title' => 'T']);
    $message = Message::create(['conversation_id' => $conversation->id, 'role' => 'assistant', 'content' => '']);
    
    MessageTokenStreamed::dispatch($message->id, 'Hello', $conversation->id);
    
    Event::assertDispatched(MessageTokenStreamed::class, function ($event) use ($message, $conversation) {
        return $event->messageId === $message->id &&
               $event->token === 'Hello' &&
               $event->broadcastOn()->name === 'private-conversation.' . $conversation->id;
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Events/MessageTokenStreamedTest.php`
Expected: FAIL

- [ ] **Step 3: Create the Event**

```php
// app/Events/MessageTokenStreamed.php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageTokenStreamed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $messageId,
        public string $token,
        public int $conversationId
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('conversation.' . $this->conversationId);
    }
    
    public function broadcastAs(): string
    {
        return 'token.streamed';
    }
}
```

- [ ] **Step 4: Update Reverb config in routes/channels.php**

```php
// routes/channels.php (Append this to the file)
<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;

Broadcast::channel('conversation.{id}', function ($user, $id) {
    $conversation = Conversation::find($id);
    return $conversation && $conversation->user_id === $user->id;
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `php artisan test --compact tests/Feature/Events/MessageTokenStreamedTest.php`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/Events routes/channels.php tests/Feature/Events
git commit -m "feat: add message token streaming event and broadcast channel"
```

### Task 3: Ollama Chat Service

**Files:**
- Create: `app/Services/OllamaService.php`
- Create: `tests/Feature/Services/OllamaServiceTest.php`

- [ ] **Step 1: Write failing test**

```php
// tests/Feature/Services/OllamaServiceTest.php
<?php

use App\Services\OllamaService;
use Illuminate\Support\Facades\Http;

it('calls the ollama generate api', function () {
    Http::fake([
        'http://127.0.0.1:11434/api/chat' => Http::response(['message' => ['content' => 'Response']], 200)
    ]);
    
    $service = new OllamaService();
    $response = $service->chat([['role' => 'user', 'content' => 'Hello']]);
    
    expect($response)->toBe('Response');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Services/OllamaServiceTest.php`
Expected: FAIL

- [ ] **Step 3: Implement OllamaService**

```php
// app/Services/OllamaService.php
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
        ]);

        return $response->json('message.content') ?? '';
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --compact tests/Feature/Services/OllamaServiceTest.php`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Services tests/Feature/Services
git commit -m "feat: add Ollama service integration"
```

### Task 4: Chat Controller and Routes

**Files:**
- Create: `app/Http/Controllers/ChatController.php`
- Modify: `routes/web.php`
- Create: `tests/Feature/Controllers/ChatControllerTest.php`

- [ ] **Step 1: Write failing test**

```php
// tests/Feature/Controllers/ChatControllerTest.php
<?php

use App\Models\User;
use App\Models\Conversation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('loads the chat index', function () {
    $user = User::factory()->create();
    
    $this->actingAs($user)
         ->get('/chat')
         ->assertStatus(200);
});

it('creates a new conversation and message', function () {
    $user = User::factory()->create();
    
    $this->actingAs($user)
         ->postJson('/chat/message', [
             'content' => 'Hello AI'
         ])
         ->assertStatus(200)
         ->assertJsonStructure(['conversation_id', 'message_id']);
         
    expect(Conversation::count())->toBe(1)
        ->and(Conversation::first()->user_id)->toBe($user->id);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --compact tests/Feature/Controllers/ChatControllerTest.php`
Expected: FAIL

- [ ] **Step 3: Create Controller**

```php
// app/Http/Controllers/ChatController.php
<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChatController extends Controller
{
    public function index(Request $request, ?Conversation $conversation = null)
    {
        $conversations = Conversation::where('user_id', $request->user()->id)
            ->latest('updated_at')
            ->get();
            
        $messages = $conversation ? $conversation->messages()->oldest()->get() : [];

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'currentConversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    public function storeMessage(Request $request)
    {
        $request->validate([
            'content' => 'required|string',
            'conversation_id' => 'nullable|exists:conversations,id',
        ]);

        $conversationId = $request->conversation_id;

        if (!$conversationId) {
            $conversation = Conversation::create([
                'user_id' => $request->user()->id,
                'title' => 'New Chat',
            ]);
            $conversationId = $conversation->id;
        }

        $userMessage = Message::create([
            'conversation_id' => $conversationId,
            'role' => 'user',
            'content' => $request->content,
            'type' => 'text',
        ]);

        // Here we would typically dispatch a job to stream the AI response
        // For now, we return the IDs so the frontend can subscribe and listen

        return response()->json([
            'conversation_id' => $conversationId,
            'message_id' => $userMessage->id,
        ]);
    }
}
```

- [ ] **Step 4: Register Routes**

```php
// routes/web.php (Append this)
use App\Http\Controllers\ChatController;

Route::middleware(['auth'])->group(function () {
    Route::get('/chat/{conversation?}', [ChatController::class, 'index'])->name('chat.index');
    Route::post('/chat/message', [ChatController::class, 'storeMessage'])->name('chat.message.store');
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `php artisan test --compact tests/Feature/Controllers/ChatControllerTest.php`
(Note: Inertia renders might need the page to exist, so we'll mock the view or create a placeholder if needed. Since Inertia testing just checks the response is 200, it should pass).

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers routes/web.php tests/Feature/Controllers
git commit -m "feat: add chat controller and routes"
```

### Task 5: Frontend Layout & Sidebar (React)

**Files:**
- Create: `resources/js/pages/chat/index.tsx`

- [ ] **Step 1: Build the UI Component**

```tsx
// resources/js/pages/chat/index.tsx
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ChatIndex({ conversations, currentConversation, messages }: any) {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        // Optimistic update could go here

        window.axios.post('/chat/message', {
            content: prompt,
            conversation_id: currentConversation?.id || null
        }).then(response => {
            setPrompt('');
            if (!currentConversation) {
                router.visit(`/chat/${response.data.conversation_id}`);
            } else {
                router.reload({ only: ['messages'] });
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Chat" />
            <div className="flex h-[calc(100vh-4rem)]">
                {/* Sidebar */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto flex flex-col">
                    <div className="p-4">
                        <Link 
                            href="/chat"
                            className="block w-full text-center bg-blue-600 text-white rounded p-2 text-sm font-medium hover:bg-blue-700"
                        >
                            + New Chat
                        </Link>
                    </div>
                    <div className="flex-1 px-3">
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Recent</div>
                        {conversations.map((conv: any) => (
                            <Link
                                key={conv.id}
                                href={`/chat/${conv.id}`}
                                className={`block p-2 rounded text-sm mb-1 truncate ${currentConversation?.id === conv.id ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
                            >
                                {conv.title}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                How can I help you today?
                            </div>
                        ) : (
                            <div className="space-y-4 max-w-3xl mx-auto w-full">
                                {messages.map((msg: any) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-200">
                        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="flex-1 rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Message LarAI..."
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/chat/index.tsx
git commit -m "feat: add React Inertia chat interface"
```

---

*Note: The plan establishes the foundational models, API integration, routing, and UI for the chat. Further streaming enhancements (WebSocket connection handling in React, image background jobs) should be iterated upon using this base architecture.*