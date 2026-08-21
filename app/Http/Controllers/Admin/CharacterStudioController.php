<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Character;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CharacterStudioController extends Controller
{
    /**
     * Store a newly created character.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'title' => 'nullable|string|max:150',
            'avatar_url' => 'nullable|string|url',
            'creator' => 'nullable|string|max:100',
            'tags' => 'nullable|string',
            'scenario' => 'nullable|string',
            'persona' => 'required|string',
            'greeting' => 'required|string',
            'default_affinity' => 'nullable|integer|min:0|max:100',
        ]);

        $rawId = Str::slug($validated['name']);
        $id = $rawId;
        $counter = 1;
        while (Character::where('id', $id)->exists()) {
            $id = "{$rawId}-{$counter}";
            $counter++;
        }

        // Parse tags from comma separated string
        $tags = !empty($validated['tags'])
            ? array_map('trim', explode(',', $validated['tags']))
            : ['Female', 'Roleplay', 'NSFW'];
        if (!in_array('NSFW', $tags)) {
            $tags[] = 'NSFW';
        }

        $character = Character::create([
            'id' => $id,
            'name' => $validated['name'],
            'title' => $validated['title'] ?? '',
            'avatar_url' => $validated['avatar_url'] ?? 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
            'creator' => $validated['creator'] ?? '@farhan_admin',
            'tags' => $tags,
            'scenario' => $validated['scenario'] ?? '',
            'persona' => $validated['persona'],
            'greeting' => $validated['greeting'],
            'greetings' => [$validated['greeting']],
            'allow_nsfw' => true,
            'bypass_guardrails' => true,
            'strictness' => 'uncensored',
            'default_affinity' => $validated['default_affinity'] ?? 50,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Karakter {$character->name} berhasil dibuat!",
            'character' => $character,
        ]);
    }

    /**
     * Update an existing character.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $character = Character::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'title' => 'nullable|string|max:150',
            'avatar_url' => 'nullable|string',
            'creator' => 'nullable|string|max:100',
            'tags' => 'nullable|string',
            'scenario' => 'nullable|string',
            'persona' => 'required|string',
            'greeting' => 'required|string',
            'default_affinity' => 'nullable|integer|min:0|max:100',
        ]);

        $tags = !empty($validated['tags'])
            ? array_map('trim', explode(',', $validated['tags']))
            : ($character->tags ?? ['Female', 'NSFW']);

        $character->update([
            'name' => $validated['name'],
            'title' => $validated['title'] ?? $character->title,
            'avatar_url' => $validated['avatar_url'] ?? $character->avatar_url,
            'creator' => $validated['creator'] ?? $character->creator,
            'tags' => $tags,
            'scenario' => $validated['scenario'] ?? $character->scenario,
            'persona' => $validated['persona'],
            'greeting' => $validated['greeting'],
            'default_affinity' => $validated['default_affinity'] ?? $character->default_affinity,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Karakter {$character->name} berhasil diperbarui!",
            'character' => $character,
        ]);
    }

    /**
     * Delete a character.
     */
    public function destroy(string $id): JsonResponse
    {
        $character = Character::findOrFail($id);
        $name = $character->name;
        $character->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Karakter {$name} berhasil dihapus!",
        ]);
    }
}
