/**
 * Profile Management Module
 * Handles user profile information and updates
 */
const ProfileManager = {
    /**
     * Initialize the profile page
     */
    init: function() {
        // Load common components (header, footer)
        if (typeof Common !== 'undefined' && Common.init) {
            Common.init();
        }
        
        // Check if user is logged in
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html?redirect=profile';
            return;
        }
        
        this.loadUserProfile();
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }
        
        // Password confirmation validation
        const newPasswordField = document.getElementById('newPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');
        
        if (confirmPasswordField && newPasswordField) {
            confirmPasswordField.addEventListener('input', () => {
                if (newPasswordField.value !== confirmPasswordField.value) {
                    confirmPasswordField.setCustomValidity('Mật khẩu không khớp');
                } else {
                    confirmPasswordField.setCustomValidity('');
                }
            });
            
            newPasswordField.addEventListener('input', () => {
                if (confirmPasswordField.value && newPasswordField.value !== confirmPasswordField.value) {
                    confirmPasswordField.setCustomValidity('Mật khẩu không khớp');
                } else {
                    confirmPasswordField.setCustomValidity('');
                }
            });
        }
        
        // Logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.logout();
            });
        }
    },
    
    /**
     * Load user profile information
     */
    loadUserProfile: function() {
        try {
            // Get current user
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) {
                this.showNotification('Không tìm thấy thông tin người dùng', 'error');
                return;
            }
            
            // Get full user data from DB
            const users = DB.getAll(DB.STORES.USERS);
            const fullUserData = users.find(user => user.id === currentUser.id || user.username === currentUser.username);
            
            if (!fullUserData) {
                this.showNotification('Không tìm thấy thông tin người dùng', 'error');
                return;
            }
            
            // Update sidebar user info
            const userFullNameEl = document.getElementById('userFullName');
            const userEmailEl = document.getElementById('userEmail');
            
            if (userFullNameEl) userFullNameEl.textContent = fullUserData.fullName || currentUser.fullName || '';
            if (userEmailEl) userEmailEl.textContent = fullUserData.email || currentUser.email || '';
            
            // Fill form fields
            const fullNameField = document.getElementById('fullName');
            const usernameField = document.getElementById('username');
            const emailField = document.getElementById('email');
            const phoneField = document.getElementById('phone');
            const addressField = document.getElementById('address');
            
            if (fullNameField) fullNameField.value = fullUserData.fullName || currentUser.fullName || '';
            if (usernameField) usernameField.value = fullUserData.username || currentUser.username || '';
            if (emailField) emailField.value = fullUserData.email || currentUser.email || '';
            if (phoneField) phoneField.value = fullUserData.phone || '';
            if (addressField) addressField.value = fullUserData.address || '';
            
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showNotification('Đã xảy ra lỗi khi tải thông tin người dùng', 'error');
        }
    },
    
    /**
     * Update user profile information
     */
    updateProfile: function() {
        try {
            const form = document.getElementById('profileForm');
            
            // Check form validity
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }
            
            // Get form data
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            
            // Get password fields
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Get current user
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) {
                this.showNotification('Không tìm thấy thông tin người dùng', 'error');
                return;
            }
            
            // Get all users
            const users = DB.getAll(DB.STORES.USERS);
            const userIndex = users.findIndex(user => user.id === currentUser.id || user.username === currentUser.username);
            
            if (userIndex === -1) {
                this.showNotification('Không tìm thấy thông tin người dùng', 'error');
                return;
            }
            
            // Update user information
            const updatedUser = { ...users[userIndex] };
            updatedUser.fullName = fullName;
            updatedUser.email = email;
            updatedUser.phone = phone;
            updatedUser.address = address;
            
            // Update password if provided
            if (newPassword) {
                if (currentPassword !== updatedUser.password) {
                    this.showNotification('Mật khẩu hiện tại không đúng', 'error');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    this.showNotification('Mật khẩu mới không khớp', 'error');
                    return;
                }
                
                updatedUser.password = newPassword;
            }
            
            // Save updated user
            users[userIndex] = updatedUser;
            DB.setAll(DB.STORES.USERS, users);
            
            // Update session user information
            const sessionUser = {
                id: updatedUser.id,
                username: updatedUser.username,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                role: updatedUser.role
            };
            
            localStorage.setItem(Auth.SESSION_KEY, JSON.stringify(sessionUser));
            
            // Show success message
            this.showNotification('Thông tin tài khoản đã được cập nhật', 'success');
            
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
            // Update sidebar display
            const userFullNameEl = document.getElementById('userFullName');
            const userEmailEl = document.getElementById('userEmail');
            
            if (userFullNameEl) userFullNameEl.textContent = fullName;
            if (userEmailEl) userEmailEl.textContent = email;
            
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Đã xảy ra lỗi khi cập nhật thông tin', 'error');
        }
    },
    
    /**
     * Display a notification
     * @param {string} message - The message to display
     * @param {string} type - The notification type (success, error, warning, info)
     */
    showNotification: function(message, type) {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(message, type);
        } else {
            alert(message);
        }
    }
};

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    ProfileManager.init();
}); 