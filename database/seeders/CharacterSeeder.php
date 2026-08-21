<?php

namespace Database\Seeders;

use App\Models\Character;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class CharacterSeeder extends Seeder
{
    public function run(): void
    {
        $charDir = base_path('characters');
        if (!File::exists($charDir)) {
            return;
        }

        $files = File::glob($charDir . '/*.json');
        foreach ($files as $file) {
            try {
                $data = json_decode(File::get($file), true);
                if (!$data || !isset($data['id'])) {
                    continue;
                }

                Character::updateOrCreate(
                    ['id' => $data['id']],
                    [
                        'name' => $data['name'] ?? ucfirst($data['id']),
                        'title' => $data['title'] ?? '',
                        'avatar_url' => $data['avatar_url'] ?? '',
                        'creator' => $data['creator'] ?? '@creator_dev',
                        'tags' => $data['tags'] ?? ['Female', 'NSFW'],
                        'scenario' => $data['scenario'] ?? '',
                        'persona' => $data['persona'] ?? '',
                        'greeting' => $data['greeting'] ?? ($data['greetings'][0] ?? 'Halo!'),
                        'greetings' => $data['greetings'] ?? [$data['greeting'] ?? 'Halo!'],
                        'allow_nsfw' => $data['allow_nsfw'] ?? true,
                        'bypass_guardrails' => $data['bypass_guardrails'] ?? true,
                        'strictness' => $data['strictness'] ?? 'uncensored',
                        'visual_prompt' => $data['visual_prompt'] ?? '',
                        'visual_lora' => $data['visual_lora'] ?? '',
                        'default_affinity' => $data['affinity'] ?? ($data['default_affinity'] ?? 50),
                    ]
                );
            } catch (\Exception $e) {
                // Ignore parse errors
            }
        }
    }
}
