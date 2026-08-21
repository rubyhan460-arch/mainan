<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AffinityScore;
use App\Models\Character;
use App\Models\ChatHistory;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    /**
     * Helper to get active user.
     */
    private function getActiveUser(): User
    {
        $userId = session('active_user_id');
        return ($userId ? User::find($userId) : null) ?: User::where('role', 'admin')->first() ?: User::first();
    }

    /**
     * Get list of all users for Admin Panel.
     */
    public function index(): JsonResponse
    {
        $admin = $this->getActiveUser();
        if (!$admin->isAdmin()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized. Admin only.'], 403);
        }

        $users = User::all()->map(function ($u) {
            $chatCount = ChatHistory::where('user_id', $u->id)->count();
            $affinitiesCount = AffinityScore::where('user_id', $u->id)->count();

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role ?? 'user',
                'chat_count' => $chatCount,
                'affinities_count' => $affinitiesCount,
                'created_at' => $u->created_at ? $u->created_at->format('d M Y') : 'Unknown',
            ];
        });

        return response()->json([
            'status' => 'success',
            'users' => $users
        ]);
    }

    /**
     * Get all character affinity scores for a specific user.
     */
    public function getUserAffinities(int $userId): JsonResponse
    {
        $admin = $this->getActiveUser();
        if (!$admin->isAdmin()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized. Admin only.'], 403);
        }

        $targetUser = User::find($userId);
        if (!$targetUser) {
            return response()->json(['status' => 'error', 'message' => 'User tidak ditemukan.'], 404);
        }

        $characters = Character::all();
        $userAffinities = AffinityScore::where('user_id', $userId)->pluck('score', 'character_id')->toArray();

        $list = $characters->map(function ($c) use ($userAffinities) {
            return [
                'character_id' => $c->id,
                'character_name' => $c->name,
                'avatar_url' => $c->avatar_url,
                'score' => $userAffinities[$c->id] ?? 0, // Default 0
            ];
        });

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'role' => $targetUser->role,
            ],
            'affinities' => $list
        ]);
    }

    /**
     * Admin updates affinity score of a character for a specific user.
     */
    public function updateUserAffinity(Request $request, int $userId): JsonResponse
    {
        $admin = $this->getActiveUser();
        if (!$admin->isAdmin()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized. Admin only.'], 403);
        }

        $charId = $request->input('character_id', '');
        $score = max(0, min(100, intval($request->input('score', 0))));

        if (empty($charId)) {
            return response()->json(['status' => 'error', 'message' => 'Character ID wajib diisi.'], 400);
        }

        $affinity = AffinityScore::updateOrCreate(
            ['user_id' => $userId, 'character_id' => $charId],
            ['score' => $score]
        );

        return response()->json([
            'status' => 'success',
            'message' => "Affinity {$charId} untuk user berhasil diubah menjadi {$score}/100.",
            'affinity_score' => $affinity->score
        ]);
    }

    /**
     * Admin deletes a user account.
     */
    public function destroy(int $userId): JsonResponse
    {
        $admin = $this->getActiveUser();
        if (!$admin->isAdmin()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized.'], 403);
        }

        if ($admin->id === $userId) {
            return response()->json(['status' => 'error', 'message' => 'Tidak dapat menghapus akun admin yang sedang aktif.'], 400);
        }

        $target = User::find($userId);
        if ($target) {
            ChatHistory::where('user_id', $userId)->delete();
            AffinityScore::where('user_id', $userId)->delete();
            $target->delete();
        }

        return response()->json(['status' => 'success', 'message' => 'Akun user berhasil dihapus.']);
    }

    /**
     * Admin updates Username, Password, and Role of any user.
     */
    public function updateUserCredentials(Request $request, int $userId): JsonResponse
    {
        $admin = $this->getActiveUser();
        if (!$admin->isAdmin()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized. Admin only.'], 403);
        }

        $targetUser = User::find($userId);
        if (!$targetUser) {
            return response()->json(['status' => 'error', 'message' => 'User tidak ditemukan.'], 404);
        }

        $newName = trim($request->input('name', ''));
        $newPassword = $request->input('password', '');
        $newRole = $request->input('role', '');

        if (!empty($newName)) {
            $existing = User::where('name', $newName)->where('id', '!=', $userId)->first();
            if ($existing) {
                return response()->json(['status' => 'error', 'message' => 'Username tersebut sudah dipakai user lain.'], 400);
            }
            $targetUser->name = $newName;
        }

        if (!empty($newPassword)) {
            if (strlen($newPassword) < 4) {
                return response()->json(['status' => 'error', 'message' => 'Password minimal 4 karakter.'], 400);
            }
            $targetUser->password = \Illuminate\Support\Facades\Hash::make($newPassword);
        }

        if (!empty($newRole) && in_array($newRole, ['admin', 'user'])) {
            $targetUser->role = $newRole;
        }

        $targetUser->save();

        return response()->json([
            'status' => 'success',
            'message' => "Akun {$targetUser->name} berhasil diperbarui!",
            'user' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'role' => $targetUser->role,
            ]
        ]);
    }
}

