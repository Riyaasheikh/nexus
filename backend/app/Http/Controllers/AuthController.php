<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Validator; // Add at the top of the file

class AuthController extends Controller
{
   

public function register(Request $request)
{
    $validator = Validator::make($request->all(), [
        'name'         => 'required|string|min:2|max:255',
        'email'        => 'required|string|email|max:255|unique:users',
        'password'     => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::min(8)->letters()->numbers()],
        'role'         => 'required|in:investor,entrepreneur',
        'bio'          => 'nullable|string|max:500',
        'location'     => 'nullable|string|max:255',
        'industry'     => 'nullable|string|max:100',
        'startupName'  => 'nullable|string|max:255',
    ], [
        'email.unique'       => 'This email is already taken.',
        'password.confirmed' => 'The password confirmation does not match.',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $user = User::create([
        'name'          => $request->name,
        'email'         => $request->email,
        'password'      => Hash::make($request->password),
        'role'          => $request->role,
        'bio'           => $request->bio,
        'location'      => $request->location,
        'industry'      => $request->industry,
        'startupName'   => $request->startupName,
        // Initialize arrays for Investors to prevent frontend crashes
        'investmentInterests' => $request->role === 'investor' ? [] : null,
        'investmentStage'     => $request->role === 'investor' ? [] : null,
    ]);

    $token = $user->createToken('nexus_auth_token')->plainTextToken;

    return response()->json([
        'message'      => 'Account created successfully!',
        'access_token' => $token,
        'user'         => $user,
    ], 201);
}

    // ─────────────────────────────────────────────
    // 2. LOGIN
    //    ✅ Validates credentials
    //    ✅ Role mismatch check
    //    ✅ Deletes old tokens (single session security)
    //    ✅ Returns Sanctum token
    // ─────────────────────────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
            'role'     => 'required|in:investor,entrepreneur',
        ]);

        $user = User::where('email', $request->email)->first();

        // ✅ Hash::check prevents timing attacks
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.'
            ], 401);
        }

        // ✅ Role-based login — investor can't log in as entrepreneur and vice versa
        if ($user->role !== $request->role) {
            return response()->json([
                'message' => "This account is registered as an {$user->role}, not a {$request->role}."
            ], 403);
        }

        // ✅ Revoke all old tokens on new login for security
        $user->tokens()->delete();

        $token = $user->createToken('nexus_auth_token')->plainTextToken;

        return response()->json([
            'message'      => 'Login successful!',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user,
        ]);
    }

    // ─────────────────────────────────────────────
    // 3. LOGOUT
    //    ✅ Revokes current token only
    // ─────────────────────────────────────────────
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.'
        ]);
    }

    // ─────────────────────────────────────────────
    // 4. GET CURRENT USER
    // ─────────────────────────────────────────────
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // ─────────────────────────────────────────────
    // 5. SEND OTP — 2FA Mockup
    //    ✅ Generates secure 6-digit OTP
    //    ✅ Stores in cache for 10 minutes
    //    ✅ Returns OTP in response for mock/testing
    //       (remove otp from response in production)
    // ─────────────────────────────────────────────
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'No account found with this email.',
        ]);

        // Generate a secure 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store in Laravel cache — expires in 10 minutes
        Cache::put('otp_' . $request->email, $otp, now()->addMinutes(10));

        // ── PRODUCTION: send real email (uncomment when ready) ──
        // Mail::raw(
        //     "Your Business Nexus OTP is: {$otp}. Valid for 10 minutes.",
        //     function ($msg) use ($request) {
        //         $msg->to($request->email)->subject('Your OTP Code - Business Nexus');
        //     }
        // );
        // ────────────────────────────────────────────────────────

        return response()->json([
            'message' => 'OTP sent successfully!',
            'otp'     => $otp,         // ← Remove this line in production
            'expires' => '10 minutes',
        ]);
    }

    // ─────────────────────────────────────────────
    // 6. VERIFY OTP — 2FA Mockup
    //    ✅ Checks OTP from cache
    //    ✅ Deletes OTP after use (no reuse)
    //    ✅ Returns success on match
    // ─────────────────────────────────────────────
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp'   => 'required|string|size:6',
        ], [
            'otp.size' => 'OTP must be exactly 6 digits.',
        ]);

        $cachedOtp = Cache::get('otp_' . $request->email);

        // OTP expired or never sent
        if (!$cachedOtp) {
            return response()->json([
                'message' => 'OTP has expired. Please request a new one.'
            ], 422);
        }

        // Wrong OTP entered
        if ($cachedOtp !== $request->otp) {
            return response()->json([
                'message' => 'Invalid OTP. Please try again.'
            ], 422);
        }

        // ✅ Delete OTP immediately so it cannot be reused
        Cache::forget('otp_' . $request->email);

        return response()->json([
            'message' => 'OTP verified successfully!',
        ]);
    }
}