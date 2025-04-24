/**
 * User Management Module
 * Handles user listing, creation, editing, and deletion in the admin dashboard
 */
const UserManagement = {
  /**
   * Initialize the user management module
   */
  init() {
    this.setupEventListeners();
    this.loadUsers();
  },

  /**
   * Set up event listeners for user management actions
   */
  setupEventListeners() {
    // Add user button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => {
        this.resetForm();
      });
    }

    // User form submission
    const userForm = document.getElementById('userForm');
    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveUser();
      });
    }

    // Search functionality
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchUsers(searchInput.value);
      });
    }

    // Filter by role
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
      roleFilter.addEventListener('change', () => {
        this.filterUsersByRole(roleFilter.value);
      });
    }

    // Filter by status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.filterUsersByStatus(statusFilter.value);
      });
    }
  },

  /**
   * Load users and display in the user table
   */
  loadUsers() {
    const users = DB.getAll(DB.STORES.USERS);
    const userList = document.getElementById('userList');
    if (!userList) return;
    
    if (users.length === 0) {
      userList.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
      return;
    }
    
    let html = '';
    users.forEach(user => {
      html += `
        <tr>
          <td>${user.username}</td>
          <td>${user.fullName}</td>
          <td>${user.email}</td>
          <td>${this.getRoleBadge(user.role)}</td>
          <td>${user.active ? 
            '<span class="badge bg-success">Active</span>' : 
            '<span class="badge bg-danger">Inactive</span>'}
          </td>
          <td>
            <button class="btn btn-sm btn-primary edit-user-btn" data-id="${user.id}" data-bs-toggle="modal" data-bs-target="#userModal">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    userList.innerHTML = html;
    
    // Add event listeners for edit buttons
    const editButtons = document.querySelectorAll('.edit-user-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.dataset.id;
        this.editUser(userId);
      });
    });
    
    // Add event listeners for delete buttons
    const deleteButtons = document.querySelectorAll('.delete-user-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.dataset.id;
        this.confirmDeleteUser(userId);
      });
    });
  },

  /**
   * Get role badge HTML
   * @param {string} role - The user role
   * @returns {string} HTML for the role badge
   */
  getRoleBadge(role) {
    switch (role) {
      case DB.ROLES.ADMIN:
        return '<span class="badge bg-danger">Admin</span>';
      case DB.ROLES.STAFF:
        return '<span class="badge bg-warning">Staff</span>';
      case DB.ROLES.CUSTOMER:
        return '<span class="badge bg-info">Customer</span>';
      default:
        return '<span class="badge bg-secondary">Unknown</span>';
    }
  },

  /**
   * Reset the user form for adding a new user
   */
  resetForm() {
    const form = document.getElementById('userForm');
    if (!form) return;
    
    form.reset();
    form.userId.value = '';
    
    // Show password field for new users
    const passwordGroup = document.getElementById('passwordGroup');
    if (passwordGroup) {
      passwordGroup.style.display = 'block';
    }
    
    document.getElementById('userModalTitle').textContent = 'Add New User';
  },

  /**
   * Edit a user
   * @param {string} userId - The user ID
   */
  editUser(userId) {
    const user = DB.getById(DB.STORES.USERS, userId);
    if (!user) {
      this.showNotification('User not found', 'error');
      return;
    }
    
    const form = document.getElementById('userForm');
    if (!form) return;
    
    // Set form fields
    form.userId.value = user.id;
    form.username.value = user.username;
    form.fullName.value = user.fullName;
    form.email.value = user.email;
    form.role.value = user.role;
    form.active.checked = user.active;
    
    // Hide password field for editing
    const passwordGroup = document.getElementById('passwordGroup');
    if (passwordGroup) {
      passwordGroup.style.display = 'none';
    }
    
    document.getElementById('userModalTitle').textContent = 'Edit User';
  },

  /**
   * Save user (create or update)
   */
  saveUser() {
    const form = document.getElementById('userForm');
    if (!form) return;
    
    const userId = form.userId.value;
    const isNewUser = !userId;
    
    // Validate form
    if (!this.validateUserForm(form, isNewUser)) {
      return;
    }
    
    if (isNewUser) {
      // Create new user
      const newUser = {
        username: form.username.value,
        password: form.password.value, // In a real app, this should be hashed
        fullName: form.fullName.value,
        email: form.email.value,
        role: form.role.value,
        active: form.active.checked,
        createdAt: new Date().toISOString()
      };
      
      DB.add(DB.STORES.USERS, newUser);
      this.showNotification('User created successfully');
    } else {
      // Update existing user
      const user = DB.getById(DB.STORES.USERS, userId);
      if (!user) {
        this.showNotification('User not found', 'error');
        return;
      }
      
      user.username = form.username.value;
      user.fullName = form.fullName.value;
      user.email = form.email.value;
      user.role = form.role.value;
      user.active = form.active.checked;
      user.updatedAt = new Date().toISOString();
      
      if (DB.update) {
        DB.update(DB.STORES.USERS, user.id, user);
      } else {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          users[index] = user;
          localStorage.setItem('users', JSON.stringify(users));
        }
      }
      this.showNotification('User updated successfully');
    }
    
    // Close modal and refresh list
    const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
    modal.hide();
    this.loadUsers();
  },

  /**
   * Validate user form
   * @param {HTMLFormElement} form - The form element
   * @param {boolean} isNewUser - Whether this is a new user
   * @returns {boolean} Whether the form is valid
   */
  validateUserForm(form, isNewUser) {
    // Check if username exists
    if (isNewUser) {
      const users = DB.getAll(DB.STORES.USERS);
      if (users.some(u => u.username === form.username.value)) {
        this.showNotification('Username already exists', 'error');
        return false;
      }
      
      // Password is required for new users
      if (!form.password.value) {
        this.showNotification('Password is required', 'error');
        return false;
      }
    }
    
    // Basic validation
    if (!form.username.value || !form.fullName.value || !form.email.value) {
      this.showNotification('All fields are required', 'error');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.value)) {
      this.showNotification('Invalid email format', 'error');
      return false;
    }
    
    return true;
  },

  /**
   * Confirm user deletion
   * @param {string} userId - The user ID
   */
  confirmDeleteUser(userId) {
    const user = DB.getById(DB.STORES.USERS, userId);
    if (!user) {
      this.showNotification('User not found', 'error');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${user.fullName}?`)) {
      this.deleteUser(userId);
    }
  },

  /**
   * Delete a user
   * @param {string} userId - The user ID
   */
  deleteUser(userId) {
    // Check if user is the current logged-in user
    const currentUser = Auth.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      this.showNotification('You cannot delete your own account', 'error');
      return;
    }
    
    // Check if user is the last admin
    const user = DB.getById(DB.STORES.USERS, userId);
    if (user && user.role === DB.ROLES.ADMIN) {
      const admins = DB.getAll(DB.STORES.USERS).filter(u => u.role === DB.ROLES.ADMIN);
      if (admins.length === 1) {
        this.showNotification('Cannot delete the last admin account', 'error');
        return;
      }
    }
    
    DB.remove(DB.STORES.USERS, userId);
    this.showNotification('User deleted successfully');
    this.loadUsers();
  },

  /**
   * Search users by name, username, or email
   * @param {string} query - The search query
   */
  searchUsers(query) {
    query = query.toLowerCase();
    const users = DB.getAll(DB.STORES.USERS);
    
    const filteredUsers = users.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
    
    this.displayFilteredUsers(filteredUsers);
  },

  /**
   * Filter users by role
   * @param {string} role - The role to filter by
   */
  filterUsersByRole(role) {
    const users = DB.getAll(DB.STORES.USERS);
    
    const filteredUsers = role === 'all' 
      ? users 
      : users.filter(user => user.role === role);
    
    this.displayFilteredUsers(filteredUsers);
  },

  /**
   * Filter users by status
   * @param {string} status - The status to filter by (active/inactive)
   */
  filterUsersByStatus(status) {
    const users = DB.getAll(DB.STORES.USERS);
    
    let filteredUsers;
    if (status === 'all') {
      filteredUsers = users;
    } else {
      const isActive = status === 'active';
      filteredUsers = users.filter(user => user.active === isActive);
    }
    
    this.displayFilteredUsers(filteredUsers);
  },

  /**
   * Display filtered users in the table
   * @param {Array} users - The filtered users array
   */
  displayFilteredUsers(users) {
    const userList = document.getElementById('userList');
    if (!userList) return;
    
    if (users.length === 0) {
      userList.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
      return;
    }
    
    let html = '';
    users.forEach(user => {
      html += `
        <tr>
          <td>${user.username}</td>
          <td>${user.fullName}</td>
          <td>${user.email}</td>
          <td>${this.getRoleBadge(user.role)}</td>
          <td>${user.active ? 
            '<span class="badge bg-success">Active</span>' : 
            '<span class="badge bg-danger">Inactive</span>'}
          </td>
          <td>
            <button class="btn btn-sm btn-primary edit-user-btn" data-id="${user.id}" data-bs-toggle="modal" data-bs-target="#userModal">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    userList.innerHTML = html;
    
    // Reattach event listeners
    const editButtons = document.querySelectorAll('.edit-user-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.dataset.id;
        this.editUser(userId);
      });
    });
    
    const deleteButtons = document.querySelectorAll('.delete-user-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.dataset.id;
        this.confirmDeleteUser(userId);
      });
    });
  },

  /**
   * Export users list to CSV
   */
  exportUsersList() {
    const users = DB.getAll(DB.STORES.USERS);
    if (users.length === 0) {
      this.showNotification('No users to export', 'error');
      return;
    }
    
    // Create CSV content
    let csvContent = 'Username,Full Name,Email,Role,Status,Created At\n';
    
    users.forEach(user => {
      const status = user.active ? 'Active' : 'Inactive';
      const createdAt = new Date(user.createdAt).toLocaleDateString();
      
      csvContent += `${user.username},"${user.fullName}",${user.email},${user.role},${status},${createdAt}\n`;
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_' + new Date().toISOString().split('T')[0] + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showNotification('Users list exported successfully');
  },

  /**
   * Show notification
   * @param {string} message - The notification message
   * @param {string} type - The notification type (success/error)
   */
  showNotification(message, type = 'success') {
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast(message, type);
    } else {
      alert(message);
    }
  }
};

// Initialize the module when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  UserManagement.init();
}); 