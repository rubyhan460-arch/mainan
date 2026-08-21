<?php

namespace App\Http\Controllers;

use App\Models\AffinityScore;
use App\Models\Character;
use App\Models\ChatHistory;
use App\Models\User;
use App\Models\UserFact;
use App\Services\DatasetImageSearchService;
use App\Services\GeminiChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    protected GeminiChatService $geminiService;
    protected DatasetImageSearchService $datasetService;

    public function __construct(GeminiChatService $geminiService, DatasetImageSearchService $datasetService)
    {
        $this->geminiService = $geminiService;
        $this->datasetService = $datasetService;
    }

    /**
     * Get or create current active user from session/auth.
     */
    protected function getActiveUser(): User
    {
        $userId = session('active_user_id', 1);
        $user = User::find($userId);
        if (!$user) {
            $user = User::first() ?? User::create([
                'name' => 'Farhan',
                'email' => 'farhan@gmail.com',
                'password' => bcrypt('user123'),
                'role' => 'user'
            ]);
        }
        return $user;
    }

    /**
     * Render main chat view.
     */
    public function index()
    {
        if (!session('active_user_id')) {
            return redirect('/login');
        }
        $currentUser = $this->getActiveUser();
        $allUsers = User::all();
        return view('chat.index', compact('currentUser', 'allUsers'));
    }

    /**
     * Get all characters with user-specific affinity scores (default 0).
     */
    public function getCharacters(): JsonResponse
    {
        $user = $this->getActiveUser();
        $characters = Character::all();

        $result = $characters->map(function ($char) use ($user) {
            $affinityRecord = AffinityScore::where('user_id', $user->id)
                ->where('character_id', $char->id)
                ->first();

            $currentAffinity = $affinityRecord ? $affinityRecord->score : 0;

            return [
                'id' => $char->id,
                'name' => $char->name,
                'title' => $char->title ?? '',
                'avatar_url' => $char->avatar_url ?? '',
                'creator' => $char->creator ?? '@creator_dev',
                'tags' => $char->tags ?? ['Female', 'Roleplay', 'NSFW'],
                'scenario' => $char->scenario ?? '',
                'persona' => $char->persona ?? '',
                'greeting' => $char->greeting ?? ($char->greetings[0] ?? 'Halo!'),
                'greetings' => $char->greetings ?? [$char->greeting ?? 'Halo!'],
                'allow_nsfw' => (bool) $char->allow_nsfw,
                'bypass_guardrails' => (bool) $char->bypass_guardrails,
                'strictness' => $char->strictness ?? 'uncensored',
                'current_affinity' => $currentAffinity,
            ];
        });

        return response()->json($result);
    }

    /**
     * Handle incoming chat message.
     */
    public function chat(Request $request): JsonResponse
    {
        $charId = $request->input('char_id');
        $userInput = trim($request->input('message', ''));

        if (empty($charId) || empty($userInput)) {
            return response()->json(['error' => 'Missing character ID or message'], 400);
        }

        $character = Character::find($charId);
        if (!$character) {
            return response()->json(['error' => 'Character not found'], 404);
        }

        $user = $this->getActiveUser();
        $charName = $character->name;

        // 1. Save User Message to Database
        ChatHistory::create([
            'user_id' => $user->id,
            'character_id' => $charId,
            'sender' => 'You',
            'message' => $userInput,
        ]);

        // 2. Check for Chat Commands like /affinity 100 (Admin Only)
        if (preg_match('/^\/(?:affinity|setaffinity|score)\s+(\d+)/i', $userInput, $matches)) {
            if (!$user->isAdmin()) {
                $ackMsg = "*System: Perintah manual /affinity khusus untuk Admin. Sebagai User, tingkatkan skor kedekatan (Affinity) lewat obrolan dan roleplay manis!*";
                ChatHistory::create([
                    'user_id' => $user->id,
                    'character_id' => $charId,
                    'sender' => $charName,
                    'message' => $ackMsg,
                ]);

                return response()->json([
                    'status' => 'success',
                    'char_id' => $charId,
                    'sender' => $charName,
                    'message' => $ackMsg,
                    'affinity_score' => $affinityRecord->score ?? 50,
                    'facts' => $this->getUserFactsArray($user->id)
                ]);
            }

            $newScore = max(0, min(100, intval($matches[1])));
            AffinityScore::updateOrCreate(
                ['user_id' => $user->id, 'character_id' => $charId],
                ['score' => $newScore]
            );

            $ackMsg = "*System: [ADMIN OVERRIDE] Affinity score untuk {$charName} berhasil diubah menjadi {$newScore}/100!*";
            ChatHistory::create([
                'user_id' => $user->id,
                'character_id' => $charId,
                'sender' => $charName,
                'message' => $ackMsg,
            ]);

            return response()->json([
                'status' => 'success',
                'char_id' => $charId,
                'sender' => $charName,
                'message' => $ackMsg,
                'affinity_score' => $newScore,
                'facts' => $this->getUserFactsArray($user->id)
            ]);
        }

        // 3. Extract Facts from text and save
        $this->extractFacts($user->id, $userInput);

        // 4. Natural User Leveling: Incremental EXP based on conversation & sentiment
        $affinityRecord = AffinityScore::firstOrCreate(
            ['user_id' => $user->id, 'character_id' => $charId],
            ['score' => 0]
        );

        // Base interaction EXP (+1 per chat)
        $expGain = 1;

        $compliments = [
            "cantik", "sayang", "hebat", "keren", "suka", "manis", "terima kasih", "makasih", "ganteng", "imut", "lucu", "goda", "seksi", "hot",
            "kawaii", "daisuki", "suki", "aishiteru", "kekkon", "marry", "love", "cute", "beautiful", "propose", "nikah", "lamar", "結婚", "愛してる", "大好き"
        ];
        foreach ($compliments as $w) {
            if (str_contains(strtolower($userInput), $w)) {
                $expGain += 3; // +3 bonus on romantic / sweet words
                break;
            }
        }

        $insults = ["jelek", "benci", "bodoh", "mati", "bacot", "anjir", "anjing", "babi", "tai", "tolol", "sampah", "idiot", "hate you"];
        foreach ($insults as $w) {
            if (str_contains(strtolower($userInput), $w)) {
                $expGain -= 4; // -4 on insults
                break;
            }
        }

        $affinityRecord->score = max(0, min(100, $affinityRecord->score + $expGain));
        $affinityRecord->save();

        // 5. Get recent chat history
        $recentHistories = ChatHistory::where('user_id', $user->id)
            ->where('character_id', $charId)
            ->latest()
            ->take(6)
            ->get()
            ->reverse()
            ->map(fn($h) => ['sender' => $h->sender, 'message' => $h->message])
            ->values()
            ->toArray();

        $userFacts = $this->getUserFactsArray($user->id);

        // 6. Generate AI response
        $responseText = $this->geminiService->generateResponse(
            $character,
            $user,
            $userInput,
            $affinityRecord->score,
            $recentHistories,
            $userFacts
        );

        // 7. Save Assistant Message
        ChatHistory::create([
            'user_id' => $user->id,
            'character_id' => $charId,
            'sender' => $charName,
            'message' => $responseText,
        ]);

        return response()->json([
            'status' => 'success',
            'char_id' => $charId,
            'sender' => $charName,
            'message' => $responseText,
            'affinity_score' => $affinityRecord->score,
            'facts' => $userFacts,
        ]);
    }

    /**
     * Get chat history for a character.
     */
    public function getHistory(string $charId): JsonResponse
    {
        $user = $this->getActiveUser();
        $histories = ChatHistory::where('user_id', $user->id)
            ->where('character_id', $charId)
            ->orderBy('id', 'asc')
            ->get()
            ->map(fn($h) => [
                'sender' => $h->sender,
                'message' => $h->message,
                'timestamp' => $h->created_at->format('H:i')
            ]);

        return response()->json($histories);
    }

    /**
     * Clear chat history for a character.
     */
    public function clearHistory(string $charId): JsonResponse
    {
        $user = $this->getActiveUser();
        ChatHistory::where('user_id', $user->id)
            ->where('character_id', $charId)
            ->delete();

        return response()->json(['status' => 'success', 'message' => 'Riwayat berhasil dibersihkan']);
    }

    /**
     * Manage Affinity Score.
     */
    public function manageAffinity(Request $request, string $charId): JsonResponse
    {
        $user = $this->getActiveUser();
        if ($request->isMethod('post')) {
            if (!$user->isAdmin()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Hanya Admin yang dapat mengubah affinity secara manual.'
                ], 403);
            }
            $score = max(0, min(100, intval($request->input('score', 50))));
            $affinity = AffinityScore::updateOrCreate(
                ['user_id' => $user->id, 'character_id' => $charId],
                ['score' => $score]
            );
            return response()->json(['status' => 'success', 'char_id' => $charId, 'affinity_score' => $affinity->score]);
        }

        $affinity = AffinityScore::where('user_id', $user->id)->where('character_id', $charId)->first();
        $score = $affinity ? $affinity->score : 50;
        return response()->json(['char_id' => $charId, 'affinity_score' => $score]);
    }

    /**
     * Get dataset photo gallery for Character Studio picker with pagination, local dataset, and Live Danbooru search.
     */
    public function getDatasetPhotos(Request $request): JsonResponse
    {
        $charKey = strtolower(trim($request->input('char_key', 'all')));
        $tagFilter = strtolower(trim($request->input('tag_filter', '')));
        $page = max(1, intval($request->input('page', 1)));
        $perPage = max(10, min(100, intval($request->input('limit', 50))));

        $effectiveQuery = !empty($tagFilter) ? $tagFilter : $charKey;
        if ($charKey === 'custom' || $charKey === 'all') {
            $effectiveQuery = !empty($tagFilter) ? $tagFilter : '';
        }

        $path = base_path('dataset/dataset_index.json');
        $dataset = file_exists($path) ? (json_decode(file_get_contents($path), true)['characters'] ?? []) : [];

        // Exact Character Name to Local Dataset Key Map
        $nameMap = [
            'hoshino ai' => 'ai', 'ai hoshino' => 'ai', 'ai' => 'ai',
            'hoshino ruby' => 'ruby', 'ruby hoshino' => 'ruby', 'ruby' => 'ruby',
            'kurokawa akane' => 'akane', 'akane kurokawa' => 'akane', 'akane' => 'akane',
            'akeno himejima' => 'akeno', 'akeno' => 'akeno',
            'aki nijou' => 'aki', 'aki' => 'aki',
            'asuna yuuki' => 'asuna', 'asuna' => 'asuna',
            'barbara' => 'barbara', 'ebina nana' => 'ebina', 'ebina' => 'ebina',
            'furina' => 'furina', 'ganyu' => 'ganyu',
            'boa hancock' => 'hancock', 'hancock' => 'hancock',
            'hinata hyuga' => 'hinata', 'hinata' => 'hinata',
            'hu tao' => 'hutao', 'hutao' => 'hutao',
            'ikumi mito' => 'ikumi', 'ikumi' => 'ikumi',
            'yamanaka ino' => 'ino', 'ino' => 'ino',
            'nakano itsuki' => 'itsuki', 'itsuki' => 'itsuki',
            'keqing' => 'keqing', 'lumine' => 'lumine',
            'nakano miku' => 'miku', 'miku' => 'miku',
            'nami' => 'nami', 'raiden shogun' => 'raiden', 'raiden' => 'raiden',
            'rias gremory' => 'rias', 'rias' => 'rias',
            'sakura haruno' => 'sakura', 'sakura' => 'sakura',
            'tsunade' => 'tsunade', 'xilonen' => 'xilonen',
            'yae miko' => 'yaemiko', 'yaemiko' => 'yaemiko', 'yae' => 'yaemiko',
        ];

        $isLocalMatch = false;
        $matchedKey = 'all';
        $photos = [];

        if (!empty($charKey) && $charKey !== 'all' && $charKey !== 'custom') {
            if (isset($nameMap[$charKey])) {
                $matchedKey = $nameMap[$charKey];
                $photos = $dataset[$matchedKey] ?? [];
                $isLocalMatch = !empty($photos);
            } elseif (isset($dataset[$charKey])) {
                $matchedKey = $charKey;
                $photos = $dataset[$charKey];
                $isLocalMatch = true;
            }
        }

        // If not matched to a 26 local character, but user typed a search query
        if (!$isLocalMatch && !empty($effectiveQuery)) {
            // Check Live Danbooru Online First for custom character names (e.g. Marin, Ichika, Yor, Megumin, Makima)
            $live = $this->fetchLiveDanbooruPhotos($effectiveQuery, $page, $perPage);
            if (!empty($live['photos'])) {
                return response()->json([
                    'matched_character' => $effectiveQuery,
                    'source' => 'live_danbooru',
                    'total' => $live['total'],
                    'page' => $page,
                    'per_page' => $perPage,
                    'has_more' => count($live['photos']) >= $perPage,
                    'photos' => $live['photos']
                ]);
            }

            // Fallback: Check if query matches any tags in local dataset
            foreach ($dataset as $cKey => $cImgs) {
                if ($cKey === $effectiveQuery || str_contains($cKey, $effectiveQuery)) {
                    $photos = array_merge($photos, $cImgs);
                } else {
                    foreach ($cImgs as $img) {
                        $rawTags = $img['tags'] ?? [];
                        $tagStr = is_array($rawTags) ? implode(' ', $rawTags) : (string)$rawTags;
                        if (str_contains(strtolower($tagStr), $effectiveQuery)) {
                            $photos[] = $img;
                        }
                    }
                }
            }
        } elseif (!$isLocalMatch && ($charKey === 'all' || empty($charKey))) {
            // All characters combined
            $matchedKey = 'all';
            foreach ($dataset as $cKey => $cImgs) {
                $photos = array_merge($photos, $cImgs);
            }
        }

        // Apply secondary tag filter if provided
        if (!empty($tagFilter) && $tagFilter !== $effectiveQuery) {
            $filtered = [];
            foreach ($photos as $img) {
                $rawTags = $img['tags'] ?? [];
                $tagStr = is_array($rawTags) ? implode(' ', $rawTags) : (string)$rawTags;
                if (str_contains(strtolower($tagStr), $tagFilter)) {
                    $filtered[] = $img;
                }
            }
            $photos = $filtered;
        }

        $total = count($photos);
        $offset = ($page - 1) * $perPage;
        $pageItems = array_slice($photos, $offset, $perPage);

        $results = [];
        foreach ($pageItems as $img) {
            $raw = $img['preview'] ?? ($img['url'] ?? '');
            if (preg_match('#/([a-f0-9]{2})/([a-f0-9]{2})/([a-f0-9]{32})\.#i', $raw, $m)) {
                $hd = "https://cdn.donmai.us/sample/{$m[1]}/{$m[2]}/sample-{$m[3]}.jpg";
            } else {
                $hd = $raw;
            }
            $results[] = [
                'url' => $hd,
                'char_key' => $matchedKey,
                'tags' => array_slice(is_array($img['tags'] ?? null) ? $img['tags'] : [], 0, 4)
            ];
        }

        return response()->json([
            'matched_character' => $isLocalMatch ? $matchedKey : ($effectiveQuery ?: 'all'),
            'source' => 'local_dataset',
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'has_more' => ($offset + $perPage) < $total,
            'photos' => $results
        ]);
    }

    /**
     * Search Live Danbooru online via DoH when character is not in local dataset.
     */
    private function fetchLiveDanbooruPhotos(string $query, int $page, int $perPage): array
    {
        $tags = strtolower(trim($query));
        $tags = str_replace(['foto', 'karakter', 'anime', 'gambar'], '', $tags);
        $tags = trim($tags);

        // Common Alias transformations
        $aliasMap = [
            'ichika' => 'nakano_ichika',
            'nakano ichika' => 'nakano_ichika',
            'ichika nakano' => 'nakano_ichika',
            'marin' => 'kitagawa_marin',
            'kitagawa marin' => 'kitagawa_marin',
            'marin kitagawa' => 'kitagawa_marin',
            'yor' => 'yor_forger',
            'yor forger' => 'yor_forger',
            'makima' => 'makima_(chainsaw_man)',
            'power' => 'power_(chainsaw_man)',
            'chika' => 'fujiwara_chika',
            'chika fujiwara' => 'fujiwara_chika',
            'kaguya' => 'shinomiya_kaguya',
            'rem' => 'rem_(re:zero)',
            'emilia' => 'emilia_(re:zero)',
            'megumin' => 'megumin',
            'aqua' => 'aqua_(konosuba)',
            'albedo' => 'albedo_(overlord)',
            'tifa' => 'tifa_lockhart',
            '2b' => 'yorha_no._2_type_b',
            'chitoge' => 'kirisaki_chitoge',
            'onodera' => 'onodera_kosaki',
            'nino' => 'nakano_nino',
            'nakano nino' => 'nakano_nino',
            'yotsuba' => 'nakano_yotsuba',
            'nakano yotsuba' => 'nakano_yotsuba',
        ];

        $formattedTag = isset($aliasMap[$tags]) ? $aliasMap[$tags] : str_replace(' ', '_', $tags);

        $url = "https://danbooru.donmai.us/posts.json?tags=" . urlencode($formattedTag) . "&page={$page}&limit={$perPage}";

        $host = parse_url($url, PHP_URL_HOST);
        $resolveOpt = ["{$host}:443:104.26.10.39", "{$host}:443:104.26.11.39", "{$host}:443:172.67.75.146"];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RESOLVE, $resolveOpt);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($code !== 200 || empty($raw)) {
            return ['photos' => [], 'total' => 0];
        }

        $items = json_decode($raw, true);
        if (!is_array($items) || empty($items)) {
            // Try with plain words without underscore
            return ['photos' => [], 'total' => 0];
        }

        $results = [];
        foreach ($items as $item) {
            $sample = $item['large_file_url'] ?? ($item['file_url'] ?? ($item['preview_file_url'] ?? ''));
            if (empty($sample)) continue;

            $charTags = !empty($item['tag_string_character']) ? explode(' ', $item['tag_string_character']) : [];
            $genTags = !empty($item['tag_string_general']) ? explode(' ', $item['tag_string_general']) : [];
            $displayTags = array_merge($charTags, $genTags);

            $results[] = [
                'url' => $sample,
                'char_key' => $formattedTag,
                'tags' => array_slice(array_filter($displayTags), 0, 4)
            ];
        }

        return [
            'photos' => $results,
            'total' => count($results) >= $perPage ? ($page * $perPage + 50) : count($results)
        ];
    }

    /**
     * Search dataset image.
     */
    public function searchImage(Request $request): JsonResponse
    {
        $charId = $request->input('char_id', '');
        $prompt = $request->input('prompt', '');
        $excluded = $request->input('excluded_urls', []);

        $result = $this->datasetService->searchImage($charId, $prompt, $excluded);
        return response()->json($result);
    }

    /**
     * Get extracted facts.
     */
    public function getFacts(): JsonResponse
    {
        $user = $this->getActiveUser();
        return response()->json($this->getUserFactsArray($user->id));
    }

    /**
     * Manage Settings.
     */
    public function manageSettings(Request $request): JsonResponse
    {
        if ($request->isMethod('post')) {
            $apiKey = trim($request->input('gemini_api_key', ''));
            $model = trim($request->input('gemini_model', ''));

            if (!empty($apiKey)) {
                $this->updateEnvFile(['GEMINI_API_KEY' => $apiKey]);
            }
            if (!empty($model)) {
                $this->updateEnvFile(['GEMINI_MODEL' => $model]);
            }

            return response()->json(['status' => 'success']);
        }

        return response()->json([
            'status' => 'success',
            'llm_engine' => env('LLM_ENGINE', 'gemini'),
            'gemini_api_key' => env('GEMINI_API_KEY', ''),
            'gemini_model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
            'pollinations_model' => env('POLLINATIONS_MODEL', 'openai'),
            'local_llm_url' => env('LOCAL_LLM_URL', 'http://localhost:11434/v1'),
            'local_llm_model' => env('LOCAL_LLM_MODEL', 'mistral'),
        ]);
    }

    /**
     * Proxy image endpoint with Cloudflare DoH resolution and multi-fallback support.
     */
    public function proxyImage(Request $request)
    {
        $url = $request->query('url');
        if (empty($url)) {
            return response('Invalid URL', 400);
        }

        // If it's already a local relative path (e.g. /avatars/ruby.jpg)
        if (str_starts_with($url, '/')) {
            $localDiskFile = public_path(ltrim($url, '/'));
            if (file_exists($localDiskFile)) {
                return response()->file($localDiskFile, [
                    'Cache-Control' => 'public, max-age=31536000'
                ]);
            }
        }

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return response('Invalid URL', 400);
        }

        // 1. Check local persistent disk cache
        $cacheDir = public_path('cache/images');
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0777, true);
        }
        $cacheHash = md5($url);
        $diskFilePath = "{$cacheDir}/{$cacheHash}.jpg";

        if (file_exists($diskFilePath) && filesize($diskFilePath) > 500) {
            return response()->file($diskFilePath, [
                'Content-Type' => 'image/jpeg',
                'Cache-Control' => 'public, max-age=31536000'
            ]);
        }

        $host = parse_url($url, PHP_URL_HOST);
        $resolveOpt = [];

        if (str_contains($host, 'donmai.us')) {
            $resolveOpt = ["{$host}:443:104.26.10.39", "{$host}:443:104.26.11.39", "{$host}:443:172.67.75.146"];
        }

        // Candidate URLs to try in order: sample .jpg -> sample .png -> 720x720 -> 180x180 -> raw
        $candidates = [$url];
        if (preg_match('#/([a-f0-9]{2})/([a-f0-9]{2})/([a-f0-9]{32})\.#i', $url, $m)) {
            $h1 = $m[1];
            $h2 = $m[2];
            $h32 = $m[3];
            $candidates = [
                "https://cdn.donmai.us/sample/{$h1}/{$h2}/sample-{$h32}.jpg",
                "https://cdn.donmai.us/sample/{$h1}/{$h2}/sample-{$h32}.png",
                "https://cdn.donmai.us/180x180/{$h1}/{$h2}/{$h32}.jpg",
                "https://cdn.donmai.us/720x720/{$h1}/{$h2}/{$h32}.jpg",
                $url
            ];
        }
        $candidates = array_unique($candidates);

        foreach ($candidates as $targetUrl) {
            $ch = curl_init($targetUrl);
            if (!empty($resolveOpt)) {
                curl_setopt($ch, CURLOPT_RESOLVE, $resolveOpt);
            }
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 8);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            $imgData = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'image/jpeg';
            curl_close($ch);

            if ($httpCode === 200 && !empty($imgData) && strlen($imgData) > 500) {
                // Save persistently to disk
                file_put_contents($diskFilePath, $imgData);

                return response()->file($diskFilePath, [
                    'Content-Type' => $contentType,
                    'Cache-Control' => 'public, max-age=31536000'
                ]);
            }
        }

        return redirect($url);
    }

    protected function extractFacts(int $userId, string $text): void
    {
        $textLower = strtolower($text);

        if (preg_match('/nama\s+(?:gua|saya|aku|gue)\s+(?:adalah\s+)?([a-zA-Z0-9]+)/i', $textLower, $m)) {
            UserFact::updateOrCreate(['user_id' => $userId, 'fact_key' => 'user_name'], ['fact_value' => ucfirst($m[1])]);
        }
        if (preg_match('/hobi\s+(?:gua|saya|aku|gue)\s+(.+)/i', $textLower, $m)) {
            UserFact::updateOrCreate(['user_id' => $userId, 'fact_key' => 'user_hobby'], ['fact_value' => trim($m[1])]);
        }
        if (preg_match('/(?:gua|saya|aku|gue)\s+suka\s+([a-zA-Z0-9\s]+)/i', $textLower, $m) && !str_contains($textLower, 'hobi')) {
            UserFact::updateOrCreate(['user_id' => $userId, 'fact_key' => 'user_likes'], ['fact_value' => trim($m[1])]);
        }
    }

    protected function getUserFactsArray(int $userId): array
    {
        return UserFact::where('user_id', $userId)->pluck('fact_value', 'fact_key')->toArray();
    }

    protected function updateEnvFile(array $values): void
    {
        $envPath = base_path('.env');
        if (!file_exists($envPath)) return;

        $content = file_get_contents($envPath);
        foreach ($values as $key => $val) {
            if (preg_match("/^{$key}=.*/m", $content)) {
                $content = preg_replace("/^{$key}=.*/m", "{$key}={$val}", $content);
            } else {
                $content .= "\n{$key}={$val}";
            }
        }
        file_put_contents($envPath, $content);
    }
}
