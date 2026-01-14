// Primordial Pit Fishing Game

// ============================================
// CONFIGURATION
// ============================================
// Primordial Essence - rare limited drop (100 total for the week)
// Chance is now dynamic - fetched from API based on remaining and days left

// Fisherman options
const FISHERMEN = [
    { id: 'wolf', name: 'Wolf', image: 'fisherman1.jpg' },
    { id: 'golden-pirate', name: 'Golden Pirate', image: 'fisherman2.jpg' },
    { id: 'majestic-beard', name: 'Majestic Beard', image: 'fisherman3.jpg' }
];

// Fish Species (MidEvil themed)
const FISH_SPECIES = [
    { name: 'Goblin Guppy', image: 'fish-goblin-guppy.png', fallback: '🐟', baseRarity: 'common' },
    { name: 'Orc Bass', image: 'fish-orc-bass.png', fallback: '🐠', baseRarity: 'common' },
    { name: 'Skeleton Fish', image: 'fish-skeleton-fish.png', fallback: '💀', baseRarity: 'uncommon' },
    { name: 'Cursed Carp', image: 'fish-cursed-carp.png', fallback: '👻', baseRarity: 'uncommon' },
    { name: 'Dragon Eel', image: 'fish-dragon-eel.png', fallback: '🐉', baseRarity: 'rare' },
    { name: 'Phantom Pike', image: 'fish-phantom-pike.png', fallback: '👁️', baseRarity: 'rare' },
    { name: 'Ancient Angler', image: 'fish-ancient-angler.png', fallback: '🦑', baseRarity: 'epic' },
    { name: 'Demon Trout', image: 'fish-demon-trout.png', fallback: '😈', baseRarity: 'epic' },
    { name: 'Primordial Leviathan', image: 'fish-primordial-leviathan.png', fallback: '🐲', baseRarity: 'legendary' },
    { name: 'Golden Kraken', image: 'fish-golden-kraken.png', fallback: '🦈', baseRarity: 'legendary' }
];

const ESSENCE_IMAGE = 'primordial-essence.png';
const ESSENCE_FALLBACK = '✨';

const FISH_SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Massive'];
const FISH_COLORS = ['Shadowy', 'Bloody', 'Mossy', 'Ashen', 'Golden', 'Cursed', 'Ancient'];
const FISH_SPECIALS = ['None', 'Glowing', 'Spectral', 'Corrupted', 'Blessed', 'Enchanted'];

const RARITY_WEIGHTS = {
    common: 40,
    uncommon: 30,
    rare: 18,
    epic: 9,
    legendary: 3
};

const RARITY_COLORS = {
    common: '#aaa',
    uncommon: '#2ecc71',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#ffd700'
};

// Pre-computed caches for performance
const SPECIES_BY_RARITY = {};
const RARITY_TOTAL = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);

// Cache species pools by rarity (computed once)
Object.keys(RARITY_WEIGHTS).forEach(rarity => {
    SPECIES_BY_RARITY[rarity] = FISH_SPECIES.filter(s => s.baseRarity === rarity);
});

// Preload all game images
function preloadImages() {
    const images = [
        'Map.jpg', 'Lure.png', 'primordial-essence.png',
        ...FISHERMEN.map(f => f.image),
        ...FISH_SPECIES.map(f => f.image)
    ];
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}
preloadImages();

// ============================================
// SOUND EFFECTS (Lazy-loaded for performance)
// ============================================
const SOUND_URLS = {
    cast: 'sounds/cast.mp3',
    splash: 'sounds/splash.mp3',
    bite: 'sounds/bite.mp3',
    reel: 'sounds/reel.mp3',
    catch: 'sounds/catch.mp3',
    escape: 'sounds/escape.mp3',
    essence: 'sounds/essence.mp3'
};

// Sound cache - populated on first use
const SOUNDS = {};
let soundsLoaded = false;

// Background music (lazy-loaded)
let BACKGROUND_MUSIC = null;

// Mute state
let isMuted = false;

// Load sounds on first user interaction
function loadSounds() {
    if (soundsLoaded) return;
    soundsLoaded = true;

    // Load sound effects
    Object.entries(SOUND_URLS).forEach(([name, url]) => {
        const sound = new Audio(url);
        sound.preload = 'auto';
        sound.volume = 0.5;
        SOUNDS[name] = sound;
    });

    // Load background music
    BACKGROUND_MUSIC = new Audio('sounds/background.mp3');
    BACKGROUND_MUSIC.loop = true;
    BACKGROUND_MUSIC.volume = 0.3;
}

