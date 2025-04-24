/**
 * Order Confirmation Module
 * Handles displaying and managing order details on the confirmation page
 */
const OrderConfirmation = {
    /**
     * Initialize the order confirmation page
     */
    init: function() {
        // Load common components (header, footer)
        Common.init();
        
        // Check if user is authenticated
        if (!Auth.isLoggedIn()) {
            window.location.href = '../../index.html';
            return;
        }
        
        // Setup page
        this.loadOrderDetails();
        this.setupEventListeners();
    },
    
    /**
     * Setup event listeners for the page
     */
    setupEventListeners: function() {
        // Print order button
        document.getElementById('print-order-btn')?.addEventListener('click', function() {
            window.print();
        });
    },
    
    /**
     * Load order details from localStorage
     */
    loadOrderDetails: function() {
        // Retrieve the last order from localStorage
        const lastOrder = this.getLastOrder();
        
        if (!lastOrder) {
            // No order found, redirect to home
            window.location.href = '../../index.html';
            return;
        }
        
        // Display order information
        this.displayOrderInfo(lastOrder);
        this.displayCustomerInfo(lastOrder);
        this.displayOrderItems(lastOrder);
        this.displayPaymentInfo(lastOrder);
    },
    
    /**
     * Get the most recent order from localStorage
     * @returns {Object|null} The last order or null if none found
     */
    getLastOrder: function() {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        return orders.length > 0 ? orders[orders.length - 1] : null;
    },
    
    /**
     * Display order information
     * @param {Object} order - The order object
     */
    displayOrderInfo: function(order) {
        document.getElementById('orderReference').textContent = order.orderNumber;
        document.getElementById('orderDate').textContent = this.formatDate(order.orderDate);
        
        // Generate transfer content for bank transfers
        document.getElementById('transferContent').textContent = `FreshFood-${order.orderNumber}`;
    },
    
    /**
     * Display customer information
     * @param {Object} order - The order object
     */
    displayCustomerInfo: function(order) {
        document.getElementById('customerName').textContent = order.customer.fullName;
        document.getElementById('customerEmail').textContent = order.customer.email;
        document.getElementById('customerPhone').textContent = order.customer.phone;
        
        // Format the address
        const address = [
            order.customer.address,
            order.customer.ward,
            order.customer.district,
            order.customer.province
        ].filter(Boolean).join(', ');
        
        document.getElementById('shippingAddress').textContent = address;
    },
    
    /**
     * Display order items
     * @param {Object} order - The order object
     */
    displayOrderItems: function(order) {
        const orderItemsList = document.getElementById('orderItemsList');
        orderItemsList.innerHTML = '';
        
        // Add each item to the list
        order.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.image}" alt="${item.name}" class="img-thumbnail me-2" style="width: 50px; height: 50px; object-fit: cover;">
                        <div>
                            <h6 class="mb-0">${item.name}</h6>
                            <small class="text-muted">${item.code || ''}</small>
                        </div>
                    </div>
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-end">${this.formatCurrency(item.price)}</td>
                <td class="text-end">${this.formatCurrency(item.price * item.quantity)}</td>
            `;
            orderItemsList.appendChild(row);
        });
        
        // Update order summary
        document.getElementById('subtotal').textContent = this.formatCurrency(order.subtotal);
        document.getElementById('shipping').textContent = this.formatCurrency(order.shipping);
        
        // Display discount if applicable
        if (order.discount > 0) {
            document.getElementById('discount-row').classList.remove('d-none');
            document.getElementById('discount').textContent = `-${this.formatCurrency(order.discount)}`;
        }
        
        document.getElementById('total').textContent = this.formatCurrency(order.total);
    },
    
    /**
     * Display payment information
     * @param {Object} order - The order object
     */
    displayPaymentInfo: function(order) {
        const paymentMethod = document.getElementById('paymentMethod');
        const paymentStatus = document.getElementById('paymentStatus');
        const bankInfoContainer = document.querySelector('.bank-info-container');
        
        // Set payment method text
        if (order.paymentMethod === 'bank_transfer') {
            paymentMethod.textContent = 'Chuyển khoản ngân hàng';
            bankInfoContainer.classList.remove('d-none');
        } else if (order.paymentMethod === 'cod') {
            paymentMethod.textContent = 'Thanh toán khi nhận hàng (COD)';
            paymentStatus.textContent = 'Chưa thanh toán';
            paymentStatus.className = 'badge bg-warning';
        }
    },
    
    /**
     * Format date to local date string
     * @param {string|number} dateString - Date string or timestamp
     * @returns {string} Formatted date
     */
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * Format currency to VND
     * @param {number} amount - Amount to format
     * @returns {string} Formatted amount
     */
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    OrderConfirmation.init();
}); 