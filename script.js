// --- VARIABLES GLOBALES ---
let allSurahs = [];
let favorites = []; 
let currentAudio = null;
let isLoggedIn = false;

// Liste des Hadiths
const hadithsList = [
    { text: "La richesse ne dépend pas de la quantité de biens, mais la richesse est la richesse de l'âme.", source: "Bukhari et Muslim" },
    { text: "Celui qui ne remercie pas les gens n'a pas remercié Allah.", source: "Abou Daoud" },
    { text: "Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne.", source: "Bukhari" },
    { text: "La propreté est la moitié de la foi.", source: "Muslim" },
    { text: "Sourire est une aumône.", source: "Tirmidhi" },
    { text: "La parole bienveillante est une aumône.", source: "Bukhari et Muslim" },
    { text: "Nulle fatigue, nulle maladie, nul souci, nulle tristesse, nul mal n'atteint le musulman sans que Dieu ne lui expie par cela de ses péchés.", source: "Bukhari" },
    { text: "Celui qui croit en Allah et au Jour dernier, qu'il dise du bien ou qu'il se taise.", source: "Bukhari et Muslim" },
    { text: "Craignez Allah où que vous soyez, faites suivre la mauvaise action par une bonne qui l'effacera, et comportez-vous avec les gens de belle manière.", source: "Tirmidhi" },
    { text: "L'homme fort n'est pas celui qui terrasse ses adversaires, mais celui qui se maîtrise lors de la colère.", source: "Bukhari" },
    { text: "Dieu ne regarde ni vos corps ni vos images, mais Il regarde vos cœurs et vos actes.", source: "Muslim" },
    { text: "La pudeur ne vient qu'avec le bien.", source: "Bukhari et Muslim" },
    { text: "Aime pour ton frère ce que tu aimes pour toi-même.", source: "Bukhari et Muslim" },
    { text: "Celui qui rompt les liens de parenté n'entrera pas au Paradis.", source: "Muslim" },
    { text: "Facilitez les choses et ne les compliquez pas, annoncez la bonne nouvelle et ne faites pas fuir les gens.", source: "Bukhari" },
    { text: "Méfiez-vous de la suspicion, car la suspicion est la parole la plus mensongère.", source: "Bukhari" },
    { text: "Le croyant n'est pas celui qui mange à satiété alors que son voisin a faim.", source: "Al-Albani" },
    { text: "Les actions ne valent que par les intentions.", source: "Bukhari et Muslim" },
    { text: "Ne vous mettez pas en colère.", source: "Bukhari" },
    { text: "Celui qui emprunte un chemin à la recherche du savoir, Allah lui facilite un chemin vers le Paradis.", source: "Muslim" },
    { text: "La douceur n'est jamais présente dans une chose sans qu'elle ne l'embellisse.", source: "Muslim" },
    { text: "Le musulman est celui dont les gens sont à l'abri de sa langue et de sa main.", source: "Bukhari" },
    { text: "Donnez à l'ouvrier son salaire avant que sa sueur ne sèche.", source: "Ibn Majah" },
    { text: "La meilleure des aumônes est de donner de l'eau à boire.", source: "Ahmad" },
    { text: "Échangez des cadeaux, vous vous aimerez.", source: "Al-Bukhari (Al-Adab Al-Mufrad)" },
    { text: "Le bas-monde est une prison pour le croyant et un paradis pour le mécréant.", source: "Muslim" },
    { text: "Allah est Beau et Il aime la beauté.", source: "Muslim" },
    { text: "Celui qui montre la voie vers une bonne action a la même récompense que celui qui la fait.", source: "Muslim" },
    { text: "Profite de cinq choses avant cinq autres : ta jeunesse avant ta vieillesse, ta santé avant ta maladie, ta richesse avant ta pauvreté, ton temps libre avant ton occupation et ta vie avant ta mort.", source: "Al-Hakim" },
    { text: "Le meilleur des hommes est celui qui est le plus utile aux autres.", source: "Tabarani" }
];

