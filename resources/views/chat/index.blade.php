<!DOCTYPE html>
<html lang="id" data-theme="nsfw">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="referrer" content="no-referrer">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Chatbot Mainan Farhan - Laravel 13 Uncensored AI Roleplay</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('static/style.css') }}">
</head>

<body>
    <!-- MOBILE TOP NAVBAR BAR -->
    <header class="mobile-header-bar">
        <button class="mobile-menu-btn" id="btnMobileMenuToggle" aria-label="Menu">
            <i class="fa-solid fa-bars"></i>
        </button>
        <a href="/" class="mobile-brand" id="mobileBrandHome">
            <i class="fa-solid fa-fire-flame-curved brand-icon"></i>
            <span class="mobile-brand-title">Chatbotmainanfarhan</span>
        </a>
        <button class="mobile-settings-btn" id="btnMobileOpenKey" aria-label="Settings">
            <i class="fa-solid fa-sliders"></i>
        </button>
    </header>

    <!-- MOBILE SIDEBAR BACKDROP OVERLAY -->
    <div class="sidebar-backdrop hidden" id="sidebarBackdrop"></div>

    <div class="app-container">
        <!-- BACKGROUND AMBIENT LIGHTING -->
        <div class="ambient-glow bg-glow-1"></div>
        <div class="ambient-glow bg-glow-2"></div>

        <!-- SIDEBAR DRAWER -->
        <aside class="sidebar" id="appSidebar">
            <div class="sidebar-header">
                <a href="/" class="brand" id="brandLogoHome">
                    <i class="fa-solid fa-fire-flame-curved brand-icon"></i>
                    <div>
                        <h2 class="brand-title">Chatbotmainanfarhan</h2>
                        <span class="brand-subtitle">Laravel 13 Uncensored Roleplay</span>
                    </div>
                </a>
            </div>

            <!-- PROFILE & ROLE SWITCHER -->
            <div class="user-profile-badge" style="padding: 10px 14px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; margin: 10px 16px 4px; border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-circle-user" style="color: {{ $currentUser->isAdmin() ? '#ff0055' : '#00f5d4' }}; font-size: 20px;"></i>
                    <div>
                        <div style="font-size: 13px; font-weight: 600; color: #fff;" id="profileCurrentName">{{ $currentUser->name }}</div>
                        <div style="font-size: 10px; color: {{ $currentUser->isAdmin() ? '#ff0055' : '#00f5d4' }}; font-weight: bold; text-transform: uppercase;" id="profileCurrentRole">
                            {{ $currentUser->role }}
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <select id="selectProfileSwitcher" title="Fast Account Switcher" style="background: #1e1330; color: #00f5d4; border: 1px solid rgba(0, 245, 212, 0.4); border-radius: 6px; padding: 4px 6px; font-size: 11px; cursor: pointer; outline: none; max-width: 110px;">
                        @foreach($allUsers as $u)
                            <option value="{{ $u->id }}" {{ $u->id === $currentUser->id ? 'selected' : '' }}>
                                {{ $u->name }}
                            </option>
                        @endforeach
                    </select>
                    <a href="{{ url('/logout') }}" title="Keluar / Logout Akun" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: rgba(255, 0, 85, 0.15); border: 1px solid rgba(255, 0, 85, 0.4); border-radius: 6px; color: #ff0055; text-decoration: none;">
                        <i class="fa-solid fa-arrow-right-from-bracket" style="font-size: 11px;"></i>
                    </a>
                </div>
            </div>

            <!-- NAVIGATION MENU -->
            <div class="nav-menu">
                <button class="nav-btn active" id="navExplore">
                    <i class="fa-solid fa-border-all"></i>
                    <span>Explore Cards Grid</span>
                </button>
                <button class="nav-btn" id="navActiveChat">
                    <i class="fa-solid fa-comments"></i>
                    <span id="navActiveChatLabel">Active Chat</span>
                </button>
            </div>

            <!-- SIDEBAR CHARACTER LIST -->
            <div class="sidebar-section">
                <span class="section-label"><i class="fa-solid fa-users-viewfinder"></i> Karakter Tersedia</span>
                <div class="character-list" id="characterList">
                    <!-- Dynamic Character Cards Loaded via JS -->
                    <div class="loading-skeleton">Memuat karakter...</div>
                </div>
            </div>

            <!-- QUICK TOOLS & ACTIONS -->
            <div class="sidebar-footer">
                @if($currentUser->isAdmin())
                <button class="tool-btn" id="btnOpenStudio" style="background: rgba(255, 0, 85, 0.15); border: 1px solid rgba(255, 0, 85, 0.4); color: #ff0055; margin-bottom: 6px;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    <span>+ Character Studio (Admin)</span>
                </button>
                <button class="tool-btn" id="btnOpenUserManagement" style="background: rgba(0, 245, 212, 0.15); border: 1px solid rgba(0, 245, 212, 0.4); color: #00f5d4; margin-bottom: 6px;">
                    <i class="fa-solid fa-users-gear"></i>
                    <span>👥 Kelola User (Admin)</span>
                </button>
                @endif
                <button class="tool-btn" id="btnOpenFacts">
                    <i class="fa-solid fa-brain"></i>
                    <span>Memori Facts SQLite</span>
                </button>
                <button class="tool-btn" id="btnOpenKey">
                    <i class="fa-solid fa-sliders"></i>
                    <span>Pengaturan Mesin AI</span>
                </button>
            </div>
        </aside>

        <!-- MAIN VIEWPORT CONTAINER -->
        <main class="main-viewport">

            <!-- VIEW 1: EXPLORE CARDS GALLERY GRID VIEW -->
            <section class="explore-view" id="exploreView">
                <div class="explore-header explore-header-row">
                    <div>
                        <h1 class="explore-title">Explore Characters</h1>
                        <p class="explore-subtitle">Pilih karakter roleplay favoritmu untuk mulai bercakap-cakap</p>
                    </div>
                    <div class="explore-search-bar explore-search-box">
                        <i class="fa-solid fa-magnifying-glass search-icon"></i>
                        <input type="text" id="inputSearchChar" placeholder="Cari nama atau anime..." autocomplete="off">
                    </div>
                </div>

                <!-- CATEGORY FILTER PILLS -->
                <div class="category-pills" id="categoryPills">
                    <button class="pill active" data-filter="all">Semua Karakter</button>
                    <button class="pill" data-filter="nsfw"><i class="fa-solid fa-fire"></i> Uncensored (NSFW)</button>
                    <button class="pill" data-filter="medium"><i class="fa-solid fa-heart"></i> Medium</button>
                    <button class="pill" data-filter="safe"><i class="fa-solid fa-shield"></i> Safe</button>
                </div>

                <!-- CHARACTER CARDS GRID -->
                <div class="spicy-grid" id="spicyGrid">
                    <!-- Populated via JS -->
                </div>
            </section>

            <!-- VIEW 2: ACTIVE CHAT ROOM VIEW -->
            <section class="chat-view hidden" id="chatView">
                <header class="chat-header">
                    <div class="active-char-info">
                        <button class="btn-close-chat" id="btnCloseChat" title="Tutup Chat (Kembali ke Explore Cards)">
                            <i class="fa-solid fa-chevron-left"></i>
                            <span>Explore</span>
                        </button>
                        <div class="avatar-circle active-avatar" id="headerAvatarWrapper">
                            <div class="avatar-fallback" id="headerAvatarFallback">B</div>
                        </div>
                        <div class="active-meta">
                            <div class="name-row">
                                <h2 class="active-name" id="headerCharName">Character Name</h2>
                                <span class="badge badge-nsfw" id="headerBadge">UNCENSORED</span>
                            </div>
                            <div class="active-status" id="headerCharTitle">Character Anime Title</div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <div class="affinity-meter-box" title="Skor Kedekatan Karakter" style="cursor: pointer;">
                            <div class="affinity-label">
                                <span><i class="fa-solid fa-heart"></i> Kedekatan:</span>
                                <strong id="headerAffinityScore">0/100</strong>
                            </div>
                            <div class="progress-bar-track">
                                <div class="progress-bar-fill" id="headerAffinityBar" style="width: 0%;"></div>
                            </div>
                        </div>
                        <button class="icon-action-btn" id="btnClearHistory" title="Bersihkan Chat History Karakter Ini">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </header>

                <!-- CHAT MESSAGES STREAM CONTAINER -->
                <div class="messages-container" id="messagesContainer">
                    <!-- Messages populated via JS -->
                </div>

                <!-- TYPING INDICATOR -->
                <div class="typing-indicator-bar hidden" id="typingIndicator">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <span id="typingText">Karakter sedang memproses balasan...</span>
                </div>

                <!-- INPUT CONTROL PANEL -->
                <div class="input-container">
                    <div class="input-glass-box">
                        <textarea id="messageInput" placeholder="Tulis obrolan atau aksi *roleplay* di sini... (Shift+Enter untuk baris baru)" rows="1"></textarea>
                        <button class="send-btn" id="btnSend">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="input-footer-info">
                        <span><i class="fa-solid fa-sparkles"></i> Gunakan tanda <code>*aksi fisik*</code> untuk narasi kontak fisik / ekspresi</span>
                        <span id="activeEngineBadge"><i class="fa-solid fa-brain"></i> Google Gemini (BLOCK_NONE Uncensored)</span>
                    </div>
                </div>
            </section>

        </main>
    </div>

    <!-- MODAL MEMORI FACTS SQLITE -->
    <div class="modal-overlay hidden" id="modalFacts">
        <div class="modal-card">
            <div class="modal-header">
                <h3><i class="fa-solid fa-brain"></i> Memori Facts Teresktraksi (SQLite)</h3>
                <button class="close-modal-btn" id="btnCloseFacts">&times;</button>
            </div>
            <div class="modal-body">
                <p class="modal-desc">Fakta-fakta tentang kamu yang otomatis dideteksi dan disimpan secara permanen di database SQLite untuk profil ini:</p>
                <div class="facts-grid" id="factsGrid">
                    <!-- Populated via JS -->
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL SETTINGS (GEMINI & LOCAL LLM) -->
    <div class="modal-overlay hidden" id="modalKey">
        <div class="modal-card">
            <div class="modal-header">
                <h3><i class="fa-solid fa-sliders"></i> Pengaturan Mesin AI (Laravel 13)</h3>
                <button class="close-modal-btn" id="btnCloseKey">&times;</button>
            </div>
            <div class="modal-body">
                <p class="modal-desc">Pilih dan kelola API Key Google Gemini (BLOCK_NONE 100% Bebas Sensor):</p>

                <div class="settings-section">
                    <label class="setting-label"><strong>🔑 Gemini API Key:</strong></label>
                    <div class="input-group">
                        <input type="password" id="inputGeminiKey" placeholder="Masukkan Gemini API Key..." autocomplete="off">
                    </div>
                    <label class="setting-label" style="margin-top: 8px;"><strong>✨ Model Gemini:</strong></label>
                    <div class="input-group">
                        <input type="text" id="inputGeminiModel" placeholder="gemini-2.5-flash" autocomplete="off">
                    </div>
                    <small style="color: #bc93aa; font-size: 12px; margin-top: 4px; display: block;">Tersedia: <code>gemini-2.5-flash</code>, <code>gemini-2.0-flash</code>, <code>gemini-flash-latest</code> (Semua filter dinonaktifkan dengan BLOCK_NONE)</small>
                </div>

                <div class="settings-section" style="margin-top: 14px; padding: 12px; background: rgba(0, 245, 212, 0.05); border: 1px solid rgba(0, 245, 212, 0.2); border-radius: 8px;">
                    <div style="font-size: 13px; color: #00f5d4;"><i class="fa-solid fa-images"></i> <strong>Dataset Pencarian Gambar:</strong></div>
                    <div style="font-size: 12px; color: #e0d0db; margin-top: 4px;">
                        Tersedia <strong>10.900+ Gambar 2D Anime Karakter</strong> di <code>dataset/dataset_index.json</code>. Chatbot otomatis mencocokkan outfit, pose, dan suasana obrolan langsung dari dataset.
                    </div>
                </div>

                <button class="btn-primary" id="btnSaveKey" style="width: 100%; margin-top: 16px;">Simpan Pengaturan</button>
                <div class="key-status-box" id="keyStatusBox" style="margin-top: 14px;"></div>
            </div>
        </div>
    </div>

    <!-- MODAL CHARACTER STUDIO (KHUSUS ADMIN) -->
    <div class="modal-overlay hidden" id="modalStudio">
        <div class="modal-card" style="width: 620px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-wand-magic-sparkles"></i> Character Studio (Visual Creator)</h3>
                <button class="close-modal-btn" id="btnCloseStudio">&times;</button>
            </div>
            <div class="modal-body">
                <p class="modal-desc">Buat karakter roleplay baru langsung ke database SQLite tanpa sentuh kodingan:</p>

                <form id="formCharacterStudio" onsubmit="return false;">
                    <input type="hidden" id="studioCharId" value="">

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="settings-section">
                            <label class="setting-label"><strong>Nama Karakter:</strong></label>
                            <input type="text" id="studioName" placeholder="Contoh: Kitagawa Marin" required style="width:100%; padding:8px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff;">
                        </div>
                        <div class="settings-section">
                            <label class="setting-label"><strong>Gelar / Asal Anime:</strong></label>
                            <input type="text" id="studioTitle" placeholder="Contoh: My Dress-Up Darling" style="width:100%; padding:8px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff;">
                        </div>
                    </div>

                    <div class="settings-section" style="margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <label class="setting-label"><strong>URL Foto Cover / Avatar:</strong></label>
                            <button type="button" id="btnOpenDatasetPicker" style="padding: 4px 10px; font-size: 11px; background: rgba(0, 245, 212, 0.15); border: 1px solid rgba(0, 245, 212, 0.4); color: #00f5d4; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                <i class="fa-solid fa-images"></i> <span>Browse 10.900+ Dataset</span>
                            </button>
                        </div>
                        <input type="text" id="studioAvatar" placeholder="https://cdn.donmai.us/sample/..." style="width:100%; padding:8px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff;">
                    </div>

                    <div class="settings-section" style="margin-top: 10px;">
                        <label class="setting-label"><strong>Tags Kategori (pisahkan dengan koma):</strong></label>
                        <input type="text" id="studioTags" placeholder="Female, Cosplay, Gyaru, NSFW" value="Female, Roleplay, NSFW" style="width:100%; padding:8px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff;">
                    </div>

                    <div class="settings-section" style="margin-top: 10px;">
                        <label class="setting-label"><strong>Kepribadian & Sifat (Persona):</strong></label>
                        <textarea id="studioPersona" rows="3" placeholder="Deskripsikan sifat, penampilan, dan ciri khas karakter..." required style="width:100%; padding:8px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff; resize:vertical;"></textarea>
                    </div>

                    <div class="settings-section" style="margin-top: 10px;">
                        <label class="setting-label"><strong>Kalimat Sapaan Awal (Greeting):</strong></label>
                        <textarea id="studioGreeting" rows="2" placeholder="*tersenyum manis* Halo! Senang bisa bertemu denganmu..." required style="width:100%; padding:8px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff; resize:vertical;"></textarea>
                    </div>

                    <div class="settings-section" style="margin-top: 10px;">
                        <label class="setting-label"><strong>Skenario Latar Belakang:</strong></label>
                        <input type="text" id="studioScenario" placeholder="Berdua di kamar kost sambil ngobrol santai..." style="width:100%; padding:8px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff;">
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 18px;">
                        <button type="button" class="btn-primary" id="btnSaveStudioChar" style="flex: 1;">💾 Simpan Karakter</button>
                        <button type="button" class="btn-secondary" id="btnCancelStudio" style="padding: 10px 18px; border-radius: 8px; background: rgba(255,255,255,0.1); border: none; color: #fff; cursor: pointer;">Batal</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- MODAL DATASET PHOTO PICKER FOR ADMIN -->
    <div class="modal-overlay hidden" id="modalDatasetPicker" style="z-index: 10000; background: rgba(0, 0, 0, 0.88); backdrop-filter: blur(10px);">
        <div class="modal-card" style="width: 780px; max-height: 88vh; overflow-y: auto;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-images"></i> Pilih Foto dari 10.900+ Dataset Danbooru</h3>
                <button class="close-modal-btn" id="btnCloseDatasetPicker">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <label class="setting-label"><strong>Pilih Karakter dari Dataset:</strong></label>
                        <select id="selectDatasetChar" style="width: 100%; padding: 8px 12px; background: #1e1330; border: 1px solid rgba(0, 245, 212, 0.4); border-radius: 8px; color: #00f5d4; font-weight: bold; cursor: pointer; outline: none;">
                            <option value="all">🌐 Semua 10.900+ Foto Dataset</option>
                            <option value="custom">🔍 Ketik Nama / Tag Karakter Baru...</option>
                            <option disabled>────────── 26 KARAKTER BAWAAN ──────────</option>
                            <option value="ai">Hoshino Ai (500 Foto)</option>
                            <option value="ruby">Hoshino Ruby (500 Foto)</option>
                            <option value="akane">Kurokawa Akane (500 Foto)</option>
                            <option value="asuna">Asuna Yuuki (500 Foto)</option>
                            <option value="tsunade">Tsunade (500 Foto)</option>
                            <option value="rias">Rias Gremory (500 Foto)</option>
                            <option value="hancock">Boa Hancock (468 Foto)</option>
                            <option value="nami">Nami (500 Foto)</option>
                            <option value="miku">Nakano Miku (500 Foto)</option>
                            <option value="itsuki">Nakano Itsuki (500 Foto)</option>
                            <option value="furina">Furina (500 Foto)</option>
                            <option value="ganyu">Ganyu (500 Foto)</option>
                            <option value="raiden">Raiden Shogun (500 Foto)</option>
                            <option value="lumine">Lumine (500 Foto)</option>
                            <option value="hutao">Hu Tao (500 Foto)</option>
                            <option value="yaemiko">Yae Miko (500 Foto)</option>
                            <option value="keqing">Keqing (500 Foto)</option>
                            <option value="barbara">Barbara (500 Foto)</option>
                            <option value="hinata">Hinata Hyuga (500 Foto)</option>
                            <option value="sakura">Sakura Haruno (500 Foto)</option>
                            <option value="ino">Yamanaka Ino (209 Foto)</option>
                            <option value="akeno">Akeno Himejima (500 Foto)</option>
                            <option value="aki">Aki Nijou (500 Foto)</option>
                            <option value="ikumi">Ikumi Mito (156 Foto)</option>
                            <option value="ebina">Ebina Nana (151 Foto)</option>
                            <option value="xilonen">Xilonen (208 Foto)</option>
                        </select>
                    </div>
                    <div>
                        <label class="setting-label"><strong>Pencarian / Filter Gaya / Pakaian:</strong></label>
                        <div style="display: flex; gap: 6px;">
                            <input type="text" id="inputDatasetTagFilter" placeholder="Ketik kata kunci (contoh: marin, bikini, cosplay, maid, sleep)..." style="flex: 1; padding: 8px 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff;">
                            <button type="button" class="btn-primary" id="btnRunDatasetSearch" style="padding: 8px 14px;"><i class="fa-solid fa-magnifying-glass"></i></button>
                        </div>
                    </div>
                </div>
                <div id="datasetPickerStatus" style="font-size: 12px; color: #00f5d4; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;"></div>
                <div id="datasetPickerGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; max-height: 50vh; overflow-y: auto; padding: 4px;">
                    <!-- Thumbnails populated via JS -->
                </div>
                <div style="text-align: center; margin-top: 14px;">
                    <button type="button" id="btnLoadMorePhotos" class="btn-secondary" style="display: none; padding: 10px 24px; border-radius: 8px; background: linear-gradient(135deg, rgba(0, 245, 212, 0.2), rgba(123, 44, 191, 0.2)); border: 1px solid #00f5d4; color: #00f5d4; font-weight: bold; cursor: pointer;">
                        <i class="fa-solid fa-cloud-arrow-down"></i> <span id="btnLoadMoreText">Muat 50 Foto Lagi</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL: KELOLA USER & AFFINITY (ADMIN) -->
    <div class="modal-overlay hidden" id="modalUserManagement" style="z-index: 1200;">
        <div class="modal-card" style="max-width: 800px; width: 95%;">
            <div class="modal-header">
                <h3 class="modal-title"><i class="fa-solid fa-users-gear"></i> Kelola User & Affinity Karakter (Admin)</h3>
                <button class="btn-close-modal" id="btnCloseUserManagement">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 75vh; overflow-y: auto;">
                <p style="font-size: 13px; color: #bc93aa; margin-bottom: 16px;">
                    Pantau semua akun pengguna di database lokal SQLite dan sesuaikan skor affinity karakter tiap pengguna secara presisi.
                </p>

                <!-- USER LIST VIEW -->
                <div id="adminUserListView">
                    <div class="table-responsive" style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                            <thead>
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.15); color: #00f5d4;">
                                    <th style="padding: 10px 8px;">Username</th>
                                    <th style="padding: 10px 8px;">Role</th>
                                    <th style="padding: 10px 8px;">Total Chat</th>
                                    <th style="padding: 10px 8px; text-align: right;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="adminUserTableBody">
                                <!-- Populated via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- USER AFFINITY DETAIL VIEW (SLIDE IN) -->
                <div id="adminUserAffinityDetailView" class="hidden" style="margin-top: 10px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; background: rgba(0,245,212,0.08); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(0,245,212,0.2);">
                        <div>
                            <span style="font-size: 11px; color: #bc93aa; text-transform: uppercase; font-weight: bold;">Mengatur Skor Affinity Untuk:</span>
                            <h4 id="adminTargetUserName" style="font-size: 16px; color: #fff; margin-top: 2px;">Nama User</h4>
                        </div>
                        <button type="button" class="btn-secondary" id="btnBackToUserList" style="padding: 6px 12px; font-size: 12px;">
                            <i class="fa-solid fa-chevron-left"></i> Kembali ke Daftar User
                        </button>
                    </div>

                    <div id="adminUserAffinityGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; max-height: 50vh; overflow-y: auto; padding: 4px;">
                        <!-- Populated via JS -->
                    </div>
                </div>

                <!-- USER CREDENTIALS EDIT VIEW (USERNAME & PASSWORD) -->
                <div id="adminUserEditCredentialsView" class="hidden" style="margin-top: 10px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; background: rgba(255,0,85,0.08); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,0,85,0.2);">
                        <div>
                            <span style="font-size: 11px; color: #ff8fab; text-transform: uppercase; font-weight: bold;">Edit Akun User:</span>
                            <h4 id="adminEditTargetNameHeader" style="font-size: 16px; color: #fff; margin-top: 2px;">Nama User</h4>
                        </div>
                        <button type="button" class="btn-secondary" id="btnBackFromEditToUserList" style="padding: 6px 12px; font-size: 12px;">
                            <i class="fa-solid fa-chevron-left"></i> Kembali ke Daftar User
                        </button>
                    </div>

                    <form id="formAdminEditUserCredentials" style="display: flex; flex-direction: column; gap: 14px;">
                        <input type="hidden" id="adminEditUserId">
                        <div>
                            <label class="setting-label"><strong>Username / Nama Akun:</strong></label>
                            <input type="text" id="adminEditUserName" required style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 14px;">
                        </div>

                        <div>
                            <label class="setting-label"><strong>Password Baru:</strong></label>
                            <input type="password" id="adminEditUserPassword" placeholder="Kosongkan jika tidak ingin mengubah password" style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 14px;">
                            <span style="font-size: 11px; color: #bc93aa;">Minimal 4 karakter. Jika dikosongkan, password lama tetap berlaku.</span>
                        </div>

                        <div>
                            <label class="setting-label"><strong>Role Akun:</strong></label>
                            <select id="adminEditUserRole" style="width: 100%; padding: 10px 12px; background: #1e1330; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #00f5d4; font-size: 14px;">
                                <option value="user">USER (Roleplay Normal)</option>
                                <option value="admin">ADMIN (Akses Penuh God Mode & Studio)</option>
                            </select>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
                            <button type="button" class="btn-secondary" id="btnCancelEditUserCredentials" style="padding: 10px 18px;">Batal</button>
                            <button type="submit" class="btn-primary" style="padding: 10px 22px; background: linear-gradient(135deg, #00f5d4, #00bbf9); color: #000; font-weight: bold;">
                                <i class="fa-solid fa-save"></i> Simpan Perubahan Akun
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- LIGHTBOX MODAL FOR FULL RESOLUTION IMAGES -->
    <div class="modal-overlay hidden" id="modalLightbox" style="z-index: 9999; background: rgba(0, 0, 0, 0.88); backdrop-filter: blur(10px);">
        <div style="position: relative; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <button id="btnCloseLightbox" style="position: absolute; top: -45px; right: 0; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 22px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
            <img id="lightboxImg" referrerpolicy="no-referrer" src="" alt="Full Character Photo" style="max-width: 90vw; max-height: 82vh; border-radius: 12px; object-fit: contain; box-shadow: 0 10px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">
            <div id="lightboxCaption" style="color: #bc93aa; font-size: 13px; margin-top: 10px; text-align: center;"></div>
        </div>
    </div>

    <script>
        window.IS_ADMIN = {{ $currentUser->isAdmin() ? 'true' : 'false' }};
    </script>
    <!-- Application JS -->
    <script src="{{ asset('static/app.js') }}"></script>
</body>

</html>
