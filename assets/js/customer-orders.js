/**
 * Customer Orders Module
 * Handles displaying and managing customer order history
 */

const CustomerOrdersManager = {
    orders: [],
    filteredOrders: [],
    
    init: function() {
        // Redirect if not logged in
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html?redirect=orders';
            return;
        }
        
        this.setupEventListeners();
        this.loadOrders();
        
        // Update cart count indicator
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            cartCount.textContent = cart.length;
        }
    },
    
    setupEventListeners: function() {
        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
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
        
        // Print order
        document.getElementById('printOrderBtn').addEventListener('click', () => {
            this.printOrder();
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
        
        // Order actions delegation
        document.addEventListener('click', (e) => {
            // View order detail
            if (e.target.closest('.view-order-btn')) {
                const orderId = e.target.closest('.view-order-btn').getAttribute('data-id');
                this.showOrderDetail(orderId);
            }
            
            // Cancel order
            if (e.target.closest('.cancel-order-btn')) {
                const orderId = e.target.closest('.cancel-order-btn').getAttribute('data-id');
                this.confirmCancelOrder(orderId);
            }
            
            // Repurchase order
            if (e.target.closest('.repurchase-btn')) {
                const orderId = e.target.closest('.repurchase-btn').getAttribute('data-id');
                this.repurchaseOrder(orderId);
            }
        });
    },
    
    loadOrders: function() {
        // In a real application, this would be an API call
        // For demonstration, we'll use localStorage
        setTimeout(() => {
            try {
                // Get orders from storage
                const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                
                // Get only the current user's orders
                const currentUser = Auth.getCurrentUser();
                
                // If the current user has orders ids stored, filter orders by these ids
                if (currentUser && currentUser.orders && currentUser.orders.length > 0) {
                    this.orders = allOrders.filter(order => 
                        currentUser.orders.includes(order.id) || 
                        order.email === currentUser.email
                    );
                } else {
                    // Otherwise filter by email
                    this.orders = allOrders.filter(order => 
                        order.email === (currentUser ? currentUser.email : '')
                    );
                }
                
                // Sort orders by date (newest first)
                this.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
                
                // Update UI
                this.filteredOrders = this.orders;
                this.renderOrders();
                
            } catch (error) {
                console.error('Error loading orders:', error);
                Utils.showToast('Không thể tải dữ liệu đơn hàng', 'error');
                
                // Show empty message
                document.getElementById('ordersList').innerHTML = '';
                document.getElementById('noOrdersMessage').classList.remove('d-none');
            }
        }, 800);
    },
    
    renderOrders: function() {
        const ordersList = document.getElementById('ordersList');
        
        if (this.filteredOrders.length === 0) {
            document.getElementById('noOrdersMessage').classList.remove('d-none');
            ordersList.innerHTML = '';
            return;
        }
        
        document.getElementById('noOrdersMessage').classList.add('d-none');
        
        let html = '';
        
        this.filteredOrders.forEach(order => {
            // Get item preview text
            let itemsPreview = '';
            if (order.items && order.items.length > 0) {
                const itemNames = order.items.map(item => item.name);
                const firstItem = itemNames[0];
                if (itemNames.length > 1) {
                    itemsPreview = `${firstItem} và ${itemNames.length - 1} sản phẩm khác`;
                } else {
                    itemsPreview = firstItem;
                }
            }
            
            // Format date
            const orderDate = new Date(order.orderDate);
            const formattedDate = orderDate.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Get appropriate status class and text
            const statusInfo = this.getStatusInfo(order.status);
            
            html += `
                <tr>
                    <td>${order.id}</td>
                    <td>${formattedDate}</td>
                    <td class="text-truncate" style="max-width: 200px;">${itemsPreview}</td>
                    <td>${this.formatCurrency(order.total)}</td>
                    <td><span class="badge ${statusInfo.class}">${statusInfo.text}</span></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary view-order-btn" data-id="${order.id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${this.canCancel(order.status) ? 
                                `<button class="btn btn-sm btn-outline-danger cancel-order-btn" data-id="${order.id}">
                                    <i class="bi bi-x-circle"></i>
                                </button>` : ''
                            }
                        </div>
                    </td>
                </tr>
            `;
        });
        
        ordersList.innerHTML = html;
    },
    
    filterOrders: function() {
        const searchTerm = document.getElementById('searchOrder').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        
        this.filteredOrders = this.orders.filter(order => {
            const matchesSearch = !searchTerm || 
                order.id.toLowerCase().includes(searchTerm) || 
                (order.items && order.items.some(item => item.name.toLowerCase().includes(searchTerm)));
            
            const matchesStatus = !statusFilter || order.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
        
        this.renderOrders();
    },
    
    showOrderDetail: function(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        
        if (!order) {
            Utils.showToast('Không tìm thấy thông tin đơn hàng', 'error');
            return;
        }
        
        // Basic information
        document.getElementById('orderIdDetail').textContent = order.id;
        document.querySelector('.order-ref').textContent = order.id;
        
        const orderDate = new Date(order.orderDate);
        document.getElementById('orderDate').textContent = orderDate.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Status
        const statusInfo = this.getStatusInfo(order.status);
        document.getElementById('orderStatus').innerHTML = `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
        
        // Payment method
        let paymentMethodText = '';
        switch (order.paymentMethod) {
            case 'COD':
                paymentMethodText = 'Thanh toán khi nhận hàng (COD)';
                break;
            case 'BankTransfer':
                paymentMethodText = 'Chuyển khoản ngân hàng';
                break;
            case 'Momo':
                paymentMethodText = 'Ví MoMo';
                break;
            default:
                paymentMethodText = order.paymentMethod;
        }
        document.getElementById('paymentMethod').textContent = paymentMethodText;
        
        // Show bank info for bank transfers
        if (order.paymentMethod === 'BankTransfer') {
            document.getElementById('bankInfo').classList.remove('d-none');
        } else {
            document.getElementById('bankInfo').classList.add('d-none');
        }
        
        // Shipping info
        document.getElementById('shippingName').textContent = order.customerName;
        document.getElementById('shippingPhone').textContent = order.phone;
        document.getElementById('shippingEmail').textContent = order.email;
        document.getElementById('shippingAddress').textContent = order.shippingAddress;
        
        // Notes
        if (order.notes) {
            document.getElementById('orderNotes').textContent = order.notes;
        } else {
            document.getElementById('orderNotes').textContent = 'Không có ghi chú';
        }
        
        // Order items
        const orderItems = document.getElementById('orderItems');
        orderItems.innerHTML = '';
        
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td class="text-center">${this.formatCurrency(item.price)}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-end">${this.formatCurrency(item.total)}</td>
                `;
                orderItems.appendChild(row);
            });
        }
        
        // Order summary
        document.getElementById('subtotal').textContent = this.formatCurrency(order.subtotal);
        document.getElementById('shippingFee').textContent = this.formatCurrency(order.shippingFee);
        
        // Discount if any
        if (order.discount && order.discount > 0) {
            document.getElementById('discountRow').classList.remove('d-none');
            document.getElementById('discount').textContent = this.formatCurrency(order.discount);
        } else {
            document.getElementById('discountRow').classList.add('d-none');
        }
        
        document.getElementById('totalAmount').textContent = this.formatCurrency(order.total);
        
        // Order actions
        const actionsContainer = document.getElementById('orderActions');
        actionsContainer.innerHTML = '';
        
        if (this.canCancel(order.status)) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-danger cancel-order-btn';
            cancelBtn.setAttribute('data-id', order.id);
            cancelBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>Hủy đơn hàng';
            actionsContainer.appendChild(cancelBtn);
        }
        
        if (order.status === 'delivered' || order.status === 'cancelled') {
            const repurchaseBtn = document.createElement('button');
            repurchaseBtn.className = 'btn btn-primary repurchase-btn ms-2';
            repurchaseBtn.setAttribute('data-id', order.id);
            repurchaseBtn.innerHTML = '<i class="bi bi-arrow-repeat me-2"></i>Mua lại';
            actionsContainer.appendChild(repurchaseBtn);
        }
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        modal.show();
    },
    
    confirmCancelOrder: function(orderId) {
        if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
            this.cancelOrder(orderId);
        }
    },
    
    cancelOrder: function(orderId) {
        // In a real application, this would be an API call
        // For demonstration, we just update the local data
        const orderIndex = this.orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            Utils.showToast('Không tìm thấy đơn hàng', 'error');
            return;
        }
        
        // Update order status
        this.orders[orderIndex].status = 'cancelled';
        
        // Save updated orders back to storage
        this.saveOrders();
        
        // Close modal if open
        const orderModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
        if (orderModal) {
            orderModal.hide();
        }
        
        // Refresh the orders list
        this.renderOrders();
        
        Utils.showToast('Đơn hàng đã được hủy thành công', 'success');
    },
    
    repurchaseOrder: function(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        
        if (!order || !order.items || order.items.length === 0) {
            Utils.showToast('Không thể tạo lại đơn hàng', 'error');
            return;
        }
        
        try {
            // Get current cart
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            
            // Add items from the order to the cart
            order.items.forEach(item => {
                // Check if the item is already in the cart
                const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
                
                if (existingItemIndex !== -1) {
                    // If it is, update the quantity
                    cart[existingItemIndex].quantity += item.quantity;
                } else {
                    // If not, add it to the cart
                    cart.push({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image || 'assets/img/product-placeholder.jpg'
                    });
                }
            });
            
            // Save updated cart
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update cart count
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = cart.length.toString();
            }
            
            // Close modal if open
            const orderModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
            if (orderModal) {
                orderModal.hide();
            }
            
            Utils.showToast('Đã thêm các sản phẩm vào giỏ hàng', 'success');
            
            // Navigate to cart
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1000);
            
        } catch (error) {
            console.error('Error repurchasing order:', error);
            Utils.showToast('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng', 'error');
        }
    },
    
    printOrder: function() {
        window.print();
    },
    
    saveOrders: function() {
        // Get all orders
        let allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Find and update the specific orders
        this.orders.forEach(updatedOrder => {
            const index = allOrders.findIndex(o => o.id === updatedOrder.id);
            if (index !== -1) {
                allOrders[index] = updatedOrder;
            }
        });
        
        // Save back to storage
        localStorage.setItem('orders', JSON.stringify(allOrders));
    },
    
    canCancel: function(status) {
        // Orders can only be cancelled if they are pending or processing
        return status === 'pending' || status === 'pending_payment' || status === 'processing';
    },
    
    getStatusInfo: function(status) {
        switch (status) {
            case 'pending':
                return { class: 'bg-warning text-dark', text: 'Chờ xác nhận' };
            case 'pending_payment':
                return { class: 'bg-info text-dark', text: 'Chờ thanh toán' };
            case 'processing':
                return { class: 'bg-info text-dark', text: 'Đang xử lý' };
            case 'shipped':
                return { class: 'bg-primary', text: 'Đang giao hàng' };
            case 'delivered':
                return { class: 'bg-success', text: 'Đã giao hàng' };
            case 'cancelled':
                return { class: 'bg-danger', text: 'Đã hủy' };
            default:
                return { class: 'bg-secondary', text: 'Không xác định' };
        }
    },
    
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
            .replace(/\s+₫/, ' ₫')
            .replace('₫', 'đ');
    }
};

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    CustomerOrdersManager.init();
}); 