const container = document.getElementById('surah-container');
const modal = document.getElementById('verse-modal');
const modalBody = document.getElementById('modal-body');
const modalTitle = document.getElementById('modal-title');

// --- 1. DÉMARRAGE UNIQUE (Fusionné) ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Lancer le Hadith
    initHadithSystem();

    // 2. Lancer les Horaires (Géolocalisation)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchPrayerTimes, handleLocationError);
    } else {
        console.log("Géolocalisation non supportée ou refusée");
        document.getElementById('prayer-city').innerText = "Géolocalisation requise";
    }

    // 3. Lancer la Session et le Coran
    await checkSession(); 
    await getSurahs();    
});


// --- 2. GESTION DES HORAIRES (API & AFFICHAGE) ---

async function fetchPrayerTimes(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const date = Math.floor(Date.now() / 1000); 

    // URL API (Méthode 3 = MWL, mais on applique nos propres corrections)
    const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=3&iso8601=true`;

    try {
        const cityEl = document.getElementById('prayer-city');
        if(cityEl) cityEl.innerText = "Chargement...";
        
        const res = await fetch(url);
        const data = await res.json();
        
        displayPrayers(data.data);
    } catch (error) {
        console.error("Erreur API Adhan", error);
        document.getElementById('prayer-city').innerText = "Erreur de connexion";
    }
}

function displayPrayers(data) {
    const timings = data.timings;
    const dateReadable = data.date.readable;

    // --- TES CORRECTIONS (Minutes) ---
    const CORRECTIONS = {
        'Fajr': 19,
        'Dhuhr': 4,
        'Asr': 0,
        'Maghrib': 3,
        'Isha': -10
    };

    // Mise à jour textes
    const cityEl = document.getElementById('prayer-city');
    const dateEl = document.getElementById('prayer-date');
    if(cityEl) cityEl.innerText = "📍 Votre Position"; 
    if(dateEl) dateEl.innerText = dateReadable;

    const listDiv = document.getElementById('prayer-times-list');
    if(!listDiv) return;
    listDiv.innerHTML = ''; 

    const prayersDef = [
        { key: 'Fajr', label: 'Fajr' },
        { key: 'Dhuhr', label: 'Dhuhr' },
        { key: 'Asr', label: 'Asr' },
        { key: 'Maghrib', label: 'Maghrib' },
        { key: 'Isha', label: 'Isha' }
    ];

    // Fonction d'ajustement
    const ajusterHeure = (dateObj, minutes) => {
        if (!minutes) return dateObj;
        const newDate = new Date(dateObj); 
        newDate.setMinutes(newDate.getMinutes() + minutes);
        return newDate;
    };

    const now = new Date();
    let nextPrayer = null;

    // Calcul des horaires ajustés
    const adjustedPrayers = prayersDef.map(p => {
        const rawDate = new Date(timings[p.key]);
        const fixedDate = ajusterHeure(rawDate, CORRECTIONS[p.key]);
        return { ...p, timeObj: fixedDate };
    });

    // Trouver la prochaine prière
    for (const p of adjustedPrayers) {
        if (p.timeObj > now) {
            nextPrayer = p;
            break;
        }
    }
    if (!nextPrayer) nextPrayer = adjustedPrayers[0]; // Si fin de journée -> Fajr demain

    const formatHeure = (dateObj) => {
        return dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    // --- CONSTRUCTION HTML (DASHBOARD) ---
    let html = '';

    // Partie GAUCHE (Hero)
    html += `
        <div class="prayer-hero">
            <h3 class="hero-label">Prochaine Prière</h3>
            <h1 class="hero-name">${nextPrayer.label}</h1>
            <div class="hero-time">${formatHeure(nextPrayer.timeObj)}</div>
            ${CORRECTIONS[nextPrayer.key] !== 0 ? '<small style="font-size:0.7em; opacity:0.7">(Ajusté mosquée)</small>' : ''}
        </div>
    `;

    // Partie DROITE (Grille)
    html += '<div class="prayer-grid">';
    adjustedPrayers.forEach(p => {
        const isActive = (p.key === nextPrayer.key) ? 'active' : '';
        html += `
            <div class="prayer-card ${isActive}">
                <span class="card-name">${p.label}</span>
                <span class="card-time">${formatHeure(p.timeObj)}</span>
            </div>
        `;
    });
    html += '</div>';

    listDiv.innerHTML = html;
}

function handleLocationError(error) {
    let msg = "Erreur inconnue.";
    switch(error.code) {
        case error.PERMISSION_DENIED: msg = "Géolocalisation refusée."; break;
        case error.POSITION_UNAVAILABLE: msg = "Position indisponible."; break;
        case error.TIMEOUT: msg = "Délai dépassé."; break;
    }
    const cityEl = document.getElementById('prayer-city');
    const listEl = document.getElementById('prayer-times-list');
    
    if(cityEl) cityEl.innerText = "Erreur";
    if(listEl) listEl.innerHTML = `<p style="color:red; font-size:0.9em;">${msg}</p>`;
}


// --- 3. GESTION SESSION & UTILISATEUR ---

async function checkSession() {
    try {
        const res = await fetch('auth.php?action=check');
        const data = await res.json();
        
        const btnLink = document.getElementById('btn-login-link');
        const userDiv = document.getElementById('user-logged-in');
        const msgSpan = document.getElementById('welcome-msg');
        const avatarImg = document.getElementById('user-avatar');

        if (data.logged_in) {
            isLoggedIn = true;
            if(btnLink) btnLink.style.display = 'none';
            if(userDiv) userDiv.style.display = 'flex';
            if(msgSpan) msgSpan.innerText = data.username;

            if(avatarImg) {
                if (data.avatar === 'default' || !data.avatar) {
                    avatarImg.src = `https://robohash.org/${data.username}?set=set4`;
                } else {
                    avatarImg.src = data.avatar;
                }
            }
            loadFavorites();
        } else {
            isLoggedIn = false;
            if(btnLink) btnLink.style.display = 'inline-block';
            if(userDiv) userDiv.style.display = 'none';
        }
    } catch (e) { console.error("Erreur auth", e); }
}

