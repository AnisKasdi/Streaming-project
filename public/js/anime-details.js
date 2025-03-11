document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id');

    if (animeId) {
        fetch(`https://api.jikan.moe/v4/anime/${animeId}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                const anime = data.data;
                const detailsSection = document.getElementById('anime-details');
                detailsSection.innerHTML = `
                    <div class="details-container">
                        <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
                        <h1>${anime.title}</h1>
                        <p><strong>Score:</strong> ${anime.score || 'N/A'}</p>
                        <p><strong>Épisodes:</strong> ${anime.episodes || 'N/A'}</p>
                        <p><strong>Année:</strong> ${anime.year || 'N/A'}</p>
                        <p><strong>Synopsis:</strong> ${anime.synopsis || 'Aucun synopsis disponible.'}</p>
                    </div>
                `;
            })
            .catch(error => console.error('Erreur lors du chargement des détails:', error));
    }
});
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const animeId = params.get("id");

    if (!animeId) {
        console.error("Aucun ID d’anime trouvé dans l’URL.");
        document.getElementById("anime-synopsis").textContent = "Aucun anime trouvé.";
        return;
    }

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
        if (!response.ok) throw new Error("Erreur lors du chargement des données");

        const { data: anime } = await response.json();
        document.getElementById("anime-title").textContent = anime.title;
        document.getElementById("anime-image").src = anime.images.jpg.large_image_url;
        document.getElementById("anime-synopsis").textContent = anime.synopsis || "Aucune description disponible.";
        document.getElementById("anime-score").textContent = anime.score || "N/A";
        document.getElementById("anime-type").textContent = anime.type || "N/A";
        document.getElementById("anime-year").textContent = anime.year || "N/A";
        document.getElementById("anime-episodes").textContent = anime.episodes || "N/A";
        document.getElementById("anime-genres").textContent = anime.genres.map(g => g.name).join(", ") || "N/A";
        document.getElementById("anime-studios").textContent = anime.studios.map(s => s.name).join(", ") || "N/A";

        // Génération des liens des épisodes
        const episodeList = document.getElementById("episode-list");
        episodeList.innerHTML = ""; // Efface le texte de chargement
        for (let i = 1; i <= (anime.episodes || 12); i++) {
            const li = document.createElement("li");
            li.innerHTML = `<a href="watch.html?anime=${animeId}&ep=${i}">Épisode ${i}</a>`;
            episodeList.appendChild(li);
        }

        // Rediriger vers le premier épisode
        const watchButton = document.getElementById("watch-first");
        if (anime.episodes) {
            watchButton.addEventListener("click", () => {
                window.location.href = `watch.html?anime=${animeId}&ep=1`;
            });
        } else {
            watchButton.style.display = "none"; // Cache le bouton s'il n'y a pas d'épisodes
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des détails de l’anime :", error);
        document.getElementById("anime-synopsis").textContent = "Impossible de charger les détails.";
    }
});
