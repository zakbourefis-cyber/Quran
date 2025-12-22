// --- ÉTAT GLOBAL ---
let allSurahs = [];
let favorites = JSON.parse(localStorage.getItem('quranFavorites')) || [];
let currentAudio = null; // Pour stopper l'audio si on change de verset

const container = document.getElementById('surah-container');
const modal = document.getElementById('verse-modal');
const modalBody = document.getElementById('modal-body');
const modalTitle = document.getElementById('modal-title');

// 1. Récupérer les sourates
async function getSurahs() {
    try {
        const response = await fetch('https://api.quran.com/api/v4/chapters?language=fr');
        const data = await response.json();
        allSurahs = data.chapters;
        renderSurahs(allSurahs); // Afficher tout par défaut
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p>Erreur de chargement.</p>';
    }
}

// 2. Afficher les cartes (avec gestion favoris)
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
        
        // Le clic sur la carte ouvre la modale
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

// 3. Gestion des Favoris (LocalStorage)
async function toggleFavorite(event, id) {
    event.stopPropagation(); // Empêche d'ouvrir la modale
    
    // 1. Mise à jour visuelle immédiate (pour que ce soit réactif)
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    
    // Rafraîchir l'icône tout de suite
    const activeFilter = document.querySelector('.btn-filter.active').innerText;
    if (activeFilter.includes('Favoris')) {
        filterSurahs('fav');
    } else {
        renderSurahs(allSurahs);
    }

    // 2. Envoi à la base de données (en arrière-plan)
    try {
        await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ surah_id: id })
        });
    } catch (error) {
        console.error("Erreur sauvegarde MySQL:", error);
        alert("Impossible de sauvegarder le favori !");
    }
}

// 4. Filtrer l'affichage
function filterSurahs(type) {
    // Gestion des boutons CSS
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (type === 'fav') {
        const favList = allSurahs.filter(s => favorites.includes(s.id));
        renderSurahs(favList);
    } else {
        renderSurahs(allSurahs);
    }
}

// 5. Charger les versets + Audio par verset
async function loadSurahDetails(id, nameFr, nameAr) {
    modal.style.display = "flex";
    modalTitle.innerText = `${nameAr} - ${nameFr}`;
    modalBody.innerHTML = '<p style="text-align:center;">Chargement...</p>';

    try {
        // Appel API Puissant : Versets + Audio + Traduction en une seule requête
        // audio=7 (Mishary), translations=136 (Français), limit=300 (pour avoir toute la sourate d'un coup)
        const url = `https://api.quran.com/api/v4/verses/by_chapter/${id}?language=fr&words=false&translations=136&audio=7&per_page=300&fields=text_uthmani,verse_key`;
        
        const response = await fetch(url);
        const data = await response.json();

        modalBody.innerHTML = ''; // Vider le loader

        data.verses.forEach(verse => {
            // Préparation de l'audio
            const audioUrl = "https://verses.quran.com/" + verse.audio.url;
            const translation = verse.translations[0].text;

            const verseDiv = document.createElement('div');
            verseDiv.className = 'verse-container';
            verseDiv.innerHTML = `
                <div class="verse-ar">
                    ${verse.text_uthmani} <span style="font-size:0.6em; color:#primary-color;">(${verse.verse_key})</span>
                </div>
                <div class="verse-fr">${translation}</div>
                <div class="verse-actions">
                    <button class="play-btn" onclick="playAudio(this, '${audioUrl}')">
                        <i class="fa-solid fa-play"></i>
                    </button>
                </div>
            `;
            modalBody.appendChild(verseDiv);
        });

    } catch (error) {
        console.error(error);
        modalBody.innerHTML = '<p>Erreur.</p>';
    }
}

// 6. Gestion du lecteur audio
function playAudio(btn, url) {
    // Si un audio joue déjà, on le stop
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        // Remettre l'icône Play sur tous les boutons
        document.querySelectorAll('.play-btn i').forEach(icon => {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
        });
    }

    // Créer et jouer le nouvel audio
    const audio = new Audio(url);
    currentAudio = audio;
    
    audio.play();
    
    // Changer l'icône du bouton cliqué
    const icon = btn.querySelector('i');
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause');

    // Quand c'est fini, remettre l'icône Play
    audio.onended = () => {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        currentAudio = null;
    };
}

function closeModal() {
    modal.style.display = "none";
    if (currentAudio) {
        currentAudio.pause(); // Stopper le son en fermant
    }
}

window.onclick = function(event) {
    if (event.target == modal) closeModal();
}

async function loadFavorites() {
    try {
        const response = await fetch('api.php'); // Appel vers notre fichier PHP
        favorites = await response.json();
        // Une fois chargé, on rafraîchit l'affichage
        renderSurahs(allSurahs);
    } catch (error) {
        console.error("Erreur chargement favoris MySQL:", error);
    }
}
// Lancer
// Lancer
getSurahs().then(() => {
    loadFavorites(); // On charge les favoris APRÈS avoir chargé les sourates
});