function playSound(soundName) {
    if (isMuted) return;
    loadSounds(); // Ensure sounds are loaded
    try {
        const sound = SOUNDS[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {
                // Silently fail if sound can't play (file missing or autoplay blocked)
            });
        }
    } catch (e) {
        // Ignore sound errors
    }
}

function stopSound(soundName) {
    try {
        const sound = SOUNDS[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    } catch (e) {
        // Ignore sound errors
    }
}

function startBackgroundMusic() {
    if (!isMuted && BACKGROUND_MUSIC) {
        BACKGROUND_MUSIC.play().catch(() => {
            // Autoplay blocked, will start on first interaction
        });
    }
}

function toggleMute() {
    isMuted = !isMuted;
    loadSounds(); // Ensure sounds are loaded

    if (isMuted) {
        if (BACKGROUND_MUSIC) BACKGROUND_MUSIC.pause();
        // Stop all currently playing sounds
        Object.values(SOUNDS).forEach(sound => {
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
    } else {
        if (BACKGROUND_MUSIC) BACKGROUND_MUSIC.play().catch(() => {});
    }

    // Update button icon
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    }
}

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    // Screens
    connectScreen: document.getElementById('connectScreen'),
    selectScreen: document.getElementById('selectScreen'),
    gameScreen: document.getElementById('gameScreen'),

    // Connect
    walletInput: document.getElementById('walletInput'),
    connectBtn: document.getElementById('connectBtn'),
    connectError: document.getElementById('connectError'),

    // Select
    nftGrid: document.getElementById('nftGrid'),
    selectError: document.getElementById('selectError'),

    // Game
    fisherman: document.getElementById('fisherman'),
    fishermanImg: document.getElementById('fishermanImg'),
    fishermanName: document.getElementById('fishermanName'),
    fishingLine: document.getElementById('fishingLine'),
    bobber: document.getElementById('bobber'),
    splash: document.getElementById('splash'),
    castBtn: document.getElementById('castBtn'),
    reelBtn: document.getElementById('reelBtn'),
    gameStatus: document.getElementById('gameStatus'),
    catchDisplay: document.getElementById('catchDisplay'),
    caughtFish: document.getElementById('caughtFish'),
    closeCatch: document.getElementById('closecatch'),
    catchCount: document.getElementById('catchCount'),
    catchList: document.getElementById('catchList'),
    changeBtn: document.getElementById('changeBtn'),

    // Loading
    loading: document.getElementById('loading'),

    // Discord
    discordLink: document.getElementById('discordLink'),
    discordStatus: document.getElementById('discordStatus'),
    linkDiscordBtn: document.getElementById('linkDiscordBtn')
};

// ============================================
// STATE
// ============================================
let userWallet = null;
let selectedFisherman = null;
let catches = [];
let gameState = 'idle'; // idle, casting, waiting, bite, reeling
let isUnlimitedWallet = false; // Admin wallets get unlimited casts

// ============================================
// DAILY COOLDOWN TRACKING (Server-side via Redis)
// ============================================

// Check if wallet can play (server-side check)
async function checkWalletCooldown(wallet) {
    try {
        const response = await fetch(`/api/cooldown?wallet=${encodeURIComponent(wallet)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to check cooldown:', error);
        return { canPlay: false, error: true };
    }
}

// Mark wallet as played (server-side)
async function markWalletAsPlayed() {
    try {
        const response = await fetch('/api/cooldown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: userWallet })
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to mark wallet as played:', error);
        return { success: false };
    }
}

function formatTimeRemaining(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

// ============================================
// EVENT LISTENERS
// ============================================
elements.connectBtn.addEventListener('click', loadWallet);
elements.walletInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') loadWallet();
});

elements.castBtn.addEventListener('click', castLine);
elements.reelBtn.addEventListener('click', reelIn);
elements.closeCatch.addEventListener('click', closeCatchDisplay);
elements.changeBtn.addEventListener('click', changeFisherman);
document.getElementById('muteBtn').addEventListener('click', toggleMute);

// Fallback: load sounds and start music on first user interaction
document.addEventListener('click', function initAudioOnClick() {
    loadSounds();
    startBackgroundMusic();
    document.removeEventListener('click', initAudioOnClick);
}, { once: true });

// ============================================
// WALLET VALIDATION & RECORDING
// ============================================
async function loadWallet() {
    const wallet = elements.walletInput.value.trim();

    // Validate Solana wallet address format
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(wallet)) {
        elements.connectError.textContent = 'Invalid Solana wallet address';
        return;
    }

    elements.connectError.textContent = '';
    showLoading(true);

    try {
        // Record the wallet
        await fetch('/api/record-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet })
        });

        userWallet = wallet;
        showSelectScreen();
    } catch (err) {
        // Continue even if recording fails
        console.error('Failed to record wallet:', err);
        userWallet = wallet;
        showSelectScreen();
    }

    showLoading(false);
}

async function showSelectScreen() {
    elements.connectScreen.style.display = 'none';
    elements.selectScreen.style.display = 'flex';
    elements.nftGrid.innerHTML = '<p style="color: #aaa;">Checking play status...</p>';

    // Check if this wallet has already played today (server-side)
    const cooldownData = await checkWalletCooldown(userWallet);
    const walletPlayed = !cooldownData.canPlay && !cooldownData.unlimited;

    elements.nftGrid.innerHTML = '';

    if (walletPlayed) {
        const timeLeft = cooldownData.resetInSeconds ? formatTimeRemaining(cooldownData.resetInSeconds) : '24h';
        elements.selectError.textContent = `You've already fished today! Resets in ${timeLeft}`;
    } else if (cooldownData.unlimited) {
        elements.selectError.textContent = 'Unlimited access enabled';
    } else {
        elements.selectError.textContent = '';
    }

    FISHERMEN.forEach((fisherman, index) => {
        const card = document.createElement('div');
        card.className = 'nft-card' + (walletPlayed ? ' on-cooldown' : '');
        card.innerHTML = `
            <img src="${fisherman.image}" alt="${fisherman.name}" width="120" height="120" loading="eager">
            <div class="nft-name">${fisherman.name}</div>
            ${walletPlayed ? '<div class="cooldown-badge">Fished Today</div>' : ''}
        `;
        if (!walletPlayed) {
            card.addEventListener('click', () => selectFisherman(index));
        }
        elements.nftGrid.appendChild(card);
    });
}

async function selectFisherman(index) {
    selectedFisherman = FISHERMEN[index];

    elements.fishermanImg.src = selectedFisherman.image;
    elements.fishermanName.textContent = selectedFisherman.name;

    elements.selectScreen.style.display = 'none';
    elements.gameScreen.style.display = 'flex';

    gameState = 'idle';
    updateStatus('Click "Cast Line" to start fishing!');

    // Check Discord link status
    checkDiscordStatus();
}

function changeFisherman() {
    elements.gameScreen.style.display = 'none';
    showSelectScreen();
}

// ============================================
// FISHING MECHANICS
// ============================================
async function castLine() {
    if (gameState !== 'idle') return;

    // Check if already cast today
    const cooldownData = await checkWalletCooldown(userWallet);
    isUnlimitedWallet = cooldownData.unlimited || false;

    if (!cooldownData.canPlay && !isUnlimitedWallet) {
        updateStatus("You've already cast today! Come back tomorrow.");
        elements.castBtn.disabled = true;
        return;
    }

    // Mark as played immediately when casting (skip for unlimited wallets)
    if (!isUnlimitedWallet) {
        await markWalletAsPlayed();
    }

    gameState = 'casting';
    updateStatus('Casting...');
    playSound('cast');

    elements.castBtn.disabled = true;
    elements.fishingLine.classList.add('cast');

    // Show splash
    setTimeout(() => {
        elements.splash.classList.add('active');
        playSound('splash');
        setTimeout(() => elements.splash.classList.remove('active'), 500);
    }, 400);

    // Show bobber after cast
    setTimeout(() => {
        elements.bobber.classList.add('visible', 'bobbing');
        gameState = 'waiting';
        updateStatus('Waiting for a bite...');

        // Random wait time before bite (3-10 seconds)
        const waitTime = 3000 + Math.random() * 7000;
        setTimeout(() => {
            if (gameState === 'waiting') {
                triggerBite();
            }
        }, waitTime);
    }, 500);
}

function triggerBite() {
    gameState = 'bite';
    elements.bobber.classList.remove('bobbing');
    elements.bobber.classList.add('bite');
    playSound('bite');

    updateStatus('🎣 You got a bite! Reel it in!');
    elements.reelBtn.disabled = false;

    // Auto-fail if not reeled in within 3 seconds
    setTimeout(() => {
        if (gameState === 'bite') {
            fishGotAway();
        }
    }, 3000);
}

function reelIn() {
    if (gameState !== 'bite') return;

    gameState = 'reeling';
    elements.reelBtn.disabled = true;
    elements.bobber.classList.remove('bite');
    playSound('reel');

    updateStatus('Reeling in...');

    // Reel animation
    elements.fishingLine.classList.remove('cast');
    elements.bobber.classList.remove('visible');

    setTimeout(() => {
        // 90% chance to catch, 10% chance fish escapes
        if (Math.random() < 0.90) {
            catchFish();
        } else {
            fishGotAway();
        }
    }, 500);
}

function fishGotAway() {
    stopSound('reel');
    gameState = 'idle';
    playSound('escape');

    elements.bobber.classList.remove('bite', 'bobbing', 'visible');
    elements.fishingLine.classList.remove('cast');
    elements.reelBtn.disabled = true;
    elements.castBtn.disabled = !isUnlimitedWallet;

    // Show escape popup
    displayEscape();
}

function displayEscape() {
    const subtext = isUnlimitedWallet ? 'Try again!' : 'Better luck tomorrow!';
    elements.caughtFish.innerHTML = `
        <div class="escape-display">
            <div class="escape-emoji">😢</div>
            <div class="escape-text">The fish got away!</div>
            <div class="escape-subtext">${subtext}</div>
        </div>
    `;
    elements.catchDisplay.style.display = 'flex';
    elements.catchDisplay.querySelector('h3').textContent = 'Oh no!';
}

async function catchFish() {
    stopSound('reel');
    const fish = generateFish();
    catches.unshift(fish);
    playSound('catch');

    // Run API calls in parallel for faster response
    let foundEssence = false;
    try {
        const [, essenceResponse] = await Promise.all([
            // Record catch to leaderboard
            fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: userWallet, fish })
            }),
            // Roll for Primordial Essence
            fetch('/api/primordial-essence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: userWallet })
            })
        ]);

        const essenceData = await essenceResponse.json();
        if (essenceData.found) {
            foundEssence = true;
            playSound('essence');
        }
    } catch (error) {
        console.error('API error:', error);
    }

    displayCatch(fish, foundEssence);
    updateCatchLog();

    gameState = 'idle';
    elements.castBtn.disabled = !isUnlimitedWallet;
}

