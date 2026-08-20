/* ==========================================================================
   SPICYSTUDIO - PERSONAL AI ROLEPLAY CLIENT LOGIC (UNCENSORED ENGINE & DYNAMIC DATASET IMAGES)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // STATE
    let characters = [];
    let activeChar = null;
    let isSending = false;
    let currentFilter = 'all';
    let sessionImageHistory = {}; // char_id -> [urls] to prevent duplicate images in same session

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
    const activeEngineBadge = document.getElementById('activeEngineBadge');

    // HEADER ELEMENTS
    const headerAvatarWrapper = document.getElementById('headerAvatarWrapper');
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
    const selectLlmEngine = document.getElementById('selectLlmEngine');
    const inputGeminiKey = document.getElementById('inputGeminiKey');
    const inputGeminiModel = document.getElementById('inputGeminiModel');
    const inputPollinationsModel = document.getElementById('inputPollinationsModel');
    const inputLocalUrl = document.getElementById('inputLocalUrl');
    const inputLocalModel = document.getElementById('inputLocalModel');
    const btnSaveKey = document.getElementById('btnSaveKey');
    const keyStatusBox = document.getElementById('keyStatusBox');
    const sectionGemini = document.getElementById('sectionGemini');
    const sectionPollinations = document.getElementById('sectionPollinations');
    const sectionLocalLlm = document.getElementById('sectionLocalLlm');

    // LIGHTBOX ELEMENTS
    const modalLightbox = document.getElementById('modalLightbox');
    const btnCloseLightbox = document.getElementById('btnCloseLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');

    // MOBILE DRAWER ELEMENTS
    const btnMobileMenuToggle = document.getElementById('btnMobileMenuToggle');
    const btnMobileOpenKey = document.getElementById('btnMobileOpenKey');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const appSidebar = document.getElementById('appSidebar');

    function closeMobileSidebar() {
        if (appSidebar) appSidebar.classList.remove('mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');
    }

    function openMobileSidebar() {
        if (appSidebar) appSidebar.classList.add('mobile-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('hidden');
    }

    if (btnMobileMenuToggle) {
        btnMobileMenuToggle.addEventListener('click', () => {
            if (appSidebar && appSidebar.classList.contains('mobile-open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }

    if (btnMobileOpenKey) {
        btnMobileOpenKey.addEventListener('click', () => {
            closeMobileSidebar();
            openKeyModal();
        });
    }

    document.addEventListener('click', (e) => {
        if (appSidebar && appSidebar.classList.contains('mobile-open')) {
            const isClickInsideSidebar = appSidebar.contains(e.target);
            const isClickToggleBtn = btnMobileMenuToggle && btnMobileMenuToggle.contains(e.target);
            if (!isClickInsideSidebar && !isClickToggleBtn) {
                closeMobileSidebar();
            }
        }
    });

    // LIGHTBOX HELPERS
    function openLightbox(src, captionText) {
        if (!modalLightbox || !lightboxImg) return;
        lightboxImg.src = src;
        if (lightboxCaption) lightboxCaption.textContent = captionText || '';
        modalLightbox.classList.remove('hidden');
    }

    function closeLightbox() {
        if (!modalLightbox) return;
        modalLightbox.classList.add('hidden');
        if (lightboxImg) lightboxImg.src = '';
    }

    if (btnCloseLightbox) {
        btnCloseLightbox.addEventListener('click', closeLightbox);
    }
    if (modalLightbox) {
        modalLightbox.addEventListener('click', (e) => {
            if (e.target === modalLightbox) closeLightbox();
        });
    }

    // INITIALIZATION
    init();

    async function init() {
        await loadCharacters();
        await checkSettingsStatus();
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

        // Close Chat Button
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

        // Auto-expand textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        });

        // Clear History
        btnClearHistory.addEventListener('click', handleClearHistory);

        // Facts Modal
        btnOpenFacts.addEventListener('click', openFactsModal);
        btnCloseFacts.addEventListener('click', () => modalFacts.classList.add('hidden'));

        // Settings Modal
        btnOpenKey.addEventListener('click', openKeyModal);
        btnCloseKey.addEventListener('click', () => modalKey.classList.add('hidden'));
        btnSaveKey.addEventListener('click', handleSaveSettings);

        // Affinity Score Click to Edit
        const affinityMeterBox = document.querySelector('.affinity-meter-box');
        if (affinityMeterBox) {
            affinityMeterBox.style.cursor = 'pointer';
            affinityMeterBox.title = 'Klik untuk mengubah Affinity Score (0-100)';
            affinityMeterBox.addEventListener('click', async () => {
                if (!activeChar) return;
                const current = activeChar.current_affinity || 10;
                const inputVal = prompt(`Ubah Affinity Score untuk ${activeChar.name} (0 - 100):`, current);
                if (inputVal === null) return;
                const num = parseInt(inputVal, 10);
                if (isNaN(num) || num < 0 || num > 100) {
                    alert('Masukkan angka antara 0 sampai 100.');
                    return;
                }
                try {
                    const res = await fetch(`/api/affinity/${activeChar.id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: num })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        activeChar.current_affinity = data.affinity_score;
                        headerAffinityScore.textContent = `${data.affinity_score}/100`;
                        headerAffinityBar.style.width = `${data.affinity_score}%`;
                        renderSidebarList();
                        renderSpicyGrid();
                    }
                } catch (err) {
                    console.error("Error updating affinity score:", err);
                }
            });
        }

        if (selectLlmEngine) {
            selectLlmEngine.addEventListener('change', () => {
                const engine = selectLlmEngine.value;
                if (sectionGemini) sectionGemini.style.display = engine === 'gemini' ? 'block' : 'none';
                if (sectionLocalLlm) sectionLocalLlm.style.display = engine === 'local' ? 'block' : 'none';
                if (sectionPollinations) sectionPollinations.style.display = engine === 'pollinations' ? 'block' : 'none';
            });
        }
    }

    // VIEW SWITCHERS
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
        scrollToBottom();
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
            characterList.innerHTML = '<div style="color:red; padding:10px;">Gagal memuat karakter</div>';
        }
    }

    // RENDER EXPLORE GRID
    function renderSpicyGrid() {
        spicyGrid.innerHTML = '';
        const search = inputSearchChar.value.toLowerCase().trim();

        const filtered = characters.filter(c => {
            const allowNsfw = c.allow_nsfw || false;
            const strictness = (c.strictness || (allowNsfw ? 'uncensored' : 'high')).toLowerCase();
            const isUncen = allowNsfw && (strictness === 'low' || strictness === 'uncensored' || strictness === 'nsfw');
            const isMedium = allowNsfw && (strictness === 'medium');
            const isSafe = !allowNsfw || strictness === 'high' || strictness === 'safe';

            if (currentFilter === 'nsfw' && !isUncen) return false;
            if (currentFilter === 'medium' && !isMedium) return false;
            if (currentFilter === 'safe' && !isSafe) return false;

            if (search) {
                const matchName = c.name && c.name.toLowerCase().includes(search);
                const matchTitle = c.title && c.title.toLowerCase().includes(search);
                const matchTags = c.tags && c.tags.some(t => t.toLowerCase().includes(search));
                return matchName || matchTitle || matchTags;
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
            const strictness = (c.strictness || (allowNsfw ? 'uncensored' : 'high')).toLowerCase();

            const isUncen = allowNsfw && (strictness === 'low' || strictness === 'uncensored' || strictness === 'nsfw');
            const isMedium = allowNsfw && (strictness === 'medium');

            let badgeClass = 'badge-safe';
            let badgeText = 'SAFE';
            if (isUncen) {
                badgeClass = 'badge-nsfw';
                badgeText = 'UNCENSORED';
            } else if (isMedium) {
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
            const strictness = (c.strictness || (allowNsfw ? 'uncensored' : 'high')).toLowerCase();
            const avatarUrl = c.avatar_url || '';

            let badgeClass = 'badge-safe';
            let badgeText = 'SAFE';
            if (allowNsfw && (strictness === 'low' || strictness === 'uncensored' || strictness === 'nsfw')) {
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
        closeMobileSidebar();
        const char = characters.find(c => c.id === charId);
        if (!char) return;

        activeChar = char;
        navActiveChatLabel.textContent = char.name;
        renderSidebarList();

        // DYNAMIC THEME
        const allowNsfw = char.allow_nsfw || false;
        const strictness = (char.strictness || (allowNsfw ? 'uncensored' : 'high')).toLowerCase();

        let theme = 'safe';
        if (allowNsfw && (strictness === 'low' || strictness === 'uncensored' || strictness === 'nsfw')) {
            theme = 'nsfw'; // Velvet Crimson & Neon Glow
        } else if (strictness === 'medium') {
            theme = 'medium'; // Royal Violet Lounge
        } else {
            theme = 'safe'; // Star Indigo
        }

        document.documentElement.setAttribute('data-theme', theme);

        // UPDATE HEADER
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
        await loadChatHistory(charId);
    }

    // LOAD CHAT HISTORY
    async function loadChatHistory(charId) {
        messagesContainer.innerHTML = '';
        try {
            const res = await fetch(`/api/history/${charId}`);
            const history = await res.json();

            if (history.length === 0) {
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

    // FORMAT & APPEND MESSAGE TO STREAM WITH DYNAMIC DATASET IMAGE SEARCH
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
            formattedText = parts[0].trim();
            const promptStr = parts[1].split(']')[0];
            imageTrigger = promptStr.trim ? promptStr.trim() : promptStr;
        }

        // Parse *actions* into glowing italicized tags
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<em class="action-text">*$1*</em>');
        bubble.innerHTML = formattedText.replace(/\n/g, '<br>');

        // RENDER DYNAMIC DATASET IMAGE IF REQUESTED
        if (imageTrigger) {
            const triggerCard = document.createElement('div');
            triggerCard.className = 'generated-image-card';
            const imgId = 'ds-img-' + Math.floor(Math.random() * 999999);

            triggerCard.innerHTML = `
                <div class="image-header" id="hdr-${imgId}" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-camera-retro"></i>
                        <span><strong>📸 Mencari Foto ${activeChar ? activeChar.name : ''} dari Dataset...</strong></span>
                    </div>
                </div>
                <div class="image-wrapper-box" style="cursor: pointer;" title="Klik untuk memperbesar foto">
                    <div class="image-loading-spinner" id="spin-${imgId}">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <span>Mencocokkan skenario dengan ribuan foto di Dataset Parquet...</span>
                    </div>
                    <img id="${imgId}" 
                         alt="${imageTrigger}" 
                         class="rendered-ai-img hidden"
                         onload="this.classList.remove('hidden'); const sp = document.getElementById('spin-${imgId}'); if(sp) sp.style.display='none'; if(window.scrollToBottom) window.scrollToBottom();"
                         onerror="const sp = document.getElementById('spin-${imgId}'); if(sp) sp.innerHTML='⚠️ Gagal memuat foto dataset.';"
                    >
                </div>
                <div class="image-prompt-caption" id="cap-${imgId}">
                    <span>Skenario: <em>"${imageTrigger}"</em></span>
                    <span id="tags-${imgId}" style="margin-left: 8px; color: #00f5d4; font-size: 11px;"></span>
                </div>
            `;
            bubble.appendChild(triggerCard);

            // Function to fetch/regenerate image
            async function fetchDatasetImage(isRegen = false) {
                const imgElem = triggerCard.querySelector('.rendered-ai-img');
                const hdrElem = triggerCard.querySelector('.image-header');
                const tagsElem = document.getElementById(`tags-${imgId}`);
                const spinElem = document.getElementById(`spin-${imgId}`);
                const charId = activeChar ? activeChar.id : 'char';

                if (isRegen) {
                    if (spinElem) {
                        spinElem.style.display = 'flex';
                        spinElem.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Mencari variasi foto lain yang cocok...</span>`;
                    }
                    if (imgElem) imgElem.classList.add('hidden');
                    const curBtn = triggerCard.querySelector('.btn-regen-photo');
                    if (curBtn) {
                        curBtn.disabled = true;
                        curBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> <span>Mencari...</span>`;
                    }
                }

                if (!sessionImageHistory[charId]) {
                    sessionImageHistory[charId] = [];
                }

                try {
                    const res = await fetch('/api/search_character_image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            char_id: charId,
                            prompt: imageTrigger,
                            excluded_urls: sessionImageHistory[charId]
                        })
                    });

                    const data = await res.json();
                    if (data.status === 'success' && data.image_url) {
                        const finalUrl = data.image_url;
                        sessionImageHistory[charId].push(finalUrl);

                        if (imgElem) {
                            imgElem.src = finalUrl;
                            imgElem.onclick = () => {
                                openLightbox(finalUrl, `${activeChar ? activeChar.name : ''} - ${imageTrigger}`);
                            };
                        }
                        if (hdrElem) {
                            hdrElem.innerHTML = `
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <i class="fa-solid fa-images" style="color: #00f5d4;"></i> 
                                    <span><strong>✨ Foto ${activeChar ? activeChar.name : 'Karakter'}</strong></span>
                                </div>
                                <button class="btn-regen-photo" title="Cari / Acak foto lain dari dataset yang cocok dengan skenario ini">
                                    <i class="fa-solid fa-arrows-rotate"></i> <span>Ganti Foto</span>
                                </button>
                            `;
                            const newRegenBtn = hdrElem.querySelector('.btn-regen-photo');
                            if (newRegenBtn) {
                                newRegenBtn.onclick = (e) => {
                                    e.stopPropagation();
                                    fetchDatasetImage(true);
                                };
                            }
                        }
                        if (tagsElem && data.matched_tags && data.matched_tags.length > 0) {
                            tagsElem.innerHTML = `• Tag Cocok: <em>${data.matched_tags.join(', ')}</em>`;
                        }
                        return;
                    }
                } catch (err) {
                    console.error("Dataset search error:", err);
                }

                // Fallback to avatar if search returned nothing
                if (imgElem && activeChar && activeChar.avatar_url) {
                    imgElem.src = activeChar.avatar_url;
                }
            }

            fetchDatasetImage(false);
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
        messageInput.style.height = 'auto';

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
                if (data.affinity_score !== undefined) {
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
            if (sessionImageHistory[activeChar.id]) {
                sessionImageHistory[activeChar.id] = [];
            }
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

    // SETTINGS MODAL
    async function openKeyModal() {
        modalKey.classList.remove('hidden');
        await checkSettingsStatus();
    }

    async function checkSettingsStatus() {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();

            if (selectLlmEngine && data.llm_engine) {
                selectLlmEngine.value = data.llm_engine;
            }
            if (inputGeminiKey && data.gemini_api_key) {
                inputGeminiKey.value = data.gemini_api_key;
            }
            if (inputGeminiModel && data.gemini_model) {
                inputGeminiModel.value = data.gemini_model;
            }
            if (inputPollinationsModel && data.pollinations_model) {
                inputPollinationsModel.value = data.pollinations_model;
            }
            if (inputLocalUrl && data.local_llm_url) {
                inputLocalUrl.value = data.local_llm_url;
            }
            if (inputLocalModel && data.local_llm_model) {
                inputLocalModel.value = data.local_llm_model;
            }

            const engine = data.llm_engine || 'gemini';
            if (sectionGemini) sectionGemini.style.display = engine === 'gemini' ? 'block' : 'none';
            if (sectionLocalLlm) sectionLocalLlm.style.display = engine === 'local' ? 'block' : 'none';
            if (sectionPollinations) sectionPollinations.style.display = engine === 'pollinations' ? 'block' : 'none';

            let html = '';
            if (engine === 'gemini') {
                html += `<div style="color: #00f5d4;"><i class="fa-solid fa-brain"></i> Mesin Aktif: <strong>Google Gemini (${data.gemini_model || 'gemini-2.5-flash'})</strong> [BLOCK_NONE 100% Uncensored Active]</div>`;
                if (activeEngineBadge) activeEngineBadge.innerHTML = `<i class="fa-solid fa-brain"></i> Gemini (${data.gemini_model || 'gemini-2.5-flash'}) Uncensored`;
            } else if (engine === 'local') {
                html += `<div style="color: #00f5d4;"><i class="fa-solid fa-laptop-code"></i> Mesin Aktif: <strong>Local AI (${data.local_llm_model || 'mistral'})</strong> @ ${data.local_llm_url || 'http://localhost:11434/v1'}</div>`;
                if (activeEngineBadge) activeEngineBadge.innerHTML = `<i class="fa-solid fa-laptop-code"></i> Local AI (${data.local_llm_model || 'mistral'}) Active`;
            } else {
                html += `<div style="color: #00f5d4;"><i class="fa-solid fa-cloud-bolt"></i> Mesin Aktif: <strong>Pollinations AI Uncensored (${data.pollinations_model || 'openai'})</strong></div>`;
                if (activeEngineBadge) activeEngineBadge.innerHTML = `<i class="fa-solid fa-bolt"></i> Pollinations AI (${data.pollinations_model || 'openai'}) Uncensored`;
            }

            keyStatusBox.innerHTML = html;
        } catch (err) {
            console.error("Error checking settings status:", err);
        }
    }

    async function handleSaveSettings() {
        const llm_engine = selectLlmEngine.value;
        const gemini_api_key = inputGeminiKey ? inputGeminiKey.value.trim() : '';
        const gemini_model = inputGeminiModel ? (inputGeminiModel.value.trim() || 'gemini-2.5-flash') : 'gemini-2.5-flash';
        const pollinations_model = inputPollinationsModel.value.trim() || 'openai';
        const local_llm_url = inputLocalUrl.value.trim() || 'http://localhost:11434/v1';
        const local_llm_model = inputLocalModel.value.trim() || 'mistral';

        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    llm_engine,
                    gemini_api_key,
                    gemini_model,
                    pollinations_model,
                    local_llm_url,
                    local_llm_model
                })
            });

            await checkSettingsStatus();
            alert('Pengaturan Mesin AI berhasil disimpan!');
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
