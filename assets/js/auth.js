/**
 * Quản lý xác thực
 * Xử lý xác thực người dùng, đăng ký và quản lý phiên
 */
const Auth = {
  /**
   * Khóa phiên người dùng hiện tại trong localStorage
   */
  SESSION_KEY: 'current_user',

  /**
   * Initialize the authentication system
   */
  init() {
    // Initialize event listeners for auth-related actions
    this.setupEventListeners();
  },

  /**
   * Setup event listeners for authentication-related elements
   */
  setupEventListeners() {
    // Add event listeners for login/logout/register forms if they exist on the page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.login(
          loginForm.username.value,
          loginForm.password.value
        );
      });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.register(
          registerForm.username.value,
          registerForm.password.value,
          registerForm.fullName.value,
          registerForm.email.value
        );
      });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Update UI based on authentication status
    this.updateUI();
  },

  /**
   * Đăng nhập người dùng
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {boolean} - Đăng nhập thành công hay không
   */
  login(username, password) {
    // Tìm người dùng
    const users = DB.getAll(DB.STORES.USERS);
    const user = users.find(u => u.username === username && u.password === password && u.active);

    if (!user) {
      this.showError('Tên đăng nhập hoặc mật khẩu không hợp lệ');
      return false;
    }

    // Lưu phiên người dùng không có dữ liệu nhạy cảm
    const session = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    
    // Chuyển hướng dựa trên vai trò
    if (user.role === DB.ROLES.ADMIN || user.role === DB.ROLES.STAFF) {
      window.location.href = '/pages/admin/dashboard.html';
    } else {
      window.location.href = '/index.html';
    }

    return true;
  },

  /**
   * Đăng ký người dùng mới
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @param {string} fullName - Họ và tên
   * @param {string} email - Email
   * @returns {boolean} - Đăng ký thành công hay không
   */
  register(username, password, fullName, email) {
    // Kiểm tra xem tên đăng nhập đã tồn tại chưa
    const users = DB.getAll(DB.STORES.USERS);
    if (users.some(u => u.username === username)) {
      this.showError('Tên đăng nhập đã tồn tại');
      return false;
    }

    // Tạo và thêm người dùng mới
    const newUser = {
      username,
      password, // Nên được mã hóa trong ứng dụng thực tế
      fullName,
      email,
      role: DB.ROLES.CUSTOMER,
      active: true,
      createdAt: new Date().toISOString()
    };

    DB.add(DB.STORES.USERS, newUser);

    // Tự động đăng nhập người dùng
    return this.login(username, password);
  },

  /**
   * Log out the current user
   */
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = '/index.html';
  },

  /**
   * Get the current user session
   * @returns {Object|null} - The current user session or null if not logged in
   */
  getCurrentUser() {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Check if a user is logged in
   * @returns {boolean} - Whether a user is logged in
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  /**
   * Check if the current user has a specific role
   * @param {string} role - The role to check
   * @returns {boolean} - Whether the current user has the role
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  },

  /**
   * Check if the current user is an admin
   * @returns {boolean} - Whether the current user is an admin
   */
  isAdmin() {
    return this.hasRole(DB.ROLES.ADMIN);
  },

  /**
   * Check if the current user is staff
   * @returns {boolean} - Whether the current user is staff
   */
  isStaff() {
    return this.hasRole(DB.ROLES.STAFF);
  },

  /**
   * Update UI elements based on authentication status
   */
  updateUI() {
    const user = this.getCurrentUser();
    
    // Update login/logout buttons
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    if (user) {
      // User is logged in
      if (loginBtn) loginBtn.style.display = 'none';
      if (registerBtn) registerBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (profileBtn) profileBtn.style.display = 'block';
      if (userNameDisplay) userNameDisplay.textContent = user.fullName;
      
      // Show/hide admin/staff links
      const adminLinks = document.querySelectorAll('.admin-only');
      const staffLinks = document.querySelectorAll('.staff-only');
      
      adminLinks.forEach(link => {
        link.style.display = this.isAdmin() ? 'block' : 'none';
      });
      
      staffLinks.forEach(link => {
        link.style.display = (this.isAdmin() || this.isStaff()) ? 'block' : 'none';
      });
    } else {
      // User is not logged in
      if (loginBtn) loginBtn.style.display = 'block';
      if (registerBtn) registerBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (profileBtn) profileBtn.style.display = 'none';
      if (userNameDisplay) userNameDisplay.textContent = '';
      
      // Hide admin/staff links
      const adminLinks = document.querySelectorAll('.admin-only');
      const staffLinks = document.querySelectorAll('.staff-only');
      
      adminLinks.forEach(link => {
        link.style.display = 'none';
      });
      
      staffLinks.forEach(link => {
        link.style.display = 'none';
      });
    }
  },

  /**
   * Hiển thị thông báo lỗi
   * @param {string} message - Thông báo lỗi
   */
  showError(message) {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast(message, 'error');
    } else {
      alert(message); // Phương án dự phòng nếu Utils không khả dụng
    }
  }
};

// Initialize authentication when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
}); 