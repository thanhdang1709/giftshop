/**
 * Admin Orders Management Module
 * Handles displaying, filtering, and managing orders in the admin panel
 */

const OrdersManager = {
    init: function() {
        this.loadOrders();
        this.setupEventListeners();
    },

    setupEventListeners: function() {
        // Search functionality
        document.getElementById('searchButton').addEventListener('click', () => {
            this.filterOrders();
        });
        
        document.getElementById('searchOrder').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.filterOrders();
            }
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterOrders();
        });

        // Date filter
        document.getElementById('dateFilter').addEventListener('change', () => {
            this.filterOrders();
        });

        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('searchOrder').value = '';
            document.getElementById('statusFilter').value = 'all';
            document.getElementById('dateFilter').value = '';
            this.loadOrders();
        });

        // Update order status
        document.getElementById('updateStatusBtn').addEventListener('click', () => {
            this.updateOrderStatus();
        });

        // Print order
        document.getElementById('printOrderBtn').addEventListener('click', () => {
            this.printOrder();
        });
    },

    loadOrders: function() {
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '<tr><td colspan="6" class="text-center py-4">Đang tải đơn hàng...</td></tr>';

        // Get orders from localStorage instead of demo data
        const orders = this.getOrdersFromStorage();

        if (orders.length === 0) {
            ordersList.innerHTML = '<tr><td colspan="6" class="text-center py-4">Không có đơn hàng nào</td></tr>';
            document.getElementById('orderCount').textContent = '0';
            return;
        }

        let html = '';
        orders.forEach(order => {
            // Format the date for display
            const orderDate = order.date || order.orderDate;
            let formattedDate = "Invalid Date";
            
            if (orderDate) {
                const date = new Date(orderDate);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('vi-VN');
                }
            }

            // Get customer name safely
            const customerName = order.customer ? 
                (order.customer.name || order.customer.fullName || 'Không xác định') : 
                'Không xác định';

            // Create status badge based on order status
            let statusBadge = '';
            switch (order.status) {
                case 'pending':
                    statusBadge = '<span class="badge bg-warning">Chờ xác nhận</span>';
                    break;
                case 'processing':
                    statusBadge = '<span class="badge bg-info">Đang xử lý</span>';
                    break;
                case 'shipped':
                    statusBadge = '<span class="badge bg-primary">Đang giao hàng</span>';
                    break;
                case 'delivered':
                    statusBadge = '<span class="badge bg-success">Đã giao hàng</span>';
                    break;
                case 'cancelled':
                    statusBadge = '<span class="badge bg-danger">Đã hủy</span>';
                    break;
                default:
                    statusBadge = '<span class="badge bg-secondary">Không xác định</span>';
            }

            html += `
                <tr>
                    <td>${order.id || order.orderNumber || ''}</td>
                    <td>${customerName}</td>
                    <td>${formattedDate}</td>
                    <td>${this.formatCurrency(order.total)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="OrdersManager.viewOrderDetails('${order.id || order.orderNumber || ''}')">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        ordersList.innerHTML = html;
        document.getElementById('orderCount').textContent = orders.length;
    },

    getOrdersFromStorage: function() {
        // Get orders from localStorage
        const orders = localStorage.getItem('orders');
        let ordersList = orders ? JSON.parse(orders) : [];
        
        // Remove duplicate orders by checking for unique orderNumber or id
        const uniqueOrderMap = new Map();
        
        ordersList.forEach(order => {
            const orderId = order.id || order.orderNumber;
            if (orderId && !uniqueOrderMap.has(orderId)) {
                uniqueOrderMap.set(orderId, order);
            }
        });
        
        // Convert back to array
        return Array.from(uniqueOrderMap.values());
    },

    filterOrders: function() {
        const searchTerm = document.getElementById('searchOrder').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        let orders = this.getOrdersFromStorage();
        
        // Apply filters
        if (searchTerm) {
            orders = orders.filter(order => 
                order.id.toLowerCase().includes(searchTerm) || 
                order.customer.name.toLowerCase().includes(searchTerm) ||
                order.customer.email.toLowerCase().includes(searchTerm) ||
                order.customer.phone.toLowerCase().includes(searchTerm)
            );
        }
        
        if (statusFilter && statusFilter !== 'all') {
            orders = orders.filter(order => order.status === statusFilter);
        }
        
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            orders = orders.filter(order => {
                const orderDate = new Date(order.date);
                return orderDate.toDateString() === filterDate.toDateString();
            });
        }
        
        // Render filtered orders
        const ordersList = document.getElementById('ordersList');
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<tr><td colspan="6" class="text-center py-4">Không tìm thấy đơn hàng nào</td></tr>';
            document.getElementById('orderCount').textContent = '0';
            return;
        }
        
        let html = '';
        orders.forEach(order => {
            const orderDate = new Date(order.date);
            const formattedDate = orderDate.toLocaleDateString('vi-VN');
            
            let statusBadge = '';
            switch (order.status) {
                case 'pending':
                    statusBadge = '<span class="badge bg-warning">Chờ xác nhận</span>';
                    break;
                case 'processing':
                    statusBadge = '<span class="badge bg-info">Đang xử lý</span>';
                    break;
                case 'shipped':
                    statusBadge = '<span class="badge bg-primary">Đang giao hàng</span>';
                    break;
                case 'delivered':
                    statusBadge = '<span class="badge bg-success">Đã giao hàng</span>';
                    break;
                case 'cancelled':
                    statusBadge = '<span class="badge bg-danger">Đã hủy</span>';
                    break;
                default:
                    statusBadge = '<span class="badge bg-secondary">Không xác định</span>';
            }
            
            html += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.customer.name}</td>
                    <td>${formattedDate}</td>
                    <td>${this.formatCurrency(order.total)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="OrdersManager.viewOrderDetails('${order.id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        ordersList.innerHTML = html;
        document.getElementById('orderCount').textContent = orders.length;
    },

    viewOrderDetails: function(orderId) {
        const orders = this.getOrdersFromStorage();
        const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
        
        if (!order) {
            alert('Không tìm thấy đơn hàng!');
            return;
        }
        
        // Fill modal with order details
        document.getElementById('orderIdDetail').textContent = order.id || order.orderNumber || '';
        document.getElementById('customerName').textContent = order.customer ? 
            (order.customer.name || order.customer.fullName || 'Không xác định') : 
            'Không xác định';
        document.getElementById('customerEmail').textContent = order.customer ? 
            (order.customer.email || 'Không xác định') : 
            'Không xác định';
        document.getElementById('customerPhone').textContent = order.customer ? 
            (order.customer.phone || 'Không xác định') : 
            'Không xác định';
        
        const orderDate = order.date || order.orderDate;
        let formattedDate = "Không xác định";
        
        if (orderDate) {
            const date = new Date(orderDate);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('vi-VN', { 
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
            }
        }
        document.getElementById('orderDate').textContent = formattedDate;
        
        // Set order status in the modal
        let statusHtml = '';
        switch (order.status) {
            case 'pending':
                statusHtml = '<span class="badge bg-warning">Chờ xác nhận</span>';
                break;
            case 'processing':
                statusHtml = '<span class="badge bg-info">Đang xử lý</span>';
                break;
            case 'shipped':
                statusHtml = '<span class="badge bg-primary">Đang giao hàng</span>';
                break;
            case 'delivered':
                statusHtml = '<span class="badge bg-success">Đã giao hàng</span>';
                break;
            case 'cancelled':
                statusHtml = '<span class="badge bg-danger">Đã hủy</span>';
                break;
            default:
                statusHtml = '<span class="badge bg-secondary">Không xác định</span>';
        }
        document.getElementById('orderStatus').innerHTML = statusHtml;
        
        // Payment method
        document.getElementById('paymentMethod').textContent = order.paymentMethod === 'COD' ? 
            'Thanh toán khi nhận hàng' : 
            (order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 'Ví MoMo');
        
        // Shipping address
        document.getElementById('shippingAddress').textContent = order.customer.address;
        
        // Order items
        const orderItemsContainer = document.getElementById('orderItems');
        let itemsHtml = '';
        
        order.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${item.image || '../../assets/images/placeholder.jpg'}" alt="${item.name}" class="me-2" style="width: 40px; height: 40px; object-fit: cover;">
                            <span>${item.name}</span>
                        </div>
                    </td>
                    <td>${this.formatCurrency(item.price)}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-end">${this.formatCurrency(item.price * item.quantity)}</td>
                </tr>
            `;
        });
        
        orderItemsContainer.innerHTML = itemsHtml;
        
        // Order total
        document.getElementById('subtotal').textContent = this.formatCurrency(order.subtotal);
        document.getElementById('shippingFee').textContent = order.shipping > 0 ? this.formatCurrency(order.shipping) : 'Miễn phí';
        document.getElementById('totalAmount').textContent = this.formatCurrency(order.total);
        
        // Set current status in the dropdown
        document.getElementById('updateStatus').value = order.status;
        
        // Order notes
        document.getElementById('orderNotes').textContent = order.notes || 'Không có ghi chú';
        
        // Show modal
        const orderDetailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        orderDetailModal.show();
    },

    updateOrderStatus: function() {
        const orderId = document.getElementById('orderIdDetail').textContent;
        const newStatus = document.getElementById('updateStatus').value;
        
        // Get orders from localStorage
        const orders = this.getOrdersFromStorage();
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            alert('Không tìm thấy đơn hàng!');
            return;
        }
        
        // Update order status
        orders[orderIndex].status = newStatus;
        
        // Save orders back to localStorage
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Update the status in the modal
        let statusHtml = '';
        switch (newStatus) {
            case 'pending':
                statusHtml = '<span class="badge bg-warning">Chờ xác nhận</span>';
                break;
            case 'processing':
                statusHtml = '<span class="badge bg-info">Đang xử lý</span>';
                break;
            case 'shipped':
                statusHtml = '<span class="badge bg-primary">Đang giao hàng</span>';
                break;
            case 'delivered':
                statusHtml = '<span class="badge bg-success">Đã giao hàng</span>';
                break;
            case 'cancelled':
                statusHtml = '<span class="badge bg-danger">Đã hủy</span>';
                break;
            default:
                statusHtml = '<span class="badge bg-secondary">Không xác định</span>';
        }
        document.getElementById('orderStatus').innerHTML = statusHtml;
        
        // Reload the orders list to reflect the change
        this.loadOrders();
        
        // Show success message
        alert('Cập nhật trạng thái đơn hàng thành công!');
    },

    printOrder: function() {
        const orderId = document.getElementById('orderIdDetail').textContent;
        alert(`Đang chuẩn bị in đơn hàng ${orderId}. Hãy kết nối máy in của bạn.`);
        
        // In actual implementation, you would create a printable version of the order here
        // For demonstration purposes, we'll just show an alert
    },

    formatCurrency: function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(amount)
            .replace(/\s+/g, '')
            .replace('₫', 'đ');
    }
};

// Initialize orders manager when the DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if the current user is an admin
    if (Auth && Auth.isAdmin()) {
        OrdersManager.init();
    } else {
        window.location.href = '../../pages/customer/login.html?redirect=admin';
    }
}); 