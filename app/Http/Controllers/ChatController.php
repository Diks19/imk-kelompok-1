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
            'conversation_id' => [
                'nullable',
                \Illuminate\Validation\Rule::exists('conversations', 'id')->where('user_id', $request->user()->id),
            ],
        ]);

        $conversationId = $request->conversation_id;

        if (! $conversationId) {
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
