/**
 * Checkout Module
 * Handles the checkout process including order summary, form validation, and order placement
 */

const CheckoutManager = {
    cart: [],
    subtotal: 0,
    shippingFee: 30000,
    discountAmount: 0,
    total: 0,
    appliedCoupon: null,
    
    init: function() {
        // Check if user is logged in
        if (!Auth.isLoggedIn()) {
            window.location.href = 'login.html?redirect=checkout';
            return;
        }
        
        // Check if cart is empty
        this.loadCart();
        if (this.cart.length === 0) {
            window.location.href = 'cart.html';
            return;
        }
        
        this.loadUserData();
        this.setupEventListeners();
        this.renderOrderItems();
        this.updateOrderSummary();
        this.setupLocationSelects();
        
        // Generate temporary order reference
        document.getElementById('orderReference').textContent = 'TMP' + Date.now().toString().slice(-6);
    },
    
    loadCart: function() {
        this.cart = CartManager.getCart();
        this.subtotal = CartManager.calculateTotal();
        this.total = this.subtotal + this.shippingFee - this.discountAmount;
    },
    
    loadUserData: function() {
        const userData = Auth.getCurrentUser();
        if (userData) {
            document.getElementById('fullName').value = userData.fullName || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('phone').value = userData.phone || '';
            
            // Fill address fields if available
            if (userData.address) {
                document.getElementById('address').value = userData.address.street || '';
                // We would also set province, district, ward if they were in the same format
            }
        }
    },
    
    setupEventListeners: function() {
        // Handle payment method change
        const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleBankInfo();
            });
        });
        
        // Coupon application
        document.getElementById('applyCouponBtn').addEventListener('click', () => {
            this.applyCoupon();
        });
        
        // Checkout form submission
        document.getElementById('checkoutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.placeOrder();
        });
        
        // Handle logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    },
    
    setupLocationSelects: function() {
        // In a real application, these would be populated with API data
        
        // Sample data for demonstration
        const hcmDistricts = [
            {id: 'Q1', name: 'Quận 1'},
            {id: 'Q3', name: 'Quận 3'},
            {id: 'Q5', name: 'Quận 5'},
            {id: 'TB', name: 'Quận Tân Bình'}
        ];
        
        const hnDistricts = [
            {id: 'HK', name: 'Quận Hoàn Kiếm'},
            {id: 'BTL', name: 'Quận Ba Đình'},
            {id: 'CG', name: 'Quận Cầu Giấy'}
        ];
        
        const q1Wards = [
            {id: 'BN', name: 'Phường Bến Nghé'},
            {id: 'BT', name: 'Phường Bến Thành'}
        ];
        
        // Handle province change
        document.getElementById('province').addEventListener('change', (e) => {
            const provinceValue = e.target.value;
            const districtSelect = document.getElementById('district');
            
            // Clear district and ward selects
            districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
            document.getElementById('ward').innerHTML = '<option value="">Chọn phường/xã</option>';
            
            // Populate districts based on province
            if (provinceValue === 'HCM') {
                hcmDistricts.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.id;
                    option.textContent = district.name;
                    districtSelect.appendChild(option);
                });
            } else if (provinceValue === 'HN') {
                hnDistricts.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.id;
                    option.textContent = district.name;
                    districtSelect.appendChild(option);
                });
            }
        });
        
        // Handle district change
        document.getElementById('district').addEventListener('change', (e) => {
            const districtValue = e.target.value;
            const wardSelect = document.getElementById('ward');
            
            // Clear ward select
            wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';
            
            // Populate wards based on district
            // For simplicity, only implementing for one district
            if (districtValue === 'Q1') {
                q1Wards.forEach(ward => {
                    const option = document.createElement('option');
                    option.value = ward.id;
                    option.textContent = ward.name;
                    wardSelect.appendChild(option);
                });
            }
        });
    },
    
    renderOrderItems: function() {
        const container = document.querySelector('.order-items-container');
        container.innerHTML = '';
        
        if (this.cart.length === 0) {
            container.innerHTML = '<p class="text-center">Không có sản phẩm nào trong giỏ hàng</p>';
            return;
        }
        
        this.cart.forEach(item => {
            const itemRow = document.createElement('div');
            itemRow.className = 'order-item d-flex justify-content-between align-items-center mb-3';
            
            itemRow.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="${item.name}" width="50" height="50" class="me-3 rounded">
                    <div>
                        <div class="fw-medium">${item.name}</div>
                        <small class="text-muted">${item.quantity} × ${this.formatCurrency(item.price)}</small>
                    </div>
                </div>
                <div class="fw-medium">${this.formatCurrency(item.price * item.quantity)}</div>
            `;
            
            container.appendChild(itemRow);
        });
    },
    
    updateOrderSummary: function() {
        // Update price displays
        document.querySelector('.subtotal').textContent = this.formatCurrency(this.subtotal);
        document.querySelector('.shipping-fee').textContent = this.formatCurrency(this.shippingFee);
        document.querySelector('.discount-amount').textContent = this.formatCurrency(this.discountAmount);
        document.querySelector('.total-amount').textContent = this.formatCurrency(this.total);
    },
    
    toggleBankInfo: function() {
        const bankInfoDiv = document.getElementById('bankInfo');
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        if (paymentMethod === 'BankTransfer') {
            bankInfoDiv.classList.remove('d-none');
        } else {
            bankInfoDiv.classList.add('d-none');
        }
    },
    
    applyCoupon: function() {
        const couponInput = document.getElementById('couponCode');
        const couponCode = couponInput.value.trim();
        
        if (!couponCode) {
            Utils.showToast('Vui lòng nhập mã giảm giá', 'warning');
            return;
        }
        
        // In a real application, this would be validated against an API
        // For demonstration, we'll use some sample coupon codes
        const availableCoupons = {
            'WELCOME10': { type: 'percent', value: 10 },
            'SALE20': { type: 'percent', value: 20 },
            'FREESHIP': { type: 'fixed', value: this.shippingFee }
        };
        
        const coupon = availableCoupons[couponCode];
        
        if (!coupon) {
            Utils.showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'error');
            return;
        }
        
        // Calculate discount
        let discountValue = 0;
        if (coupon.type === 'percent') {
            discountValue = (this.subtotal * coupon.value) / 100;
        } else if (coupon.type === 'fixed') {
            discountValue = coupon.value;
        }
        
        // Apply discount
        this.discountAmount = discountValue;
        this.appliedCoupon = couponCode;
        this.total = this.subtotal + this.shippingFee - this.discountAmount;
        
        // Update UI
        document.querySelector('.discount-amount').textContent = this.formatCurrency(this.discountAmount);
        document.querySelector('.total-amount').textContent = this.formatCurrency(this.total);
        document.querySelector('.coupon-applied').classList.remove('d-none');
        
        Utils.showToast('Mã giảm giá đã được áp dụng', 'success');
    },
    
    validateForm: function() {
        const form = document.getElementById('checkoutForm');
        
        if (!form.checkValidity()) {
            // Trigger browser's native validation UI
            form.reportValidity();
            return false;
        }
        
        // Additional validation can be added here if needed
        
        return true;
    },
    
    placeOrder: function() {
        if (!this.validateForm()) {
            return;
        }
        
        // Collect order data
        const orderData = this.collectOrderData();
        
        // Show loading state
        const orderBtn = document.getElementById('placeOrderBtn');
        const originalText = orderBtn.textContent;
        orderBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';
        orderBtn.disabled = true;
        
        // In a real application, this would be an API call
        // For demonstration, we'll simulate the server response
        setTimeout(() => {
            try {
                // Save order to storage (in a real app, this would be sent to backend)
                this.saveOrder(orderData);
                
                // Clear cart
                CartManager.clearCart();
                
                // Set info in success modal
                document.getElementById('successOrderId').textContent = orderData.id;
                
                // Show bank payment info if needed
                if (orderData.paymentMethod === 'BankTransfer') {
                    document.querySelector('.bank-payment-info').classList.remove('d-none');
                } else {
                    document.querySelector('.bank-payment-info').classList.add('d-none');
                }
                
                // Show success modal
                const successModal = new bootstrap.Modal(document.getElementById('checkoutSuccessModal'));
                successModal.show();
            } catch (error) {
                console.error('Error placing order:', error);
                Utils.showToast('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.', 'error');
                
                // Reset button state
                orderBtn.textContent = originalText;
                orderBtn.disabled = false;
            }
        }, 1500);
    },
    
    collectOrderData: function() {
        // Generate a random order ID
        const orderId = 'ORD' + Date.now().toString().slice(-6);
        
        // Get form data
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const province = document.getElementById('province');
        const district = document.getElementById('district');
        const ward = document.getElementById('ward');
        
        const provinceName = province.options[province.selectedIndex].text;
        const districtName = district.options[district.selectedIndex].text;
        const wardName = ward.options[ward.selectedIndex].text;
        
        const fullAddress = `${address}, ${wardName}, ${districtName}, ${provinceName}`;
        
        const notes = document.getElementById('notes').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // Create order object
        return {
            id: orderId,
            customerName: fullName,
            email: email,
            phone: phone,
            shippingAddress: fullAddress,
            orderDate: new Date().toISOString(),
            items: this.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            subtotal: this.subtotal,
            shippingFee: this.shippingFee,
            discount: this.discountAmount,
            total: this.total,
            couponCode: this.appliedCoupon,
            paymentMethod: paymentMethod,
            notes: notes,
            status: paymentMethod === 'BankTransfer' ? 'pending_payment' : 'pending'
        };
    },
    
    saveOrder: function(orderData) {
        // In a real application, this would send data to a server
        // For demonstration, we'll store it in localStorage
        
        // Get existing orders or initialize empty array
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Add new order
        orders.push(orderData);
        
        // Save updated orders
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Also save to user's orders
        const userData = Auth.getCurrentUser();
        if (userData) {
            if (!userData.orders) {
                userData.orders = [];
            }
            userData.orders.push(orderData.id);
            Auth.updateUserData(userData);
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
    CheckoutManager.init();
}); 