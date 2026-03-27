<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    // Add this block to allow the controller to save these fields
    protected $fillable = [
        'user_id',
        'title',
        'file_path',
        'status',
        'signature_data',
        'version',
        'receiver_id',
        
    ];
}