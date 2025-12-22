// --- VARIABLES GLOBALES ---
let allSurahs = [];
let favorites = []; 
let currentAudio = null;
let isLoggedIn = false;

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