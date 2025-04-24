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
  }
};

// Khởi tạo giỏ hàng khi tài liệu được tải
document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
}); 