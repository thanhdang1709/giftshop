/**
 * Admin User Management JavaScript
 * Handles user listing, editing, and deletion
 */

const AdminUsers = {
  /**
   * Initialize the user management page
   */
  init() {
    // Check if user is admin
    if (!Auth.isAdmin()) {
      window.location.href = '../../login.html?redirect=admin/users.html';
      return;
    }

    // Setup event listeners
    this.setupEventListeners();
    
    // Load and display all users
    this.loadUsers();
  },

  /**
   * Set up event listeners for the page
   */
  setupEventListeners() {
    // Search functionality
    document.getElementById('searchButton').addEventListener('click', () => {
      this.loadUsers();
    });

    document.getElementById('searchUser').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.loadUsers();
      }
    });

    // Filter by role
    document.getElementById('roleFilter').addEventListener('change', () => {
      this.loadUsers();
    });

    // Reset filters
    document.getElementById('resetFilters').addEventListener('click', () => {
      document.getElementById('searchUser').value = '';
      document.getElementById('roleFilter').value = 'all';
      this.loadUsers();
    });

    // Admin logout
    document.getElementById('adminLogoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
      window.location.href = '../../login.html';
    });

    // Save user changes
    document.getElementById('saveUserBtn').addEventListener('click', () => {
      this.saveUserChanges();
    });

    // Create new user
    document.getElementById('createUserBtn').addEventListener('click', () => {
      this.createUser();
    });

    // Delete user
    document.getElementById('deleteUserBtn').addEventListener('click', () => {
      this.deleteUser();
    });
  },

  /**
   * Load users from database and display them
   */
  loadUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    
    // Get users from DB
    let users = [];
    if (typeof DB !== 'undefined' && DB.getAll) {
      users = DB.getAll(DB.STORES.USERS) || [];
    } else {
      // Fallback to localStorage
      users = JSON.parse(localStorage.getItem('users') || '[]');
    }

    // Apply filters
    if (searchTerm) {
      users = users.filter(user => 
        user.fullName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.phone?.includes(searchTerm)
      );
    }

    if (roleFilter !== 'all') {
      users = users.filter(user => user.role === roleFilter);
    }

    // Sort users by registration date (newest first)
    users.sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0));

    // Update the user count
    document.getElementById('userCount').textContent = users.length;

    // Display users
    this.displayUsers(users);
  },

  /**
   * Display users in the table
   * @param {Array} users - Array of user objects
   */
  displayUsers(users) {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
      usersList.innerHTML = '<tr><td colspan="7" class="text-center py-4">Không tìm thấy người dùng nào</td></tr>';
      return;
    }

    let html = '';
    users.forEach(user => {
      const registrationDate = user.registrationDate 
        ? new Date(user.registrationDate).toLocaleDateString('vi-VN')
        : 'N/A';

      html += `
        <tr>
          <td>${user.id.substring(0, 8)}...</td>
          <td>${user.fullName || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td>${user.phone || 'N/A'}</td>
          <td>
            <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-success'}">
              ${user.role === 'admin' ? 'Admin' : 'Người dùng'}
            </span>
          </td>
          <td>${registrationDate}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary view-user" data-id="${user.id}">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-user" data-id="${user.id}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

    usersList.innerHTML = html;

    // Add event listeners to the view buttons
    document.querySelectorAll('.view-user').forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = e.currentTarget.dataset.id;
        this.showUserDetails(userId);
      });
    });

    // Add event listeners to the delete buttons
    document.querySelectorAll('.delete-user').forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = e.currentTarget.dataset.id;
        if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
          this.deleteUserById(userId);
        }
      });
    });
  },

  /**
   * Show user details in modal
   * @param {string} userId - User ID
   */
  showUserDetails(userId) {
    // Get user from DB
    let user;
    if (typeof DB !== 'undefined' && DB.getById) {
      user = DB.getById(DB.STORES.USERS, userId);
    } else {
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      user = users.find(u => u.id === userId);
    }

    if (!user) {
      Utils.showToast('Không tìm thấy thông tin người dùng', 'error');
      return;
    }

    // Fill in the form fields
    document.getElementById('userId').value = user.id;
    document.getElementById('fullName').value = user.fullName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';
    document.getElementById('role').value = user.role || 'user';
    document.getElementById('registrationDate').value = user.registrationDate 
      ? new Date(user.registrationDate).toLocaleString('vi-VN')
      : 'N/A';

    // Get user order statistics
    this.loadUserStats(userId);

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('userDetailModal'));
    modal.show();
  },

  /**
   * Load user statistics (orders, spending)
   * @param {string} userId - User ID
   */
  loadUserStats(userId) {
    // Get orders from DB
    let orders = [];
    if (typeof DB !== 'undefined' && DB.getAll) {
      orders = DB.getAll(DB.STORES.ORDERS) || [];
    } else {
      // Fallback to localStorage
      orders = JSON.parse(localStorage.getItem('orders') || '[]');
    }

    // Filter orders by user ID
    const userOrders = orders.filter(order => order.customer?.userId === userId);
    
    // Calculate total spent
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);

    // Update UI
    document.getElementById('totalOrders').textContent = userOrders.length;
    document.getElementById('totalSpent').textContent = this.formatCurrency(totalSpent);
  },

  /**
   * Save changes to user details
   */
  saveUserChanges() {
    const userId = document.getElementById('userId').value;
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const role = document.getElementById('role').value;

    // Validate inputs
    if (!fullName || !email) {
      Utils.showToast('Vui lòng điền đầy đủ họ tên và email', 'error');
      return;
    }

    // Get user from DB
    let user;
    if (typeof DB !== 'undefined' && DB.getById) {
      user = DB.getById(DB.STORES.USERS, userId);
    } else {
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      user = users.find(u => u.id === userId);
    }

    if (!user) {
      Utils.showToast('Không tìm thấy thông tin người dùng', 'error');
      return;
    }

    // Update user data
    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    user.address = address;
    user.role = role;

    // Save to DB
    if (typeof DB !== 'undefined' && DB.update) {
      DB.update(DB.STORES.USERS, user);
    } else {
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const index = users.findIndex(u => u.id === userId);
      if (index !== -1) {
        users[index] = user;
        localStorage.setItem('users', JSON.stringify(users));
      }
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('userDetailModal'));
    modal.hide();

    // Show success message
    Utils.showToast('Cập nhật thông tin người dùng thành công', 'success');

    // Reload users
    this.loadUsers();
  },

  /**
   * Create a new user
   */
  createUser() {
    const fullName = document.getElementById('newFullName').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const phone = document.getElementById('newPhone').value;
    const address = document.getElementById('newAddress').value;
    const role = document.getElementById('newRole').value;

    // Validate inputs
    if (!fullName || !email || !password) {
      Utils.showToast('Vui lòng điền đầy đủ họ tên, email và mật khẩu', 'error');
      return;
    }

    // Check if email already exists
    let existingUsers = [];
    if (typeof DB !== 'undefined' && DB.getAll) {
      existingUsers = DB.getAll(DB.STORES.USERS) || [];
    } else {
      // Fallback to localStorage
      existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    }

    if (existingUsers.some(user => user.email === email)) {
      Utils.showToast('Email đã tồn tại trong hệ thống', 'error');
      return;
    }

    // Create new user object
    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      fullName,
      email,
      password: Auth.hashPassword(password), // Hash password
      phone,
      address,
      role,
      registrationDate: new Date().toISOString()
    };

    // Save to DB
    if (typeof DB !== 'undefined' && DB.add) {
      DB.add(DB.STORES.USERS, newUser);
    } else {
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
    modal.hide();

    // Clear form
    document.getElementById('addUserForm').reset();

    // Show success message
    Utils.showToast('Tạo người dùng mới thành công', 'success');

    // Reload users
    this.loadUsers();
  },

  /**
   * Delete user from the modal
   */
  deleteUser() {
    const userId = document.getElementById('userId').value;
    this.deleteUserById(userId);

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('userDetailModal'));
    modal.hide();
  },

  /**
   * Delete user by ID
   * @param {string} userId - User ID
   */
  deleteUserById(userId) {
    // Check if user is an admin
    let user;
    if (typeof DB !== 'undefined' && DB.getById) {
      user = DB.getById(DB.STORES.USERS, userId);
    } else {
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      user = users.find(u => u.id === userId);
    }

    if (!user) {
      Utils.showToast('Không tìm thấy thông tin người dùng', 'error');
      return;
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      let admins = [];
      if (typeof DB !== 'undefined' && DB.getAll) {
        admins = DB.getAll(DB.STORES.USERS).filter(u => u.role === 'admin');
      } else {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        admins = users.filter(u => u.role === 'admin');
      }

      if (admins.length <= 1) {
        Utils.showToast('Không thể xóa admin cuối cùng trong hệ thống', 'error');
        return;
      }
    }

    // Delete from DB
    if (typeof DB !== 'undefined' && DB.delete) {
      DB.delete(DB.STORES.USERS, userId);
    } else {
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }

    // Show success message
    Utils.showToast('Xóa người dùng thành công', 'success');

    // Reload users
    this.loadUsers();
  },

  /**
   * Format currency in VND
   * @param {number} value - Value to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }
};

// Initialize the admin users page when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  AdminUsers.init();
}); 