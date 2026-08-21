document.addEventListener('DOMContentLoaded', () => {
    // CSRF Helper for Laravel AJAX Requests
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    // Image URL Proxy Helper (Bypasses Indonesian ISP / Internet Positif Blocks via Laravel DoH Route)
    function getProxiedImageUrl(url) {
        if (!url) return '';
        if (url.startsWith('/api/proxy-image') || url.startsWith('data:')) return url;
        if (url.startsWith('/avatars/') || url.startsWith('/static/') || url.startsWith('/cache/')) return url;
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }

    async function secureFetch(url, options = {}) {
        options.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            ...(options.headers || {})
        };
        return fetch(url, options);
    }

    // ==========================================
    // CYBERPUNK NEON TOAST & CUSTOM DIALOG SYSTEM
    // ==========================================
    function showToast(message, type = 'success', title = null, duration = 3500) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `cyber-toast toast-${type}`;

        let icon = '<i class="fa-solid fa-circle-check"></i>';
        let defaultTitle = 'Sukses';
        if (type === 'error') {
            icon = '<i class="fa-solid fa-circle-xmark"></i>';
            defaultTitle = 'Peringatan / Gagal';
        } else if (type === 'info') {
            icon = '<i class="fa-solid fa-circle-info"></i>';
            defaultTitle = 'Informasi';
        } else if (type === 'warning') {
            icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
            defaultTitle = 'Perhatian';
        }

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title || defaultTitle}</div>
                <div class="toast-msg">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
            <div class="toast-progress" style="animation: toastProgressAnim ${duration}ms linear forwards;"></div>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        let dismissed = false;
        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        };

        closeBtn.addEventListener('click', dismiss);
        setTimeout(dismiss, duration);

        container.appendChild(toast);
    }

    function showCustomConfirm(title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', isDanger = false) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = '999999';

            overlay.innerHTML = `
                <div class="cyber-dialog-box" style="border-color: ${isDanger ? 'rgba(255,0,85,0.5)' : 'rgba(0,245,212,0.5)'};">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: ${isDanger ? 'rgba(255,0,85,0.2)' : 'rgba(0,245,212,0.2)'}; color: ${isDanger ? '#ff0055' : '#00f5d4'}; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                            <i class="fa-solid ${isDanger ? 'fa-triangle-exclamation' : 'fa-circle-question'}"></i>
                        </div>
                        <h3 style="font-size: 16px; color: #fff; font-family: 'Outfit', sans-serif;">${title}</h3>
                    </div>
                    <p style="color: #e2d1db; font-size: 13.5px; line-height: 1.5; margin-bottom: 20px;">${message}</p>
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="btn-secondary btn-dialog-cancel" style="padding: 8px 16px; font-size: 13px;">${cancelText}</button>
                        <button type="button" class="btn-primary btn-dialog-confirm" style="padding: 8px 20px; font-size: 13px; background: ${isDanger ? 'linear-gradient(135deg, #ff0055, #e0004d)' : 'linear-gradient(135deg, #00f5d4, #00bbf9)'}; color: ${isDanger ? '#fff' : '#000'}; font-weight: bold;">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;

            const btnCancel = overlay.querySelector('.btn-dialog-cancel');
            const btnConfirm = overlay.querySelector('.btn-dialog-confirm');

            btnCancel.addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });

            btnConfirm.addEventListener('click', () => {
                overlay.remove();
                resolve(true);
            });

            document.body.appendChild(overlay);
        });
    }

    function showCustomPrompt(title, message, defaultValue = '', inputType = 'text') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = '999999';

            overlay.innerHTML = `
                <div class="cyber-dialog-box" style="border-color: rgba(0,245,212,0.5);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(0,245,212,0.2); color: #00f5d4; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                            <i class="fa-solid fa-sliders"></i>
                        </div>
                        <h3 style="font-size: 16px; color: #fff; font-family: 'Outfit', sans-serif;">${title}</h3>
                    </div>
                    <p style="color: #e2d1db; font-size: 13px; line-height: 1.5; margin-bottom: 12px;">${message}</p>
                    <input type="${inputType}" class="dialog-prompt-input" value="${defaultValue}" style="width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,245,212,0.4); border-radius: 8px; color: #fff; font-size: 14px; margin-bottom: 18px; outline: none;">
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="btn-secondary btn-dialog-cancel" style="padding: 8px 16px; font-size: 13px;">Batal</button>
                        <button type="button" class="btn-primary btn-dialog-confirm" style="padding: 8px 20px; font-size: 13px; background: linear-gradient(135deg, #00f5d4, #00bbf9); color: #000; font-weight: bold;">
                            Simpan
                        </button>
                    </div>
                </div>
            `;

            const input = overlay.querySelector('.dialog-prompt-input');
            const btnCancel = overlay.querySelector('.btn-dialog-cancel');
            const btnConfirm = overlay.querySelector('.btn-dialog-confirm');

            setTimeout(() => input.focus(), 50);

            const handleDone = () => {
                const val = input.value;
                overlay.remove();
                resolve(val);
            };

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleDone();
                if (e.key === 'Escape') {
                    overlay.remove();
                    resolve(null);
                }
            });

            btnCancel.addEventListener('click', () => {
                overlay.remove();
                resolve(null);
            });

            btnConfirm.addEventListener('click', handleDone);

            document.body.appendChild(overlay);
        });
    }

    // STATE
    let characters = [];
    let activeChar = null;
    let currentFilter = 'all';
    let isSending = false;
    let sessionImageHistory = {};

    // DOM ELEMENTS - CORE VIEWS
    const exploreView = document.getElementById('exploreView');
    const chatView = document.getElementById('chatView');
    const navExplore = document.getElementById('navExplore');
    const navActiveChat = document.getElementById('navActiveChat');
    const navActiveChatLabel = document.getElementById('navActiveChatLabel');
    const btnCloseChat = document.getElementById('btnCloseChat');

    // DOM ELEMENTS - EXPLORE GRID & FILTER
    const spicyGrid = document.getElementById('spicyGrid');
    const inputSearchChar = document.getElementById('inputSearchChar');
    const categoryPills = document.getElementById('categoryPills');
    const characterList = document.getElementById('characterList');

    // DOM ELEMENTS - ACTIVE CHAT HEADER
    const headerAvatarWrapper = document.getElementById('headerAvatarWrapper');
    const headerCharName = document.getElementById('headerCharName');
    const headerCharTitle = document.getElementById('headerCharTitle');
    const headerBadge = document.getElementById('headerBadge');
    const headerAffinityScore = document.getElementById('headerAffinityScore');
    const headerAffinityBar = document.getElementById('headerAffinityBar');
    const btnClearHistory = document.getElementById('btnClearHistory');

    // DOM ELEMENTS - MESSAGES & INPUT
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const btnSend = document.getElementById('btnSend');
    const typingIndicator = document.getElementById('typingIndicator');
    const typingText = document.getElementById('typingText');
    const activeEngineBadge = document.getElementById('activeEngineBadge');

    // DOM ELEMENTS - MODALS
    const modalFacts = document.getElementById('modalFacts');
    const btnOpenFacts = document.getElementById('btnOpenFacts');
    const btnCloseFacts = document.getElementById('btnCloseFacts');
    const factsGrid = document.getElementById('factsGrid');

    const modalKey = document.getElementById('modalKey');
    const btnOpenKey = document.getElementById('btnOpenKey');
    const btnCloseKey = document.getElementById('btnCloseKey');
    const inputGeminiKey = document.getElementById('inputGeminiKey');
    const inputGeminiModel = document.getElementById('inputGeminiModel');
    const btnSaveKey = document.getElementById('btnSaveKey');
    const keyStatusBox = document.getElementById('keyStatusBox');

    // DOM ELEMENTS - CHARACTER STUDIO (ADMIN)
    const btnOpenStudio = document.getElementById('btnOpenStudio');
    const modalStudio = document.getElementById('modalStudio');
    const btnCloseStudio = document.getElementById('btnCloseStudio');
    const btnCancelStudio = document.getElementById('btnCancelStudio');
    const btnSaveStudioChar = document.getElementById('btnSaveStudioChar');
    const studioCharId = document.getElementById('studioCharId');
    const studioName = document.getElementById('studioName');
    const studioTitle = document.getElementById('studioTitle');
    const studioAvatar = document.getElementById('studioAvatar');
    const studioTags = document.getElementById('studioTags');
    const studioPersona = document.getElementById('studioPersona');
    const studioGreeting = document.getElementById('studioGreeting');
    const studioScenario = document.getElementById('studioScenario');

    // DOM ELEMENTS - PROFILE SWITCHER
    const selectProfileSwitcher = document.getElementById('selectProfileSwitcher');

    // DOM ELEMENTS - LIGHTBOX
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

    // LIGHTBOX HELPERS
    function openLightbox(src, captionText) {
        if (!modalLightbox || !lightboxImg) return;
        lightboxImg.src = src;
        if (lightboxCaption) lightboxCaption.textContent = captionText || 'Full Character Photo Preview';
        modalLightbox.classList.remove('hidden');
    }

    if (btnCloseLightbox) {
        btnCloseLightbox.addEventListener('click', () => modalLightbox.classList.add('hidden'));
    }
    if (modalLightbox) {
        modalLightbox.addEventListener('click', (e) => {
            if (e.target === modalLightbox) modalLightbox.classList.add('hidden');
        });
    }

    // INITIALIZATION
    initApp();

    async function initApp() {
        setupEventListeners();
        await loadCharacters();
        await checkSettingsStatus();
    }

    // EVENT LISTENERS
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

        // Profile Switcher
        if (selectProfileSwitcher) {
            selectProfileSwitcher.addEventListener('change', async () => {
                const userId = selectProfileSwitcher.value;
                try {
                    const res = await secureFetch('/api/profile/switch', {
                        method: 'POST',
                        body: JSON.stringify({ user_id: userId })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        location.reload();
                    }
                } catch (err) {
                    console.error("Error switching profile:", err);
                }
            });
        }

        // Character Studio (Admin)
        if (btnOpenStudio) {
            btnOpenStudio.addEventListener('click', () => openStudioModal());
        }
        if (btnCloseStudio) {
            btnCloseStudio.addEventListener('click', () => modalStudio.classList.add('hidden'));
        }
        if (btnCancelStudio) {
            btnCancelStudio.addEventListener('click', () => modalStudio.classList.add('hidden'));
        }
        if (btnSaveStudioChar) {
            btnSaveStudioChar.addEventListener('click', handleSaveStudioCharacter);
        }

        // Affinity Score Click to Edit (Admin Only)
        const affinityMeterBox = document.querySelector('.affinity-meter-box');
        if (affinityMeterBox) {
            if (window.IS_ADMIN) {
                affinityMeterBox.style.cursor = 'pointer';
                affinityMeterBox.title = '👑 [Khusus Admin] Klik untuk mengubah Affinity Score secara instan (0-100)';
                affinityMeterBox.addEventListener('click', async () => {
                    if (!activeChar) return;
                    const current = (activeChar.current_affinity !== undefined && activeChar.current_affinity !== null) ? activeChar.current_affinity : 0;
                    const inputVal = await showCustomPrompt('👑 Admin Override Affinity', `Ubah Affinity Score untuk <strong>${activeChar.name}</strong> (0 - 100):`, current, 'number');
                    if (inputVal === null) return;
                    const num = parseInt(inputVal, 10);
                    if (isNaN(num) || num < 0 || num > 100) {
                        showToast('Masukkan angka skor antara 0 sampai 100.', 'error');
                        return;
                    }
                    try {
                        const res = await secureFetch(`/api/affinity/${activeChar.id}`, {
                            method: 'POST',
                            body: JSON.stringify({ score: num })
                        });
                        const data = await res.json();
                        if (data.status === 'success') {
                            activeChar.current_affinity = data.affinity_score;
                            headerAffinityScore.textContent = `${data.affinity_score}/100`;
                            headerAffinityBar.style.width = `${data.affinity_score}%`;
                            renderSidebarList();
                            renderSpicyGrid();
                            showToast(`Affinity ${activeChar.name} berhasil diubah ke ${data.affinity_score}/100!`, 'success');
                        } else {
                            showToast(data.message || 'Gagal mengubah skor affinity.', 'error');
                        }
                    } catch (err) {
                        console.error("Error updating affinity score:", err);
                        showToast('Terjadi kesalahan jaringan.', 'error');
                    }
                });
            } else {
                affinityMeterBox.style.cursor = 'default';
                affinityMeterBox.title = '❤️ Tingkat Kedekatan: Naikkan skor lewat obrolan & gombalan manis!';
                affinityMeterBox.addEventListener('click', () => {
                    const current = (activeChar && activeChar.current_affinity !== undefined) ? activeChar.current_affinity : 0;
                    showToast(`Kedekatan: ${current}/100. Ajak ngobrol & puji untuk menaikkan skor!`, 'info', `❤️ ${activeChar ? activeChar.name : 'Karakter'}`);
                });
            }
        }
    }

    // VIEW SWITCHERS
    function showExploreView() {
        exploreView.classList.remove('hidden');
        chatView.classList.add('hidden');
        navExplore.classList.add('active');
        navActiveChat.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            const res = await secureFetch('/api/characters');
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
            const scenario = c.scenario || (c.persona ? c.persona.substring(0, 70) + '...' : '');
            const rawAvatarUrl = c.avatar_url || '';
            const avatarUrl = getProxiedImageUrl(rawAvatarUrl);

            const coverHTML = avatarUrl
                ? `<img src="${avatarUrl}" referrerpolicy="no-referrer" class="spicy-cover-img" alt="${c.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                   <div class="spicy-cover-initial" style="display:none;">${initial}</div>`
                : `<div class="spicy-cover-initial">${initial}</div>`;

            const adminEditBtn = (window.IS_ADMIN)
                ? `<button class="spicy-opts-btn btn-card-edit" title="Edit Karakter & Avatar" style="background: rgba(0, 245, 212, 0.9); color: #000; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: none; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-pen-to-square"></i> <span>Edit</span></button>`
                : `<button class="spicy-opts-btn" title="Options"><i class="fa-solid fa-ellipsis-vertical"></i></button>`;

            card.innerHTML = `
                <div class="spicy-cover-box">
                    <span class="badge ${badgeClass} spicy-badge-top">${badgeText}</span>
                    ${adminEditBtn}
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
                        <span class="stat-item"><i class="fa-solid fa-heart"></i> ${(c.current_affinity !== undefined && c.current_affinity !== null) ? c.current_affinity : 0}%</span>
                    </div>
                </div>
            `;

            const editBtn = card.querySelector('.btn-card-edit');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openStudioModal(c);
                });
            }

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
            const affinity = (c.current_affinity !== undefined && c.current_affinity !== null) ? c.current_affinity : 0;
            const allowNsfw = c.allow_nsfw || false;
            const strictness = (c.strictness || (allowNsfw ? 'uncensored' : 'high')).toLowerCase();
            const avatarUrl = getProxiedImageUrl(c.avatar_url || '');

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
                ? `<img src="${avatarUrl}" referrerpolicy="no-referrer" alt="${c.name}" onerror="this.parentNode.innerHTML='${initial}'">`
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
            theme = 'nsfw';
        } else if (strictness === 'medium') {
            theme = 'medium';
        } else {
            theme = 'safe';
        }

        document.documentElement.setAttribute('data-theme', theme);

        // UPDATE HEADER
        const initial = char.name ? char.name.charAt(0).toUpperCase() : 'B';
        const avatarUrl = getProxiedImageUrl(char.avatar_url || '');

        if (avatarUrl) {
            headerAvatarWrapper.innerHTML = `<img src="${avatarUrl}" referrerpolicy="no-referrer" alt="${char.name}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            headerAvatarWrapper.innerHTML = `<div class="avatar-fallback" id="headerAvatarFallback">${initial}</div>`;
        }

        headerCharName.textContent = char.name;
        headerCharTitle.textContent = char.title || '';

        const affinity = (char.current_affinity !== undefined && char.current_affinity !== null) ? char.current_affinity : 0;
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
            const res = await secureFetch(`/api/history/${charId}`);
            const history = await res.json();

            if (history.length === 0) {
                const greetingsList = activeChar.greetings || [activeChar.greeting || "Halo!"];
                const randomGreeting = greetingsList[Math.floor(Math.random() * greetingsList.length)];
                appendMessage(activeChar.name, randomGreeting, 'char');
            } else {
                history.forEach(item => {
                    const type = (item.sender === 'You') ? 'user' : 'char';
                    appendMessage(item.sender, item.message, type);
                });
            }
        } catch (err) {
            console.error("Error loading chat history:", err);
        }
    }

    // APPEND MESSAGE TO CHAT CONTAINER
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
                         referrerpolicy="no-referrer"
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
                    const res = await secureFetch('/api/search_character_image', {
                        method: 'POST',
                        body: JSON.stringify({
                            char_id: charId,
                            prompt: imageTrigger,
                            excluded_urls: sessionImageHistory[charId]
                        })
                    });

                    const data = await res.json();
                    if (data.status === 'success' && data.image_url) {
                        const finalUrl = data.image_url;
                        const proxiedUrl = getProxiedImageUrl(finalUrl);
                        sessionImageHistory[charId].push(finalUrl);

                        if (imgElem) {
                            imgElem.src = proxiedUrl;
                            imgElem.onclick = () => {
                                openLightbox(proxiedUrl, `${activeChar ? activeChar.name : ''} - ${imageTrigger}`);
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
            const res = await secureFetch('/api/chat', {
                method: 'POST',
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
                appendMessage('System', 'Gagal memproses pesan.', 'char');
            }
        } catch (err) {
            console.error("Error sending message:", err);
            typingIndicator.classList.add('hidden');
            appendMessage('System', 'Terjadi kesalahan jaringan.', 'char');
        } finally {
            isSending = false;
        }
    }

    // CLEAR HISTORY
    async function handleClearHistory() {
        if (!activeChar) return;
        const ok = await showCustomConfirm(
            'Bersihkan Riwayat Obrolan',
            `Hapus seluruh pesan obrolan dan foto bersama <strong>${activeChar.name}</strong>?`,
            'Ya, Bersihkan',
            'Batal',
            true
        );
        if (!ok) return;

        try {
            await secureFetch(`/api/clear/${activeChar.id}`, { method: 'POST' });
            if (sessionImageHistory[activeChar.id]) {
                sessionImageHistory[activeChar.id] = [];
            }
            await loadChatHistory(activeChar.id);
            showToast(`Riwayat obrolan dengan ${activeChar.name} berhasil dibersihkan!`, 'success');
        } catch (err) {
            console.error("Error clearing history:", err);
            showToast('Gagal membersihkan riwayat obrolan.', 'error');
        }
    }

    // FACTS MODAL
    async function openFactsModal() {
        modalFacts.classList.remove('hidden');
        factsGrid.innerHTML = '<div class="loading-skeleton">Memuat fakta...</div>';

        try {
            const res = await secureFetch('/api/facts');
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
            const res = await secureFetch('/api/settings');
            const data = await res.json();

            if (inputGeminiKey && data.gemini_api_key) {
                inputGeminiKey.value = data.gemini_api_key;
            }
            if (inputGeminiModel && data.gemini_model) {
                inputGeminiModel.value = data.gemini_model;
            }

            let html = `<div style="color: #00f5d4;"><i class="fa-solid fa-brain"></i> Mesin Aktif: <strong>Google Gemini (${data.gemini_model || 'gemini-2.5-flash'})</strong> [Laravel 13 BLOCK_NONE Uncensored Active]</div>`;
            keyStatusBox.innerHTML = html;
        } catch (err) {
            console.error("Error checking settings status:", err);
        }
    }

    async function handleSaveSettings() {
        const gemini_api_key = inputGeminiKey ? inputGeminiKey.value.trim() : '';
        const gemini_model = inputGeminiModel ? (inputGeminiModel.value.trim() || 'gemini-2.5-flash') : 'gemini-2.5-flash';

        try {
            await secureFetch('/api/settings', {
                method: 'POST',
                body: JSON.stringify({
                    gemini_api_key,
                    gemini_model,
                })
            });

            await checkSettingsStatus();
            showToast('Pengaturan Mesin AI berhasil disimpan!', 'success');
            modalKey.classList.add('hidden');
        } catch (err) {
            console.error("Error saving settings:", err);
            showToast('Gagal menyimpan pengaturan.', 'error');
        }
    }

    // CHARACTER STUDIO (ADMIN)
    function openStudioModal(charToEdit = null) {
        if (!modalStudio) return;
        modalStudio.classList.remove('hidden');

        if (charToEdit) {
            studioCharId.value = charToEdit.id;
            studioName.value = charToEdit.name;
            studioTitle.value = charToEdit.title || '';
            studioAvatar.value = charToEdit.avatar_url || '';
            studioTags.value = Array.isArray(charToEdit.tags) ? charToEdit.tags.join(', ') : 'Female, NSFW';
            studioPersona.value = charToEdit.persona || '';
            studioGreeting.value = charToEdit.greeting || '';
            studioScenario.value = charToEdit.scenario || '';
        } else {
            studioCharId.value = '';
            studioName.value = '';
            studioTitle.value = '';
            studioAvatar.value = '';
            studioTags.value = 'Female, Roleplay, NSFW';
            studioPersona.value = '';
            studioGreeting.value = '';
            studioScenario.value = '';
        }
    }

    async function handleSaveStudioCharacter() {
        const name = studioName.value.trim();
        const persona = studioPersona.value.trim();
        const greeting = studioGreeting.value.trim();

        if (!name || !persona || !greeting) {
            showToast('Harap isi Nama Karakter, Persona, dan Sapaan Awal.', 'warning');
            return;
        }

        const payload = {
            name: name,
            title: studioTitle.value.trim(),
            avatar_url: studioAvatar.value.trim(),
            tags: studioTags.value.trim(),
            persona: persona,
            greeting: greeting,
            scenario: studioScenario.value.trim(),
        };

        const charId = studioCharId.value;
        const url = charId ? `/api/admin/characters/${charId}` : '/api/admin/characters';
        const method = charId ? 'PUT' : 'POST';

        try {
            const res = await secureFetch(url, {
                method: method,
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(data.message || `Karakter ${name} berhasil disimpan!`, 'success');
                modalStudio.classList.add('hidden');
                await loadCharacters();
            } else {
                showToast(data.message || 'Gagal menyimpan karakter.', 'error');
            }
        } catch (err) {
            console.error("Error saving character via Studio:", err);
            showToast('Terjadi kesalahan saat menyimpan karakter.', 'error');
        }
    }

    // DOM ELEMENTS - DATASET PICKER MODAL
    const modalDatasetPicker = document.getElementById('modalDatasetPicker');
    const btnOpenDatasetPicker = document.getElementById('btnOpenDatasetPicker');
    const btnCloseDatasetPicker = document.getElementById('btnCloseDatasetPicker');
    const selectDatasetChar = document.getElementById('selectDatasetChar');
    const inputDatasetTagFilter = document.getElementById('inputDatasetTagFilter');
    const btnRunDatasetSearch = document.getElementById('btnRunDatasetSearch');
    const datasetPickerStatus = document.getElementById('datasetPickerStatus');
    const datasetPickerGrid = document.getElementById('datasetPickerGrid');
    const btnLoadMorePhotos = document.getElementById('btnLoadMorePhotos');
    const btnLoadMoreText = document.getElementById('btnLoadMoreText');

    let datasetCurrentPage = 1;
    let datasetCurrentCharKey = 'ai';
    let datasetCurrentTagFilter = '';
    let datasetLoadedCount = 0;
    let datasetTotalCount = 0;

    if (btnOpenDatasetPicker) {
        btnOpenDatasetPicker.addEventListener('click', () => {
            const rawName = studioName.value.trim().toLowerCase();
            const rawId = studioCharId.value ? studioCharId.value.toLowerCase() : '';
            
            let detectedKey = 'all';
            if (rawId && selectDatasetChar.querySelector(`option[value="${rawId}"]`)) {
                detectedKey = rawId;
            } else if (rawName) {
                for (let opt of selectDatasetChar.options) {
                    if (opt.value !== 'all' && opt.value !== 'custom' && (rawName.includes(opt.value) || opt.text.toLowerCase().includes(rawName))) {
                        detectedKey = opt.value;
                        break;
                    }
                }
            }

            selectDatasetChar.value = detectedKey;
            if (inputDatasetTagFilter) inputDatasetTagFilter.value = '';
            modalDatasetPicker.classList.remove('hidden');
            loadDatasetPhotos(detectedKey, '', 1, false);
        });
    }

    if (selectDatasetChar) {
        selectDatasetChar.addEventListener('change', () => {
            let charKey = selectDatasetChar.value;
            if (charKey === 'custom') {
                if (inputDatasetTagFilter) inputDatasetTagFilter.focus();
                charKey = inputDatasetTagFilter ? inputDatasetTagFilter.value.trim() || 'all' : 'all';
            }
            const tag = inputDatasetTagFilter ? inputDatasetTagFilter.value.trim() : '';
            loadDatasetPhotos(charKey, tag, 1, false);
        });
    }

    if (btnCloseDatasetPicker) {
        btnCloseDatasetPicker.addEventListener('click', () => modalDatasetPicker.classList.add('hidden'));
    }

    if (modalDatasetPicker) {
        modalDatasetPicker.addEventListener('click', (e) => {
            if (e.target === modalDatasetPicker) modalDatasetPicker.classList.add('hidden');
        });
    }

    if (btnRunDatasetSearch) {
        btnRunDatasetSearch.addEventListener('click', () => {
            const tag = inputDatasetTagFilter ? inputDatasetTagFilter.value.trim() : '';
            let charKey = selectDatasetChar ? selectDatasetChar.value : 'all';
            if (tag) {
                charKey = tag;
            }
            loadDatasetPhotos(charKey, tag, 1, false);
        });
    }

    if (inputDatasetTagFilter) {
        inputDatasetTagFilter.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = inputDatasetTagFilter.value.trim();
                let charKey = selectDatasetChar ? selectDatasetChar.value : 'all';
                if (tag) {
                    charKey = tag;
                }
                loadDatasetPhotos(charKey, tag, 1, false);
            }
        });
    }

    if (btnLoadMorePhotos) {
        btnLoadMorePhotos.addEventListener('click', () => {
            loadDatasetPhotos(datasetCurrentCharKey, datasetCurrentTagFilter, datasetCurrentPage + 1, true);
        });
    }

    async function loadDatasetPhotos(charKey, tagFilter = '', page = 1, append = false) {
        datasetCurrentCharKey = charKey;
        datasetCurrentTagFilter = tagFilter;
        datasetCurrentPage = page;

        if (!append) {
            datasetLoadedCount = 0;
            datasetPickerGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 30px; color:#00f5d4;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><div style="margin-top:10px;">Mencari galeri foto HD dari dataset & Danbooru online...</div></div>';
            if (btnLoadMorePhotos) btnLoadMorePhotos.style.display = 'none';
        } else {
            if (btnLoadMoreText) btnLoadMoreText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memuat...';
        }
        
        try {
            const res = await secureFetch(`/api/admin/dataset-photos?char_key=${encodeURIComponent(charKey)}&tag_filter=${encodeURIComponent(tagFilter)}&page=${page}&limit=50`);
            const data = await res.json();
            const photos = data.photos || [];
            const matchedChar = data.matched_character || charKey;
            const source = data.source === 'live_danbooru' ? '🌐 Live Online Danbooru' : '💾 Dataset Lokal';
            datasetTotalCount = data.total || photos.length;
            datasetLoadedCount += photos.length;

            if (!append) {
                datasetPickerGrid.innerHTML = '';
            }

            if (datasetPickerStatus) {
                datasetPickerStatus.innerHTML = `
                    <span>📸 Karakter: <strong>${matchedChar.toUpperCase()}</strong> <span style="font-size:10px; color:#bc93aa; margin-left:4px;">(${source})</span></span>
                    <span>Menampilkan <strong>${datasetLoadedCount}</strong> Foto HD</span>
                `;
            }

            if (photos.length === 0 && !append) {
                datasetPickerGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 30px; color:#bc93aa;">Tidak ada foto yang cocok. Coba ketik nama karakter dalam bahasa inggris/romaji (contoh: ichika, marin, yor, megumin, rem).</div>';
                if (btnLoadMorePhotos) btnLoadMorePhotos.style.display = 'none';
                return;
            }

            photos.forEach(p => {
                const item = document.createElement('div');
                item.style.cursor = 'pointer';
                item.style.border = '1px solid rgba(255,255,255,0.15)';
                item.style.borderRadius = '8px';
                item.style.overflow = 'hidden';
                item.style.position = 'relative';
                item.style.background = 'rgba(0,0,0,0.5)';
                item.style.transition = 'transform 0.15s ease, border-color 0.15s ease';
                item.title = 'Klik foto ini untuk menjadikannya Avatar!';

                item.addEventListener('mouseenter', () => {
                    item.style.transform = 'scale(1.03)';
                    item.style.borderColor = '#00f5d4';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.transform = 'scale(1)';
                    item.style.borderColor = 'rgba(255,255,255,0.15)';
                });

                const proxied = getProxiedImageUrl(p.url);
                const tagStr = (p.tags && p.tags.length > 0) ? p.tags.join(', ') : 'Danbooru Fanart';

                item.innerHTML = `
                    <img src="${proxied}" referrerpolicy="no-referrer" loading="lazy" style="width: 100%; height: 140px; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='/api/proxy-image?url=' + encodeURIComponent('${p.url.replace('/sample/', '/180x180/').replace('sample-', '')}');">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); font-size: 10px; color: #00f5d4; padding: 3px 6px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                        ${tagStr}
                    </div>
                `;

                item.addEventListener('click', () => {
                    studioAvatar.value = p.url;
                    modalDatasetPicker.classList.add('hidden');
                });

                datasetPickerGrid.appendChild(item);
            });

            // Handle Load More Button
            if (btnLoadMorePhotos) {
                if (data.has_more) {
                    const remaining = datasetTotalCount - datasetLoadedCount;
                    btnLoadMorePhotos.style.display = 'inline-block';
                    if (btnLoadMoreText) btnLoadMoreText.textContent = `Muat 50 Foto Lagi (Sisa ${remaining} Foto)`;
                } else {
                    btnLoadMorePhotos.style.display = 'none';
                }
            }

        } catch (err) {
            console.error("Error loading dataset photos:", err);
            if (!append) {
                datasetPickerGrid.innerHTML = '<div style="grid-column: 1/-1; color:red; text-align:center; padding: 20px;">Gagal memuat galeri dataset.</div>';
            }
            if (btnLoadMorePhotos) btnLoadMorePhotos.style.display = 'none';
        }
    }

    // ==========================================
    // ADMIN USER MANAGEMENT & AFFINITY EDITOR
    // ==========================================
    const btnOpenUserManagement = document.getElementById('btnOpenUserManagement');
    const modalUserManagement = document.getElementById('modalUserManagement');
    const btnCloseUserManagement = document.getElementById('btnCloseUserManagement');
    const adminUserListView = document.getElementById('adminUserListView');
    const adminUserTableBody = document.getElementById('adminUserTableBody');
    const adminUserAffinityDetailView = document.getElementById('adminUserAffinityDetailView');
    const adminTargetUserName = document.getElementById('adminTargetUserName');
    const adminUserAffinityGrid = document.getElementById('adminUserAffinityGrid');
    const btnBackToUserList = document.getElementById('btnBackToUserList');
    const adminUserEditCredentialsView = document.getElementById('adminUserEditCredentialsView');
    const adminEditTargetNameHeader = document.getElementById('adminEditTargetNameHeader');
    const adminEditUserId = document.getElementById('adminEditUserId');
    const adminEditUserName = document.getElementById('adminEditUserName');
    const adminEditUserPassword = document.getElementById('adminEditUserPassword');
    const adminEditUserRole = document.getElementById('adminEditUserRole');
    const formAdminEditUserCredentials = document.getElementById('formAdminEditUserCredentials');
    const btnBackFromEditToUserList = document.getElementById('btnBackFromEditToUserList');
    const btnCancelEditUserCredentials = document.getElementById('btnCancelEditUserCredentials');

    if (btnOpenUserManagement) {
        btnOpenUserManagement.addEventListener('click', openUserManagementModal);
    }
    if (btnCloseUserManagement) {
        btnCloseUserManagement.addEventListener('click', () => {
            if (modalUserManagement) modalUserManagement.classList.add('hidden');
        });
    }
    if (btnBackToUserList) {
        btnBackToUserList.addEventListener('click', () => {
            if (adminUserAffinityDetailView) adminUserAffinityDetailView.classList.add('hidden');
            if (adminUserEditCredentialsView) adminUserEditCredentialsView.classList.add('hidden');
            if (adminUserListView) adminUserListView.classList.remove('hidden');
        });
    }
    if (btnBackFromEditToUserList) {
        btnBackFromEditToUserList.addEventListener('click', () => {
            if (adminUserEditCredentialsView) adminUserEditCredentialsView.classList.add('hidden');
            if (adminUserListView) adminUserListView.classList.remove('hidden');
        });
    }
    if (btnCancelEditUserCredentials) {
        btnCancelEditUserCredentials.addEventListener('click', () => {
            if (adminUserEditCredentialsView) adminUserEditCredentialsView.classList.add('hidden');
            if (adminUserListView) adminUserListView.classList.remove('hidden');
        });
    }

    if (formAdminEditUserCredentials) {
        formAdminEditUserCredentials.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = adminEditUserId.value;
            const name = adminEditUserName.value.trim();
            const password = adminEditUserPassword.value;
            const role = adminEditUserRole.value;

            if (!name) {
                showToast('Username tidak boleh kosong.', 'error');
                return;
            }

            try {
                const res = await secureFetch(`/api/admin/users/${userId}/credentials`, {
                    method: 'POST',
                    body: JSON.stringify({ name, password, role })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast(data.message || 'Akun berhasil diperbarui!', 'success');
                    if (adminUserEditCredentialsView) adminUserEditCredentialsView.classList.add('hidden');
                    if (adminUserListView) adminUserListView.classList.remove('hidden');
                    openUserManagementModal();
                } else {
                    showToast(data.message || 'Gagal memperbarui akun.', 'error');
                }
            } catch (err) {
                console.error("Error updating user credentials:", err);
                showToast('Terjadi kesalahan jaringan.', 'error');
            }
        });
    }

    async function openUserManagementModal() {
        if (!modalUserManagement) return;
        modalUserManagement.classList.remove('hidden');
        if (adminUserAffinityDetailView) adminUserAffinityDetailView.classList.add('hidden');
        if (adminUserEditCredentialsView) adminUserEditCredentialsView.classList.add('hidden');
        if (adminUserListView) adminUserListView.classList.remove('hidden');

        adminUserTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #bc93aa;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar user...</td></tr>`;

        try {
            const res = await secureFetch('/api/admin/users');
            const data = await res.json();

            if (data.status !== 'success' || !data.users) {
                adminUserTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ff0055;">Gagal memuat daftar user.</td></tr>`;
                return;
            }

            adminUserTableBody.innerHTML = '';
            data.users.forEach(u => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.08)';

                const isAdm = u.role === 'admin';
                const roleBadge = isAdm
                    ? `<span style="background: rgba(255,0,85,0.2); color: #ff0055; border: 1px solid rgba(255,0,85,0.4); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">ADMIN</span>`
                    : `<span style="background: rgba(0,245,212,0.2); color: #00f5d4; border: 1px solid rgba(0,245,212,0.4); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">USER</span>`;

                tr.innerHTML = `
                    <td style="padding: 10px 8px; font-weight: 600; color: #fff;">
                        <i class="fa-solid fa-circle-user" style="color: ${isAdm ? '#ff0055' : '#00f5d4'}; margin-right: 6px;"></i> ${u.name}
                    </td>
                    <td style="padding: 10px 8px;">${roleBadge}</td>
                    <td style="padding: 10px 8px; color: #bc93aa;">${u.chat_count} pesan</td>
                    <td style="padding: 10px 8px; text-align: right; white-space: nowrap;">
                        <button type="button" class="btn-edit-creds" style="background: rgba(255,143,171,0.15); border: 1px solid #ff8fab; color: #ff8fab; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 600; margin-right: 6px;" title="Edit Username & Password">
                            <i class="fa-solid fa-user-pen"></i> Edit Akun
                        </button>
                        <button type="button" class="btn-manage-aff" style="background: rgba(0,245,212,0.15); border: 1px solid #00f5d4; color: #00f5d4; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 600; margin-right: 6px;" title="Atur Skor Affinity Karakter">
                            <i class="fa-solid fa-heart"></i> Affinity
                        </button>
                        ${!isAdm ? `
                        <button type="button" class="btn-delete-user" style="background: rgba(255,0,85,0.15); border: 1px solid #ff0055; color: #ff0055; padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer;" title="Hapus User">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>` : ''}
                    </td>
                `;

                const btnCreds = tr.querySelector('.btn-edit-creds');
                if (btnCreds) {
                    btnCreds.addEventListener('click', () => openEditUserCredentials(u));
                }

                const btnAff = tr.querySelector('.btn-manage-aff');
                if (btnAff) {
                    btnAff.addEventListener('click', () => loadAdminUserAffinities(u.id, u.name));
                }

                const btnDel = tr.querySelector('.btn-delete-user');
                if (btnDel) {
                    btnDel.addEventListener('click', () => handleDeleteUser(u.id, u.name));
                }

                adminUserTableBody.appendChild(tr);
            });

        } catch (err) {
            console.error("Error loading admin users:", err);
            adminUserTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ff0055;">Terjadi kesalahan memuat data.</td></tr>`;
        }
    }

    function openEditUserCredentials(u) {
        if (!adminUserListView || !adminUserEditCredentialsView) return;
        adminUserListView.classList.add('hidden');
        if (adminUserAffinityDetailView) adminUserAffinityDetailView.classList.add('hidden');
        adminUserEditCredentialsView.classList.remove('hidden');

        adminEditTargetNameHeader.textContent = u.name;
        adminEditUserId.value = u.id;
        adminEditUserName.value = u.name;
        adminEditUserPassword.value = '';
        adminEditUserRole.value = u.role || 'user';
    }

    async function loadAdminUserAffinities(userId, userName) {
        if (!adminUserListView || !adminUserAffinityDetailView) return;
        adminUserListView.classList.add('hidden');
        if (adminUserEditCredentialsView) adminUserEditCredentialsView.classList.add('hidden');
        adminUserAffinityDetailView.classList.remove('hidden');

        adminTargetUserName.textContent = userName;
        adminUserAffinityGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #bc93aa;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat daftar karakter & skor affinity...</div>`;

        try {
            const res = await secureFetch(`/api/admin/users/${userId}/affinities`);
            const data = await res.json();

            if (data.status !== 'success' || !data.affinities) {
                adminUserAffinityGrid.innerHTML = `<div style="grid-column: 1/-1; color: #ff0055; text-align: center;">Gagal memuat affinity user.</div>`;
                return;
            }

            adminUserAffinityGrid.innerHTML = '';
            data.affinities.forEach(item => {
                const card = document.createElement('div');
                card.style.background = 'rgba(255, 255, 255, 0.04)';
                card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                card.style.borderRadius = '10px';
                card.style.padding = '10px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '8px';

                const avatarUrl = getProxiedImageUrl(item.avatar_url);
                const initial = item.character_name.charAt(0).toUpperCase();

                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; background: #2a1b40; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold; color: #ff0055;">
                            ${avatarUrl ? `<img src="${avatarUrl}" referrerpolicy="no-referrer" style="width:100%; height:100%; object-fit: cover;" onerror="this.parentNode.innerHTML='${initial}'">` : initial}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.character_name}</div>
                            <div style="font-size: 11px; color: #00f5d4; font-weight: bold;"><i class="fa-solid fa-heart"></i> <span class="score-display">${item.score}</span>/100</div>
                        </div>
                    </div>
                    <div style="background: rgba(0,0,0,0.4); height: 6px; border-radius: 4px; overflow: hidden;">
                        <div class="score-bar" style="background: linear-gradient(90deg, #ff0055, #00f5d4); height: 100%; width: ${item.score}%; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="display: flex; gap: 4px; margin-top: 2px;">
                        <button type="button" class="btn-step-minus" style="flex: 1; padding: 4px 0; font-size: 11px; font-weight: bold; background: rgba(255,0,85,0.15); border: 1px solid rgba(255,0,85,0.3); color: #ff0055; border-radius: 6px; cursor: pointer;" title="Kurang 10">-10</button>
                        <button type="button" class="btn-step-plus" style="flex: 1; padding: 4px 0; font-size: 11px; font-weight: bold; background: rgba(0,245,212,0.15); border: 1px solid rgba(0,245,212,0.3); color: #00f5d4; border-radius: 6px; cursor: pointer;" title="Tambah 10">+10</button>
                        <button type="button" class="btn-set-max" style="flex: 1; padding: 4px 0; font-size: 11px; font-weight: bold; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 6px; cursor: pointer;" title="Set ke Max 100">100</button>
                        <button type="button" class="btn-set-zero" style="flex: 1; padding: 4px 0; font-size: 11px; font-weight: bold; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; border-radius: 6px; cursor: pointer;" title="Reset ke 0">0</button>
                    </div>
                `;

                const scoreDisp = card.querySelector('.score-display');
                const scoreBar = card.querySelector('.score-bar');
                let currentScore = item.score;

                const updateScore = async (newVal) => {
                    newVal = Math.max(0, Math.min(100, newVal));
                    currentScore = newVal;
                    scoreDisp.textContent = newVal;
                    scoreBar.style.width = `${newVal}%`;

                    try {
                        await secureFetch(`/api/admin/users/${userId}/affinity`, {
                            method: 'POST',
                            body: JSON.stringify({
                                character_id: item.character_id,
                                score: newVal
                            })
                        });
                    } catch (e) {
                        console.error("Error updating user affinity:", e);
                    }
                };

                card.querySelector('.btn-step-minus').addEventListener('click', () => updateScore(currentScore - 10));
                card.querySelector('.btn-step-plus').addEventListener('click', () => updateScore(currentScore + 10));
                card.querySelector('.btn-set-max').addEventListener('click', () => updateScore(100));
                card.querySelector('.btn-set-zero').addEventListener('click', () => updateScore(0));

                adminUserAffinityGrid.appendChild(card);
            });

        } catch (err) {
            console.error("Error loading user affinities:", err);
            adminUserAffinityGrid.innerHTML = `<div style="grid-column: 1/-1; color: #ff0055; text-align: center;">Terjadi kesalahan saat memuat data.</div>`;
        }
    }

    async function handleDeleteUser(userId, userName) {
        const ok = await showCustomConfirm(
            'Hapus Akun Pengguna',
            `Apakah kamu yakin ingin menghapus akun <strong>"${userName}"</strong> beserta seluruh riwayat obrolan dan data affinity-nya? Tindakan ini tidak dapat dibatalkan.`,
            'Ya, Hapus Akun',
            'Batal',
            true
        );
        if (!ok) return;

        try {
            const res = await secureFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`Akun "${userName}" berhasil dihapus.`, 'success');
                openUserManagementModal();
            } else {
                showToast(data.message || 'Gagal menghapus user.', 'error');
            }
        } catch (err) {
            console.error("Error deleting user:", err);
            showToast('Terjadi kesalahan saat menghapus user.', 'error');
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    window.scrollToBottom = scrollToBottom;
});

