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
        if ($conversation && $conversation->user_id !== $request->user()->id) {
            abort(403);
        }

        $conversations = Conversation::where('user_id', $request->user()->id)
            ->latest('updated_at')
            ->get();

        $messages = $conversation ? $conversation->messages()->with('attachments')->oldest()->get() : [];

        $ollama = new \App\Services\OllamaService();
        $availableModels = $ollama->listModels();

        \Illuminate\Support\Facades\Log::info('Available models count: ' . count($availableModels));

        return Inertia::render('chat/index', [
            'conversations' => $conversations,
            'currentConversation' => $conversation,
            'messages' => $messages,
            'availableModels' => $availableModels,
        ]);
    }

    public function storeMessage(Request $request)
    {
        $request->validate([
            'content' => 'nullable|string',
            'conversation_id' => [
                'nullable',
                \Illuminate\Validation\Rule::exists('conversations', 'id')->where('user_id', $request->user()->id),
            ],
            'image' => 'nullable|file|max:10240', // 10MB limit
            'model' => 'nullable|string',
        ]);

        $conversationId = $request->conversation_id;

        if (! $conversationId) {
            $conversation = Conversation::create([
                'user_id' => $request->user()->id,
                'title' => 'New Chat',
                'model' => $request->model ?? config('services.ollama.model', 'deepseek-r1:8b'),
            ]);
            $conversationId = $conversation->id;
        }

        $userMessage = Message::create([
            'conversation_id' => $conversationId,
            'role' => 'user',
            'content' => $request->content,
            'type' => 'text',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('attachments', 'public');
            $attachment = \App\Models\Attachment::create([
                'message_id' => $userMessage->id,
                'path' => '/storage/'.$path,
                'original_name' => $file->getClientOriginalName(),
                'type' => 'uploaded_vision',
            ]);

            // Dispatch RAG processing if it's a document (not an image)
            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
                \App\Jobs\ProcessDocumentForRAG::dispatch($attachment->id);
            }
        }

        \App\Jobs\RespondToChat::dispatch($conversationId);

        return redirect()->route('chat.index', $conversationId);
    }

    public function updateModel(Request $request, Conversation $conversation)
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'model' => 'required|string',
        ]);

        $conversation->update([
            'model' => $request->model,
        ]);

        return back();
    }

    public function rename(Request $request, Conversation $conversation)
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $conversation->update([
            'title' => $request->title,
        ]);

        return back();
    }

    public function destroy(Request $request, Conversation $conversation)
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403);
        }

        $conversation->delete();

        return redirect()->route('chat.index');
    }
}
