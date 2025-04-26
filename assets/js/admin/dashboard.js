/**
 * Admin Dashboard main controller
 * Handles dashboard overview statistics and UI interactions
 */

const DashboardManager = {
    // Store references to elements for performance
    elements: {
        orderCountEl: null,
        revenueEl: null,
        customerCountEl: null,
        productCountEl: null,
        lowStockCountEl: null,
        recentOrdersList: null,
        notificationsList: null
    },
    
    // Dashboard data
    data: {
        orderStats: null,
        revenueStats: null,
        lowStockProducts: [],
        recentOrders: [],
        notifications: []
    },
    
    /**
     * Initialize the dashboard
     */
    init: function() {
        // Cache DOM elements
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load dashboard data
        this.loadDashboardData();
        
        // Initialize widgets
        this.initDateRangePicker();
        this.initNotificationsWidget();
    },
    
    /**
     * Cache DOM elements
     */
    cacheElements: function() {
        this.elements.orderCountEl = document.getElementById('order-count');
        this.elements.revenueEl = document.getElementById('total-revenue');
        this.elements.customerCountEl = document.getElementById('customer-count');
        this.elements.productCountEl = document.getElementById('product-count');
        this.elements.lowStockCountEl = document.getElementById('low-stock-count');
        this.elements.recentOrdersList = document.getElementById('recent-orders-list');
        this.elements.notificationsList = document.getElementById('notifications-list');
    },
    
    /**
     * Set up event listeners for dashboard interactions
     */
    setupEventListeners: function() {
        // Refresh dashboard button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.refreshDashboard();
            });
        }
        
        // Date range selector changed
        const dateRangeInput = document.getElementById('dashboard-date-range');
        if (dateRangeInput) {
            dateRangeInput.addEventListener('change', () => {
                this.loadDashboardData();
            });
        }
        
        // Mark all notifications as read
        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.markAllNotificationsAsRead();
            });
        }
        
        // Individual notification read buttons
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('mark-notification-read')) {
                const notificationId = e.target.dataset.id;
                this.markNotificationAsRead(notificationId);
            }
        });
    },
    
    /**
     * Initialize date range picker for dashboard filtering
     */
    initDateRangePicker: function() {
        const dateRangeInput = document.getElementById('dashboard-date-range');
        
        if (dateRangeInput && typeof flatpickr !== 'undefined') {
            flatpickr(dateRangeInput, {
                mode: 'range',
                dateFormat: 'Y-m-d',
                defaultDate: [
                    new Date(new Date().setDate(new Date().getDate() - 30)), 
                    new Date()
                ],
                onChange: (selectedDates) => {
                    if (selectedDates.length === 2) {
                        // Both dates selected, reload dashboard data
                        this.loadDashboardData();
                    }
                }
            });
        }
    },
    
    /**
     * Initialize notifications widget
     */
    initNotificationsWidget: function() {
        // Load notifications count for badge
        this.updateNotificationBadge();
        
        // Set up notification dropdown toggle
        const notificationDropdown = document.getElementById('notification-dropdown');
        if (notificationDropdown) {
            notificationDropdown.addEventListener('show.bs.dropdown', () => {
                this.loadNotifications();
            });
        }
    },
    
    /**
     * Load all dashboard data
     */
    loadDashboardData: function() {
        // Show loading state
        this.showLoadingState();
        
        // Make API calls or pull from local data
        this.loadOrderStats();
        this.loadRevenueStats();
        this.loadCustomerStats();
        this.loadProductStats();
        this.loadLowStockProducts();
        this.loadRecentOrders();
        
        // Hide loading state after all data is loaded
        setTimeout(() => {
            this.hideLoadingState();
            Utils.showToast('success', 'Dashboard data updated successfully');
        }, 800);
    },
    
    /**
     * Show loading state on dashboard
     */
    showLoadingState: function() {
        // Add loading overlay
        const dashboard = document.querySelector('.dashboard-content');
        if (dashboard) {
            dashboard.classList.add('loading');
            
            // Create overlay if it doesn't exist
            if (!document.querySelector('.dashboard-loading-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'dashboard-loading-overlay';
                overlay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
                dashboard.appendChild(overlay);
            } else {
                document.querySelector('.dashboard-loading-overlay').style.display = 'flex';
            }
        }
    },
    
    /**
     * Hide loading state on dashboard
     */
    hideLoadingState: function() {
        const dashboard = document.querySelector('.dashboard-content');
        if (dashboard) {
            dashboard.classList.remove('loading');
            
            const overlay = document.querySelector('.dashboard-loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    },
    
    /**
     * Load order statistics
     */
    loadOrderStats: function() {
        // In a real application, this would be an API call
        // For demonstration, we'll use simulated data
        
        this.data.orderStats = {
            total: 152,
            pending: 23,
            processing: 14,
            completed: 108,
            cancelled: 7,
            growth: 12.5 // percent growth from previous period
        };
        
        // Update UI with order stats
        if (this.elements.orderCountEl) {
            this.elements.orderCountEl.textContent = this.data.orderStats.total;
            
            // Update growth indicator
            const growthEl = this.elements.orderCountEl.nextElementSibling;
            if (growthEl) {
                const isPositive = this.data.orderStats.growth > 0;
                growthEl.innerHTML = `
                    <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}-circle-fill text-${isPositive ? 'success' : 'danger'}"></i>
                    ${Math.abs(this.data.orderStats.growth)}%
                `;
            }
        }
        
        // Update order breakdown chart
        this.updateOrderChart();
    },
    
    /**
     * Update the order status breakdown chart
     */
    updateOrderChart: function() {
        const chartEl = document.getElementById('order-status-chart');
        if (!chartEl || typeof Chart === 'undefined') return;
        
        // Check if chart instance already exists and destroy it
        if (window.orderStatusChart) {
            window.orderStatusChart.destroy();
        }
        
        // Create new chart
        window.orderStatusChart = new Chart(chartEl.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending', 'Processing', 'Cancelled'],
                datasets: [{
                    data: [
                        this.data.orderStats.completed,
                        this.data.orderStats.pending,
                        this.data.orderStats.processing,
                        this.data.orderStats.cancelled
                    ],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.7)',
                        'rgba(255, 193, 7, 0.7)',
                        'rgba(0, 123, 255, 0.7)',
                        'rgba(220, 53, 69, 0.7)'
                    ],
                    borderColor: [
                        'rgba(40, 167, 69, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(0, 123, 255, 1)',
                        'rgba(220, 53, 69, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            boxWidth: 12
                        }
                    }
                },
                cutout: '70%'
            }
        });
    },
    
    /**
     * Load revenue statistics
     */
    loadRevenueStats: function() {
        // Simulated revenue data
        this.data.revenueStats = {
            total: 27850000, // in VND
            today: 1250000,
            weekly: 8700000,
            monthly: 27850000,
            growth: 8.3, // percent growth from previous period
            revenueByDay: [
                1250000, 980000, 1540000, 1120000, 2100000, 950000, 760000
            ]
        };
        
        // Update UI with revenue stats
        if (this.elements.revenueEl) {
            this.elements.revenueEl.textContent = Utils.formatCurrency(this.data.revenueStats.total);
            
            // Update growth indicator
            const growthEl = this.elements.revenueEl.nextElementSibling;
            if (growthEl) {
                const isPositive = this.data.revenueStats.growth > 0;
                growthEl.innerHTML = `
                    <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}-circle-fill text-${isPositive ? 'success' : 'danger'}"></i>
                    ${Math.abs(this.data.revenueStats.growth)}%
                `;
            }
        }
        
        // Update revenue chart
        this.updateRevenueChart();
    },
    
    /**
     * Update the revenue chart
     */
    updateRevenueChart: function() {
        const chartEl = document.getElementById('revenue-chart');
        if (!chartEl || typeof Chart === 'undefined') return;
        
        // Check if chart instance already exists and destroy it
        if (window.revenueChart) {
            window.revenueChart.destroy();
        }
        
        // Create new chart
        window.revenueChart = new Chart(chartEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue',
                    data: this.data.revenueStats.revenueByDay,
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return Utils.formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value, 'vi-VN', 'VND').replace(/\D00(?=\D*$)/, '');
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Load customer statistics
     */
    loadCustomerStats: function() {
        // Simulated data
        const customerStats = {
            total: 879,
            new: 24,
            returning: 67,
            growth: 5.8 // percent growth from previous period
        };
        
        // Update UI
        if (this.elements.customerCountEl) {
            this.elements.customerCountEl.textContent = customerStats.total;
            
            // Update growth indicator
            const growthEl = this.elements.customerCountEl.nextElementSibling;
            if (growthEl) {
                const isPositive = customerStats.growth > 0;
                growthEl.innerHTML = `
                    <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}-circle-fill text-${isPositive ? 'success' : 'danger'}"></i>
                    ${Math.abs(customerStats.growth)}%
                `;
            }
        }
    },
    
    /**
     * Load product statistics
     */
    loadProductStats: function() {
        // Simulated data
        const productStats = {
            total: 124,
            active: 98,
            outOfStock: 8,
            disabled: 18
        };
        
        // Update UI
        if (this.elements.productCountEl) {
            this.elements.productCountEl.textContent = productStats.total;
        }
    },
    
    /**
     * Load low stock products
     */
    loadLowStockProducts: function() {
        // Simulated data for low stock products
        this.data.lowStockProducts = [
            { id: 1, name: 'Organic Mountain Coffee', stock: 5, minStock: 10 },
            { id: 2, name: 'Premium Tea Collection', stock: 3, minStock: 15 },
            { id: 3, name: 'Handcrafted Ceramic Mug', stock: 8, minStock: 20 },
            { id: 4, name: 'Coffee Brewing Kit', stock: 2, minStock: 5 }
        ];
        
        // Update UI
        if (this.elements.lowStockCountEl) {
            this.elements.lowStockCountEl.textContent = this.data.lowStockProducts.length;
        }
        
        // Update low stock products list
        const lowStockList = document.getElementById('low-stock-list');
        if (lowStockList) {
            lowStockList.innerHTML = '';
            
            if (this.data.lowStockProducts.length === 0) {
                lowStockList.innerHTML = '<li class="list-group-item">No products with low stock</li>';
            } else {
                this.data.lowStockProducts.forEach(product => {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                    
                    // Calculate percentage of minimum stock
                    const stockPercentage = (product.stock / product.minStock) * 100;
                    let badgeClass = 'bg-danger';
                    if (stockPercentage > 50) {
                        badgeClass = 'bg-warning';
                    }
                    
                    listItem.innerHTML = `
                        <div>
                            <h6 class="mb-0">${product.name}</h6>
                            <small class="text-muted">Min stock: ${product.minStock}</small>
                        </div>
                        <span class="badge ${badgeClass} rounded-pill">${product.stock} left</span>
                    `;
                    
                    lowStockList.appendChild(listItem);
                });
            }
        }
    },
    
    /**
     * Load recent orders
     */
    loadRecentOrders: function() {
        // Simulated data for recent orders
        this.data.recentOrders = [
            { id: 'ORD-1234', customer: 'Nguyen Van A', date: new Date('2025-05-10T08:30:00'), total: 350000, status: 'completed' },
            { id: 'ORD-1233', customer: 'Tran Thi B', date: new Date('2025-05-09T14:20:00'), total: 520000, status: 'processing' },
            { id: 'ORD-1232', customer: 'Le Van C', date: new Date('2025-05-09T10:15:00'), total: 180000, status: 'completed' },
            { id: 'ORD-1231', customer: 'Pham Thi D', date: new Date('2025-05-08T16:45:00'), total: 790000, status: 'pending' },
            { id: 'ORD-1230', customer: 'Hoang Van E', date: new Date('2025-05-08T09:10:00'), total: 450000, status: 'completed' }
        ];
        
        // Update UI
        if (this.elements.recentOrdersList) {
            this.elements.recentOrdersList.innerHTML = '';
            
            this.data.recentOrders.forEach(order => {
                const statusClass = this.getStatusClass(order.status);
                const formattedDate = Utils.formatDate(order.date, { weekday: 'short', day: 'numeric', month: 'short' });
                
                const listItem = document.createElement('tr');
                listItem.innerHTML = `
                    <td>
                        <a href="order-details.html?id=${order.id}" class="fw-bold text-primary">${order.id}</a>
                    </td>
                    <td>${order.customer}</td>
                    <td>${formattedDate}</td>
                    <td>${Utils.formatCurrency(order.total)}</td>
                    <td><span class="badge ${statusClass}">${order.status}</span></td>
                    <td>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Actions
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="order-details.html?id=${order.id}">View Details</a></li>
                                <li><a class="dropdown-item order-action" data-action="process" data-id="${order.id}" href="#">Process Order</a></li>
                                <li><a class="dropdown-item order-action" data-action="complete" data-id="${order.id}" href="#">Mark as Completed</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item order-action text-danger" data-action="cancel" data-id="${order.id}" href="#">Cancel Order</a></li>
                            </ul>
                        </div>
                    </td>
                `;
                
                this.elements.recentOrdersList.appendChild(listItem);
            });
        }
    },
    
    /**
     * Get CSS class for order status
     * @param {string} status - Order status
     * @returns {string} - CSS class name
     */
    getStatusClass: function(status) {
        switch(status) {
            case 'completed': return 'bg-success';
            case 'processing': return 'bg-primary';
            case 'pending': return 'bg-warning';
            case 'cancelled': return 'bg-danger';
            default: return 'bg-secondary';
        }
    },
    
    /**
     * Load notifications for the dropdown
     */
    loadNotifications: function() {
        // Simulated notifications data
        this.data.notifications = [
            { id: 1, type: 'order', message: 'New order #ORD-1234 received', time: '10 minutes ago', read: false },
            { id: 2, type: 'stock', message: 'Organic Mountain Coffee is low on stock (5 remaining)', time: '2 hours ago', read: false },
            { id: 3, type: 'customer', message: 'New customer registration: Nguyen Van A', time: '3 hours ago', read: true },
            { id: 4, type: 'system', message: 'System update completed successfully', time: '1 day ago', read: true }
        ];
        
        // Update UI
        if (this.elements.notificationsList) {
            this.elements.notificationsList.innerHTML = '';
            
            if (this.data.notifications.length === 0) {
                this.elements.notificationsList.innerHTML = '<li class="dropdown-item text-center">No notifications</li>';
                return;
            }
            
            this.data.notifications.forEach(notification => {
                const listItem = document.createElement('li');
                listItem.className = notification.read ? 'notification-item read' : 'notification-item unread';
                
                // Define icon based on notification type
                let icon = '';
                switch(notification.type) {
                    case 'order': icon = 'bi-bag-check'; break;
                    case 'stock': icon = 'bi-exclamation-triangle'; break;
                    case 'customer': icon = 'bi-person-plus'; break;
                    case 'system': icon = 'bi-gear'; break;
                    default: icon = 'bi-bell';
                }
                
                listItem.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="notification-icon">
                            <i class="bi ${icon}"></i>
                        </div>
                        <div class="notification-content ms-3">
                            <p class="mb-1">${notification.message}</p>
                            <small class="text-muted">${notification.time}</small>
                        </div>
                        ${!notification.read ? `<button class="btn btn-sm ms-auto mark-notification-read" data-id="${notification.id}">
                            <i class="bi bi-check-circle"></i>
                        </button>` : ''}
                    </div>
                `;
                
                this.elements.notificationsList.appendChild(listItem);
            });
        }
        
        // Update notification badge
        this.updateNotificationBadge();
    },
    
    /**
     * Update notification badge count
     */
    updateNotificationBadge: function() {
        const unreadCount = this.data.notifications ? 
            this.data.notifications.filter(n => !n.read).length : 0;
        
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    },
    
    /**
     * Mark a notification as read
     * @param {number} id - Notification ID
     */
    markNotificationAsRead: function(id) {
        // Find the notification
        const notification = this.data.notifications.find(n => n.id === parseInt(id));
        if (notification) {
            notification.read = true;
            
            // Update UI
            const notificationItem = document.querySelector(`.notification-item [data-id="${id}"]`)?.closest('.notification-item');
            if (notificationItem) {
                notificationItem.classList.remove('unread');
                notificationItem.classList.add('read');
                
                // Remove the read button
                const readButton = notificationItem.querySelector('.mark-notification-read');
                if (readButton) {
                    readButton.remove();
                }
            }
            
            // Update badge
            this.updateNotificationBadge();
            
            // In a real application, you would send an API request to mark as read
            Utils.showToast('success', 'Notification marked as read');
        }
    },
    
    /**
     * Mark all notifications as read
     */
    markAllNotificationsAsRead: function() {
        // Mark all as read in the data
        if (this.data.notifications) {
            this.data.notifications.forEach(n => n.read = true);
        }
        
        // Update UI
        const notificationItems = document.querySelectorAll('.notification-item');
        notificationItems.forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            
            // Remove read buttons
            const readButton = item.querySelector('.mark-notification-read');
            if (readButton) {
                readButton.remove();
            }
        });
        
        // Update badge
        this.updateNotificationBadge();
        
        // In a real application, you would send an API request
        Utils.showToast('success', 'All notifications marked as read');
    },
    
    /**
     * Refresh the dashboard data
     */
    refreshDashboard: function() {
        Utils.showToast('info', 'Refreshing dashboard data...');
        this.loadDashboardData();
    }
};

// Initialize the dashboard when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    DashboardManager.init();
}); 