<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('/chat/test-event', function (\Illuminate\Http\Request $request) {
        \App\Events\MessageTokenStreamed::dispatch(999, 'this is a test token', 16);
        return 'Event dispatched';
    });
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::get('/chat/{conversation?}', [ChatController::class, 'index'])->name('chat.index');
    Route::post('/chat/message', [ChatController::class, 'storeMessage'])->name('chat.message.store');
    Route::patch('/chat/{conversation}/model', [ChatController::class, 'updateModel'])->name('chat.model.update');
    Route::patch('/chat/{conversation}/title', [ChatController::class, 'rename'])->name('chat.rename');
    Route::delete('/chat/{conversation}', [ChatController::class, 'destroy'])->name('chat.destroy');
});

require __DIR__.'/settings.php';
