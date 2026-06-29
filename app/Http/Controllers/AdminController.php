<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Attachment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('dashboard', [
            'stats' => [
                'users' => User::count(),
                'conversations' => Conversation::count(),
                'messages' => Message::count(),
                'attachments' => Attachment::count(),
            ]
        ]);
    }
}