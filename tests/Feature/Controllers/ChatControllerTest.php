<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('loads the chat index', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withoutVite()
        ->withoutExceptionHandling()
        ->get('/chat')
        ->assertStatus(200);
});

it('creates a new conversation and message', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withoutVite()
        ->withoutExceptionHandling()
        ->withoutMiddleware(PreventRequestForgery::class)
        ->postJson('/chat/message', [
            'content' => 'Hello AI',
        ])
        ->assertStatus(200)
        ->assertJsonStructure(['conversation_id', 'message_id']);

    expect(Conversation::count())->toBe(1)
        ->and(Conversation::first()->user_id)->toBe($user->id);
});
