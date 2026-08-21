<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Character extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'title',
        'avatar_url',
        'creator',
        'tags',
        'scenario',
        'persona',
        'greeting',
        'greetings',
        'allow_nsfw',
        'bypass_guardrails',
        'strictness',
        'visual_prompt',
        'visual_lora',
        'default_affinity',
    ];

    protected $casts = [
        'tags' => 'array',
        'greetings' => 'array',
        'allow_nsfw' => 'boolean',
        'bypass_guardrails' => 'boolean',
        'default_affinity' => 'integer',
    ];

    public function chatHistories(): HasMany
    {
        return $this->hasMany(ChatHistory::class, 'character_id', 'id');
    }

    public function affinityScores(): HasMany
    {
        return $this->hasMany(AffinityScore::class, 'character_id', 'id');
    }
}
