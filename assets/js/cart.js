/**
 * Quản lý giỏ hàng
 * Xử lý các hoạt động giỏ hàng và xử lý đơn hàng
 */
const Cart = {
  /**
   * Khởi tạo giỏ hàng
   */
  init() {
    this.setupEventListeners();
    this.updateCartCount();
  },

  /**
   * Setup event listeners for cart-related elements
   */
  setupEventListeners() {
    // Add to cart buttons - using event delegation to handle dynamically added buttons
    document.addEventListener('click', (e) => {
      // Handle add to cart - check both the button itself and if an icon inside was clicked
      if (e.target && (e.target.classList.contains('add-to-cart') || 
          e.target.closest('.add-to-cart'))) {
        
        e.preventDefault();
        const button = e.target.classList.contains('add-to-cart') ? 
                      e.target : e.target.closest('.add-to-cart');
        const productId = button.dataset.id;
        const quantity = 1; // Default quantity
        
        if (productId) {
          this.addItem(productId, quantity);
        }
      }

      // Handle remove from cart
      if (e.target && (e.target.classList.contains('remove-from-cart') || 
          e.target.closest('.remove-from-cart'))) {
        
        e.preventDefault();
        const button = e.target.classList.contains('remove-from-cart') ? 
                      e.target : e.target.closest('.remove-from-cart');
        const productId = button.dataset.id;
        
        if (productId) {
          this.removeItem(productId);
        }
      }

      // Handle clear cart
      if (e.target && e.target.classList.contains('clear-cart')) {
        e.preventDefault();
        this.clearCart();
      }

      // Handle checkout
      if (e.target && e.target.classList.contains('checkout-btn')) {
        e.preventDefault();
        this.checkout();
      }
    });

    // Update quantities
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('cart-quantity')) {
        const productId = e.target.dataset.id;
        const quantity = parseInt(e.target.value, 10);
        if (quantity > 0) {
          this.updateQuantity(productId, quantity);
        } else {
          e.target.value = 1;
          this.updateQuantity(productId, 1);
        }
      }
    });

    // Update cart display if we're on the cart page
    if (window.location.pathname.includes('cart.html')) {
      this.displayCart();
    }
  },

  /**
   * Get the current cart
   * @returns {Array} - Array of cart items
   */
  getCart() {
    const cartItems = localStorage.getItem('cart');
    return cartItems ? JSON.parse(cartItems) : [];
  },

  /**
   * Save the cart to localStorage
   * @param {Array} cart - The cart to save
   */
  saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    this.updateCartCount();
  },

  /**
   * Thêm một sản phẩm vào giỏ hàng
   * @param {string} productId - ID sản phẩm
   * @param {number} quantity - Số lượng cần thêm
   */
  addItem(productId, quantity) {
    const product = DB.getById(DB.STORES.PRODUCTS, productId);
    if (!product) {
      this.showNotification('Không tìm thấy sản phẩm', 'error');
      return;
    }

    const cart = this.getCart();
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId,
        quantity,
        name: product.name,
        price: product.price,
        image: product.image
      });
    }

    this.saveCart(cart);
    this.showNotification('Đã thêm sản phẩm vào giỏ hàng', 'success');
  },

  /**
   * Remove an item from the cart
   * @param {string} productId - The product ID
   */
  removeItem(productId) {
    const cart = this.getCart();
    const updatedCart = cart.filter(item => item.productId !== productId);
    this.saveCart(updatedCart);

    // If we're on the cart page, update the display
    if (window.location.pathname.includes('cart.html')) {
      this.displayCart();
    }
  },

  /**
   * Update the quantity of an item in the cart
   * @param {string} productId - The product ID
   * @param {number} quantity - The new quantity
   */
  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => item.productId === productId);

    if (item) {
      item.quantity = quantity;
      this.saveCart(cart);

      // If we're on the cart page, update the display
      if (window.location.pathname.includes('cart.html')) {
        this.updateCartTotal();
      }
    }
  },

  /**
   * Clear the cart
   */
  clearCart() {
    this.saveCart([]);

    // If we're on the cart page, update the display
    if (window.location.pathname.includes('cart.html')) {
      this.displayCart();
    }
  },

  /**
   * Update the cart count display
   */
  updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
      const count = this.getCart().reduce((total, item) => total + item.quantity, 0);
      cartCount.textContent = count;
      cartCount.style.display = count ? 'inline' : 'none';
    }
  },

  /**
   * Display the cart on the cart page
   */
  displayCart() {
    const cartContainer = document.getElementById('cartItems');
    if (!cartContainer) return;

    const cart = this.getCart();

    if (cart.length === 0) {
      cartContainer.innerHTML = '<tr><td colspan="6" class="text-center">Your cart is empty</td></tr>';
      document.getElementById('cartTotal').textContent = '0';
      document.getElementById('checkoutBtn').disabled = true;
      return;
    }

    let html = '';
    cart.forEach(item => {
      html += `
        <tr>
          <td>
            <img src="${item.image}" alt="${item.name}" class="cart-img" width="50">
          </td>
          <td>${item.name}</td>
          <td>${item.price.toLocaleString()}đ</td>
          <td>
            <input 
              type="number" 
              class="form-control cart-quantity" 
              value="${item.quantity}" 
              min="1" 
              data-id="${item.productId}"
              style="width: 70px;"
            >
          </td>
          <td>${(item.price * item.quantity).toLocaleString()}đ</td>
          <td>
            <button class="btn btn-sm btn-danger remove-from-cart" data-id="${item.productId}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

    cartContainer.innerHTML = html;
    this.updateCartTotal();
    document.getElementById('checkoutBtn').disabled = false;
  },

  /**
   * Update the cart total display
   */
  updateCartTotal() {
    const cart = this.getCart();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').textContent = total.toLocaleString() + 'đ';
  },

  /**
   * Xử lý thanh toán
   */
  checkout() {
    if (!Auth.isLoggedIn()) {
      this.showNotification('Vui lòng đăng nhập để thanh toán', 'warning');
      window.location.href = '/pages/customer/login.html';
      return;
    }

    const cart = this.getCart();
    if (cart.length === 0) {
      this.showNotification('Giỏ hàng của bạn đang trống', 'warning');
      return;
    }

    const user = Auth.getCurrentUser();
    const order = {
      userId: user.id,
      items: cart,
      totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: DB.ORDER_STATUS.PENDING,
      orderDate: new Date().toISOString(),
      shippingAddress: '',
      paymentMethod: 'COD'
    };

    // Lưu vào đơn hàng
    DB.add(DB.STORES.ORDERS, order);

    // Xóa giỏ hàng
    this.clearCart();

    // Hiển thị thông báo thành công
    this.showNotification('Đặt hàng thành công!', 'success');

    // Chuyển hướng đến lịch sử đơn hàng
    window.location.href = '/pages/customer/orders.html';
  },

  /**
   * Hiển thị thông báo
   * @param {string} message - Tin nhắn cần hiển thị
   * @param {string} type - Loại thông báo (success, error, warning, info)
   */
  showNotification(message, type = 'info') {
    // Sử dụng Utils.showToast nếu có, ngược lại sử dụng alert
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast(message, type);
    } else {
      alert(message);
    }
  }
};

// Initialize cart when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
}); 