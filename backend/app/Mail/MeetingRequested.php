<?php

namespace App\Mail;

use App\Models\Meeting; // 🟢 Import the model
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MeetingRequested extends Mailable
{
    use Queueable, SerializesModels;

    // 🟢 1. Declare the public property
    public $meeting;

    /**
     * Create a new message instance.
     */
    public function __construct(Meeting $meeting) // 🟢 2. Accept the Meeting object
    {
        $this->meeting = $meeting;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Meeting Request: ' . $this->meeting->title,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.meeting_requested', // 🟢 3. Ensure this view exists!
        );
    }

    public function attachments(): array
    {
        return [];
    }
}