async function logout() {
    await fetch('auth.php?action=logout');
    window.location.reload(); 
}


// --- 4. CHARGEMENT & AFFICHAGE SOURATES ---

async function getSurahs() {
    try {
        const response = await fetch('https://api.quran.com/api/v4/chapters?language=fr');
        const data = await response.json();
        allSurahs = data.chapters;
        renderSurahs(allSurahs);
    } catch (error) {
        if(container) container.innerHTML = '<p>Erreur de chargement API.</p>';
    }
}

async function loadFavorites() {
    if (!isLoggedIn) return;
    try {
        const response = await fetch('api.php');
        favorites = await response.json();
        renderSurahs(allSurahs); // Rafraîchir pour afficher les coeurs rouges
    } catch (error) { console.error(error); }
}

function renderSurahs(list) {
    if(!container) return;
    container.innerHTML = '';
    
    if(list.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%;">Aucune sourate trouvée.</p>';
        return;
    }

    list.forEach(surah => {
        const isFav = favorites.includes(surah.id);
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.onclick = (e) => loadSurahDetails(surah.id, surah.translated_name.name, surah.name_arabic);

        card.innerHTML = `
            <div class="card-header">
                <div class="surah-number">${surah.id}</div>
                <div class="surah-name-ar">${surah.name_arabic}</div>
            </div>
            <div class="surah-name-fr">${surah.translated_name.name}</div>
            <div class="surah-info">${surah.verses_count} Versets</div>
            
            <i class="fa-solid fa-heart fav-btn ${isFav ? 'active' : ''}" 
               onclick="toggleFavorite(event, ${surah.id})"></i>
        `;
        container.appendChild(card);
    });
}

