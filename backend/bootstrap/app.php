<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // 1. Exclude API from CSRF protection
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // 2. Enable Stateful API for Sanctum (Fixes CORS/Auth issues)
        $middleware->statefulApi();

        // 3. ✅ Register role middleware alias — usage: ->middleware('role:investor')
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

        // 4. ✅ Sanitize all incoming input globally (XSS prevention)
        $middleware->append(\App\Http\Middleware\SanitizeInput::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();