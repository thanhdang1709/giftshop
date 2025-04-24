/**
 * Common Module
 * Handles common functionality across the site
 */
const Common = {
    /**
     * Initialize common elements
     */
    init: function() {
        this.loadHeader();
        this.loadFooter();
    },
    
    /**
     * Load header component
     */
    loadHeader: function() {
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            fetch('../../components/header.html')
                .then(response => response.text())
                .then(data => {
                    headerContainer.innerHTML = data;
                    // Update navigation active state
                    this.updateNavActiveState();
                    // Initialize any header-specific functionality
                    this.initHeaderFunctions();
                })
                .catch(error => {
                    console.error('Error loading header:', error);
                });
        }
    },
    
    /**
     * Load footer component
     */
    loadFooter: function() {
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            fetch('../../components/footer.html')
                .then(response => response.text())
                .then(data => {
                    footerContainer.innerHTML = data;
                    // Initialize any footer-specific functionality
                })
                .catch(error => {
                    console.error('Error loading footer:', error);
                });
        }
    },
    
    /**
     * Update navigation active state based on current page
     */
    updateNavActiveState: function() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href) && href !== '#' && href !== '/') {
                link.classList.add('active');
            }
        });
    },
    
    /**
     * Initialize header-specific functions
     */
    initHeaderFunctions: function() {
        // Initialize header dropdown menus, search, etc.
        const dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdownMenu = this.nextElementSibling;
                dropdownMenu.classList.toggle('show');
            });
        });
    },
    
    /**
     * Show a notification message
     * @param {string} message - Message to display
     * @param {string} type - Message type (success, error, warning, info)
     */
    showNotification: function(message, type = 'info') {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(message, type);
        } else {
            alert(message);
        }
    }
}; 