<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PaymentController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES — no token required
// ─────────────────────────────────────────────────────────────
Route::post('/register',        [AuthController::class, 'register']);
Route::post('/login',           [AuthController::class, 'login']);
Route::post('/auth/send-otp',   [AuthController::class, 'sendOtp']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);


Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ───────────────────────────────────────────────
    Route::get('/user',    [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ── Documents ──────────────────────────────────────────
    Route::get('/documents',            [DocumentController::class, 'index']);
    // ✅ FIXED: Changed from 'store' to 'upload' to match your Controller
    Route::post('/documents',           [DocumentController::class, 'upload']); 
    Route::post('/documents/{id}/sign', [DocumentController::class, 'sign']);
    Route::delete('/documents/{id}',    [DocumentController::class, 'destroy']);

    // ── Meetings ───────────────────────────────────────────
    Route::get('/meetings',            [MeetingController::class, 'index']);
    Route::post('/meetings',           [MeetingController::class, 'store']);
    // ✅ FIXED: Using '{meeting}' matches your updateStatus(Meeting $meeting) signature
    Route::patch('/meetings/{meeting}/status', [MeetingController::class, 'updateStatus']);

    // ── Messages ───────────────────────────────────────────
    Route::post('/messages',         [MessageController::class, 'store']);
    Route::get('/messages/{userId}', [MessageController::class, 'getMessages']);

    // ── Payments ───────────────────────────────────────────
    Route::get('/payments',                [PaymentController::class, 'index']);
    Route::post('/payments/create-intent', [PaymentController::class, 'createIntent']);
    Route::post('/payments/deposit',       [PaymentController::class, 'deposit']);

    // Role-based Payments
    Route::post('/payments/transfer', [PaymentController::class, 'transfer'])
         ->middleware('role:investor');

    Route::post('/payments/withdraw', [PaymentController::class, 'withdraw'])
         ->middleware('role:entrepreneur');

    // ── Users (Dynamic Discovery) ──────────────────────────
    Route::get('/investors',     fn() => User::where('role', 'investor')->get());
    Route::get('/entrepreneurs', fn() => User::where('role', 'entrepreneur')->get());
});
