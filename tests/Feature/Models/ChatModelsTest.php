<?php

use App\Models\Attachment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
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
