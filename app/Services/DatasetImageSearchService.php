<?php

namespace App\Services;

use App\Models\Character;
use Illuminate\Support\Facades\File;

class DatasetImageSearchService
{
    protected ?array $datasetCache = null;

    protected array $synonymTags = [
        # Outfits & Costumes
        "bikini" => ["bikini", "swimsuit", "two-piece_swimsuit", "side-tie_bikini_bottom", "micro_bikini", "string_bikini", "cleavage"],
        "renang" => ["swimsuit", "bikini", "one-piece_swimsuit", "school_swimsuit", "wet"],
        "pantai" => ["beach", "sea", "ocean", "swimsuit", "bikini", "sand", "summer", "outdoors", "sky"],
        "kamar" => ["bedroom", "bed", "sheet", "pillow", "lying", "room", "indoors"],
        "tidur" => ["bed", "lying", "sleeping", "pillow", "sheet", "night", "indoors"],
        "kasur" => ["bed", "lying", "on_bed", "sheet", "pillow"],
        "mandi" => ["bath", "bathtub", "shower", "wet", "wet_clothes", "towel", "water", "onsen", "soap_bubbles", "bare_shoulders"],
        "onsen" => ["onsen", "hot_spring", "towel", "steam", "bath", "water"],
        "gaun" => ["dress", "gown", "evening_gown", "white_dress", "black_dress", "frills"],
        "baju" => ["shirt", "dress", "outfit", "top", "clothes", "cleavage"],
        "pakaian" => ["clothes", "outfit", "dress"],
        "kimono" => ["kimono", "yukata", "japanese_clothes", "obi", "sash"],
        "yukata" => ["yukata", "kimono", "festival"],
        "maid" => ["maid", "maid_apron", "maid_headdress", "maid_outfit"],
        "sekolah" => ["school_uniform", "serafuku", "pleated_skirt", "sailor_collar"],
        "seragam" => ["uniform", "school_uniform", "military_uniform"],
        "lingerie" => ["lingerie", "underwear", "panties", "bra", "lace", "nightie", "cleavage"],
        "underwear" => ["underwear", "panties", "bra", "thighs"],
        "dalam" => ["underwear", "panties", "bra", "cleavage"],
        "bra" => ["bra", "strapless_bra", "lace_bra", "cleavage"],
        "hot" => ["cleavage", "bare_shoulders", "thighs", "bare_legs", "navel", "stomach", "collarbone", "exposed", "breasts"],
        "seksi" => ["cleavage", "bare_shoulders", "thighs", "ass", "bare_legs", "seductive_smile", "blush", "breasts"],
        "telanjang" => ["nude", "completely_nude", "bare_breasts", "nipples", "ass", "uncensored"],
        "uncen" => ["nude", "bare_breasts", "nipples", "pussy", "uncensored", "ass"],
        
        # Wedding & Romance
        "pengantin" => ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
        "nikah" => ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
        "menikah" => ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
        "wedding" => ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
        "bride" => ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
        "kekkon" => ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],

        # Bunny & Special
        "bunny" => ["bunny_suit", "playboy_bunny", "bunny_ears", "rabbit_ears", "fishnets", "leotard"],
        "kelinci" => ["bunny_suit", "playboy_bunny", "bunny_ears", "rabbit_ears", "fishnets"],
        "selfie" => ["selfie", "holding_phone", "looking_at_viewer", "camera", "portrait"],
        "close-up" => ["close-up", "portrait", "looking_at_viewer", "face", "smile"],
        "closeup" => ["close-up", "portrait", "looking_at_viewer", "face", "smile"],
        "stoking" => ["thighhighs", "pantyhose", "black_thighhighs", "fishnet_pantyhose", "stockings"],
        "rok" => ["skirt", "miniskirt", "pleated_skirt", "short_skirt"],
        
