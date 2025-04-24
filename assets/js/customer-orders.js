/**
 * Customer Orders Module
 * Handles displaying and managing customer order history
 */

const CustomerOrdersManager = {
    orders: [],
    filteredOrders: [],
    
    init: function() {
        // Load common components
        if (typeof Common !== 'undefined' && Common.init) {
            Common.init();
        }
        
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
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.filterOrders();
        });
        
        document.getElementById('searchOrder')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.filterOrders();
            }
        });
        
        // Status filter
        document.getElementById('statusFilter')?.addEventListener('change', () => {
            this.filterOrders();
        });
        
        // Logout button - handled by Common.init now
        
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
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;
        
        // Show loading
        ordersList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="mt-2">Đang tải đơn hàng...</p>
                </td>
            </tr>
        `;
        
        // Get orders from storage
        setTimeout(() => {
            try {
                // Get all orders
                const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                
                // Get current user
                const currentUser = Auth.getCurrentUser();
                if (!currentUser) {
                    this.showEmptyOrders("Vui lòng đăng nhập để xem đơn hàng");
                    return;
                }
                
                // Filter orders for current user
                this.orders = allOrders.filter(order => {
                    // Match by userId in customer object
                    if (order.customer && order.customer.userId === currentUser.id) {
                        return true;
                    }
                    
                    // Match by email as fallback
                    if (order.customer && order.customer.email === currentUser.email) {
                        return true;
                    }
                    
                    return false;
                });
                
                // Sort orders by date (newest first)
                this.orders.sort((a, b) => {
                    const dateA = new Date(a.date || a.orderDate);
                    const dateB = new Date(b.date || b.orderDate);
                    return dateB - dateA;
                });
                
                // Filter duplicates using Map
                const uniqueOrderMap = new Map();
                this.orders.forEach(order => {
                    const orderId = order.id || order.orderNumber;
                    if (orderId && !uniqueOrderMap.has(orderId)) {
                        uniqueOrderMap.set(orderId, order);
                    }
                });
                
                // Convert back to array
                this.orders = Array.from(uniqueOrderMap.values());
                
                // Update UI
                this.filteredOrders = this.orders;
                this.renderOrders();
                
            } catch (error) {
                console.error('Error loading orders:', error);
                this.showEmptyOrders("Không thể tải dữ liệu đơn hàng");
            }
        }, 800);
    },
    
    renderOrders: function() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;
        
        if (this.filteredOrders.length === 0) {
            this.showEmptyOrders("Bạn chưa có đơn hàng nào");
            return;
        }
        
        let html = '';
        
        this.filteredOrders.forEach(order => {
            // Get order ID
            const orderId = order.id || order.orderNumber || '';
            
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
            const orderDate = new Date(order.date || order.orderDate);
            let formattedDate = "Không xác định";
            
            if (!isNaN(orderDate.getTime())) {
                formattedDate = orderDate.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
            }
            
            // Get appropriate status class and text
            const statusInfo = this.getStatusInfo(order.status);
            
            html += `
                <tr>
                    <td>${orderId}</td>
                    <td>${formattedDate}</td>
                    <td class="text-truncate" style="max-width: 200px;">${itemsPreview}</td>
                    <td>${this.formatCurrency(order.total)}</td>
                    <td><span class="badge ${statusInfo.class}">${statusInfo.text}</span></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary view-order-btn" data-id="${orderId}">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${this.canCancel(order.status) ? 
                                `<button class="btn btn-sm btn-outline-danger cancel-order-btn" data-id="${orderId}">
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
    
    showEmptyOrders: function(message) {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;
        
        ordersList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="empty-orders-icon mb-3">
                        <i class="bi bi-basket text-muted" style="font-size: 3rem;"></i>
                    </div>
                    <p class="mb-1">${message}</p>
                    <a href="../shop/index.html" class="btn btn-primary mt-3">Tiếp tục mua sắm</a>
                </td>
            </tr>
        `;
    },
    
    filterOrders: function() {
        const searchTerm = document.getElementById('searchOrder')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        
        this.filteredOrders = this.orders.filter(order => {
            const orderId = order.id || order.orderNumber || '';
            
            const matchesSearch = !searchTerm || 
                orderId.toLowerCase().includes(searchTerm) || 
                (order.items && order.items.some(item => item.name.toLowerCase().includes(searchTerm)));
            
            const matchesStatus = !statusFilter || order.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
        
        this.renderOrders();
    },
    
    showOrderDetail: function(orderId) {
        const order = this.orders.find(o => (o.id === orderId) || (o.orderNumber === orderId));
        
        if (!order) {
            this.showNotification('Không tìm thấy thông tin đơn hàng', 'error');
            return;
        }
        
        // Get elements in the modal
        const orderIdDetail = document.getElementById('orderIdDetail');
        const orderDate = document.getElementById('orderDate');
        const orderStatus = document.getElementById('orderStatus');
        const shippingAddress = document.getElementById('shippingAddress');
        const paymentMethod = document.getElementById('paymentMethod');
        const orderItems = document.getElementById('orderItems');
        const subtotal = document.getElementById('subtotal');
        const shippingFee = document.getElementById('shippingFee');
        const discount = document.getElementById('discount');
        const totalAmount = document.getElementById('totalAmount');
        const orderNotes = document.getElementById('orderNotes');
        
        // Format date
        const orderDateObj = new Date(order.date || order.orderDate);
        let formattedDate = "Không xác định";
        
        if (!isNaN(orderDateObj.getTime())) {
            formattedDate = orderDateObj.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Fill order details
        if (orderIdDetail) orderIdDetail.textContent = order.id || order.orderNumber || '';
        if (orderDate) orderDate.textContent = formattedDate;
        
        // Set status badge
        if (orderStatus) {
            const statusInfo = this.getStatusInfo(order.status);
            orderStatus.innerHTML = `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
        }
        
        // Set shipping address
        if (shippingAddress && order.customer) {
            shippingAddress.textContent = order.customer.address || 'Không có thông tin';
        }
        
        // Set payment method
        if (paymentMethod) {
            const methodText = this.getPaymentMethodText(order.paymentMethod);
            paymentMethod.textContent = methodText;
        }
        
        // Fill order items
        if (orderItems && order.items && order.items.length > 0) {
            let itemsHtml = '';
            
            order.items.forEach(item => {
                const itemTotal = item.price * item.quantity;
                
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
                        <td class="text-end">${this.formatCurrency(itemTotal)}</td>
                    </tr>
                `;
            });
            
            orderItems.innerHTML = itemsHtml;
        }
        
        // Fill totals
        if (subtotal) subtotal.textContent = this.formatCurrency(order.subtotal || 0);
        if (shippingFee) shippingFee.textContent = this.formatCurrency(order.shipping || 0);
        if (discount) discount.textContent = this.formatCurrency(order.discount || 0);
        if (totalAmount) totalAmount.textContent = this.formatCurrency(order.total || 0);
        
        // Fill notes
        if (orderNotes) orderNotes.textContent = order.notes || 'Không có ghi chú';
        
        // Show/hide cancel button based on order status
        const cancelButtonContainer = document.getElementById('cancelButtonContainer');
        if (cancelButtonContainer) {
            if (this.canCancel(order.status)) {
                cancelButtonContainer.classList.remove('d-none');
                // Add order ID to cancel button
                const cancelBtn = document.getElementById('cancelOrderBtn');
                if (cancelBtn) {
                    cancelBtn.setAttribute('data-id', order.id || order.orderNumber);
                }
            } else {
                cancelButtonContainer.classList.add('d-none');
            }
        }
        
        // Show repurchase button
        const repurchaseBtn = document.getElementById('repurchaseBtn');
        if (repurchaseBtn) {
            repurchaseBtn.setAttribute('data-id', order.id || order.orderNumber);
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        modal.show();
    },
    
    confirmCancelOrder: function(orderId) {
        if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
            this.cancelOrder(orderId);
        }
    },
    
    cancelOrder: function(orderId) {
        // Find order in the orders array
        const orderIndex = this.orders.findIndex(o => (o.id === orderId) || (o.orderNumber === orderId));
        
        if (orderIndex === -1) {
            this.showNotification('Không tìm thấy đơn hàng', 'error');
            return;
        }
        
        // Update order status to cancelled
        this.orders[orderIndex].status = 'cancelled';
        
        // Save changes
        this.saveOrders();
        
        // Update UI
        this.renderOrders();
        
        // Close modal if open
        const orderModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
        if (orderModal) {
            orderModal.hide();
        }
        
        this.showNotification('Đơn hàng đã được hủy thành công', 'success');
    },
    
    repurchaseOrder: function(orderId) {
        const order = this.orders.find(o => (o.id === orderId) || (o.orderNumber === orderId));
        
        if (!order || !order.items || order.items.length === 0) {
            this.showNotification('Không thể thêm sản phẩm vào giỏ hàng', 'error');
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
                        image: item.image || '../../assets/images/placeholder.jpg'
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
            
            this.showNotification('Đã thêm các sản phẩm vào giỏ hàng', 'success');
            
            // Navigate to cart
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1000);
            
        } catch (error) {
            console.error('Error repurchasing order:', error);
            this.showNotification('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng', 'error');
        }
    },
    
    getStatusInfo: function(status) {
        switch (status) {
            case 'pending':
                return { class: 'bg-warning text-dark', text: 'Chờ xác nhận' };
            case 'pending_payment':
                return { class: 'bg-warning text-dark', text: 'Chờ thanh toán' };
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
    
    getPaymentMethodText: function(method) {
        switch (method) {
            case 'COD':
                return 'Thanh toán khi nhận hàng';
            case 'bank_transfer':
                return 'Chuyển khoản ngân hàng';
            case 'momo':
                return 'Ví MoMo';
            default:
                return method || 'Không xác định';
        }
    },
    
    saveOrders: function() {
        // Get all orders
        let allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Find and update the specific orders
        this.orders.forEach(updatedOrder => {
            const orderId = updatedOrder.id || updatedOrder.orderNumber;
            const index = allOrders.findIndex(o => (o.id === orderId) || (o.orderNumber === orderId));
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
    
    formatCurrency: function(amount) {
        // Use Utils if available
        if (typeof Utils !== 'undefined' && Utils.formatCurrency) {
            return Utils.formatCurrency(amount);
        }
        
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount).replace(/\s+/g, '').replace('₫', 'đ');
    },
    
    showNotification: function(message, type) {
        // Use Utils if available
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(message, type);
            return;
        }
        
        // Fallback to alert
        alert(message);
    }
};

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    CustomerOrdersManager.init();
}); 