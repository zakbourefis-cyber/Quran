// --- VARIABLES GLOBALES ---
let allSurahs = [];
let favorites = []; 
let currentAudio = null;
let isLoggedIn = false;

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

// Éléments d'interface
const btnLoginLink = document.getElementById('btn-login-link');
const userLoggedInDiv = document.getElementById('user-logged-in');
const welcomeMsg = document.getElementById('welcome-msg');

// --- 1. DÉMARRAGE ---
document.addEventListener('DOMContentLoaded', async () => {
    initHadithSystem();
    await checkSession(); // Vérifier qui est là
    await getSurahs();    // Charger le Coran
});

// --- 2. GESTION SESSION ---

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

// --- MISE À JOUR : On utilise l'avatar de la BDD ---
            if(avatarImg) {
                // Si l'utilisateur n'a pas choisi (default) ou si c'est vide
                if (data.avatar === 'default' || !data.avatar) {
                    // ON GÉNÈRE UN CHAT UNIQUE BASÉ SUR SON PSEUDO
                    avatarImg.src = `https://robohash.org/${data.username}?set=set4`;
                } else {
                    // Sinon, on affiche le chat qu'il a choisi dans la grille
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
    window.location.reload(); // Recharger la page pour remettre à zéro
}

// --- 3. CHARGEMENT DONNÉES ---

async function getSurahs() {
    try {
        const response = await fetch('https://api.quran.com/api/v4/chapters?language=fr');
        const data = await response.json();
        allSurahs = data.chapters;
        renderSurahs(allSurahs);
    } catch (error) {
        container.innerHTML = '<p>Erreur de chargement API.</p>';
    }
}

async function loadFavorites() {
    if (!isLoggedIn) return;
    try {
        const response = await fetch('api.php');
        favorites = await response.json();
        renderSurahs(allSurahs);
    } catch (error) { console.error(error); }
}

// --- 4. AFFICHAGE & FAVORIS ---

function renderSurahs(list) {
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
        // Rediriger vers la page de login si on clique sur favori sans être connecté
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
    
    const activeFilter = document.querySelector('.btn-filter.active').innerText;
    if (activeFilter.includes('Favoris')) filterSurahs('fav');
    else renderSurahs(allSurahs);

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
    document.getElementById('prayer-container').style.display = 'none';
    document.getElementById('surah-container').style.display = 'grid';
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

// --- FONCTION HADITH ---
function afficherHadith() {
    const textEl = document.getElementById('hadith-text');
    const sourceEl = document.getElementById('hadith-source');
    
    if(!textEl || !sourceEl) return;

    const h = hadithsList[currentHadithIndex];

    // Mise à jour du texte
    textEl.innerText = `"${h.text}"`;
    sourceEl.innerText = `- Rapporté par ${h.source}`;
}
// Variable pour savoir où on en est
let currentHadithIndex = 0;

function initHadithSystem() {
    const container = document.getElementById('hadith-container');
    
    if (container) {
        // 1. Choisir un index de départ aléatoire
        currentHadithIndex = Math.floor(Math.random() * hadithsList.length);
        afficherHadith();

        // 2. Ajouter l'événement "clic" pour passer au suivant
        container.onclick = function() {
            // Passer à l'index suivant (le module % permet de revenir à 0 à la fin de la liste)
            currentHadithIndex = (currentHadithIndex + 1) % hadithsList.length;
            afficherHadith();
        };
        
        // Petit message au survol pour guider l'utilisateur
        container.title = "Cliquez pour lire un autre hadith";
    }
}

// --- 6. GESTION DES HORAIRES DE PRIÈRE ---

function showPrayerTimes() {
    // 1. Gérer l'affichage des onglets
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    // On cible le 3ème bouton (celui qu'on vient d'ajouter)
    document.querySelectorAll('.btn-filter')[2].classList.add('active');

    // Cacher les sourates et afficher les prières
    document.getElementById('surah-container').style.display = 'none';
    document.getElementById('prayer-container').style.display = 'block';

    // 2. Lancer la géolocalisation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchPrayerTimes, handleLocationError);
    } else {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
}

// Fonction appelée si on a la position
async function fetchPrayerTimes(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const date = Math.floor(Date.now() / 1000); // Timestamp actuel

    // METHODE 12 = UOIF (France)
    const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=12&iso8601=true`;

    try {
        document.getElementById('prayer-city').innerText = "Chargement...";
        
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

    // 1. Mise à jour des infos générales
    document.getElementById('prayer-city').innerText = "📍 Votre Position"; 
    document.getElementById('prayer-date').innerText = dateReadable;

    const listDiv = document.getElementById('prayer-times-list');
    listDiv.innerHTML = ''; // On vide la liste précédente

    // 2. Configuration : On définit les prières voulues (Sans Chourouk)
    const prayersDef = [
        { key: 'Fajr', label: 'Fajr' },
        { key: 'Dhuhr', label: 'Dhuhr' },
        { key: 'Asr', label: 'Asr' },
        { key: 'Maghrib', label: 'Maghrib' },
        { key: 'Isha', label: 'Isha' }
    ];

    // 3. Trouver la prochaine prière
    const now = new Date();
    let nextPrayer = null;

    // On cherche la première prière dont l'heure est dans le futur
    for (const p of prayersDef) {
        // L'API renvoie un format ISO date complète grâce à iso8601=true
        const timeObj = new Date(timings[p.key]); 
        
        if (timeObj > now) {
            nextPrayer = { ...p, timeObj: timeObj };
            break; // On a trouvé la prochaine, on arrête de chercher
        }
    }

    // Si on n'a rien trouvé (il est tard, après Isha), la prochaine est Fajr (le 1er de la liste)
    if (!nextPrayer) {
        const firstP = prayersDef[0];
        nextPrayer = { ...firstP, timeObj: new Date(timings[firstP.key]) };
    }

    // Fonction utilitaire pour avoir juste l'heure "HH:MM"
    const formatHeure = (dateObj) => {
        return dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    // --- CONSTRUCTION DU HTML ---
    let html = '';

    // A. Bloc HERO (La prochaine prière en grand)
    html += `
        <div class="prayer-hero">
            <h3 class="hero-label">Prochaine Prière</h3>
            <h1 class="hero-name">${nextPrayer.label}</h1>
            <div class="hero-time">${formatHeure(nextPrayer.timeObj)}</div>
        </div>
    `;

    // B. Bloc GRILLE (Les autres prières en petit en bas)
    html += '<div class="prayer-grid">';
    
    prayersDef.forEach(p => {
        const pDate = new Date(timings[p.key]);
        // On ajoute une classe 'active' si c'est la prière affichée en grand
        const isActive = (p.key === nextPrayer.key) ? 'active' : '';

        html += `
            <div class="prayer-card ${isActive}">
                <span class="card-name">${p.label}</span>
                <span class="card-time">${formatHeure(pDate)}</span>
            </div>
        `;
    });
    html += '</div>';

    // Injection dans la page
    listDiv.innerHTML = html;
}

    prayersToShow.forEach(p => {
        // L'API renvoie l'heure au format "HH:MM (CET)", on nettoie pour garder HH:MM
        let time = timings[p.key].split(' ')[0]; 

        const div = document.createElement('div');
        div.className = 'prayer-item';
        div.innerHTML = `
            <span class="prayer-name">${p.label}</span>
            <span class="prayer-time">${time}</span>
        `;
        listDiv.appendChild(div);
    });


function handleLocationError(error) {
    let msg = "Erreur inconnue.";
    switch(error.code) {
        case error.PERMISSION_DENIED:
            msg = "Vous avez refusé la géolocalisation.";
            break;
        case error.POSITION_UNAVAILABLE:
            msg = "Position indisponible.";
            break;
        case error.TIMEOUT:
            msg = "Délai d'attente dépassé.";
            break;
    }
    document.getElementById('prayer-city').innerText = "Erreur";
    document.getElementById('prayer-times-list').innerHTML = `<p style="color:red;">${msg}</p>`;
}