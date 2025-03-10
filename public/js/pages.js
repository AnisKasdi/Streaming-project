document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log('Recherche : ', e.target.value);
        });
    }

    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            const genre = document.querySelector('select[name="genre"]').value;
            const rating = document.querySelector('#rating-filter').value;
            console.log(`Filtrer par genre: ${genre}, note: ${rating}`);
        });
    }

    const authForm = document.querySelector('.auth-form');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = authForm.querySelector('input[type="email"]').value;
            const password = authForm.querySelector('input[type="password"]').value;
            console.log('Connexion : ', { email, password });
        });
    }

    const switchForm = document.querySelector('.switch-form');
    if (switchForm) {
        switchForm.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Switch entre connexion/inscription');
        });
    }
});