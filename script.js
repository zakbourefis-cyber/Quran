// --- VARIABLES GLOBALES ---
let allSurahs = [];
let favorites = []; 
let currentAudio = null;
let isLoggedIn = false; // Pour savoir si on affiche les cœurs rouges ou non

const container = document.getElementById('surah-container');
const modal = document.getElementById('verse-modal');
const modalBody = document.getElementById('modal-body');
const modalTitle = document.getElementById('modal-title');

// Éléments d'interface Auth
const loginDiv = document.getElementById('login-forms');
const userInfoDiv = document.getElementById('user-info');
const welcomeMsg = document.getElementById('welcome-msg');
const userField = document.getElementById('username');
const passField = document.getElementById('password');

// --- 1. DÉMARRAGE : Vérifier la session et charger les sourates ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkSession(); // On vérifie d'abord qui est là
    await getSurahs();    // Ensuite on charge le Coran
});

// --- 2. GESTION AUTHENTIFICATION (Appels vers auth.php) ---

async function checkSession() {
    try {
        const res = await fetch('auth.php?action=check');
        const data = await res.json();
        
        if (data.logged_in) {
            userConnected(data.username);
        } else {
            userDisconnected();
        }
    } catch (e) { console.error("Erreur auth", e); }
}

async function login() {
    const user = userField.value;
    const pass = passField.value;

    if(!user || !pass) return alert("Veuillez remplir les champs");

    const res = await fetch('auth.php?action=login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();

    if (data.success) {
        userConnected(data.username);
        userField.value = ''; passField.value = ''; // Vider les champs
    } else {
        alert("Erreur : " + data.message);
    }
}

async function register() {
    const user = userField.value;
    const pass = passField.value;

    if(!user || !pass) return alert("Veuillez remplir les champs");

    const res = await fetch('auth.php?action=register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();

    alert(data.message); // "Compte créé !" ou "Erreur"
}

async function logout() {
    await fetch('auth.php?action=logout');
    userDisconnected();
}

// --- Fonctions d'interface (UI) ---
function userConnected(name) {
    isLoggedIn = true;
    loginDiv.style.display = 'none';
    userInfoDiv.style.display = 'block';
    welcomeMsg.innerText = `Salam, ${name}`;
    loadFavorites(); // Charger les favoris de cet utilisateur
}

function userDisconnected() {
    isLoggedIn = false;
    loginDiv.style.display = 'block';
    userInfoDiv.style.display = 'none';
    favorites = []; // Vider les favoris locaux
    renderSurahs(allSurahs); // Rafraîchir l'affichage (enlève les cœurs rouges)
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
    
    // SÉCURITÉ : Si pas connecté, on bloque
    if (!isLoggedIn) {
        alert("Connectez-vous pour sauvegarder vos favoris !");
        return;
    }

    // Mise à jour visuelle immédiate
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    
    // Rafraîchir l'interface
    const activeFilter = document.querySelector('.btn-filter.active').innerText;
    if (activeFilter.includes('Favoris')) filterSurahs('fav');
    else renderSurahs(allSurahs);

    // Envoi BDD
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

    if (type === 'fav') {
        if(!isLoggedIn) {
            alert("Vous devez être connecté.");
            return;
        }
        const favList = allSurahs.filter(s => favorites.includes(s.id));
        renderSurahs(favList);
    } else {
        renderSurahs(allSurahs);
    }
}

// --- 5. LECTURE & AUDIO (Reste inchangé) ---

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