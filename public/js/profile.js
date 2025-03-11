document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/profile')
        .then(response => response.json())
        .then(data => {
            document.getElementById('username').textContent = data.username;
            const favorites = document.getElementById('favorites');
            const watchHistory = document.getElementById('watch-history');

            favorites.innerHTML = '<h3>Favoris</h3><ul>' + 
                data.favorites.map(item => `<li>${item}</li>`).join('') + 
                '</ul>';
            watchHistory.innerHTML = '<h3>Historique</h3><ul>' + 
                data.watchHistory.map(item => `<li>${item}</li>`).join('') + 
                '</ul>';
        })
        .catch(error => console.error('Erreur lors du chargement du profil:', error));
});