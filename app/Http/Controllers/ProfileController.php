<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * Switch current active profile.
     */
    public function switch(Request $request): JsonResponse
    {
        $userId = intval($request->input('user_id'));
        $user = User::findOrFail($userId);

        session(['active_user_id' => $user->id]);

        return response()->json([
            'status' => 'success',
            'message' => "Beralih ke profil {$user->name}",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
            ]
        ]);
    }

    /**
     * Create a new testing user profile.
     */
    public function createProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:60',
            'role' => 'nullable|string|in:admin,user',
        ]);

        $role = $validated['role'] ?? 'user';
        $email = strtolower(str_replace(' ', '', $validated['name'])) . rand(100, 999) . '@test.com';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => $role,
        ]);

        session(['active_user_id' => $user->id]);

        return response()->json([
            'status' => 'success',
            'message' => "Profil baru {$user->name} berhasil dibuat!",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
            ]
        ]);
    }
}