        # Poses & Expressions
        "duduk" => ["sitting", "on_chair", "seiza", "crossed_legs", "sitting_on_bed"],
        "berbaring" => ["lying", "on_back", "on_stomach", "on_side", "reclining"],
        "tiduran" => ["lying", "on_bed", "on_back", "reclining", "pillow"],
        "berdiri" => ["standing", "full_body", "looking_at_viewer"],
        "senyum" => ["smile", "happy", "grin", "open_mouth", "blush"],
        "manis" => ["blush", "smile", "sweet", "cute", "sparkle"],
        "merona" => ["blush", "embarrassed", "flustered", "shy"],
        "malu" => ["blush", "embarrassed", "shy", "looking_away"],
        "goda" => ["seductive_smile", "smirk", "blush", "looking_at_viewer", "cleavage"],
        "peluk" => ["hugging", "arms_up", "holding"],
        "cium" => ["kiss", "kissing", "lips", "open_mouth"],
    ];

    /**
     * Searches character dataset images based on prompt and excludes previous URLs.
     */
    public function searchImage(string $charId, string $queryText, array $excludedUrls = []): array
    {
        $character = Character::find($charId);
        $coverUrl = $character ? ($character->avatar_url ?? '') : '';

        $dataset = $this->loadDataset($charId);
        if (empty($dataset)) {
            return [
                'status' => 'fallback',
                'image_url' => $coverUrl ?: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
                'matched_tags' => []
            ];
        }

        // Available candidate pool (filter out excluded URLs)
        $available = array_filter($dataset, function($img) use ($excludedUrls) {
            $url = $img['url'] ?? '';
            return !in_array($url, $excludedUrls);
        });

        if (empty($available)) {
            $available = $dataset;
        }

        // Expand query terms
        $queryLower = strtolower($queryText);
        $queryTokens = preg_split('/[\s,\.\_\-\:\;]+/', $queryLower);
        $queryTokens = array_filter($queryTokens, fn($t) => strlen($t) > 1 && !in_array($t, ['foto', 'pap', 'minta', 'coba', 'tengok', 'lihat']));

        $targetDanbooruTags = [];
        foreach ($queryTokens as $tok) {
            $targetDanbooruTags[] = $tok;
            if (isset($this->synonymTags[$tok])) {
                $targetDanbooruTags = array_merge($targetDanbooruTags, $this->synonymTags[$tok]);
            }
        }
        $targetDanbooruTags = array_unique($targetDanbooruTags);

        // Score candidates
        $scored = [];
        foreach ($available as $img) {
            $url = $img['url'] ?? '';
            $preview = $img['preview'] ?? $url;
            $rawTags = $img['tags'] ?? [];
            if (is_array($rawTags)) {
                $imgTags = $rawTags;
                $imgTagStr = strtolower(implode(' ', $imgTags));
            } else {
                $imgTagStr = strtolower((string)$rawTags);
                $imgTags = preg_split('/\s+/', $imgTagStr);
            }

            $matchScore = 0;
            $matchedReasons = [];

            foreach ($targetDanbooruTags as $targetTag) {
                if (in_array($targetTag, $imgTags) || str_contains($imgTagStr, $targetTag)) {
                    $matchScore += 10;
                    $matchedReasons[] = $targetTag;
                }
            }

            // Quality score boost
            $danbooruScore = intval($img['score'] ?? 0);
            $matchScore += min(15, max(0, intval($danbooruScore / 2)));

            // Heavy penalty for cover URL
            if ($url === $coverUrl) {
                $matchScore -= 50;
            }

            $scored[] = [
                'url' => $url,
                'preview' => $preview,
                'rating' => $img['rating'] ?? 's',
                'score' => $matchScore,
                'matched_tags' => array_slice(array_unique($matchedReasons), 0, 5),
            ];
        }

        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);

        // Pick from top pool
        $topPool = array_filter(array_slice($scored, 0, 8), fn($c) => $c['url'] !== $coverUrl);
        if (empty($topPool)) {
            $topPool = array_slice($scored, 0, 5);
        }

        $chosen = !empty($topPool) ? $topPool[array_rand($topPool)] : $dataset[0];

        $finalUrl = !empty($chosen['preview']) ? $chosen['preview'] : $chosen['url'];

        return [
            'status' => 'success',
            'image_url' => $finalUrl,
            'preview_url' => $chosen['preview'] ?? $finalUrl,
            'matched_tags' => $chosen['matched_tags'] ?? [],
        ];
    }

    protected function loadDataset(string $charId): array
    {
        if ($this->datasetCache === null) {
            $path = base_path('dataset/dataset_index.json');
            if (File::exists($path)) {
                $json = json_decode(File::get($path), true);
                $this->datasetCache = $json['characters'] ?? [];
            } else {
                $this->datasetCache = [];
            }
        }

        return $this->datasetCache[$charId] ?? [];
    }
}