// ============================================
// FISH GENERATION
// ============================================
function generateFish() {
    // Determine rarity first
    const rarity = getRandomRarity();

    // Get species from pre-computed cache
    const speciesPool = SPECIES_BY_RARITY[rarity];
    const species = speciesPool.length > 0
        ? speciesPool[Math.floor(Math.random() * speciesPool.length)]
        : FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)];

    // Generate other traits
    const size = FISH_SIZES[Math.floor(Math.random() * FISH_SIZES.length)];
    const color = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];

    // Special trait more likely on higher rarities
    let special = 'None';
    const specialChance = rarity === 'legendary' ? 0.8 :
                          rarity === 'epic' ? 0.5 :
                          rarity === 'rare' ? 0.3 : 0.1;
    if (Math.random() < specialChance) {
        special = FISH_SPECIALS[1 + Math.floor(Math.random() * (FISH_SPECIALS.length - 1))];
    }

    // Calculate weight based on size
    const baseWeight = { Tiny: 0.5, Small: 2, Medium: 5, Large: 15, Massive: 40 };
    const weight = (baseWeight[size] + Math.random() * baseWeight[size]).toFixed(1);

    return {
        species: species.name,
        image: species.image,
        fallback: species.fallback,
        rarity,
        size,
        color,
        special,
        weight: `${weight} lbs`,
        timestamp: new Date().toLocaleTimeString()
    };
}

