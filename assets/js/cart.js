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
        this.prepareCheckout();
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
    if (window.location.pathname.includes('cart')) {
      this.displayCart();
      this.setupCheckoutModal();
    }
  },

  /**
   * Thiết lập modal checkout
   */
  setupCheckoutModal() {
    // Xử lý khi modal checkout được mở
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
      checkoutModal.addEventListener('show.bs.modal', () => {
        this.populateCheckoutModal();
      });

      // Xử lý khi chọn phương thức thanh toán
      const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
      paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
          const bankInfo = document.getElementById('bank-transfer-info');
          if (bankInfo) {
            if (e.target.value === 'bank_transfer') {
              bankInfo.classList.remove('d-none');
            } else {
              bankInfo.classList.add('d-none');
            }
          }
        });
      });

      // Xử lý nút đặt hàng
      const placeOrderBtn = document.getElementById('placeOrderBtn');
      if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => {
          this.processOrder();
        });
      }

      // Cập nhật mã tham chiếu đơn hàng
      const orderRef = document.getElementById('orderReference');
      if (orderRef) {
        orderRef.textContent = this.generateShortReference();
      }
    }

    // Prefill thông tin người dùng
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
      const user = Auth.getCurrentUser();
      if (user) {
        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const addressInput = document.getElementById('address');
        
        if (fullNameInput && user.fullName) fullNameInput.value = user.fullName;
        if (emailInput && user.email) emailInput.value = user.email;
        if (phoneInput && user.phone) phoneInput.value = user.phone;
        if (addressInput && user.address) addressInput.value = user.address;
      }
    }
  },

  /**
   * Chuẩn bị checkout
   * Kiểm tra đăng nhập trước khi mở modal thanh toán
   */
  prepareCheckout() {
    if (!Auth.isLoggedIn()) {
      this.showNotification('Vui lòng đăng nhập để tiến hành thanh toán', 'warning');
      setTimeout(() => {
        window.location.href = 'login.html?redirect=cart.html';
      }, 1500);
      return;
    }

    const cart = this.getCart();
    if (!cart || cart.length === 0) {
      this.showNotification('Giỏ hàng của bạn đang trống', 'warning');
      return;
    }

    // Nếu đã đăng nhập và giỏ hàng có sản phẩm, mở modal
    const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    checkoutModal.show();
  },

  /**
   * Điền thông tin vào modal checkout
   */
  populateCheckoutModal() {
    const cart = this.getCart();
    const modalCartItems = document.getElementById('modalCartItems');
    const modalSubtotal = document.getElementById('modalCartSubtotal');
    const modalTotal = document.getElementById('modalCartTotal');

    if (!modalCartItems || !modalSubtotal || !modalTotal) return;

    // Hiển thị các sản phẩm trong giỏ hàng
    let itemsHtml = '';
    let subtotal = 0;

    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      itemsHtml += `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="d-flex align-items-center">
            <img src="${item.image}" alt="${item.name}" class="img-thumbnail me-2" style="width: 40px; height: 40px; object-fit: cover;">
            <div>
              <div class="fw-bold">${item.name}</div>
              <small class="text-muted">${this.formatCurrency(item.price)} x ${item.quantity}</small>
            </div>
          </div>
          <span>${this.formatCurrency(itemTotal)}</span>
        </div>
      `;
    });

    modalCartItems.innerHTML = itemsHtml;
    modalSubtotal.textContent = this.formatCurrency(subtotal);
    modalTotal.textContent = this.formatCurrency(subtotal); // Không tính phí vận chuyển
  },

  /**
   * Xử lý đặt hàng
   */
  processOrder() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;
    
    // Kiểm tra form hợp lệ
    if (!form.checkValidity()) {
      // Thêm class was-validated để hiển thị lỗi
      form.classList.add('was-validated');
      return;
    }

    // Lấy dữ liệu từ form
    const formData = new FormData(form);
    const cart = this.getCart();
    
    // Tính tổng đơn hàng
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Lấy người dùng hiện tại
    const user = Auth.getCurrentUser();
    const userId = user ? user.id : 'guest';
    
    // Tạo đối tượng đơn hàng
    const order = {
      id: this.generateOrderId(),
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
      shipping: 0, // Miễn phí vận chuyển
      discount: 0,
      total: subtotal,
      paymentMethod: formData.get('paymentMethod'),
      notes: formData.get('notes') || '',
      status: 'pending'
    };
    
    // Lưu đơn hàng vào database
    this.saveOrder(order);
    
    // Hiển thị thông báo thành công
    this.showOrderSuccessModal(order);
    
    // Xóa giỏ hàng
    this.clearCart();
  },

  /**
   * Lưu đơn hàng vào DB
   * @param {Object} order - Đơn hàng cần lưu
   */
  saveOrder(order) {
    // Lưu đơn hàng vào IndexedDB
    if (typeof DB !== 'undefined' && DB.add) {
      DB.add(DB.STORES.ORDERS, order);
    }
    
    // Lưu đơn hàng mới nhất vào localStorage để tham chiếu
    localStorage.setItem('lastOrder', JSON.stringify(order));
    
    // Lưu tất cả đơn hàng
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // Check for duplicate orders before adding
    const isDuplicate = orders.some(existingOrder => 
      existingOrder.id === order.id || existingOrder.orderNumber === order.orderNumber
    );
    
    // Only add the order if it's not a duplicate
    if (!isDuplicate) {
      orders.push(order);
      localStorage.setItem('orders', JSON.stringify(orders));
    }
    
    return true;
  },

  /**
   * Hiển thị modal đặt hàng thành công
   * @param {Object} order - Đơn hàng đã đặt
   */
  showOrderSuccessModal(order) {
    // Ẩn modal checkout
    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    if (checkoutModal) {
      checkoutModal.hide();
    }
    
    // Hiển thị thông tin trong modal thành công
    const successModal = document.getElementById('orderSuccessModal');
    const orderIdElement = document.getElementById('successOrderId');
    const bankInfo = document.querySelector('.bank-payment-info');
    
    if (successModal && orderIdElement) {
      orderIdElement.textContent = order.orderNumber;
      
      // Hiển thị/ẩn thông tin ngân hàng nếu phương thức thanh toán là chuyển khoản
      if (bankInfo) {
        if (order.paymentMethod === 'bank_transfer') {
          bankInfo.classList.remove('d-none');
        } else {
          bankInfo.classList.add('d-none');
        }
      }
      
      // Hiển thị modal thành công
      const bsModal = new bootstrap.Modal(successModal);
      bsModal.show();
    }
  },

  /**
   * Tạo ID đơn hàng ngẫu nhiên
   * @returns {string} ID đơn hàng
   */
  generateOrderId() {
    return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Tạo mã đơn hàng dễ đọc
   * @returns {string} Mã đơn hàng
   */
  generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const timestamp = date.getTime().toString().substr(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${year}${month}${day}-${timestamp}-${random}`;
  },

  /**
   * Tạo mã tham chiếu ngắn cho đơn hàng
   * @returns {string} Mã tham chiếu
   */
  generateShortReference() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
    if (window.location.pathname.includes('cart')) {
      this.displayCart();
    }
  },

  /**
   * Cập nhật số lượng của một mục trong giỏ hàng
   * @param {string} itemId - ID sản phẩm (có thể là productId hoặc id)
   * @param {number} quantity - Số lượng mới
   */
  updateQuantity(itemId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => item.productId === itemId || item.id === itemId);

    if (item) {
      item.quantity = quantity;
      this.saveCart(cart);

      // Nếu chúng ta đang ở trang giỏ hàng, cập nhật hiển thị
      if (this.isOnCartPage()) {
        // Cập nhật cả hai hiển thị giỏ hàng để đảm bảo tính nhất quán
        if (document.getElementById('cartItems')) {
          this.displayCart();
        }
        
        if (document.querySelector('.cart-items-container')) {
          this.renderCartPage();
        } else {
          // Nếu không có container cho renderCartPage, chỉ cập nhật tổng giỏ hàng
          this.updateCartTotal();
        }
      }
    }
  },

  /**
   * Xóa giỏ hàng
   */
  clearCart() {
    this.saveCart([]);

    // Nếu chúng ta đang ở trang giỏ hàng, cập nhật hiển thị
    if (window.location.pathname.includes('cart')) {
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
    
    // Cập nhật tổng giỏ hàng
    const cartTotalEl = document.getElementById('cartTotal');
    if (cartTotalEl) {
      cartTotalEl.textContent = total.toLocaleString() + 'đ';
    }
    
    // Cập nhật tổng cộng (cộng thêm phí vận chuyển nếu có)
    const orderTotalEl = document.getElementById('orderTotal');
    if (orderTotalEl) {
      // Mặc định phí vận chuyển là 0 (miễn phí)
      const shipping = 0;
      orderTotalEl.textContent = (total + shipping).toLocaleString() + 'đ';
    }
  },

  /**
   * Định dạng tiền tệ VND
   * @param {number} value - Số tiền cần định dạng
   * @returns {string} Chuỗi đã định dạng
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value).replace('₫', ' ₫');
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
    
    // Get the latest cart data
    const cart = this.getCart();
    this.cart = cart;

    if (!cart || cart.length === 0) {
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
      // Phí vận chuyển mặc định
      const shippingFee = 30000;
      const totalWithShipping = subtotal + shippingFee;
      
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
              <span>${this.formatCurrency(shippingFee)}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between mb-3">
              <strong>Tổng cộng:</strong>
              <strong id="orderTotal">${this.formatCurrency(totalWithShipping)}</strong>
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
    // Get the cart to ensure we have the most recent version
    const cart = this.getCart();
    this.cart = cart;

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
          this.renderCartPage(); // Re-render to update item totals
        } else {
          e.currentTarget.value = 1;
          this.updateQuantity(id, 1);
          this.renderCartPage(); // Re-render to update item totals
        }
      });
    });

    // Quantity changes - buttons
    document.querySelectorAll('.decrease-qty').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const currentItem = this.cart.find(item => item.id === id || item.productId === id);
        if (currentItem && currentItem.quantity > 1) {
          this.updateQuantity(id, currentItem.quantity - 1);
          this.renderCartPage(); // Re-render to update item totals
        }
      });
    });

    document.querySelectorAll('.increase-qty').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const currentItem = this.cart.find(item => item.id === id || item.productId === id);
        if (currentItem) {
          this.updateQuantity(id, currentItem.quantity + 1);
          this.renderCartPage(); // Re-render to update item totals
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

  isOnCartPage: function() {
    return window.location.pathname.includes('cart');
  },

  /**
   * Xóa một mục khỏi giỏ hàng (phiên bản mới hỗ trợ cả id và productId)
   * @param {string} itemId - ID sản phẩm (có thể là productId hoặc id)
   */
  removeFromCart(itemId) {
    const cart = this.getCart();
    const updatedCart = cart.filter(item => item.productId !== itemId && item.id !== itemId);
    this.saveCart(updatedCart);

    // Cập nhật giao diện
    if (this.isOnCartPage()) {
      this.renderCartPage();
    }
  }
};

// Khởi tạo giỏ hàng khi tài liệu được tải
document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
}); 