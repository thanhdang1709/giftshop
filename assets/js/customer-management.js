/**
 * Customer Management Module for Admin Dashboard
 * Handles customer data display, filtering, and management
 */
const CustomerManager = {
    /**
     * Initialize the customer management module
     */
    init: function() {
        // Check if user is logged in and is admin
        if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
            window.location.href = '/pages/auth/login.html?redirect=admin';
            return;
        }
        
        this.loadCustomers();
        this.setupEventListeners();
        this.initializeDataTable();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // Search functionality
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', Utils.debounce(() => {
                this.filterCustomers(searchInput.value);
            }, 300));
        }
        
        // Add listener for customer detail view
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-customer-btn')) {
                const customerId = e.target.closest('.view-customer-btn').dataset.id;
                this.viewCustomerDetails(customerId);
            }
        });
        
        // Export customer data
        const exportBtn = document.getElementById('export-customers');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportCustomerData();
            });
        }
        
        // Customer status toggle
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('customer-status-toggle')) {
                const customerId = e.target.dataset.id;
                const isActive = e.target.checked;
                this.updateCustomerStatus(customerId, isActive);
            }
        });
    },
    
    /**
     * Initialize DataTable for better data presentation
     */
    initializeDataTable: function() {
        const customersTable = document.getElementById('customers-table');
        if (customersTable && typeof $.fn.DataTable !== 'undefined') {
            $(customersTable).DataTable({
                responsive: true,
                language: {
                    search: "Tìm kiếm:",
                    lengthMenu: "Hiển thị _MENU_ khách hàng",
                    info: "Hiển thị _START_ đến _END_ của _TOTAL_ khách hàng",
                    infoEmpty: "Hiển thị 0 đến 0 của 0 khách hàng",
                    infoFiltered: "(lọc từ _MAX_ khách hàng)",
                    paginate: {
                        first: "Đầu",
                        last: "Cuối",
                        next: "Tiếp",
                        previous: "Trước"
                    }
                }
            });
            this.showNotification('Bảng dữ liệu khách hàng đã được khởi tạo', 'info');
        }
    },
    
    /**
     * Load customers from database
     */
    loadCustomers: function() {
        try {
            const customers = this.getCustomersData();
            const tableBody = document.querySelector('#customers-table tbody');
            
            if (!tableBody) {
                this.showNotification('Không tìm thấy bảng khách hàng', 'error');
                return;
            }
            
            tableBody.innerHTML = '';
            
            if (customers.length === 0) {
                const noDataRow = document.createElement('tr');
                noDataRow.innerHTML = '<td colspan="7" class="text-center">Không có dữ liệu khách hàng</td>';
                tableBody.appendChild(noDataRow);
                return;
            }
            
            customers.forEach(customer => {
                const row = this.createCustomerRow(customer);
                tableBody.appendChild(row);
            });
            
            this.updateCustomerCounters(customers);
            this.showNotification(`Đã tải ${customers.length} khách hàng`, 'success');
            
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showNotification('Đã xảy ra lỗi khi tải dữ liệu khách hàng', 'error');
        }
    },
    
    /**
     * Get customers data from database
     * @returns {Array} Array of customer objects
     */
    getCustomersData: function() {
        // Get users from DB
        const users = DB.getAll(DB.STORES.USERS) || [];
        
        // Filter only customer role users
        return users.filter(user => user.role === 'customer').map(user => {
            // Get order count for this customer
            const orders = DB.getAll(DB.STORES.ORDERS) || [];
            const customerOrders = orders.filter(order => order.userId === user.id);
            
            return {
                id: user.id,
                username: user.username,
                fullName: user.fullName || 'N/A',
                email: user.email || 'N/A',
                phone: user.phone || 'N/A',
                address: user.address || 'N/A',
                orderCount: customerOrders.length,
                totalSpent: customerOrders.reduce((total, order) => total + order.total, 0),
                status: user.status !== undefined ? user.status : true,
                createdAt: user.createdAt || new Date().toISOString()
            };
        });
    },
    
    /**
     * Create a table row for a customer
     * @param {Object} customer - Customer data object
     * @returns {HTMLElement} TR element
     */
    createCustomerRow: function(customer) {
        const row = document.createElement('tr');
        row.dataset.id = customer.id;
        
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="customer-avatar bg-light rounded-circle p-2">
                        <i class="bi bi-person"></i>
                    </div>
                    <div class="ms-3">
                        <p class="fw-bold mb-1">${customer.fullName}</p>
                        <p class="text-muted mb-0">${customer.email}</p>
                    </div>
                </div>
            </td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${Utils.truncateText(customer.address, 30) || 'N/A'}</td>
            <td>${customer.orderCount}</td>
            <td>${Utils.formatCurrency(customer.totalSpent)}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input customer-status-toggle" type="checkbox" 
                        data-id="${customer.id}" ${customer.status ? 'checked' : ''}>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-primary view-customer-btn" data-id="${customer.id}">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;
        
        return row;
    },
    
    /**
     * Update customer counters in the dashboard
     * @param {Array} customers - Array of customer objects
     */
    updateCustomerCounters: function(customers) {
        const totalCustomers = document.getElementById('total-customers');
        const activeCustomers = document.getElementById('active-customers');
        const newCustomers = document.getElementById('new-customers');
        
        if (totalCustomers) {
            totalCustomers.textContent = customers.length;
        }
        
        if (activeCustomers) {
            const activeCount = customers.filter(c => c.status).length;
            activeCustomers.textContent = activeCount;
        }
        
        if (newCustomers) {
            // Calculate new customers in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const newCount = customers.filter(c => {
                const createdDate = new Date(c.createdAt);
                return createdDate >= thirtyDaysAgo;
            }).length;
            
            newCustomers.textContent = newCount;
        }
    },
    
    /**
     * Filter customers based on search query
     * @param {string} query - Search query
     */
    filterCustomers: function(query) {
        const table = document.getElementById('customers-table');
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        const lowerQuery = query.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        this.showNotification(`Đã lọc khách hàng theo từ khóa: ${query}`, 'info');
    },
    
    /**
     * View customer details
     * @param {string} customerId - Customer ID
     */
    viewCustomerDetails: function(customerId) {
        try {
            // Get users from DB
            const users = DB.getAll(DB.STORES.USERS) || [];
            const customer = users.find(user => user.id === customerId);
            
            if (!customer) {
                this.showNotification('Không tìm thấy thông tin khách hàng', 'error');
                return;
            }
            
            // Get customer orders
            const orders = DB.getAll(DB.STORES.ORDERS) || [];
            const customerOrders = orders.filter(order => order.userId === customerId);
            
            // Create a modal to display customer details
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'customerDetailModal';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('aria-labelledby', 'customerDetailModalLabel');
            modal.setAttribute('aria-hidden', 'true');
            
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="customerDetailModalLabel">
                                Thông tin khách hàng: ${customer.fullName || customer.username}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="fw-bold">Thông tin cá nhân</h6>
                                    <p><strong>ID:</strong> ${customer.id}</p>
                                    <p><strong>Tên đăng nhập:</strong> ${customer.username}</p>
                                    <p><strong>Họ tên:</strong> ${customer.fullName || 'N/A'}</p>
                                    <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                                    <p><strong>Số điện thoại:</strong> ${customer.phone || 'N/A'}</p>
                                    <p><strong>Địa chỉ:</strong> ${customer.address || 'N/A'}</p>
                                    <p><strong>Trạng thái:</strong> 
                                        <span class="badge ${customer.status ? 'bg-success' : 'bg-danger'}">
                                            ${customer.status ? 'Hoạt động' : 'Không hoạt động'}
                                        </span>
                                    </p>
                                    <p><strong>Ngày tạo:</strong> ${Utils.formatDate(customer.createdAt, true)}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="fw-bold">Thống kê mua hàng</h6>
                                    <p><strong>Tổng số đơn hàng:</strong> ${customerOrders.length}</p>
                                    <p><strong>Tổng chi tiêu:</strong> ${Utils.formatCurrency(customerOrders.reduce((total, order) => total + order.total, 0))}</p>
                                    <p><strong>Đơn hàng gần nhất:</strong> ${customerOrders.length > 0 ? Utils.formatDate(customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt, true) : 'N/A'}</p>
                                    
                                    <h6 class="fw-bold mt-4">Lịch sử đơn hàng</h6>
                                    <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Mã đơn</th>
                                                    <th>Ngày</th>
                                                    <th>Tổng tiền</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${customerOrders.length > 0 ? 
                                                    customerOrders.map(order => `
                                                        <tr>
                                                            <td>${order.id}</td>
                                                            <td>${Utils.formatDate(order.createdAt)}</td>
                                                            <td>${Utils.formatCurrency(order.total)}</td>
                                                            <td>
                                                                <span class="badge bg-${this.getOrderStatusColor(order.status)}">
                                                                    ${order.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    `).join('') : 
                                                    '<tr><td colspan="4" class="text-center">Không có đơn hàng</td></tr>'
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                            <button type="button" class="btn btn-primary" id="editCustomerBtn" data-id="${customer.id}">
                                Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
            
            // Event listener for edit button
            const editBtn = document.getElementById('editCustomerBtn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    modalInstance.hide();
                    this.editCustomer(customerId);
                });
            }
            
            // Remove modal from DOM when hidden
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
            
        } catch (error) {
            console.error('Error viewing customer details:', error);
            this.showNotification('Đã xảy ra lỗi khi hiển thị thông tin khách hàng', 'error');
        }
    },
    
    /**
     * Get color for order status badge
     * @param {string} status - Order status
     * @returns {string} Color class name
     */
    getOrderStatusColor: function(status) {
        const statusColors = {
            'pending': 'warning',
            'processing': 'info',
            'shipped': 'primary',
            'delivered': 'success',
            'cancelled': 'danger'
        };
        
        return statusColors[status.toLowerCase()] || 'secondary';
    },
    
    /**
     * Edit customer information
     * @param {string} customerId - Customer ID
     */
    editCustomer: function(customerId) {
        try {
            // Get users from DB
            const users = DB.getAll(DB.STORES.USERS) || [];
            const customer = users.find(user => user.id === customerId);
            
            if (!customer) {
                this.showNotification('Không tìm thấy thông tin khách hàng', 'error');
                return;
            }
            
            // Create a modal with a form to edit customer details
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'editCustomerModal';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('aria-labelledby', 'editCustomerModalLabel');
            modal.setAttribute('aria-hidden', 'true');
            
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="editCustomerModalLabel">
                                Chỉnh sửa khách hàng: ${customer.fullName || customer.username}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form id="editCustomerForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label for="edit-fullName" class="form-label">Họ tên</label>
                                    <input type="text" class="form-control" id="edit-fullName" 
                                        value="${customer.fullName || ''}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-email" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="edit-email" 
                                        value="${customer.email || ''}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-phone" class="form-label">Số điện thoại</label>
                                    <input type="tel" class="form-control" id="edit-phone" 
                                        value="${customer.phone || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-address" class="form-label">Địa chỉ</label>
                                    <textarea class="form-control" id="edit-address" rows="2">${customer.address || ''}</textarea>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="edit-status" 
                                        ${customer.status ? 'checked' : ''}>
                                    <label class="form-check-label" for="edit-status">Tài khoản hoạt động</label>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                                <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
            
            // Handle form submission
            const form = document.getElementById('editCustomerForm');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Get form values
                const fullName = document.getElementById('edit-fullName').value;
                const email = document.getElementById('edit-email').value;
                const phone = document.getElementById('edit-phone').value;
                const address = document.getElementById('edit-address').value;
                const status = document.getElementById('edit-status').checked;
                
                // Update customer in DB
                const customerIndex = users.findIndex(user => user.id === customerId);
                if (customerIndex !== -1) {
                    users[customerIndex].fullName = fullName;
                    users[customerIndex].email = email;
                    users[customerIndex].phone = phone;
                    users[customerIndex].address = address;
                    users[customerIndex].status = status;
                    
                    // Save to DB
                    DB.setAll(DB.STORES.USERS, users);
                    
                    // Close modal
                    modalInstance.hide();
                    
                    // Reload customers list
                    this.loadCustomers();
                    
                    this.showNotification('Thông tin khách hàng đã được cập nhật', 'success');
                }
            });
            
            // Remove modal from DOM when hidden
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
            
        } catch (error) {
            console.error('Error editing customer:', error);
            this.showNotification('Đã xảy ra lỗi khi chỉnh sửa thông tin khách hàng', 'error');
        }
    },
    
    /**
     * Update customer status (active/inactive)
     * @param {string} customerId - Customer ID
     * @param {boolean} isActive - New status
     */
    updateCustomerStatus: function(customerId, isActive) {
        try {
            // Get users from DB
            const users = DB.getAll(DB.STORES.USERS) || [];
            const customerIndex = users.findIndex(user => user.id === customerId);
            
            if (customerIndex === -1) {
                this.showNotification('Không tìm thấy thông tin khách hàng', 'error');
                return;
            }
            
            // Update customer status
            users[customerIndex].status = isActive;
            
            // Save to DB
            DB.setAll(DB.STORES.USERS, users);
            
            this.showNotification(
                `Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản khách hàng`, 
                isActive ? 'success' : 'warning'
            );
            
        } catch (error) {
            console.error('Error updating customer status:', error);
            this.showNotification('Đã xảy ra lỗi khi cập nhật trạng thái khách hàng', 'error');
        }
    },
    
    /**
     * Export customer data to CSV
     */
    exportCustomerData: function() {
        try {
            const customers = this.getCustomersData();
            
            if (customers.length === 0) {
                this.showNotification('Không có dữ liệu khách hàng để xuất', 'warning');
                return;
            }
            
            // Create CSV header
            let csv = 'ID,Tên đăng nhập,Họ tên,Email,Số điện thoại,Địa chỉ,Số đơn hàng,Tổng chi tiêu,Trạng thái,Ngày tạo\n';
            
            // Add data rows
            customers.forEach(customer => {
                csv += `"${customer.id}","${customer.username}","${customer.fullName}","${customer.email}","${customer.phone}","${customer.address}",${customer.orderCount},${customer.totalSpent},"${customer.status ? 'Hoạt động' : 'Không hoạt động'}","${customer.createdAt}"\n`;
            });
            
            // Create blob and download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.setAttribute('href', url);
            link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification(`Đã xuất ${customers.length} khách hàng thành công`, 'success');
            
        } catch (error) {
            console.error('Error exporting customer data:', error);
            this.showNotification('Đã xảy ra lỗi khi xuất dữ liệu khách hàng', 'error');
        }
    },
    
    /**
     * Display a notification
     * @param {string} message - The message to display
     * @param {string} type - The notification type (success, error, warning, info)
     */
    showNotification: function(message, type) {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(type, message);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            
            // Fallback to Bootstrap toast if available
            if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
                const toastEl = document.createElement('div');
                toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
                toastEl.setAttribute('role', 'alert');
                toastEl.setAttribute('aria-live', 'assertive');
                toastEl.setAttribute('aria-atomic', 'true');
                
                toastEl.innerHTML = `
                    <div class="d-flex">
                        <div class="toast-body">
                            ${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                `;
                
                document.body.appendChild(toastEl);
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
                
                toastEl.addEventListener('hidden.bs.toast', () => {
                    toastEl.remove();
                });
            } else {
                alert(message);
            }
        }
    }
};

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    CustomerManager.init();
}); 