async function toggleFavorite(event, id) {
    event.stopPropagation();
    
    if (!isLoggedIn) {
        if(confirm("Vous devez être connecté pour gérer vos favoris. Aller à la connexion ?")) {
            window.location.href = 'login.html';
        }
        return;
    }

    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    
    const activeBtn = document.querySelector('.btn-filter.active');
    if (activeBtn && activeBtn.innerText.includes('Favoris')) {
        filterSurahs('fav');
    } else {
        renderSurahs(allSurahs);
    }

    try {
        await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ surah_id: id })
        });
    } catch (error) { console.error("Erreur save", error); }
}

function filterSurahs(type) {
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // On s'assure que tout est visible
    if (type === 'fav') {
        if(!isLoggedIn) {
            if(confirm("Connectez-vous pour voir vos favoris.")) {
                window.location.href = 'login.html';
            }
            return;
        }
        const favList = allSurahs.filter(s => favorites.includes(s.id));
        renderSurahs(favList);
    } else {
        renderSurahs(allSurahs);
    }
}


// --- 5. LECTURE & AUDIO ---

async function loadSurahDetails(id, nameFr, nameAr) {
    modal.style.display = "flex";
    modalTitle.innerText = `${nameAr} - ${nameFr}`;
    modalBody.innerHTML = '<p style="text-align:center;">Chargement...</p>';

    try {
        const url = `https://api.quran.com/api/v4/verses/by_chapter/${id}?language=fr&words=false&translations=136&audio=7&per_page=300&fields=text_uthmani,verse_key`;
        const response = await fetch(url);
        const data = await response.json();

        modalBody.innerHTML = ''; 

        data.verses.forEach(verse => {
            const audioUrl = "https://verses.quran.com/" + verse.audio.url;
            const translation = verse.translations[0].text;

            const verseDiv = document.createElement('div');
            verseDiv.className = 'verse-container';
            verseDiv.innerHTML = `
                <div class="verse-ar">${verse.text_uthmani} <span style="font-size:0.6em; color:#2E7D32;">(${verse.verse_key})</span></div>
                <div class="verse-fr">${translation}</div>
                <div class="verse-actions">
                    <button class="play-btn" onclick="playAudio(this, '${audioUrl}')"><i class="fa-solid fa-play"></i></button>
                </div>
            `;
            modalBody.appendChild(verseDiv);
        });
    } catch (error) { console.error(error); }
}

function playAudio(btn, url) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        document.querySelectorAll('.play-btn i').forEach(icon => {
            icon.classList.remove('fa-pause'); icon.classList.add('fa-play');
        });
    }
    const audio = new Audio(url);
    currentAudio = audio;
    audio.play();
    
    const icon = btn.querySelector('i');
    icon.classList.remove('fa-play'); icon.classList.add('fa-pause');

    audio.onended = () => {
        icon.classList.remove('fa-pause'); icon.classList.add('fa-play');
        currentAudio = null;
    };
}

function closeModal() {
    modal.style.display = "none";
    if (currentAudio) currentAudio.pause();
}

window.onclick = function(event) { if (event.target == modal) closeModal(); }


// --- 6. SYSTEME HADITH ---

let currentHadithIndex = 0;

function afficherHadith() {
    const textEl = document.getElementById('hadith-text');
    const sourceEl = document.getElementById('hadith-source');
    if(!textEl || !sourceEl) return;

    const h = hadithsList[currentHadithIndex];
    textEl.innerText = `"${h.text}"`;
    sourceEl.innerText = `- Rapporté par ${h.source}`;
}

function initHadithSystem() {
    const hadithContainer = document.getElementById('hadith-container');
    if (hadithContainer) {
        currentHadithIndex = Math.floor(Math.random() * hadithsList.length);
        afficherHadith();

        hadithContainer.onclick = function() {
            currentHadithIndex = (currentHadithIndex + 1) % hadithsList.length;
            afficherHadith();
        };
        hadithContainer.title = "Cliquez pour lire un autre hadith";
    }
}