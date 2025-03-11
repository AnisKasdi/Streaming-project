document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log('Recherche : ', e.target.value);
        });
    }

    // Charger les animes depuis l'API
    fetch('/api/animes')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Données reçues du serveur:', data);
            const animes = data.data || [];
            if (!animes.length) {
                console.warn('Aucun anime trouvé dans la réponse.');
                document.getElementById('shonen-list').innerHTML = '<div class="error-message">Aucun anime disponible.</div>';
                document.getElementById('seinen-list').innerHTML = '<div class="error-message">Aucun anime disponible.</div>';
                document.getElementById('comedy-list').innerHTML = '<div class="error-message">Aucun anime disponible.</div>';
                return;
            }

            // Répartir les 25 animes
            const shonenList = document.getElementById('shonen-list');
            const seinenList = document.getElementById('seinen-list');
            const comedyList = document.getElementById('comedy-list');

            const shonen = animes.slice(0, 8);
            const seinen = animes.slice(8, 16);
            const comedy = animes.slice(16, 25);

            // Remplir les carrousels
            [shonen, seinen, comedy].forEach((genreList, index) => {
                const list = [shonenList, seinenList, comedyList][index];
                genreList.forEach(anime => {
                    const card = document.createElement('div');
                    card.className = 'anime-card';
                    card.innerHTML = createAnimeCard(anime);
                    list.appendChild(card);
                });
            });

            // Initialiser les carrousels
            initCarousels();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des animes:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = `Erreur: ${error.message}. Vérifiez la console pour plus de détails.`;
            document.querySelector('.genres-list').insertAdjacentElement('afterbegin', errorDiv);
        });

    // Gestion des carrousels
    function initCarousels() {
        document.querySelectorAll('.carousel-container').forEach(container => {
            const carousel = container.querySelector('.genre-anime-list');
            const prevBtn = container.querySelector('.carousel-prev');
            const nextBtn = container.querySelector('.carousel-next');
            const cardWidth = 240; // 220px + 20px gap

            nextBtn.addEventListener('click', () => {
                const scrollPosition = carousel.scrollLeft + cardWidth;
                const maxScroll = carousel.scrollWidth - carousel.clientWidth;
                carousel.scrollTo({ left: Math.min(scrollPosition, maxScroll), behavior: 'smooth' });
            });

            prevBtn.addEventListener('click', () => {
                const scrollPosition = carousel.scrollLeft - cardWidth;
                carousel.scrollTo({ left: Math.max(scrollPosition, 0), behavior: 'smooth' });
            });
        });
    }
});

// Style pour le message d'erreur
const style = document.createElement('style');
style.textContent = `
    .error-message {
        color: #fff;
        background: #ff4444;
        padding: 10px;
        text-align: center;
        border-radius: 5px;
        margin: 10px;
    }
`;
document.head.appendChild(style);
function createAnimeCard(anime) {
    return `
        <a href="anime-details.html?id=${anime.mal_id}" class="anime-link">
            <div class="anime-card">
                <img src="${anime.images?.jpg?.large_image_url || 'https://via.placeholder.com/220x300'}" alt="${anime.title}">
                <span class="anime-title">${anime.title}</span>
                <div class="anime-details">
                    <p>Score: ${anime.score || 'N/A'}</p>
                    <p>Épisodes: ${anime.episodes || 'N/A'}</p>
                    <p>Année: ${anime.year || 'N/A'}</p>
                </div>
            </div>
        </a>
    `;
}


const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length < 3) return; // Minimum 3 caractères pour lancer la recherche

        try {
            const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const animes = data.data || [];
            console.log('Résultats de recherche:', animes);

            // Remplir les carrousels avec les résultats
            ['shonen-list', 'seinen-list', 'comedy-list'].forEach(id => {
                const list = document.getElementById(id);
                list.innerHTML = '';
                animes.slice(0, 8).forEach(anime => {
                    const card = document.createElement('div');
                    card.className = 'anime-card';
                    card.innerHTML = createAnimeCard(anime);
                    list.appendChild(card);
                });
            });
            initCarousels();
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
        }
    });
}
