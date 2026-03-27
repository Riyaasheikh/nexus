<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #374151; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .header { border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; }
        .details { background-color: #f9fafb; padding: 15px; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="color: #4f46e5; margin: 0;">Business Nexus Meeting Invite</h2>
        </div>
        <p>Hello,</p>
        <p><strong>{{ $meeting->sender->name }}</strong> has requested a meeting with you regarding: <strong>{{ $meeting->title }}</strong>.</p>
        
        <div class="details">
            <p><strong>📅 Date & Time:</strong> {{ $meeting->start_time->format('M d, Y \a\t h:i A') }}</p>
            @if($meeting->description)
                <p><strong>💬 Note:</strong> {{ $meeting->description }}</p>
            @endif
        </div>

        <p>Please log in to your dashboard to respond to this request.</p>
        
        <a href="http://localhost:5173/dashboard" class="button">View Request</a>
        
        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
            This is an automated message from Business Nexus. Please do not reply directly to this email.
        </p>
    </div>
</body>
</html>