function getRandomRarity() {
    let random = Math.random() * RARITY_TOTAL;

    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        random -= weight;
        if (random <= 0) return rarity;
    }

    return 'common';
}

// ============================================
// UI UPDATES
// ============================================
function shareEssenceOnX() {
    const tweetText = `I just found a Primordial Essence in the Primordial Pit! Only 100 exist this week. Can you find one?

Play now: https://midevil-fishing.vercel.app

@MidEvilsNFT #MidEvils #PrimordialPit`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank', 'width=550,height=420');
}

function displayCatch(fish, foundEssence = false) {
    let essenceHTML = '';
    if (foundEssence) {
        essenceHTML = `
            <div class="essence-found">
                <img class="essence-img" src="${ESSENCE_IMAGE}" alt="Primordial Essence" width="80" height="80" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="essence-fallback" style="display:none; font-size:60px;">${ESSENCE_FALLBACK}</div>
                <div class="essence-text">PRIMORDIAL ESSENCE FOUND!</div>
                <div class="essence-subtext">One of only 100 this week!</div>
                <button class="btn btn-share-x" onclick="shareEssenceOnX()">Share on X</button>
            </div>
        `;
    }

    elements.caughtFish.innerHTML = `
        ${essenceHTML}
        <div class="fish-image">
            <img src="${fish.image}" alt="${fish.species}" width="150" height="150" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span class="fish-fallback" style="display:none; font-size:80px;">${fish.fallback}</span>
        </div>
        <div class="fish-name" style="color: ${RARITY_COLORS[fish.rarity]}">${fish.color} ${fish.species}</div>
        <div class="fish-traits">
            <span class="trait rarity-${fish.rarity}">${capitalize(fish.rarity)}</span>
            <span class="trait">${fish.size}</span>
            <span class="trait">${fish.weight}</span>
            ${fish.special !== 'None' ? `<span class="trait">${fish.special}</span>` : ''}
        </div>
    `;

    elements.catchDisplay.style.display = 'flex';
}

