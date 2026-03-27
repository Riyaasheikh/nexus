<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('messages', function (Blueprint $table) {
        $table->id();
        // The sender (Entrepreneur or Investor)
        $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
        // The receiver (The other party)
        $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade');
        
        $table->text('content');
        $table->boolean('is_read')->default(false);
        $table->timestamps(); // This creates created_at (our message timestamp)
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
