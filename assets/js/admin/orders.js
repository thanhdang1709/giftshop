/**
 * Orders Management Module
 * Handles admin functionality for managing customer orders
 */

const OrdersManager = {
    orders: [],
    currentPage: 1,
    itemsPerPage: 10,
    
    init: function() {
        // Bảo vệ trang admin
        if (!Auth.isLoggedIn() || (!Auth.isAdmin() && !Auth.isStaff())) {
            window.location.href = '../../pages/customer/login.html';
            return;
        }
        
        this.loadOrders();
        this.setupEventListeners();
    },
    
    setupEventListeners: function() {
        // Search functionality
        document.getElementById('searchButton').addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('searchOrder').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });
        
        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('dateFilter').addEventListener('change', () => {
            this.applyFilters();
        });
        
        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('searchOrder').value = '';
            document.getElementById('statusFilter').value = 'all';
            document.getElementById('dateFilter').value = '';
            this.applyFilters();
        });
        
        // Update order status
        document.getElementById('updateStatusBtn').addEventListener('click', () => {
            this.updateOrderStatus();
        });
        
        // Print order
        document.getElementById('printOrderBtn').addEventListener('click', () => {
            this.printOrder();
        });
        
        // Pagination event delegation
        document.getElementById('pagination').addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
                const pageNum = parseInt(e.target.getAttribute('data-page'));
                if (!isNaN(pageNum)) {
                    this.goToPage(pageNum);
                }
            }
        });

        // View order details event delegation
        document.getElementById('ordersList').addEventListener('click', (e) => {
            const viewButton = e.target.closest('.view-order');
            if (viewButton) {
                const orderId = viewButton.getAttribute('data-id');
                this.openOrderDetail(orderId);
            }
        });
        
        // Đăng xuất
        document.getElementById('adminLogoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    },
    
    loadOrders: async function() {
        try {
            // In a real application, this would fetch from an API
            // For demonstration, we're using local data
            this.orders = await this.fetchOrdersData();
            this.renderOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
            Utils.showToast('error', 'Không thể tải dữ liệu đơn hàng');
        }
    },
    
    fetchOrdersData: async function() {
        // Simulating API call with sample data
        // In production, this would be replaced with a real API fetch
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        id: "ORD001",
                        customerName: "Nguyễn Văn A",
                        email: "nguyenvana@example.com",
                        phone: "0901234567",
                        orderDate: "2023-03-15",
                        total: 1250000,
                        status: "delivered",
                        paymentMethod: "COD",
                        shippingAddress: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
                        items: [
                            { name: "Sản phẩm A", price: 350000, quantity: 2, total: 700000 },
                            { name: "Sản phẩm B", price: 500000, quantity: 1, total: 500000 }
                        ],
                        shippingFee: 50000,
                        notes: "Giao giờ hành chính"
                    },
                    {
                        id: "ORD002",
                        customerName: "Trần Thị B",
                        email: "tranthib@example.com",
                        phone: "0909876543",
                        orderDate: "2023-03-16",
                        total: 820000,
                        status: "processing",
                        paymentMethod: "Bank Transfer",
                        shippingAddress: "456 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                        items: [
                            { name: "Sản phẩm C", price: 420000, quantity: 1, total: 420000 },
                            { name: "Sản phẩm D", price: 350000, quantity: 1, total: 350000 }
                        ],
                        shippingFee: 50000,
                        notes: ""
                    },
                    {
                        id: "ORD003",
                        customerName: "Lê Văn C",
                        email: "levanc@example.com",
                        phone: "0912345678",
                        orderDate: "2023-03-17",
                        total: 1500000,
                        status: "pending",
                        paymentMethod: "Momo",
                        shippingAddress: "789 Đường Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM",
                        items: [
                            { name: "Sản phẩm E", price: 1450000, quantity: 1, total: 1450000 }
                        ],
                        shippingFee: 50000,
                        notes: "Gọi trước khi giao"
                    },
                    {
                        id: "ORD004",
                        customerName: "Phạm Thị D",
                        email: "phamthid@example.com",
                        phone: "0987654321",
                        orderDate: "2023-03-18",
                        total: 2100000,
                        status: "shipped",
                        paymentMethod: "COD",
                        shippingAddress: "101 Đường Nguyễn Du, Phường Bến Thành, Quận 1, TP.HCM",
                        items: [
                            { name: "Sản phẩm F", price: 980000, quantity: 2, total: 1960000 },
                            { name: "Sản phẩm G", price: 90000, quantity: 1, total: 90000 }
                        ],
                        shippingFee: 50000,
                        notes: ""
                    },
                    {
                        id: "ORD005",
                        customerName: "Võ Văn E",
                        email: "vovane@example.com",
                        phone: "0978123456",
                        orderDate: "2023-03-19",
                        total: 750000,
                        status: "cancelled",
                        paymentMethod: "COD",
                        shippingAddress: "202 Đường Lý Tự Trọng, Phường Bến Thành, Quận 1, TP.HCM",
                        items: [
                            { name: "Sản phẩm H", price: 700000, quantity: 1, total: 700000 }
                        ],
                        shippingFee: 50000,
                        notes: "Khách hàng đã yêu cầu hủy"
                    },
                    {
                        id: "ORD006",
                        customerName: "Nguyễn Thị F",
                        email: "nguyenthif@example.com",
                        phone: "0912345987",
                        orderDate: "2023-03-20",
                        total: 1800000,
                        status: "pending",
                        paymentMethod: "Bank Transfer",
                        shippingAddress: "303 Đường Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP.HCM",
                        items: [
                            { name: "Sản phẩm I", price: 1750000, quantity: 1, total: 1750000 }
                        ],
                        shippingFee: 50000,
                        notes: ""
                    },
                    {
                        id: "ORD007",
                        customerName: "Trần Văn G",
                        email: "tranvang@example.com",
                        phone: "0901122334",
                        orderDate: "2023-03-21",
                        total: 1350000,
                        status: "processing",
                        paymentMethod: "Momo",
                        shippingAddress: "404 Đường Cách Mạng Tháng 8, Phường 10, Quận 3, TP.HCM",
                        items: [
                            { name: "Sản phẩm J", price: 650000, quantity: 2, total: 1300000 }
                        ],
                        shippingFee: 50000,
                        notes: "Giao trong giờ hành chính"
                    }
                ]);
            }, 300);
        });
    },
    
    renderOrders: function() {
        const filteredOrders = this.getFilteredOrders();
        
        // Update order count
        document.getElementById('orderCount').textContent = filteredOrders.length;
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredOrders.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, filteredOrders.length);
        
        const currentOrders = filteredOrders.slice(startIndex, endIndex);
        
        // Render orders
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';
        
        if (currentOrders.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6" class="text-center">Không tìm thấy đơn hàng nào</td>';
            ordersList.appendChild(row);
        } else {
            currentOrders.forEach(order => {
                const statusClass = this.getStatusClass(order.status);
                const statusText = this.getStatusText(order.status);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.customerName}</td>
                    <td>${this.formatDate(order.orderDate)}</td>
                    <td>${this.formatCurrency(order.total)}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary view-order" data-id="${order.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                `;
                ordersList.appendChild(row);
            });
        }
        
        // Render pagination
        this.renderPagination(totalPages);
    },
    
    renderPagination: function(totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>Trước</a>`;
        pagination.appendChild(prevLi);
        
        // Page numbers
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            pagination.appendChild(pageLi);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'tabindex="-1" aria-disabled="true"' : ''}>Sau</a>`;
        pagination.appendChild(nextLi);
    },
    
    getFilteredOrders: function() {
        const searchTerm = document.getElementById('searchOrder').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        return this.orders.filter(order => {
            // Search filter
            const matchesSearch = searchTerm === '' || 
                order.id.toLowerCase().includes(searchTerm) || 
                order.customerName.toLowerCase().includes(searchTerm) ||
                order.email.toLowerCase().includes(searchTerm);
            
            // Status filter
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            
            // Date filter
            const matchesDate = dateFilter === '' || order.orderDate === dateFilter;
            
            return matchesSearch && matchesStatus && matchesDate;
        });
    },
    
    applyFilters: function() {
        this.currentPage = 1; // Reset to first page when filters change
        this.renderOrders();
    },
    
    goToPage: function(pageNum) {
        this.currentPage = pageNum;
        this.renderOrders();
        // Scroll to top of table
        document.querySelector('.table-responsive').scrollIntoView({ behavior: 'smooth' });
    },
    
    openOrderDetail: function(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        
        if (!order) {
            Utils.showToast('error', 'Không tìm thấy thông tin đơn hàng');
            return;
        }
        
        // Fill the modal with order details
        document.getElementById('orderIdDetail').textContent = order.id;
        document.getElementById('customerName').textContent = order.customerName;
        document.getElementById('customerEmail').textContent = order.email;
        document.getElementById('customerPhone').textContent = order.phone;
        document.getElementById('orderDate').textContent = this.formatDate(order.orderDate);
        
        const statusText = this.getStatusText(order.status);
        const statusClass = this.getStatusClass(order.status);
        document.getElementById('orderStatus').innerHTML = `<span class="badge ${statusClass}">${statusText}</span>`;
        
        document.getElementById('paymentMethod').textContent = order.paymentMethod;
        document.getElementById('shippingAddress').textContent = order.shippingAddress;
        
        // Order items
        const orderItems = document.getElementById('orderItems');
        orderItems.innerHTML = '';
        
        let subtotal = 0;
        order.items.forEach(item => {
            subtotal += item.total;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${this.formatCurrency(item.price)}</td>
                <td>${item.quantity}</td>
                <td class="text-end">${this.formatCurrency(item.total)}</td>
            `;
            orderItems.appendChild(row);
        });
        
        document.getElementById('subtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('shippingFee').textContent = this.formatCurrency(order.shippingFee);
        document.getElementById('totalAmount').textContent = this.formatCurrency(order.total);
        
        document.getElementById('orderNotes').textContent = order.notes || "Không có ghi chú";
        
        // Set current status in the dropdown
        document.getElementById('updateStatus').value = order.status;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        modal.show();
    },
    
    updateOrderStatus: function() {
        const orderId = document.getElementById('orderIdDetail').textContent;
        const newStatus = document.getElementById('updateStatus').value;
        
        // Find the order and update its status
        const orderIndex = this.orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            Utils.showToast('error', 'Không tìm thấy đơn hàng');
            return;
        }
        
        // In a real application, this would be an API call
        // For demonstration, we just update the local data
        this.orders[orderIndex].status = newStatus;
        
        // Update the status display in the modal
        const statusText = this.getStatusText(newStatus);
        const statusClass = this.getStatusClass(newStatus);
        document.getElementById('orderStatus').innerHTML = `<span class="badge ${statusClass}">${statusText}</span>`;
        
        // Reload the orders list to reflect the change
        this.renderOrders();
        
        // Show success message
        Utils.showToast('success', 'Đã cập nhật trạng thái đơn hàng');
    },
    
    printOrder: function() {
        const orderId = document.getElementById('orderIdDetail').textContent;
        
        // In a real application, this would create a printable view
        // For demonstration, we just show an alert
        Utils.showToast('info', 'Đang chuẩn bị in đơn hàng...');
        
        // Simulate printing delay
        setTimeout(() => {
            window.print();
        }, 500);
    },
    
    // Helper functions
    getStatusClass: function(status) {
        switch (status) {
            case 'pending': return 'bg-warning text-dark';
            case 'processing': return 'bg-info text-dark';
            case 'shipped': return 'bg-primary';
            case 'delivered': return 'bg-success';
            case 'cancelled': return 'bg-danger';
            default: return 'bg-secondary';
        }
    },
    
    getStatusText: function(status) {
        switch (status) {
            case 'pending': return 'Chờ xác nhận';
            case 'processing': return 'Đang xử lý';
            case 'shipped': return 'Đang giao hàng';
            case 'delivered': return 'Đã giao hàng';
            case 'cancelled': return 'Đã hủy';
            default: return 'Không xác định';
        }
    },
    
    formatDate: function(dateString) {
        const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    },
    
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
            .replace(/\s+₫/, ' ₫')
            .replace('₫', 'đ');
    }
};

// Initialize on DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    OrdersManager.init();
}); 