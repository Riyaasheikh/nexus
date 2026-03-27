<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Block users from accessing routes not meant for their role.
     * Usage in routes: ->middleware('role:investor')
     *                  ->middleware('role:entrepreneur')
     *                  ->middleware('role:investor,entrepreneur')
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Unauthorized. Your role does not have access to this resource.'
            ], 403);
        }

        return $next($request);
    }
}
