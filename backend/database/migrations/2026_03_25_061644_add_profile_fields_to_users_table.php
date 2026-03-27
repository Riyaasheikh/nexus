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
        Schema::table('users', function (Blueprint $table) {
        $table->text('bio')->nullable();
        $table->text('history')->nullable(); 
        $table->json('preferences')->nullable(); 
        $table->string('location')->nullable();
        $table->string('industry')->nullable();
        $table->string('startupName')->nullable();
        
        // 🟢 ADD THESE FOR THE INVESTOR FILTERS
        $table->json('investmentInterests')->nullable();
        $table->json('investmentStage')->nullable();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'history', 'preferences', 
            'location', 'industry', 'startupName', 
            'investmentInterests', 'investmentStage']);
        });
    }
};
