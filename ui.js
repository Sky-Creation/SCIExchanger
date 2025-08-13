document.addEventListener('DOMContentLoaded', () => {
    // --- UI Interaction Logic ---

    // Mobile Menu Toggle
    function initializeMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const hamburgerIcon = document.getElementById('hamburger-icon');
        const closeIcon = document.getElementById('close-icon');

        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', () => {
                const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
                mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
                mobileMenu.classList.toggle('hidden');
                hamburgerIcon.classList.toggle('hidden');
                closeIcon.classList.toggle('hidden');
            });
        }
    }

    // --- NEW: Manual Ad Scroller Logic ---
    function initializeAdScroller() {
        const scroller = document.querySelector('.ad-scroller');
        const nextBtn = document.getElementById('ad-next-btn');
        const prevBtn = document.getElementById('ad-prev-btn');

        if (!scroller || !nextBtn || !prevBtn) {
            return;
        }

        const scrollAmount = 316; // Width of ad (300) + gap (16)

        const handleManualScroll = () => {
            // Stop automatic animation on manual interaction
            scroller.style.animation = 'none';
        };

        nextBtn.addEventListener('click', () => {
            handleManualScroll();
            scroller.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            handleManualScroll();
            scroller.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
    }

    // Initialize all UI components
    initializeMobileMenu();
    initializeAdScroller(); // <-- Add this line
});