function closeCatchDisplay() {
    elements.catchDisplay.style.display = 'none';
    // Reset the header text
    elements.catchDisplay.querySelector('h3').textContent = 'You caught a fish!';
    if (isUnlimitedWallet) {
        updateStatus('Click "Cast Line" to fish again!');
    } else {
        updateStatus("You've used your cast for today. Come back tomorrow!");
    }
}

function updateCatchLog() {
    elements.catchCount.textContent = `(${catches.length})`;

    // Only prepend new fish instead of rebuilding entire list
    const fish = catches[0];
    const newItem = `
        <div class="catch-item">
            <span class="fish-icon">${fish.fallback}</span>
            <div class="fish-info">
                <div class="name" style="color: ${RARITY_COLORS[fish.rarity]}">${fish.species}</div>
                <div class="rarity">${capitalize(fish.rarity)} - ${fish.weight}</div>
            </div>
        </div>
    `;
    elements.catchList.insertAdjacentHTML('afterbegin', newItem);

    // Remove excess items (keep max 20)
    while (elements.catchList.children.length > 20) {
        elements.catchList.lastChild.remove();
    }
}

function updateStatus(message) {
    elements.gameStatus.textContent = message;
}

function showLoading(show) {
    elements.loading.style.display = show ? 'flex' : 'none';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// DISCORD LINKING
// ============================================
async function checkDiscordStatus() {
    if (!userWallet || !elements.discordStatus) return;

    try {
        const response = await fetch(`/api/discord-status?wallet=${encodeURIComponent(userWallet)}`);
        const data = await response.json();

        if (data.linked) {
            const avatarUrl = data.avatar && data.discordId
                ? `https://cdn.discordapp.com/avatars/${data.discordId}/${data.avatar}.png?size=64`
                : null;
            const avatarImg = avatarUrl
                ? `<img src="${avatarUrl}" alt="" class="discord-avatar-small" onerror="this.style.display='none'">`
                : '';
            elements.discordStatus.innerHTML = `${avatarImg}<span class="discord-username">${data.globalName || data.username}</span>`;
            elements.linkDiscordBtn.style.display = 'none';
        } else {
            elements.discordStatus.textContent = 'Discord not linked';
            elements.linkDiscordBtn.style.display = 'inline-block';
        }
    } catch (error) {
        console.error('Failed to check Discord status:', error);
        elements.discordStatus.textContent = 'Discord not linked';
        elements.linkDiscordBtn.style.display = 'inline-block';
    }
}

function linkDiscord() {
    if (!userWallet) return;
    window.location.href = `/api/discord?wallet=${encodeURIComponent(userWallet)}`;
}

// Handle Discord OAuth callback messages
function handleDiscordCallback() {
    const params = new URLSearchParams(window.location.search);
    const discordStatus = params.get('discord');

    if (discordStatus === 'success') {
        const name = params.get('name');
        alert(`Discord linked successfully${name ? ` as ${decodeURIComponent(name)}` : ''}!`);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (discordStatus === 'denied') {
        alert('Discord authorization was denied.');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (discordStatus === 'error') {
        const reason = params.get('reason') || 'unknown';
        alert(`Failed to link Discord: ${reason}`);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Add Discord button listener
if (elements.linkDiscordBtn) {
    elements.linkDiscordBtn.addEventListener('click', linkDiscord);
}

// Check for Discord callback on page load
handleDiscordCallback();
