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
   * Khởi tạo hệ thống xác thực
   */
  init() {
    // Khởi tạo các trình lắng nghe sự kiện cho các hành động liên quan đến xác thực
    this.setupEventListeners();
  },

  /**
   * Thiết lập trình lắng nghe sự kiện cho các phần tử liên quan đến xác thực
   */
  setupEventListeners() {
    // Thêm trình lắng nghe sự kiện cho các biểu mẫu đăng nhập/đăng xuất/đăng ký nếu chúng tồn tại trên trang
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

    // Cập nhật giao diện người dùng dựa trên trạng thái xác thực
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
    console.log(users);
    const user = users.find(u => u.username === username && u.password === password && (u.active === true || u.status));

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
      window.location.href = '../admin/dashboard.html';
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
   * Đăng xuất người dùng hiện tại
   */
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = '/index.html';
  },

  /**
   * Lấy phiên người dùng hiện tại
   * @returns {Object|null} - Phiên người dùng hiện tại hoặc null nếu chưa đăng nhập
   */
  getCurrentUser() {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng hiện tại:', error);
      return null;
    }
  },

  /**
   * Kiểm tra xem người dùng đã đăng nhập chưa
   * @returns {boolean} - Người dùng đã đăng nhập hay chưa
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  /**
   * Kiểm tra xem người dùng hiện tại có vai trò cụ thể không
   * @param {string} role - Vai trò cần kiểm tra
   * @returns {boolean} - Người dùng hiện tại có vai trò đó hay không
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  },

  /**
   * Kiểm tra xem người dùng hiện tại có phải là quản trị viên không
   * @returns {boolean} - Người dùng hiện tại có phải là quản trị viên không
   */
  isAdmin() {
    return this.hasRole(DB.ROLES.ADMIN);
  },

  /**
   * Kiểm tra xem người dùng hiện tại có phải là nhân viên không
   * @returns {boolean} - Người dùng hiện tại có phải là nhân viên không
   */
  isStaff() {
    return this.hasRole(DB.ROLES.STAFF);
  },

  /**
   * Cập nhật các phần tử giao diện dựa trên trạng thái xác thực
   */
  updateUI() {
    const user = this.getCurrentUser();
    
    // Cập nhật các nút đăng nhập/đăng xuất
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    if (user) {
      // Người dùng đã đăng nhập
      if (loginBtn) loginBtn.style.display = 'none';
      if (registerBtn) registerBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (profileBtn) profileBtn.style.display = 'block';
      if (userNameDisplay) userNameDisplay.textContent = user.fullName;
      
      // Hiển thị/ẩn các liên kết dành cho quản trị viên/nhân viên
      const adminLinks = document.querySelectorAll('.admin-only');
      const staffLinks = document.querySelectorAll('.staff-only');
      
      adminLinks.forEach(link => {
        link.style.display = this.isAdmin() ? 'block' : 'none';
      });
      
      staffLinks.forEach(link => {
        link.style.display = (this.isAdmin() || this.isStaff()) ? 'block' : 'none';
      });
    } else {
      // Người dùng chưa đăng nhập
      if (loginBtn) loginBtn.style.display = 'block';
      if (registerBtn) registerBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (profileBtn) profileBtn.style.display = 'none';
      if (userNameDisplay) userNameDisplay.textContent = '';
      
      // Ẩn các liên kết dành cho quản trị viên/nhân viên
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

// Khởi tạo xác thực khi tài liệu được tải
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
}); 