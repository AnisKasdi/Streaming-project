document.addEventListener('DOMContentLoaded', () => {
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            document.body.classList.toggle('night-mode');
        });
    }

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.addEventListener('mouseover', () => {
            sidebar.style.width = '280px';
        });
        sidebar.addEventListener('mouseout', () => {
            sidebar.style.width = '250px';
        });
    }

    const sections = document.querySelectorAll('.anime-grid, .categories, .discover, .profile');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.2 });

    sections.forEach(section => observer.observe(section));
});

const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .fade-in {
        animation: fadeIn 0.8s ease forwards;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(styleSheet);