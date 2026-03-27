<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * Fetch documents based on Role.
     * Entrepreneurs see what they sent.
     * Investors see what they received.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'entrepreneur') {
            return Document::where('user_id', $user->id)
                           ->orderBy('created_at', 'desc')
                           ->get();
        }

        // If Investor, only show documents sent to them
        return Document::where('receiver_id', $user->id)
                       ->orderBy('created_at', 'desc')
                       ->get();
    }

    /**
     * Upload a document and assign it to a Receiver (Investor).
     * Includes Versioning logic.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'document' => 'required|mimes:pdf|max:10240',
            'receiver_id' => 'required|exists:users,id', 
        ]);

        if ($request->hasFile('document')) {
            $userId = Auth::id();
            $title = $request->title;

            // VERSIONING LOGIC: Check if this user sent this title to this receiver before
            $latestDoc = Document::where('user_id', $userId)
                ->where('receiver_id', $request->receiver_id)
                ->where('title', $title)
                ->orderBy('version', 'desc')
                ->first();

            $newVersion = $latestDoc ? (float)$latestDoc->version + 0.1 : 1.0;

            $path = $request->file('document')->store('documents', 'public');

            $doc = Document::create([
                'user_id'     => $userId,
                'receiver_id' => $request->receiver_id,
                'title'       => $title,
                'file_path'   => $path,
                'status'      => 'pending',
                'version'     => number_format($newVersion, 1)
            ]);

            return response()->json($doc, 201);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    /**
     * The Handshake: Allow Receiver to sign the document.
     */
    public function sign(Request $request, $id)
    {
        $request->validate(['signature' => 'required|string']); 

        $doc = Document::findOrFail($id);
        
        // Security: Ensure ONLY the intended receiver can sign
        if (Auth::id() != $doc->receiver_id) {
            return response()->json(['message' => 'Unauthorized. Only the assigned receiver can sign.'], 403);
        }

        $doc->update([
            'signature_data' => $request->signature,
            'status' => 'signed',
            'signed_at' => now() // Track when the handshake happened
        ]);

        return response()->json([
            'message' => 'Document officially signed!', 
            'doc' => $doc
        ]);
    }

    /**
     * Delete a document.
     */
    public function destroy($id)
    {
        $doc = Document::findOrFail($id);
        
        // Security: Only the owner can delete
        if (Auth::id() != $doc->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Optional: Clean up storage
        if (Storage::disk('public')->exists($doc->file_path)) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $doc->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}