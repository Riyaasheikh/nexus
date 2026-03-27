<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\MeetingRequested;

class MeetingController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'title'       => 'required|string|max:255',
            'start_time'  => 'required|date|after:now',
            'end_time'    => 'required|date|after:start_time',
        ]);

        $senderId = Auth::id();
        $receiverId = $request->receiver_id;

        // 🚩 CONFLICT DETECTION
        $exists = Meeting::where('status', 'accepted')
            ->where(function ($query) use ($senderId, $receiverId) {
                $query->whereIn('sender_id', [$senderId, $receiverId])
                      ->orWhereIn('receiver_id', [$senderId, $receiverId]);
            })
            ->where(function ($query) use ($request) {
                $query->where('start_time', '<', $request->end_time)
                      ->where('end_time', '>', $request->start_time);
            })->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Conflict detected! One of the participants is already booked during this time.'
            ], 422);
        }
        

        $meeting = Meeting::create([
            'sender_id'   => $senderId,
            'receiver_id' => $receiverId,
            'title'       => $request->title,
            'start_time'  => $request->start_time,
            'end_time'    => $request->end_time,
            'status'      => 'pending',
        ]);
        Mail::to($meeting->receiver->email)->send(new MeetingRequested($meeting));
        return response()->json($meeting, 201);
    }

    public function index()
    {
        return Meeting::where('sender_id', Auth::id())
            ->orWhere('receiver_id', Auth::id())
            ->with(['sender', 'receiver'])
            ->orderBy('start_time', 'asc')
            ->get();
    }

    // NEW: Logic for accepting/rejecting meetings
    public function updateStatus(Request $request, Meeting $meeting)
    {
        // Only the receiver can change the status
        if ($meeting->receiver_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['status' => 'required|in:accepted,rejected']);

        $meeting->update(['status' => $request->status]);

        return response()->json([
            'message' => "Meeting {$request->status} successfully",
            'meeting' => $meeting
        ]);
    }
}