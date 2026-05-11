<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    \Illuminate\Support\Facades\Log::info("Channel auth attempted for user {$user->id} on conversation {$conversationId}");
    return true;
});
