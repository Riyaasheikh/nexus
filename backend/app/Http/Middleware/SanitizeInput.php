<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SanitizeInput
{
    /**
     * Recursively strip dangerous HTML/JS from all incoming input.
     * Prevents XSS attacks on every route automatically.
     */
    public function handle(Request $request, Closure $next)
    {
        $input = $request->all();
        $request->replace($this->sanitize($input));
        return $next($request);
    }

    private function sanitize(array $input): array
    {
        foreach ($input as $key => $value) {
            if (is_array($value)) {
                $input[$key] = $this->sanitize($value);
            } elseif (is_string($value)) {
                // Strip all HTML tags and encode special characters
                $input[$key] = htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
            }
        }
        return $input;
    }
}
