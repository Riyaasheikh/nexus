<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
       
        'name',
        'email',
        'password',
        'role',         
        'bio',         
        'location',      // 🟢 Added for MapPin filters
        'avatarUrl',     // 🟢 For profile pictures
        
        // Entrepreneur Specific
        'startupName',   // 🟢 Needed for search
        'industry',      // 🟢 Needed for industry badges
        'fundingNeeded', // 🟢 Needed for funding range filters
        'pitchSummary',  // 🟢 Needed for the card description
        
        // Investor Specific
        'investmentInterests', // 🟢 Should be cast to array
        'investmentStage',     // 🟢 Should be cast to array
        'portfolioCompanies',  // 🟢 Should be cast to array
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
            
            // 🟢 Crucial for the Filter Logic
            'investmentInterests' => 'array', 
            'investmentStage' => 'array',
            'portfolioCompanies' => 'array',
        ];
    }
}