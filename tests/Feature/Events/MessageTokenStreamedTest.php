<?php

use App\Events\MessageTokenStreamed;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

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
               $event->broadcastOn()->name === 'private-conversation.'.$conversation->id;
    });
});
