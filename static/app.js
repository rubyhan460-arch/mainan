/* ==========================================================================
   SPICYSTUDIO - PERSONAL AI ROLEPLAY CLIENT LOGIC (SPICYCHAT CARDS & LIVE AI IMAGES)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // STATE
    let characters = [];
    let activeChar = null;
    let isSending = false;
    let currentFilter = 'all';

    // DOM VIEWS
    const exploreView = document.getElementById('exploreView');
    const chatView = document.getElementById('chatView');

    // NAV BUTTONS
    const navExplore = document.getElementById('navExplore');
    const navActiveChat = document.getElementById('navActiveChat');
    const navActiveChatLabel = document.getElementById('navActiveChatLabel');
    const btnCloseChat = document.getElementById('btnCloseChat');

    // EXPLORE GRID ELEMENTS
    const spicyGrid = document.getElementById('spicyGrid');
    const inputSearchChar = document.getElementById('inputSearchChar');
    const categoryPills = document.getElementById('categoryPills');

    // SIDEBAR & CHAT ELEMENTS
    const characterList = document.getElementById('characterList');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const btnSend = document.getElementById('btnSend');
    const typingIndicator = document.getElementById('typingIndicator');
    const typingText = document.getElementById('typingText');

    // HEADER ELEMENTS
    const headerAvatarWrapper = document.getElementById('headerAvatarWrapper');
    const headerAvatarFallback = document.getElementById('headerAvatarFallback');
    const headerCharName = document.getElementById('headerCharName');
    const headerCharTitle = document.getElementById('headerCharTitle');
    const headerBadge = document.getElementById('headerBadge');
    const headerAffinityScore = document.getElementById('headerAffinityScore');
    const headerAffinityBar = document.getElementById('headerAffinityBar');
    const btnClearHistory = document.getElementById('btnClearHistory');

    // MODALS
    const modalFacts = document.getElementById('modalFacts');
    const btnOpenFacts = document.getElementById('btnOpenFacts');
    const btnCloseFacts = document.getElementById('btnCloseFacts');
    const factsGrid = document.getElementById('factsGrid');

    const modalKey = document.getElementById('modalKey');
    const btnOpenKey = document.getElementById('btnOpenKey');
    const btnCloseKey = document.getElementById('btnCloseKey');
    const inputGroqKey = document.getElementById('inputGroqKey');
    const btnSaveKey = document.getElementById('btnSaveKey');
    const keyStatusBox = document.getElementById('keyStatusBox');

    // INITIALIZATION
    init();

    async function init() {
        await loadCharacters();
        await checkApiKeyStatus();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Nav Buttons
        navExplore.addEventListener('click', showExploreView);
        navActiveChat.addEventListener('click', () => {
            if (activeChar) {
                showChatView();
            } else if (characters.length > 0) {
                openChatView(characters[0].id);
            }
        });

        // CLOSE CHAT BUTTON -> Exit Chat Room & Return to Cards Grid
        btnCloseChat.addEventListener('click', () => {
            showExploreView();
        });

        // Search Input
        inputSearchChar.addEventListener('input', () => {
            renderSpicyGrid();
        });

        // Category Pills Filter
        categoryPills.addEventListener('click', (e) => {
            const pill = e.target.closest('.pill');
            if (!pill) return;
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter || 'all';
            renderSpicyGrid();
        });

        // Send Message
        btnSend.addEventListener('click', handleSendMessage);
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        // Clear history button
        btnClearHistory.addEventListener('click', handleClearHistory);

        // Modals
        btnOpenFacts.addEventListener('click', openFactsModal);
        btnCloseFacts.addEventListener('click', () => modalFacts.classList.add('hidden'));

        btnOpenKey.addEventListener('click', openKeyModal);
        btnCloseKey.addEventListener('click', () => modalKey.classList.add('hidden'));
        btnSaveKey.addEventListener('click', handleSaveKey);

        // Close modal on overlay click
        modalFacts.addEventListener('click', (e) => {
            if (e.target === modalFacts) modalFacts.classList.add('hidden');
        });
        modalKey.addEventListener('click', (e) => {
            if (e.target === modalKey) modalKey.classList.add('hidden');
        });
    }

    // VIEW SWITCHING
    function showExploreView() {
        exploreView.classList.remove('hidden');
        chatView.classList.add('hidden');
        navExplore.classList.add('active');
        navActiveChat.classList.remove('active');
    }

    function showChatView() {
        exploreView.classList.add('hidden');
        chatView.classList.remove('hidden');
        navExplore.classList.remove('active');
        navActiveChat.classList.add('active');
    }

    // LOAD CHARACTERS
    async function loadCharacters() {
        try {
            const res = await fetch('/api/characters');
            characters = await res.json();
            renderSidebarList();
            renderSpicyGrid();
        } catch (err) {
            console.error("Error loading characters:", err);
            sidebarList.innerHTML = `<div class="error-box">Gagal memuat karakter!</div>`;
        }
    }

    // RENDER SPICYCHAT CARDS GRID IN EXPLORE VIEW
    function renderSpicyGrid() {
        spicyGrid.innerHTML = '';
        const searchQuery = inputSearchChar.value.toLowerCase().trim();

        const filtered = characters.filter(c => {
            const allowNsfw = c.allow_nsfw || false;
            const strictness = c.strictness || 'low';

            // Filter Category Pill
            if (currentFilter === 'nsfw' && !(allowNsfw && strictness === 'low')) return false;
            if (currentFilter === 'medium' && strictness !== 'medium') return false;
            if (currentFilter === 'safe' && allowNsfw) return false;

            // Filter Search Text
            if (searchQuery) {
                const nameMatch = c.name.toLowerCase().includes(searchQuery);
                const titleMatch = (c.title || '').toLowerCase().includes(searchQuery);
                const scenarioMatch = (c.scenario || '').toLowerCase().includes(searchQuery);
                const tagMatch = (c.tags || []).some(t => t.toLowerCase().includes(searchQuery));
                return nameMatch || titleMatch || scenarioMatch || tagMatch;
            }

            return true;
        });

        if (filtered.length === 0) {
            spicyGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Tidak ada karakter yang cocok dengan kriteria pencarian.</div>`;
            return;
        }

        filtered.forEach(c => {
            const card = document.createElement('div');
            card.className = 'spicy-card';

            const initial = c.name ? c.name.charAt(0).toUpperCase() : 'B';
            const allowNsfw = c.allow_nsfw || false;
            const strictness = c.strictness || 'low';

            let badgeClass = 'badge-safe';
            let badgeText = 'SAFE';
            if (allowNsfw && strictness === 'low') {
                badgeClass = 'badge-nsfw';
                badgeText = 'UNCENSORED';
            } else if (strictness === 'medium') {
                badgeClass = 'badge-medium';
                badgeText = 'MEDIUM';
            }

            const creator = c.creator || '@creator_dev';
            const tags = c.tags || ['Female', 'Roleplay', 'Anime'];
            const scenario = c.scenario || c.persona.substring(0, 70) + '...';
            const avatarUrl = c.avatar_url || '';

            const coverHTML = avatarUrl 
                ? `<img src="${avatarUrl}" class="spicy-cover-img" alt="${c.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                   <div class="spicy-cover-initial" style="display:none;">${initial}</div>`
                : `<div class="spicy-cover-initial">${initial}</div>`;

            card.innerHTML = `
                <div class="spicy-cover-box">
                    <span class="badge ${badgeClass} spicy-badge-top">${badgeText}</span>
                    <button class="spicy-opts-btn" title="Options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                    ${coverHTML}
                </div>
                <div class="spicy-card-body">
                    <h3 class="spicy-card-name">${c.name}</h3>
                    <div class="spicy-card-creator">${creator}</div>
                    <p class="spicy-card-desc">${scenario}</p>
                    <div class="spicy-card-tags">
                        ${tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
                    </div>
                    <div class="spicy-card-footer">
                        <span class="stat-item"><i class="fa-solid fa-comments"></i> 253.9k</span>
                        <span class="stat-item"><i class="fa-solid fa-thumbs-up"></i> 98%</span>
                        <span class="stat-item"><i class="fa-solid fa-heart"></i> ${c.current_affinity || 10}%</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => openChatView(c.id));
            spicyGrid.appendChild(card);
        });
    }

    // RENDER SIDEBAR LIST
    function renderSidebarList() {
        characterList.innerHTML = '';
        characters.forEach(c => {
            const card = document.createElement('div');
            card.className = `character-card ${activeChar && activeChar.id === c.id ? 'active' : ''}`;
            card.dataset.id = c.id;

            const initial = c.name ? c.name.charAt(0).toUpperCase() : 'B';
            const affinity = c.current_affinity || 10;
            const allowNsfw = c.allow_nsfw || false;
            const strictness = c.strictness || 'low';
            const avatarUrl = c.avatar_url || '';

            let badgeClass = 'badge-safe';
            let badgeText = 'SAFE';
            if (allowNsfw && strictness === 'low') {
                badgeClass = 'badge-nsfw';
                badgeText = 'UNCENSORED';
            } else if (strictness === 'medium') {
                badgeClass = 'badge-medium';
                badgeText = 'MEDIUM';
            }

            const avatarHTML = avatarUrl 
                ? `<img src="${avatarUrl}" alt="${c.name}" onerror="this.parentNode.innerHTML='${initial}'">`
                : initial;

            card.innerHTML = `
                <div class="avatar-circle">${avatarHTML}</div>
                <div class="card-meta">
                    <div class="card-name">${c.name}</div>
                    <div class="card-tag"><span class="badge ${badgeClass}">${badgeText}</span></div>
                    <div class="card-affinity-mini">
                        <i class="fa-solid fa-heart"></i>
                        <div class="mini-bar-track">
                            <div class="mini-bar-fill" style="width: ${affinity}%;"></div>
                        </div>
                        <span>${affinity}%</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => openChatView(c.id));
            characterList.appendChild(card);
        });
    }

    // OPEN CHAT VIEW FOR SELECTED CHARACTER
    async function openChatView(charId) {
        const char = characters.find(c => c.id === charId);
        if (!char) return;

        activeChar = char;
        navActiveChatLabel.textContent = char.name;
        renderSidebarList(); // Refresh active card UI in sidebar

        // DYNAMIC THEME SWITCHING BASED ON CHARACTER TYPE
        const allowNsfw = char.allow_nsfw || false;
        const strictness = char.strictness || 'low';

        let theme = 'safe';
        if (allowNsfw && strictness === 'low') {
            theme = 'nsfw'; // Love Hotel Velvet Crimson & Neon Pink
        } else if (strictness === 'medium') {
            theme = 'medium'; // Dim Classy Violet & Royal Purple Lounge
        } else {
            theme = 'safe'; // Bright Energetic Star Indigo
        }

        document.documentElement.setAttribute('data-theme', theme);

        // UPDATE CHAT HEADER INFO
        const initial = char.name ? char.name.charAt(0).toUpperCase() : 'B';
        const avatarUrl = char.avatar_url || '';

        if (avatarUrl) {
            headerAvatarWrapper.innerHTML = `<img src="${avatarUrl}" alt="${char.name}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            headerAvatarWrapper.innerHTML = `<div class="avatar-fallback" id="headerAvatarFallback">${initial}</div>`;
        }

        headerCharName.textContent = char.name;
        headerCharTitle.textContent = char.title || '';

        const affinity = char.current_affinity || 10;
        headerAffinityScore.textContent = `${affinity}/100`;
        headerAffinityBar.style.width = `${affinity}%`;

        // Update Badge
        if (theme === 'nsfw') {
            headerBadge.className = 'badge badge-nsfw';
            headerBadge.textContent = 'UNCENSORED';
        } else if (theme === 'medium') {
            headerBadge.className = 'badge badge-medium';
            headerBadge.textContent = 'MEDIUM';
        } else {
            headerBadge.className = 'badge badge-safe';
            headerBadge.textContent = 'SAFE/STRICT';
        }

        showChatView();

        // LOAD CHAT HISTORY FOR THIS CHARACTER
        await loadChatHistory(charId);
    }

    // LOAD CHAT HISTORY
    async function loadChatHistory(charId) {
        messagesContainer.innerHTML = '';
        try {
            const res = await fetch(`/api/history/${charId}`);
            const history = await res.json();

            if (history.length === 0) {
                // If history is empty, pick a random greeting from greetings array or fallback
                const greetingsList = activeChar.greetings || [activeChar.greeting || "Halo!"];
                const randomGreeting = greetingsList[Math.floor(Math.random() * greetingsList.length)];
                appendMessage(activeChar.name, randomGreeting, 'char');
            } else {
                history.forEach(item => {
                    const senderType = item.sender === activeChar.name ? 'char' : 'user';
                    appendMessage(item.sender, item.message, senderType);
                });
            }
            scrollToBottom();
        } catch (err) {
            console.error("Error loading chat history:", err);
        }
    }

    // FORMAT & APPEND MESSAGE TO STREAM WITH REAL LIVE IMAGE GENERATION
    function appendMessage(sender, text, type) {
        const row = document.createElement('div');
        row.className = `message-row ${type}-row`;

        const nameSpan = document.createElement('div');
        nameSpan.className = 'sender-name';
        nameSpan.textContent = sender;

        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        // Check for Image Trigger Tag
        let formattedText = text;
        let imageTrigger = null;

        if (formattedText.includes('[IMAGE_TRIGGER:')) {
            const parts = formattedText.split('[IMAGE_TRIGGER:');
            formattedText = parts[0];
            const promptStr = parts[1].split(']')[0];
            imageTrigger = promptStr.trim ? promptStr.trim() : promptStr;
        }

        // Parse *actions* into glowing italicized tags
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<em class="action-text">*$1*</em>');

        bubble.innerHTML = formattedText.replace(/\n/g, '<br>');

        // APPEND 100% ACCURATE CURATED LOCAL CHARACTER PHOTO BASED ON SCENARIO PROMPT
        if (imageTrigger) {
            const triggerCard = document.createElement('div');
            triggerCard.className = 'generated-image-card';
            const imgId = 'ai-img-' + Math.floor(Math.random() * 999999);

            triggerCard.innerHTML = `
                <div class="image-header" id="hdr-${imgId}">
                    <i class="fa-solid fa-bolt"></i>
                    <span><strong>🚀 Meminta GPU Colab Menggambar Foto ${activeChar ? activeChar.name : ''}...</strong></span>
                </div>
                <div class="image-wrapper-box">
                    <div class="image-loading-spinner" id="spin-${imgId}">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <span>Sedang menggambar via Free Colab GPU (NVIDIA T4)...</span>
                    </div>
                    <img id="${imgId}" 
                         alt="${imageTrigger}" 
                         class="rendered-ai-img hidden"
                         onload="this.classList.remove('hidden'); const sp = document.getElementById('spin-${imgId}'); if(sp) sp.style.display='none'; if(window.scrollToBottom) window.scrollToBottom();"
                         onerror="const sp = document.getElementById('spin-${imgId}'); if(sp) sp.innerHTML='⚠️ Gagal memuat foto.';"
                    >
                </div>
                <div class="image-prompt-caption">Skenario: <em>"${imageTrigger}"</em></div>
            `;
            bubble.appendChild(triggerCard);

            // Fetch Image asynchronously from Colab GPU proxy
            (async () => {
                const imgElem = triggerCard.querySelector('.rendered-ai-img');
                const hdrElem = triggerCard.querySelector('.image-header');
                const visualAnchor = activeChar ? (activeChar.visual_prompt || activeChar.name) : '';
                const fullImagePrompt = `masterpiece, 2d anime style, ${visualAnchor}, ${imageTrigger}`;
                const seed = Math.floor(Math.random() * 9999999);
                const dynamicAnimeUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullImagePrompt)}?model=anime&nologo=true&width=512&height=512&seed=${seed}`;

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 6000);

                    const res = await fetch('/api/generate_lora_image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                        body: JSON.stringify({
                            char_id: activeChar ? activeChar.id : 'char',
                            prompt: imageTrigger
                        })
                    });
                    clearTimeout(timeoutId);
                    const data = await res.json();
                    if (data.status === 'success' && data.image_b64) {
                        if (imgElem) imgElem.src = data.image_b64;
                        if (hdrElem) hdrElem.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles" style="color: #00f5d4;"></i> <span><strong>✨ Foto AI Baru Digambar via Colab GPU Engine!</strong></span>`;
                        return;
                    }
                } catch (err) {
                    console.log("Colab GPU Proxy timeout/failed, using dynamic 2D anime AI fallback");
                }

                // Dynamic 2D Anime AI Fallback (Guaranteed unique per prompt)
                if (imgElem) imgElem.src = dynamicAnimeUrl;
                if (hdrElem) hdrElem.innerHTML = `<i class="fa-solid fa-wand-magic" style="color: #ff758f;"></i> <span><strong>🎨 Foto 2D Anime Digambar Sesuai Prompt (AI Engine)</strong></span>`;
            })();
        }

        row.appendChild(nameSpan);
        row.appendChild(bubble);
        messagesContainer.appendChild(row);
        scrollToBottom();
    }

    // HANDLE SEND MESSAGE
    async function handleSendMessage() {
        if (isSending || !activeChar) return;
        const text = messageInput.value.trim();
        if (!text) return;

        isSending = true;
        messageInput.value = '';

        // Append User Message to UI
        appendMessage('You', text, 'user');

        // Show Typing Indicator
        typingText.textContent = `${activeChar.name} sedang memproses balasan...`;
        typingIndicator.classList.remove('hidden');
        scrollToBottom();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    char_id: activeChar.id,
                    message: text
                })
            });

            const data = await res.json();
            typingIndicator.classList.add('hidden');

            if (data.status === 'success') {
                appendMessage(data.sender, data.message, 'char');

                // Update Affinity Score
                if (data.affinity_score) {
                    activeChar.current_affinity = data.affinity_score;
                    headerAffinityScore.textContent = `${data.affinity_score}/100`;
                    headerAffinityBar.style.width = `${data.affinity_score}%`;
                    renderSidebarList();
                    renderSpicyGrid();
                }
            } else {
                appendMessage('System', 'Gagal mendapatkan respon dari server.', 'char');
            }
        } catch (err) {
            console.error("Error sending message:", err);
            typingIndicator.classList.add('hidden');
            appendMessage('System', 'Terjadi kesalahan koneksi.', 'char');
        } finally {
            isSending = false;
        }
    }

    // CLEAR HISTORY
    async function handleClearHistory() {
        if (!activeChar) return;
        if (!confirm(`Bersihkan semua riwayat obrolan dengan ${activeChar.name}?`)) return;

        try {
            await fetch(`/api/clear/${activeChar.id}`, { method: 'POST' });
            await loadChatHistory(activeChar.id);
        } catch (err) {
            console.error("Error clearing history:", err);
        }
    }

    // FACTS MODAL
    async function openFactsModal() {
        modalFacts.classList.remove('hidden');
        factsGrid.innerHTML = '<div class="loading-skeleton">Memuat fakta...</div>';

        try {
            const res = await fetch('/api/facts');
            const facts = await res.json();

            factsGrid.innerHTML = '';
            const keys = Object.keys(facts);
            if (keys.length === 0) {
                factsGrid.innerHTML = '<div class="fact-item">Belum ada fakta terdeteksi di SQLite DB</div>';
            } else {
                keys.forEach(k => {
                    const item = document.createElement('div');
                    item.className = 'fact-item';
                    item.innerHTML = `
                        <span class="fact-key">${k}</span>
                        <span class="fact-val">${facts[k]}</span>
                    `;
                    factsGrid.appendChild(item);
                });
            }
        } catch (err) {
            console.error("Error fetching facts:", err);
        }
    }

    // KEY MODAL
    async function openKeyModal() {
        modalKey.classList.remove('hidden');
        await checkApiKeyStatus();
    }

    async function checkApiKeyStatus() {
        try {
            const res = await fetch('/api/key');
            const data = await res.json();

            const inputGeminiKey = document.getElementById('inputGeminiKey');
            const inputGroqKey = document.getElementById('inputGroqKey');
            const inputColabUrl = document.getElementById('inputColabUrl');

            if (data.colab_gpu_url) inputColabUrl.value = data.colab_gpu_url;

            let html = '';
            if (data.has_gemini_key) {
                html += `<div style="color: #00f5d4;"><i class="fa-solid fa-check"></i> Gemini 1.5 API Key Aktif (${data.gemini_preview})</div>`;
            } else {
                html += `<div style="color: #ffb703;"><i class="fa-solid fa-circle-info"></i> Gemini API Key belum diisi (Opsional)</div>`;
            }

            if (data.has_groq_key) {
                html += `<div style="color: #00f5d4;"><i class="fa-solid fa-check"></i> Groq Llama-3.3 API Key Aktif (${data.groq_preview})</div>`;
            } else {
                html += `<div style="color: #ffb703;"><i class="fa-solid fa-circle-info"></i> Groq API Key belum diisi (Opsional)</div>`;
            }

            if (data.colab_gpu_url) {
                html += `<div style="color: #00f5d4;"><i class="fa-solid fa-bolt"></i> Colab GPU Engine Tunnel Connected!</div>`;
            } else {
                html += `<div style="color: #bc93aa;"><i class="fa-solid fa-info-circle"></i> Engine Gambar: Menggunakan Dataset Local & Pollinations Model Anime</div>`;
            }

            keyStatusBox.innerHTML = html;
        } catch (err) {
            console.error("Error checking key status:", err);
        }
    }

    async function handleSaveKey() {
        const gemini_key = document.getElementById('inputGeminiKey').value.trim();
        const groq_key = document.getElementById('inputGroqKey').value.trim();
        const colab_url = document.getElementById('inputColabUrl').value.trim();

        try {
            if (gemini_key || groq_key) {
                await fetch('/api/key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gemini_key, groq_key })
                });
            }

            if (colab_url !== undefined) {
                await fetch('/api/colab_gpu', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ colab_url })
                });
            }

            await checkApiKeyStatus();
            alert('Pengaturan API & GPU Engine berhasil disimpan!');
            modalKey.classList.add('hidden');
        } catch (err) {
            console.error("Error saving settings:", err);
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    window.scrollToBottom = scrollToBottom;
});
