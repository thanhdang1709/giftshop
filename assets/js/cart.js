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
   * Thiết lập các sự kiện lắng nghe cho các phần tử liên quan đến giỏ hàng
   */
  setupEventListeners() {
    // Nút thêm vào giỏ hàng - sử dụng ủy quyền sự kiện để xử lý các nút được thêm động
    document.addEventListener('click', (e) => {
      // Xử lý thêm vào giỏ hàng - kiểm tra cả nút và nếu một biểu tượng bên trong được nhấp
      if (e.target && (e.target.classList.contains('add-to-cart') || 
          e.target.closest('.add-to-cart'))) {
        
        e.preventDefault();
        const button = e.target.classList.contains('add-to-cart') ? 
                      e.target : e.target.closest('.add-to-cart');
        const productId = button.dataset.id;
        const quantity = 1; // Số lượng mặc định
        
        if (productId) {
          this.addItem(productId, quantity);
        }
      }

      // Xử lý xóa khỏi giỏ hàng
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

      // Xử lý xóa giỏ hàng
      if (e.target && e.target.classList.contains('clear-cart')) {
        e.preventDefault();
        this.clearCart();
      }

      // Xử lý thanh toán
      if (e.target && e.target.classList.contains('checkout-btn')) {
        e.preventDefault();
        this.checkout();
      }
    });

    // Cập nhật số lượng
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

    // Cập nhật hiển thị giỏ hàng nếu chúng ta đang ở trang giỏ hàng
    if (window.location.pathname.includes('cart.html')) {
      this.displayCart();
    }
  },

  /**
   * Lấy giỏ hàng hiện tại
   * @returns {Array} - Mảng các mục giỏ hàng
   */
  getCart() {
    const cartItems = localStorage.getItem('cart');
    return cartItems ? JSON.parse(cartItems) : [];
  },

  /**
   * Lưu giỏ hàng vào localStorage
   * @param {Array} cart - Giỏ hàng cần lưu
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
   * Xóa một mục khỏi giỏ hàng
   * @param {string} productId - ID sản phẩm
   */
  removeItem(productId) {
    const cart = this.getCart();
    const updatedCart = cart.filter(item => item.productId !== productId);
    this.saveCart(updatedCart);

    // Nếu chúng ta đang ở trang giỏ hàng, cập nhật hiển thị
    if (window.location.pathname.includes('cart.html')) {
      this.displayCart();
    }
  },

  /**
   * Cập nhật số lượng của một mục trong giỏ hàng
   * @param {string} productId - ID sản phẩm
   * @param {number} quantity - Số lượng mới
   */
  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => item.productId === productId);

    if (item) {
      item.quantity = quantity;
      this.saveCart(cart);

      // Nếu chúng ta đang ở trang giỏ hàng, cập nhật hiển thị
      if (window.location.pathname.includes('cart.html')) {
        this.updateCartTotal();
      }
    }
  },

  /**
   * Xóa giỏ hàng
   */
  clearCart() {
    this.saveCart([]);

    // Nếu chúng ta đang ở trang giỏ hàng, cập nhật hiển thị
    if (window.location.pathname.includes('cart.html')) {
      this.displayCart();
    }
  },

  /**
   * Cập nhật hiển thị số lượng giỏ hàng
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
   * Hiển thị giỏ hàng trên trang giỏ hàng
   */
  displayCart() {
    const cartContainer = document.getElementById('cartItems');
    if (!cartContainer) return;

    const cart = this.getCart();

    if (cart.length === 0) {
      cartContainer.innerHTML = '<tr><td colspan="6" class="text-center">Giỏ hàng của bạn đang trống</td></tr>';
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
   * Cập nhật hiển thị tổng giỏ hàng
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
  },

  updateCartUI: function() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
      element.textContent = this.cart.length;
    });

    if (this.isOnCartPage()) {
      this.renderCartPage();
    }
  },

  renderCartPage: function() {
    const cartContainer = document.querySelector('.cart-items-container');
    if (!cartContainer) return;

    if (this.cart.length === 0) {
      cartContainer.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-cart-x fs-1 text-muted mb-3"></i>
          <h4>Giỏ hàng của bạn đang trống</h4>
          <p class="text-muted">Hãy tiếp tục mua sắm để lựa chọn sản phẩm</p>
          <a href="../products.html" class="btn btn-primary mt-3">Tiếp tục mua sắm</a>
        </div>
      `;
      document.querySelector('.cart-summary-container').innerHTML = '';
      return;
    }

    let totalItems = 0;
    let subtotal = 0;
    let html = '';

    this.cart.forEach(item => {
      totalItems += item.quantity;
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      html += `
        <div class="card mb-3 border-0 shadow-sm">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-2 mb-3 mb-md-0 text-center">
                <img src="${item.image}" alt="${item.name}" class="img-fluid rounded" style="max-height: 80px;">
              </div>
              <div class="col-md-5 mb-3 mb-md-0">
                <h5 class="card-title mb-1">${item.name}</h5>
                <p class="card-text text-muted mb-0 small">Đơn giá: ${this.formatCurrency(item.price)}</p>
              </div>
              <div class="col-md-3 mb-3 mb-md-0">
                <div class="d-flex align-items-center justify-content-center">
                  <button class="btn btn-sm btn-outline-secondary decrease-qty" data-id="${item.id}">
                    <i class="bi bi-dash"></i>
                  </button>
                  <input type="number" min="1" value="${item.quantity}" 
                    class="form-control form-control-sm mx-2 text-center item-qty" 
                    style="width: 60px;" data-id="${item.id}">
                  <button class="btn btn-sm btn-outline-secondary increase-qty" data-id="${item.id}">
                    <i class="bi bi-plus"></i>
                  </button>
                </div>
              </div>
              <div class="col-md-1 text-center text-md-end mb-3 mb-md-0">
                <h6 class="mb-0">${this.formatCurrency(itemTotal)}</h6>
              </div>
              <div class="col-md-1 text-center text-md-end">
                <button class="btn btn-sm btn-danger remove-item" data-id="${item.id}">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    cartContainer.innerHTML = html;

    // Update the order summary
    const summaryContainer = document.querySelector('.cart-summary-container');
    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white py-3">
            <h5 class="mb-0">Tóm tắt đơn hàng</h5>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <span>Tạm tính (${totalItems} sản phẩm):</span>
              <span>${this.formatCurrency(subtotal)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Phí vận chuyển:</span>
              <span>${this.formatCurrency(30000)}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between mb-3">
              <strong>Tổng cộng:</strong>
              <strong>${this.formatCurrency(subtotal + 30000)}</strong>
            </div>
            <div class="d-grid">
              <a href="checkout.html" class="btn btn-primary btn-lg checkout-btn">
                Tiến hành thanh toán
              </a>
            </div>
          </div>
        </div>
      `;
    }

    this.setupCartEventListeners();
  },

  setupCartEventListeners: function() {
    // Remove items
    document.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.removeFromCart(id);
      });
    });

    // Quantity changes - manual input
    document.querySelectorAll('.item-qty').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const qty = parseInt(e.currentTarget.value);
        if (qty > 0) {
          this.updateQuantity(id, qty);
        } else {
          e.currentTarget.value = 1;
          this.updateQuantity(id, 1);
        }
      });
    });

    // Quantity changes - buttons
    document.querySelectorAll('.decrease-qty').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const currentItem = this.cart.find(item => item.id === id);
        if (currentItem && currentItem.quantity > 1) {
          this.updateQuantity(id, currentItem.quantity - 1);
        }
      });
    });

    document.querySelectorAll('.increase-qty').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const currentItem = this.cart.find(item => item.id === id);
        if (currentItem) {
          this.updateQuantity(id, currentItem.quantity + 1);
        }
      });
    });

    // Checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        if (!Auth.isLoggedIn()) {
          e.preventDefault();
          Utils.showToast('Vui lòng đăng nhập để tiến hành thanh toán', 'warning');
          setTimeout(() => {
            window.location.href = 'login.html?redirect=checkout';
          }, 1500);
        }
      });
    }
  },

  formatCurrency: function(value) {
    return '$' + value.toLocaleString();
  },

  isOnCartPage: function() {
    return window.location.pathname.includes('cart.html');
  }
};

// Khởi tạo giỏ hàng khi tài liệu được tải
document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
}); 