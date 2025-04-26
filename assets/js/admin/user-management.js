/**
 * User Management Module
 * Handles all user management operations in the admin dashboard
 */
const UserManager = {
    users: [],
    currentPage: 1,
    usersPerPage: 10,
    totalPages: 1,
    selectedUsers: [],
    
    /**
     * Initialize the user management functionality
     */
    init: function() {
        this.setupEventListeners();
        this.loadUsers();
    },
    
    /**
     * Set up event listeners for user interactions
     */
    setupEventListeners: function() {
        // Add user button
        document.getElementById('add-user-btn')?.addEventListener('click', () => {
            this.showAddUserModal();
        });
        
        // Search functionality
        document.getElementById('user-search')?.addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });
        
        // Bulk actions
        document.getElementById('bulk-action-apply')?.addEventListener('click', () => {
            const action = document.getElementById('bulk-action-select').value;
            if (action && this.selectedUsers.length > 0) {
                this.applyBulkAction(action);
            } else {
                this.showNotification('Please select users and an action', 'warning');
            }
        });
        
        // Pagination
        document.getElementById('pagination-container')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                const page = parseInt(e.target.dataset.page);
                if (page) {
                    this.goToPage(page);
                }
            }
        });
        
        // User filters
        document.getElementById('role-filter')?.addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('status-filter')?.addEventListener('change', () => {
            this.applyFilters();
        });
        
        // Export users
        document.getElementById('export-users')?.addEventListener('click', () => {
            this.exportUsers();
        });
    },
    
    /**
     * Load users from the server or localStorage
     */
    loadUsers: function() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Simulate API call
            setTimeout(() => {
                // For demo purposes, get users from localStorage or create sample data
                let storedUsers = localStorage.getItem('users');
                
                if (storedUsers) {
                    this.users = JSON.parse(storedUsers);
                } else {
                    // Sample data if no users exist
                    this.users = this.getSampleUsers();
                    localStorage.setItem('users', JSON.stringify(this.users));
                }
                
                this.calculatePagination();
                this.renderUsers();
                this.hideLoadingState();
                
                this.showNotification('Users loaded successfully', 'success');
            }, 800);
        } catch (error) {
            this.hideLoadingState();
            this.showNotification('Error loading users: ' + error.message, 'error');
        }
    },
    
    /**
     * Show notification with enhanced styling and animations
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, warning, info)
     * @param {number} duration - How long to show the notification in ms
     */
    showNotification: function(message, type = 'info', duration = 3000) {
        // Check if Utils.showToast is available
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(message, type, duration);
            return;
        }
        
        // Fallback notification system
        const notificationArea = document.getElementById('notification-area') || this.createNotificationArea();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${this.getIconForType(type)}"></i>
            </div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('notification-hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        notificationArea.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('notification-visible');
        }, 10);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('notification-hiding');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }
            }, duration);
        }
    },
    
    /**
     * Creates a notification area if it doesn't exist
     * @returns {HTMLElement} The notification area
     */
    createNotificationArea: function() {
        const area = document.createElement('div');
        area.id = 'notification-area';
        area.className = 'notification-area';
        document.body.appendChild(area);
        return area;
    },
    
    /**
     * Get the appropriate icon for each notification type
     * @param {string} type - The notification type
     * @returns {string} The icon name
     */
    getIconForType: function(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            case 'info': 
            default: return 'info-circle';
        }
    },
    
    /**
     * Show loading state while fetching data
     */
    showLoadingState: function() {
        const tableBody = document.getElementById('users-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Loading users...</p>
                    </td>
                </tr>
            `;
        }
    },
    
    /**
     * Hide loading state
     */
    hideLoadingState: function() {
        // Will be replaced by renderUsers
    },
    
    /**
     * Calculate pagination based on total users
     */
    calculatePagination: function() {
        this.totalPages = Math.ceil(this.users.length / this.usersPerPage);
        this.renderPagination();
    },
    
    /**
     * Render pagination controls
     */
    renderPagination: function() {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        
        let html = '';
        
        // Previous button
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" data-page="${this.currentPage - 1}" href="javascript:void(0);">Previous</a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= this.totalPages; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" data-page="${i}" href="javascript:void(0);">${i}</a>
                </li>
            `;
        }
        
        // Next button
        html += `
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" data-page="${this.currentPage + 1}" href="javascript:void(0);">Next</a>
            </li>
        `;
        
        paginationContainer.innerHTML = html;
    },
    
    /**
     * Go to a specific page
     * @param {number} page - The page number to navigate to
     */
    goToPage: function(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.renderUsers();
        this.renderPagination();
    },
    
    /**
     * Render users table with current page data
     */
    renderUsers: function() {
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) return;
        
        // Apply filters
        const filteredUsers = this.getFilteredUsers();
        
        // Get current page users
        const startIndex = (this.currentPage - 1) * this.usersPerPage;
        const endIndex = startIndex + this.usersPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        let html = '';
        
        if (paginatedUsers.length === 0) {
            html = `
                <tr>
                    <td colspan="7" class="text-center">No users found</td>
                </tr>
            `;
        } else {
            paginatedUsers.forEach(user => {
                html += `
                    <tr data-user-id="${user.id}" class="${this.selectedUsers.includes(user.id) ? 'table-active' : ''}">
                        <td>
                            <input type="checkbox" class="user-select-checkbox" 
                                   ${this.selectedUsers.includes(user.id) ? 'checked' : ''}
                                   data-user-id="${user.id}">
                        </td>
                        <td>${user.id}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="user-avatar">
                                    <img src="${user.avatar || 'assets/images/default-avatar.png'}" alt="${user.username}">
                                </div>
                                <div class="ms-2">
                                    <div class="fw-bold">${user.username}</div>
                                    <div class="text-muted small">${user.email}</div>
                                </div>
                            </div>
                        </td>
                        <td>${user.fullName}</td>
                        <td>
                            <span class="badge bg-${this.getRoleBadgeColor(user.role)}">${user.role}</span>
                        </td>
                        <td>
                            <span class="badge bg-${user.status === 'active' ? 'success' : 'danger'}">${user.status}</span>
                        </td>
                        <td>${this.formatDate(user.createdAt)}</td>
                        <td>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item edit-user" data-user-id="${user.id}" href="javascript:void(0);">Edit</a></li>
                                    <li><a class="dropdown-item view-user" data-user-id="${user.id}" href="javascript:void(0);">View Details</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger delete-user" data-user-id="${user.id}" href="javascript:void(0);">Delete</a></li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        
        tableBody.innerHTML = html;
        
        // Add event listeners to the table rows
        this.addTableRowEventListeners();
    },
    
    /**
     * Add event listeners to table rows
     */
    addTableRowEventListeners: function() {
        // Checkbox selection
        document.querySelectorAll('.user-select-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const userId = parseInt(e.target.dataset.userId);
                if (e.target.checked) {
                    if (!this.selectedUsers.includes(userId)) {
                        this.selectedUsers.push(userId);
                    }
                } else {
                    this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
                }
                
                // Update row styling
                const row = document.querySelector(`tr[data-user-id="${userId}"]`);
                if (row) {
                    row.classList.toggle('table-active', e.target.checked);
                }
                
                // Update bulk actions visibility
                this.updateBulkActionsVisibility();
            });
        });
        
        // Action buttons
        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.dataset.userId);
                this.editUser(userId);
            });
        });
        
        document.querySelectorAll('.view-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.dataset.userId);
                this.viewUserDetails(userId);
            });
        });
        
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.dataset.userId);
                this.confirmDeleteUser(userId);
            });
        });
    },
    
    /**
     * Update bulk actions visibility based on selection
     */
    updateBulkActionsVisibility: function() {
        const bulkActionsContainer = document.getElementById('bulk-actions-container');
        if (bulkActionsContainer) {
            bulkActionsContainer.classList.toggle('d-none', this.selectedUsers.length === 0);
        }
        
        // Update selection count
        const selectionCount = document.getElementById('selection-count');
        if (selectionCount) {
            selectionCount.textContent = this.selectedUsers.length;
        }
    },
    
    /**
     * Apply bulk action to selected users
     * @param {string} action - The action to apply
     */
    applyBulkAction: function(action) {
        if (this.selectedUsers.length === 0) return;
        
        switch(action) {
            case 'delete':
                this.confirmBulkDelete();
                break;
            case 'activate':
                this.bulkChangeStatus('active');
                break;
            case 'deactivate':
                this.bulkChangeStatus('inactive');
                break;
            case 'change-role':
                this.showBulkChangeRoleModal();
                break;
        }
    },
    
    /**
     * Confirm bulk delete action
     */
    confirmBulkDelete: function() {
        if (confirm(`Are you sure you want to delete ${this.selectedUsers.length} users? This action cannot be undone.`)) {
            this.users = this.users.filter(user => !this.selectedUsers.includes(user.id));
            localStorage.setItem('users', JSON.stringify(this.users));
            
            this.selectedUsers = [];
            this.updateBulkActionsVisibility();
            
            this.calculatePagination();
            this.renderUsers();
            
            this.showNotification(`${this.selectedUsers.length} users have been deleted`, 'success');
        }
    },
    
    /**
     * Bulk change user status
     * @param {string} status - The new status
     */
    bulkChangeStatus: function(status) {
        this.users = this.users.map(user => {
            if (this.selectedUsers.includes(user.id)) {
                return { ...user, status };
            }
            return user;
        });
        
        localStorage.setItem('users', JSON.stringify(this.users));
        this.renderUsers();
        
        const statusText = status === 'active' ? 'activated' : 'deactivated';
        this.showNotification(`${this.selectedUsers.length} users have been ${statusText}`, 'success');
    },
    
    /**
     * Show bulk change role modal
     */
    showBulkChangeRoleModal: function() {
        // Modal would be implemented here
        alert('Bulk change role functionality would open a modal here');
    },
    
    /**
     * Search users based on query
     * @param {string} query - The search query
     */
    searchUsers: function(query) {
        // Reset to first page
        this.currentPage = 1;
        this.renderUsers();
        this.calculatePagination();
    },
    
    /**
     * Apply filters to user list
     */
    applyFilters: function() {
        // Reset to first page
        this.currentPage = 1;
        this.renderUsers();
        this.calculatePagination();
    },
    
    /**
     * Get filtered users based on search and filters
     * @returns {Array} Filtered users array
     */
    getFilteredUsers: function() {
        let filtered = [...this.users];
        
        // Apply search
        const searchQuery = document.getElementById('user-search')?.value.toLowerCase();
        if (searchQuery) {
            filtered = filtered.filter(user => 
                user.username.toLowerCase().includes(searchQuery) ||
                user.email.toLowerCase().includes(searchQuery) ||
                user.fullName.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply role filter
        const roleFilter = document.getElementById('role-filter')?.value;
        if (roleFilter && roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }
        
        // Apply status filter
        const statusFilter = document.getElementById('status-filter')?.value;
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(user => user.status === statusFilter);
        }
        
        return filtered;
    },
    
    /**
     * Show add user modal
     */
    showAddUserModal: function() {
        // Implementation of modal functionality would go here
        alert('Add user modal would open here');
    },
    
    /**
     * Edit user
     * @param {number} userId - The ID of the user to edit
     */
    editUser: function(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        // Implementation of edit user modal would go here
        alert(`Edit user modal for ${user.username} would open here`);
    },
    
    /**
     * View user details
     * @param {number} userId - The ID of the user to view
     */
    viewUserDetails: function(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        // Implementation of view user details modal would go here
        alert(`View details modal for ${user.username} would open here`);
    },
    
    /**
     * Confirm delete user
     * @param {number} userId - The ID of the user to delete
     */
    confirmDeleteUser: function(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        if (confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
            this.users = this.users.filter(u => u.id !== userId);
            localStorage.setItem('users', JSON.stringify(this.users));
            
            this.calculatePagination();
            this.renderUsers();
            
            this.showNotification(`User ${user.username} has been deleted`, 'success');
        }
    },
    
    /**
     * Export users as CSV
     */
    exportUsers: function() {
        const filteredUsers = this.getFilteredUsers();
        
        // Convert users to CSV format
        const headers = ['ID', 'Username', 'Full Name', 'Email', 'Role', 'Status', 'Created At'];
        let csv = headers.join(',') + '\n';
        
        filteredUsers.forEach(user => {
            const row = [
                user.id,
                `"${user.username}"`,
                `"${user.fullName}"`,
                `"${user.email}"`,
                user.role,
                user.status,
                this.formatDate(user.createdAt)
            ];
            csv += row.join(',') + '\n';
        });
        
        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'users.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showNotification('Users exported successfully', 'success');
    },
    
    /**
     * Get role badge color
     * @param {string} role - The user role
     * @returns {string} The badge color class
     */
    getRoleBadgeColor: function(role) {
        switch(role.toLowerCase()) {
            case 'admin': return 'danger';
            case 'manager': return 'warning';
            case 'staff': return 'info';
            case 'customer': return 'success';
            default: return 'secondary';
        }
    },
    
    /**
     * Format date
     * @param {string|Date} date - The date to format
     * @returns {string} Formatted date
     */
    formatDate: function(date) {
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    },
    
    /**
     * Generate sample users for demo
     * @returns {Array} Array of sample users
     */
    getSampleUsers: function() {
        return [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                fullName: 'Admin User',
                email: 'admin@example.com',
                role: 'admin',
                status: 'active',
                createdAt: '2025-01-01T08:00:00Z',
                avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
            },
            {
                id: 2,
                username: 'manager1',
                password: 'manager123',
                fullName: 'Manager One',
                email: 'manager@example.com',
                role: 'manager',
                status: 'active',
                createdAt: '2025-01-15T09:30:00Z',
                avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
            },
            {
                id: 3,
                username: 'customer1',
                password: 'customer123',
                fullName: 'Customer One',
                email: 'customer1@example.com',
                role: 'customer',
                status: 'active',
                createdAt: '2025-02-05T14:20:00Z',
                avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
            },
            {
                id: 4,
                username: 'staff1',
                password: 'staff123',
                fullName: 'Staff Member',
                email: 'staff@example.com',
                role: 'staff',
                status: 'inactive',
                createdAt: '2025-02-10T11:45:00Z',
                avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
            },
            {
                id: 5,
                username: 'customer2',
                password: 'customer456',
                fullName: 'Customer Two',
                email: 'customer2@example.com',
                role: 'customer',
                status: 'active',
                createdAt: '2025-02-15T16:30:00Z',
                avatar: 'https://randomuser.me/api/portraits/men/5.jpg'
            },
            {
                id: 6,
                username: 'customer3',
                password: 'customer789',
                fullName: 'Customer Three',
                email: 'customer3@example.com',
                role: 'customer',
                status: 'active',
                createdAt: '2025-02-20T10:15:00Z',
                avatar: 'https://randomuser.me/api/portraits/women/6.jpg'
            },
            {
                id: 7,
                username: 'manager2',
                password: 'manager456',
                fullName: 'Manager Two',
                email: 'manager2@example.com',
                role: 'manager',
                status: 'active',
                createdAt: '2025-03-01T09:00:00Z',
                avatar: 'https://randomuser.me/api/portraits/men/7.jpg'
            },
            {
                id: 8,
                username: 'staff2',
                password: 'staff456',
                fullName: 'Staff Two',
                email: 'staff2@example.com',
                role: 'staff',
                status: 'active',
                createdAt: '2025-03-05T13:45:00Z',
                avatar: 'https://randomuser.me/api/portraits/women/8.jpg'
            },
            {
                id: 9,
                username: 'customer4',
                password: 'customer101112',
                fullName: 'Customer Four',
                email: 'customer4@example.com',
                role: 'customer',
                status: 'inactive',
                createdAt: '2025-03-10T15:20:00Z',
                avatar: 'https://randomuser.me/api/portraits/men/9.jpg'
            },
            {
                id: 10,
                username: 'customer5',
                password: 'customer131415',
                fullName: 'Customer Five',
                email: 'customer5@example.com',
                role: 'customer',
                status: 'active',
                createdAt: '2025-03-15T12:10:00Z',
                avatar: 'https://randomuser.me/api/portraits/women/10.jpg'
            },
            {
                id: 11,
                username: 'staff3',
                password: 'staff789',
                fullName: 'Staff Three',
                email: 'staff3@example.com',
                role: 'staff',
                status: 'active',
                createdAt: '2025-03-20T11:30:00Z',
                avatar: 'https://randomuser.me/api/portraits/men/11.jpg'
            },
            {
                id: 12,
                username: 'customer6',
                password: 'customer161718',
                fullName: 'Customer Six',
                email: 'customer6@example.com',
                role: 'customer',
                status: 'active',
                createdAt: '2025-03-25T14:50:00Z',
                avatar: 'https://randomuser.me/api/portraits/women/12.jpg'
            }
        ];
    }
};

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    UserManager.init();
}); 