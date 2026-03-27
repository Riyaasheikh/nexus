<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    // Send a message
    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'required|string',
        ]);

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'content' => $request->content,
            'is_read' => false,
        ]);

        return response()->json($message, 201);
    }

    // Get messages for a specific chat
    public function getMessages($userId)
    {
        $currentUserId = Auth::id();

        return Message::where(function($q) use ($currentUserId, $userId) {
            $q->where('sender_id', $currentUserId)->where('receiver_id', $userId);
        })->orWhere(function($q) use ($currentUserId, $userId) {
            $q->where('sender_id', $userId)->where('receiver_id', $currentUserId);
        })
        ->orderBy('created_at', 'asc')
        ->get();
    }
}