<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = ['sender_id', 'receiver_id', 'content', 'is_read'];

    // This helps the frontend know who sent what
    public function sender() {
        return $this->belongsTo(User::class, 'sender_id');
    }
}