/**
 * Checkout Module
 * Handles checkout process and order processing
 */
const Checkout = {
    /**
     * Initialize checkout functionality
     */
    init: function() {
        // Kiểm tra xem có đang ở trang checkout không
        // Cách kiểm tra mạnh mẽ hơn, tìm phần tử đặc trưng của trang checkout
        const checkoutForm = document.getElementById('checkout-form');
        if (!checkoutForm) {
            // Không phải trang checkout, không cần chạy
            console.log("Checkout module: Not on checkout page, skipping initialization");
            return;
        }
        
        console.log("Checkout module: Initializing on checkout page");
        
        // Kiểm tra các dependencies
        this.checkDependencies();
        
        // Tải các components chung (header, footer)
        this.loadCommonComponents();
        
        // Kiểm tra đăng nhập
        if (!this.checkLoginStatus()) {
            return; // Đã chuyển hướng đến trang đăng nhập
        }
        
        // Kiểm tra giỏ hàng
        if (!this.checkCartStatus()) {
            return; // Đã chuyển hướng đến trang giỏ hàng nếu trống
        }
        
        // Khởi tạo trang checkout
        this.setupFormValidation();
        this.setupEventListeners();
        this.loadUserInfo();
        this.displayCartSummary();
        
        // Cập nhật mã đơn hàng
        this.updateOrderReference();
    },
    
    /**
     * Kiểm tra tất cả các dependencies cần thiết
     */
    checkDependencies: function() {
        // Kiểm tra Auth
        if (typeof Auth === 'undefined') {
            console.warn("Auth module is missing. Login functionality will be limited.");
            window.Auth = {
                isLoggedIn: function() { return false; },
                getCurrentUser: function() { return null; }
            };
        }
        
        // Kiểm tra Cart
        if (typeof Cart === 'undefined') {
            console.error("Cart module is missing. Checkout cannot proceed.");
            alert("Lỗi: Không thể tải thông tin giỏ hàng. Vui lòng thử lại sau.");
            window.location.href = '../customer/cart.html';
            return false;
        }
        
        // Kiểm tra Utils
        if (typeof Utils === 'undefined') {
            console.warn("Utils module is missing. Using fallback utilities.");
            window.Utils = {
                formatCurrency: function(amount) {
                    return new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(amount).replace('₫', ' ₫');
                },
                showToast: function(message, type) {
                    alert(message);
                }
            };
        }
        
        // Kiểm tra Common
        if (typeof Common === 'undefined') {
            console.warn("Common module is missing. Using fallback.");
            window.Common = {
                init: function() {
                    console.log("Using fallback Common.init()");
                }
            };
        }
        
        return true;
    },
    
    /**
     * Tải các components chung
     */
    loadCommonComponents: function() {
        try {
            // Khởi tạo Common module nếu có
            if (typeof Common !== 'undefined' && Common.init) {
                Common.init();
            }
        } catch (error) {
            console.error("Error initializing Common components:", error);
        }
    },
    
    /**
     * Kiểm tra trạng thái đăng nhập
     * @returns {boolean} - true nếu đã đăng nhập hoặc không cần kiểm tra
     */
    checkLoginStatus: function() {
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn) {
            if (!Auth.isLoggedIn()) {
                console.log("User not logged in. Redirecting to login page.");
                window.location.href = '../customer/login.html?redirect=checkout';
                return false;
            }
        }
        return true;
    },
    
    /**
     * Kiểm tra trạng thái giỏ hàng
     * @returns {boolean} - true nếu giỏ hàng có sản phẩm
     */
    checkCartStatus: function() {
        if (typeof Cart !== 'undefined' && Cart.getCart) {
            const cart = Cart.getCart();
            if (!cart || !cart.items || cart.items.length === 0) {
                console.log("Cart is empty. Redirecting to cart page.");
                if (!sessionStorage.getItem('redirectedFromEmpty')) {
                    sessionStorage.setItem('redirectedFromEmpty', 'true');
                    window.location.href = '../customer/cart.html';
                    return false;
                }
            } else {
                sessionStorage.removeItem('redirectedFromEmpty');
                return true;
            }
        }
        return false;
    },
    
    /**
     * Thiết lập event listeners
     */
    setupEventListeners: function() {
        const checkoutForm = document.getElementById('checkout-form');
        if (!checkoutForm) {
            console.error("Checkout form not found");
            return;
        }
        
        // Form submission
        checkoutForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.processOrder(event);
        });
        
        // Payment method toggle
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        if (paymentMethods.length > 0) {
            paymentMethods.forEach(method => {
                method.addEventListener('change', (event) => {
                    this.togglePaymentMethod(event);
                });
            });
        }
    },
    
    /**
     * Thiết lập validation form
     */
    setupFormValidation: function() {
        // Get form element
        const form = document.getElementById('checkout-form');
        
        if (!form) {
            console.error("Checkout form not found");
            return;
        }
        
        // Add validation class to form
        form.classList.add('needs-validation');
        
        // Custom form validation
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    },
    
    /**
     * Chuyển đổi hiển thị phương thức thanh toán
     * @param {Event} event - Change event
     */
    togglePaymentMethod: function(event) {
        const paymentMethod = event.target.value;
        const bankTransferInfo = document.getElementById('bank-transfer-info');
        
        if (!bankTransferInfo) return;
        
        if (paymentMethod === 'bank_transfer') {
            bankTransferInfo.classList.remove('d-none');
        } else {
            bankTransferInfo.classList.add('d-none');
        }
    },
    
    /**
     * Tải thông tin người dùng từ Auth module
     */
    loadUserInfo: function() {
        if (typeof Auth === 'undefined' || !Auth.getCurrentUser) {
            console.warn("Auth module not available or missing getCurrentUser method");
            return;
        }
        
        const user = Auth.getCurrentUser();
        if (!user) return;
        
        // Pre-fill form with user information
        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const addressInput = document.getElementById('address');
        
        if (fullNameInput) fullNameInput.value = user.fullName || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        if (addressInput && user.address) addressInput.value = user.address || '';
    },
    
    /**
     * Hiển thị tóm tắt giỏ hàng
     */
    displayCartSummary: function() {
        // Kiểm tra Cart module
        if (typeof Cart === 'undefined' || !Cart.getCart) {
            console.error("Cart module not available");
            return;
        }
        
        const cart = Cart.getCart();
        if (!cart || !cart.items || cart.items.length === 0) {
            console.error("Invalid cart data");
            return;
        }
        
        const summaryContainer = document.getElementById('cart-summary');
        const itemsContainer = document.getElementById('cart-items');
        
        // Kiểm tra các phần tử DOM cần thiết
        if (!summaryContainer || !itemsContainer) {
            console.error("Cart summary elements not found in the DOM");
            return;
        }
        
        // Clear previous items
        itemsContainer.innerHTML = '';
        
        // Display each item
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item d-flex justify-content-between mb-2';
            itemElement.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="${item.name}" class="img-thumbnail me-2" style="width: 50px; height: 50px; object-fit: cover;">
                    <div>
                        <span>${item.name}</span>
                        <small class="d-block text-muted">Số lượng: ${item.quantity}</small>
                    </div>
                </div>
                <span class="fw-bold">${this.formatCurrency(item.price * item.quantity)}</span>
            `;
            itemsContainer.appendChild(itemElement);
        });
        
        // Calculate and display totals
        const subtotalEl = document.getElementById('cart-subtotal');
        const shippingEl = document.getElementById('cart-shipping');
        const totalEl = document.getElementById('cart-total');
        const discountEl = document.getElementById('discount-amount');
        
        if (!subtotalEl || !shippingEl || !totalEl) {
            console.error("Price summary elements not found");
            return;
        }
        
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = 30000; // Fixed shipping cost
        const discount = 0; // No discount by default
        const total = subtotal + shipping - discount;
        
        subtotalEl.textContent = this.formatCurrency(subtotal);
        shippingEl.textContent = this.formatCurrency(shipping);
        if (discountEl) discountEl.textContent = this.formatCurrency(discount);
        totalEl.textContent = this.formatCurrency(total);
        
        // Store the calculated values in data attributes for later use
        if (summaryContainer) {
            summaryContainer.dataset.subtotal = subtotal;
            summaryContainer.dataset.shipping = shipping;
            summaryContainer.dataset.discount = discount;
            summaryContainer.dataset.total = total;
        }
    },
    
    /**
     * Xử lý đơn hàng khi submit form
     * @param {Event} event - Submit event
     */
    processOrder: function(event) {
        try {
            const form = event.target;
            
            // Check form validity
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }
            
            // Get form data
            const formData = new FormData(form);
            
            // Get cart
            if (typeof Cart === 'undefined' || !Cart.getCart) {
                this.showNotification("Lỗi: Không thể tải thông tin giỏ hàng", "error");
                return;
            }
            
            const cart = Cart.getCart();
            if (!cart || cart.length === 0) {
                this.showNotification("Giỏ hàng của bạn trống", "warning");
                window.location.href = '../customer/cart.html';
                return;
            }
            
            // Calculate totals
            const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            const shipping = 30000; // Fixed shipping cost
            const discount = 0; // Mặc định không có giảm giá
            const total = subtotal + shipping - discount;
            
            // Get current user if logged in
            const currentUser = typeof Auth !== 'undefined' && Auth.getCurrentUser ? Auth.getCurrentUser() : null;
            const userId = currentUser ? currentUser.id : 'guest';
            
            // Create order object
            const order = {
                orderNumber: this.generateOrderNumber(),
                orderDate: new Date().toISOString(),
                customer: {
                    userId: userId,
                    fullName: formData.get('fullName'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    address: formData.get('address')
                },
                items: cart,
                subtotal: subtotal,
                shipping: shipping,
                discount: discount,
                total: total,
                paymentMethod: formData.get('paymentMethod'),
                notes: formData.get('notes') || '',
                status: 'pending'
            };
            
            // Save order to localStorage
            this.saveOrder(order);
            
            // Show success message
            this.showSuccessModal(order);
            
            // Clear cart
            if (typeof Cart !== 'undefined' && Cart.clearCart) {
                Cart.clearCart();
            } else {
                localStorage.removeItem('cart');
            }
        } catch (error) {
            console.error("Error processing order:", error);
            this.showNotification("Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại.", "error");
        }
    },
    
    /**
     * Hiển thị modal thành công
     * @param {Object} order - Order object
     */
    showSuccessModal: function(order) {
        const successModal = document.getElementById('checkoutSuccessModal');
        const orderIdElement = document.getElementById('successOrderId');
        const bankInfo = document.querySelector('.bank-payment-info');
        
        if (successModal && orderIdElement) {
            orderIdElement.textContent = order.orderNumber;
            
            // Show/hide bank payment info if payment method is bank transfer
            if (bankInfo) {
                if (order.paymentMethod === 'bank_transfer') {
                    bankInfo.classList.remove('d-none');
                } else {
                    bankInfo.classList.add('d-none');
                }
            }
            
            // Show modal
            const bsModal = new bootstrap.Modal(successModal);
            bsModal.show();
            
            // Add event listener to redirect after modal is closed
            successModal.addEventListener('hidden.bs.modal', function() {
                window.location.href = 'order-confirmation.html';
            });
        } else {
            // Fallback if modal elements not found
            this.showNotification("Đặt hàng thành công! Đơn hàng của bạn đã được tiếp nhận.", "success");
            setTimeout(() => {
                window.location.href = 'order-confirmation.html';
            }, 2000);
        }
    },
    
    /**
     * Cập nhật mã tham chiếu đơn hàng
     */
    updateOrderReference: function() {
        const orderRefElement = document.getElementById('orderReference');
        if (orderRefElement) {
            orderRefElement.textContent = this.generateShortReference();
        }
    },
    
    /**
     * Tạo mã tham chiếu ngắn cho đơn hàng
     * @returns {string} Mã tham chiếu
     */
    generateShortReference: function() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    },
    
    /**
     * Tạo mã đơn hàng duy nhất
     * @returns {string} Mã đơn hàng
     */
    generateOrderNumber: function() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const timestamp = date.getTime().toString().substr(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD-${year}${month}${day}-${timestamp}-${random}`;
    },
    
    /**
     * Lưu đơn hàng vào localStorage
     * @param {Object} order - Đối tượng đơn hàng
     */
    saveOrder: function(order) {
        try {
            // Get existing orders
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            
            // Add new order
            orders.push(order);
            
            // Save back to localStorage
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Lưu đơn hàng mới nhất để hiển thị ở trang xác nhận
            localStorage.setItem('lastOrder', JSON.stringify(order));
            
            console.log("Order saved successfully:", order);
            return true;
        } catch (error) {
            console.error("Error saving order:", error);
            return false;
        }
    },
    
    /**
     * Định dạng tiền tệ sang VND
     * @param {number} amount - Số tiền cần định dạng
     * @returns {string} Chuỗi định dạng tiền tệ
     */
    formatCurrency: function(amount) {
        if (typeof Utils !== 'undefined' && Utils.formatCurrency) {
            return Utils.formatCurrency(amount);
        }
        
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount).replace('₫', ' ₫');
    },
    
    /**
     * Hiển thị thông báo
     * @param {string} message - Tin nhắn
     * @param {string} type - Loại thông báo (success, error, warning, info)
     */
    showNotification: function(message, type) {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(message, type);
        } else {
            alert(message);
        }
    }
};

// Khởi tạo module khi trang đã tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Chỉ chạy Checkout.init() - nó sẽ tự kiểm tra xem có đang ở trang checkout không
    Checkout.init();
}); 