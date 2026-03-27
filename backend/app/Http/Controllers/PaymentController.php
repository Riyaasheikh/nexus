<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Exception;

class PaymentController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    // ─────────────────────────────────────────────
    // 1. Fetch Transaction History
    // ─────────────────────────────────────────────
    public function index()
    {
        return Transaction::where('user_id', Auth::id())
                          ->orderBy('created_at', 'desc')
                          ->get();
    }

    // ─────────────────────────────────────────────
    // 2. Create Stripe PaymentIntent
    //    Frontend calls this FIRST to get client_secret
    //    A "pending" transaction is recorded immediately
    // ─────────────────────────────────────────────
    public function createIntent(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:1']);

        try {
            $intent = PaymentIntent::create([
                'amount'   => (int)($request->amount * 100), // Stripe works in cents
                'currency' => 'usd',
            ]);

            // ✅ Record as PENDING straight away so every attempt is visible
            Transaction::create([
                'user_id'     => Auth::id(),
                'stripe_id'   => $intent->id,
                'amount'      => $request->amount,
                'type'        => 'deposit',
                'status'      => 'pending',
                'description' => 'Stripe deposit initiated — Intent: ' . $intent->id,
            ]);

            return response()->json(['client_secret' => $intent->client_secret]);

        } catch (Exception $e) {
            // ✅ Record as FAILED if Stripe itself throws (e.g. invalid key)
            Transaction::create([
                'user_id'     => Auth::id(),
                'stripe_id'   => null,
                'amount'      => $request->amount,
                'type'        => 'deposit',
                'status'      => 'failed',
                'description' => 'Stripe error: ' . $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Could not initiate payment: ' . $e->getMessage()
            ], 500);
        }
    }

    // ─────────────────────────────────────────────
    // 3. Confirm Deposit
    //    Called AFTER Stripe confirms card on frontend
    //    Updates the pending record to completed or failed
    // ─────────────────────────────────────────────
    public function deposit(Request $request)
    {
        $request->validate([
            'amount'            => 'required|numeric|min:1',
            'payment_intent_id' => 'required|string',
        ]);

        try {
            // Verify with Stripe that payment actually succeeded
            $intent = PaymentIntent::retrieve($request->payment_intent_id);

            // Find the pending transaction we created in createIntent()
            $transaction = Transaction::where('stripe_id', $request->payment_intent_id)
                                      ->where('user_id', Auth::id())
                                      ->first();

            if ($intent->status !== 'succeeded') {
                // ✅ Update existing record to FAILED
                if ($transaction) {
                    $transaction->update([
                        'status'      => 'failed',
                        'description' => 'Payment failed — Stripe status: ' . $intent->status,
                    ]);
                } else {
                    // Safety fallback: create a failed record if somehow missing
                    Transaction::create([
                        'user_id'     => Auth::id(),
                        'stripe_id'   => $request->payment_intent_id,
                        'amount'      => $request->amount,
                        'type'        => 'deposit',
                        'status'      => 'failed',
                        'description' => 'Payment failed — Stripe status: ' . $intent->status,
                    ]);
                }

                return response()->json([
                    'message' => 'Payment was not confirmed by Stripe.'
                ], 400);
            }

            // ✅ Update existing record to COMPLETED
            if ($transaction) {
                $transaction->update([
                    'status'      => 'completed',
                    'description' => 'Stripe deposit confirmed — Intent: ' . $intent->id,
                ]);
            } else {
                // Safety fallback: create completed record if somehow missing
                $transaction = Transaction::create([
                    'user_id'     => Auth::id(),
                    'stripe_id'   => $request->payment_intent_id,
                    'amount'      => $request->amount,
                    'type'        => 'deposit',
                    'status'      => 'completed',
                    'description' => 'Stripe deposit confirmed — Intent: ' . $intent->id,
                ]);
            }

            return response()->json([
                'message'     => 'Deposit successful!',
                'transaction' => $transaction->fresh(),
            ]);

        } catch (Exception $e) {
            // ✅ Mark as FAILED if any unexpected error occurs
            Transaction::where('stripe_id', $request->payment_intent_id)
                       ->where('user_id', Auth::id())
                       ->update([
                           'status'      => 'failed',
                           'description' => 'Exception during confirmation: ' . $e->getMessage(),
                       ]);

            return response()->json([
                'message' => 'Deposit confirmation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // ─────────────────────────────────────────────
    // 4. Transfer / Invest
    //    Investor sends funds to an entrepreneur
    //    Both sides recorded — no Stripe needed
    // ─────────────────────────────────────────────
    public function transfer(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'amount'      => 'required|numeric|min:1',
        ]);

        $sender  = Auth::user();
        $amount  = $request->amount;

        // Calculate sender's real available balance
        $balance = Transaction::where('user_id', $sender->id)
                               ->where('status', 'completed')
                               ->sum('amount');

        if ($balance < $amount) {
            return response()->json([
                'message' => 'Insufficient funds in your Nexus Wallet!'
            ], 400);
        }

        try {
            // ✅ Deduct from sender — recorded as COMPLETED immediately
            Transaction::create([
                'user_id'     => $sender->id,
                'amount'      => -$amount,
                'type'        => 'transfer',
                'status'      => 'completed',
                'description' => 'Investment sent to User ID: ' . $request->receiver_id,
            ]);

            // ✅ Credit to receiver — recorded as COMPLETED immediately
            Transaction::create([
                'user_id'     => $request->receiver_id,
                'amount'      => $amount,
                'type'        => 'transfer',
                'status'      => 'completed',
                'description' => 'Investment received from ' . $sender->name,
            ]);

            return response()->json(['message' => 'Transfer Complete! Startup funded.']);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Transfer failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // ─────────────────────────────────────────────
    // 5. Withdraw
    //    Simulated — no real bank API
    //    Checks balance, records as COMPLETED
    // ─────────────────────────────────────────────
    public function withdraw(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:1']);

        $balance = Transaction::where('user_id', Auth::id())
                               ->where('status', 'completed')
                               ->sum('amount');

        if ($balance < $request->amount) {
            return response()->json([
                'message' => 'Insufficient funds in your Nexus Wallet.'
            ], 400);
        }

        try {
            $transaction = Transaction::create([
                'user_id'     => Auth::id(),
                'amount'      => -$request->amount,
                'type'        => 'withdraw',
                'status'      => 'completed',
                'description' => 'Withdrawal to bank account (simulated)',
            ]);

            return response()->json([
                'message'     => 'Withdrawal processed successfully.',
                'transaction' => $transaction,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Withdrawal failed: ' . $e->getMessage()
            ], 500);
        }
    }
}