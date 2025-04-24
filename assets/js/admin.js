/**
 * Quản lý chức năng Admin
 * Xử lý các tính năng và hoạt động của bảng điều khiển admin
 */
const Admin = {
  /**
   * Khởi tạo chức năng admin
   */
  init() {
    // Kiểm tra nếu người dùng là admin
    if (!this.checkAccess()) return;
    
    // Thiết lập các trình lắng nghe sự kiện
    this.setupEventListeners();
    
    // Tải nội dung dựa trên trang hiện tại
    this.loadPageContent();
  },
  
  /**
   * Kiểm tra xem người dùng hiện tại có quyền truy cập admin không
   * @returns {boolean} - Người dùng có quyền truy cập hay không
   */
  checkAccess() {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/pages/customer/login.html?redirect=/pages/admin/dashboard.html';
      return false;
    }
    
    if (!Auth.isAdmin() && !Auth.isStaff()) {
      alert('Bạn không có quyền truy cập trang này');
      window.location.href = '/index.html';
      return false;
    }
    
    return true;
  },
  
  /**
   * Thiết lập các trình lắng nghe sự kiện cho chức năng admin
   */
  setupEventListeners() {
    // Gửi biểu mẫu sản phẩm
    const productForm = document.getElementById('productForm');
    if (productForm) {
      productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProduct(productForm);
      });
    }
    
    // Gửi biểu mẫu danh mục
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
      categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCategory(categoryForm);
      });
    }
    
    // Gửi biểu mẫu người dùng
    const userForm = document.getElementById('userForm');
    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveUser(userForm);
      });
    }
    
    // Cập nhật trạng thái đơn hàng
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('order-status-select')) {
        const orderId = e.target.dataset.id;
        const newStatus = e.target.value;
        this.updateOrderStatus(orderId, newStatus);
      }
    });
    
    // Nút xóa
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-product-btn')) {
        const productId = e.target.dataset.id;
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
          this.deleteProduct(productId);
        }
      }
      
      if (e.target.classList.contains('delete-category-btn')) {
        const categoryId = e.target.dataset.id;
        if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
          this.deleteCategory(categoryId);
        }
      }
      
      if (e.target.classList.contains('delete-user-btn')) {
        const userId = e.target.dataset.id;
        if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
          this.deleteUser(userId);
        }
      }
    });
  },
  
  /**
   * Tải nội dung dựa trên trang hiện tại
   */
  loadPageContent() {
    const path = window.location.pathname;
    
    if (path.includes('products.html')) {
      this.loadProducts();
      this.loadCategoriesForSelect();
    } else if (path.includes('categories.html')) {
      this.loadCategories();
    } else if (path.includes('users.html')) {
      this.loadUsers();
    } else if (path.includes('orders.html')) {
      this.loadOrders();
    } else if (path.includes('dashboard.html')) {
      this.loadDashboardData();
    }
  },
  
  /**
   * Tải sản phẩm cho quản lý admin
   */
  loadProducts() {
    const products = DB.getAll(DB.STORES.PRODUCTS);
    const productList = document.getElementById('productList');
    if (!productList) return;
    
    if (products.length === 0) {
      productList.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy sản phẩm nào</td></tr>';
      return;
    }
    
    let html = '';
    products.forEach(product => {
      const category = DB.getById(DB.STORES.CATEGORIES, product.categoryId);
      html += `
        <tr>
          <td>${product.name}</td>
          <td>${product.price.toLocaleString()}đ</td>
          <td>${category ? category.name : 'N/A'}</td>
          <td>${product.stock || 0}</td>
          <td>${product.status ? '<span class="badge bg-success">Hoạt động</span>' : '<span class="badge bg-danger">Không hoạt động</span>'}</td>
          <td>
            <button class="btn btn-sm btn-primary edit-product-btn" data-id="${product.id}" data-bs-toggle="modal" data-bs-target="#productModal">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.id}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    productList.innerHTML = html;
    
    // Thêm trình lắng nghe sự kiện cho nút chỉnh sửa
    const editButtons = document.querySelectorAll('.edit-product-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const productId = button.dataset.id;
        this.editProduct(productId);
      });
    });
  },
  
  /**
   * Tải danh mục cho quản lý admin
   */
  loadCategories() {
    const categories = DB.getAll(DB.STORES.CATEGORIES);
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;
    
    if (categories.length === 0) {
      categoryList.innerHTML = '<tr><td colspan="3" class="text-center">Không tìm thấy danh mục nào</td></tr>';
      return;
    }
    
    let html = '';
    categories.forEach(category => {
      html += `
        <tr>
          <td>${category.name}</td>
          <td>${category.status ? '<span class="badge bg-success">Hoạt động</span>' : '<span class="badge bg-danger">Không hoạt động</span>'}</td>
          <td>
            <button class="btn btn-sm btn-primary edit-category-btn" data-id="${category.id}" data-bs-toggle="modal" data-bs-target="#categoryModal">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-category-btn" data-id="${category.id}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    categoryList.innerHTML = html;
    
    // Thêm trình lắng nghe sự kiện cho nút chỉnh sửa
    const editButtons = document.querySelectorAll('.edit-category-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const categoryId = button.dataset.id;
        this.editCategory(categoryId);
      });
    });
  },
  
  /**
   * Tải người dùng cho quản lý admin
   */
  loadUsers() {
    const users = DB.getAll(DB.STORES.USERS);
    const userList = document.getElementById('userList');
    if (!userList) return;
    
    if (users.length === 0) {
      userList.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy người dùng nào</td></tr>';
      return;
    }
    
    let html = '';
    users.forEach(user => {
      html += `
        <tr>
          <td>${user.username}</td>
          <td>${user.fullName}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.active ? '<span class="badge bg-success">Hoạt động</span>' : '<span class="badge bg-danger">Không hoạt động</span>'}</td>
          <td>
            <button class="btn btn-sm btn-primary edit-user-btn" data-id="${user.id}" data-bs-toggle="modal" data-bs-target="#userModal">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    userList.innerHTML = html;
    
    // Thêm trình lắng nghe sự kiện cho nút chỉnh sửa
    const editButtons = document.querySelectorAll('.edit-user-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.dataset.id;
        this.editUser(userId);
      });
    });
  },
  
  /**
   * Tải đơn hàng cho quản lý admin
   */
  loadOrders() {
    const orders = DB.getAll(DB.STORES.ORDERS);
    const orderList = document.getElementById('orderList');
    if (!orderList) return;
    
    if (orders.length === 0) {
      orderList.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy đơn hàng nào</td></tr>';
      return;
    }
    
    // Sắp xếp đơn hàng theo ngày (mới nhất trước)
    orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    let html = '';
    orders.forEach(order => {
      const user = DB.getById(DB.STORES.USERS, order.userId);
      html += `
        <tr>
          <td>${order.id}</td>
          <td>${user ? user.fullName : 'Không xác định'}</td>
          <td>${Utils.formatDate(order.orderDate, true)}</td>
          <td>${order.totalAmount.toLocaleString()}đ</td>
          <td>
            <select class="form-select form-select-sm order-status-select" data-id="${order.id}">
              <option value="${DB.ORDER_STATUS.PENDING}" ${order.status === DB.ORDER_STATUS.PENDING ? 'selected' : ''}>Đang chờ</option>
              <option value="${DB.ORDER_STATUS.PROCESSING}" ${order.status === DB.ORDER_STATUS.PROCESSING ? 'selected' : ''}>Đang xử lý</option>
              <option value="${DB.ORDER_STATUS.SHIPPED}" ${order.status === DB.ORDER_STATUS.SHIPPED ? 'selected' : ''}>Đã gửi</option>
              <option value="${DB.ORDER_STATUS.DELIVERED}" ${order.status === DB.ORDER_STATUS.DELIVERED ? 'selected' : ''}>Đã giao</option>
              <option value="${DB.ORDER_STATUS.CANCELLED}" ${order.status === DB.ORDER_STATUS.CANCELLED ? 'selected' : ''}>Đã hủy</option>
            </select>
          </td>
          <td>
            <button class="btn btn-sm btn-info view-order-btn" data-id="${order.id}" data-bs-toggle="modal" data-bs-target="#orderDetailsModal">
              <i class="bi bi-eye"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    orderList.innerHTML = html;
    
    // Thêm trình lắng nghe sự kiện cho nút xem
    const viewButtons = document.querySelectorAll('.view-order-btn');
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.dataset.id;
        this.viewOrderDetails(orderId);
      });
    });
  },
  
  /**
   * Tải dữ liệu bảng điều khiển
   */
  loadDashboardData() {
    // Số lượng sản phẩm
    const productCount = DB.getAll(DB.STORES.PRODUCTS).length;
    const productCountEl = document.getElementById('productCount');
    if (productCountEl) {
      productCountEl.textContent = productCount;
    }
    
    // Số lượng người dùng
    const userCount = DB.getAll(DB.STORES.USERS).length;
    const userCountEl = document.getElementById('userCount');
    if (userCountEl) {
      userCountEl.textContent = userCount;
    }
    
    // Số lượng đơn hàng
    const orders = DB.getAll(DB.STORES.ORDERS);
    const orderCount = orders.length;
    const orderCountEl = document.getElementById('orderCount');
    if (orderCountEl) {
      orderCountEl.textContent = orderCount;
    }
    
    // Tổng doanh thu
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.status !== DB.ORDER_STATUS.CANCELLED) {
        return sum + order.total;
      }
      return sum;
    }, 0);
    
    const revenueEl = document.getElementById('totalRevenue');
    if (revenueEl) {
      revenueEl.textContent = totalRevenue.toLocaleString() + 'đ';
    }
    
    // Đơn hàng gần đây
    this.loadRecentOrders();
    
    // Sản phẩm bán chạy
    this.loadTopProducts();
  },
  
  /**
   * Tải đơn hàng gần đây cho bảng điều khiển
   */
  loadRecentOrders() {
    const recentOrdersList = document.getElementById('recentOrders');
    if (!recentOrdersList) return;
    
    const orders = DB.getAll(DB.STORES.ORDERS);
    
    if (orders.length === 0) {
      recentOrdersList.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy đơn hàng nào</td></tr>';
      return;
    }
    
    // Sắp xếp đơn hàng theo ngày (mới nhất trước) và lấy 5 đơn hàng đầu tiên
    const recentOrders = orders
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
      .slice(0, 5);
    
    let html = '';
    recentOrders.forEach(order => {
      const user = DB.getById(DB.STORES.USERS, order.userId);
      html += `
        <tr>
          <td>${order.id.substring(0, 8)}...</td>
          <td>${user ? user.fullName : 'Không xác định'}</td>
          <td>${Utils.formatDate(order.orderDate)}</td>
          <td>${order.total.toLocaleString()}đ</td>
          <td>
            <span class="badge bg-${this.getStatusColorClass(order.status)}">${order.status}</span>
          </td>
        </tr>
      `;
    });
    
    recentOrdersList.innerHTML = html;
  },
  
  /**
   * Tải sản phẩm bán chạy cho bảng điều khiển
   */
  loadTopProducts() {
    const topProductsList = document.getElementById('topProducts');
    if (!topProductsList) return;
    
    const products = DB.getAll(DB.STORES.PRODUCTS);
    const orders = DB.getAll(DB.STORES.ORDERS);
    
    if (products.length === 0) {
      topProductsList.innerHTML = '<tr><td colspan="3" class="text-center">Không tìm thấy sản phẩm nào</td></tr>';
      return;
    }
    
    // Tính tổng số lượng đã bán cho mỗi sản phẩm
    const productSales = {};
    
    orders.forEach(order => {
      if (order.status !== DB.ORDER_STATUS.CANCELLED) {
        order.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = 0;
          }
          productSales[item.productId] += item.quantity;
        });
      }
    });
    
    // Tạo mảng sản phẩm với dữ liệu bán hàng
    const productsWithSales = products.map(product => ({
      ...product,
      totalSold: productSales[product.id] || 0
    }));
    
    // Sắp xếp theo tổng số lượng đã bán và lấy 5 sản phẩm hàng đầu
    const topProducts = productsWithSales
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
    
    let html = '';
    topProducts.forEach(product => {
      html += `
        <tr>
          <td>${product.name}</td>
          <td>${product.price.toLocaleString()}đ</td>
          <td>${product.totalSold}</td>
        </tr>
      `;
    });
    
    topProductsList.innerHTML = html;
  },
  
  /**
   * Lấy lớp màu trạng thái cho Bootstrap
   * @param {string} status - Trạng thái đơn hàng
   * @returns {string} - Lớp màu
   */
  getStatusColorClass(status) {
    switch (status) {
      case DB.ORDER_STATUS.PENDING:
        return 'warning';
      case DB.ORDER_STATUS.PROCESSING:
        return 'info';
      case DB.ORDER_STATUS.SHIPPED:
        return 'primary';
      case DB.ORDER_STATUS.DELIVERED:
        return 'success';
      case DB.ORDER_STATUS.CANCELLED:
        return 'danger';
      default:
        return 'secondary';
    }
  },
  
  /**
   * Tải danh mục cho dropdown lựa chọn
   */
  loadCategoriesForSelect() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;
    
    const categories = DB.getAll(DB.STORES.CATEGORIES).filter(c => c.status);
    
    let html = '<option value="">Chọn Danh mục</option>';
    categories.forEach(category => {
      html += `<option value="${category.id}">${category.name}</option>`;
    });
    
    categorySelect.innerHTML = html;
  },
  
  /**
   * Chỉnh sửa sản phẩm
   * @param {string} productId - ID sản phẩm
   */
  editProduct(productId) {
    const product = DB.getById(DB.STORES.PRODUCTS, productId);
    if (!product) return;
    
    const form = document.getElementById('productForm');
    if (!form) return;
    
    // Thiết lập các trường biểu mẫu
    form.productId.value = product.id;
    form.productName.value = product.name;
    form.productPrice.value = product.price;
    form.productCategory.value = product.categoryId;
    form.productDescription.value = product.description || '';
    form.productImage.value = product.image || '';
    form.productStock.value = product.stock || 0;
    form.productStatus.checked = product.status;
    form.productFeatured.checked = product.featured;
    
    document.getElementById('productModalTitle').textContent = 'Chỉnh sửa Sản phẩm';
  },
  
  /**
   * Lưu sản phẩm
   * @param {HTMLFormElement} form - Biểu mẫu sản phẩm
   */
  saveProduct(form) {
    const productId = form.productId.value;
    
    const productData = {
      name: form.productName.value,
      price: parseFloat(form.productPrice.value),
      categoryId: form.productCategory.value,
      description: form.productDescription.value,
      image: form.productImage.value,
      stock: parseInt(form.productStock.value, 10),
      status: form.productStatus.checked,
      featured: form.productFeatured.checked
    };
    
    // Xác thực
    if (!productData.name || isNaN(productData.price) || !productData.categoryId) {
      alert('Vui lòng điền đầy đủ tất cả các trường bắt buộc');
      return;
    }
    
    if (productId) {
      // Cập nhật sản phẩm hiện có
      DB.update(DB.STORES.PRODUCTS, productId, productData);
    } else {
      // Thêm sản phẩm mới
      productData.createdAt = new Date().toISOString();
      DB.add(DB.STORES.PRODUCTS, productData);
    }
    
    // Đóng modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    if (modal) {
      modal.hide();
    }
    
    // Tải lại sản phẩm
    this.loadProducts();
    
    // Đặt lại biểu mẫu
    form.reset();
    form.productId.value = '';
    document.getElementById('productModalTitle').textContent = 'Thêm Sản phẩm';
  },
  
  /**
   * Xóa sản phẩm
   * @param {string} productId - ID sản phẩm
   */
  deleteProduct(productId) {
    const success = DB.remove(DB.STORES.PRODUCTS, productId);
    if (success) {
      this.loadProducts();
    } else {
      alert('Không thể xóa sản phẩm');
    }
  },
  
  /**
   * Chỉnh sửa danh mục
   * @param {string} categoryId - ID danh mục
   */
  editCategory(categoryId) {
    const category = DB.getById(DB.STORES.CATEGORIES, categoryId);
    if (!category) return;
    
    const form = document.getElementById('categoryForm');
    if (!form) return;
    
    // Thiết lập các trường biểu mẫu
    form.categoryId.value = category.id;
    form.categoryName.value = category.name;
    form.categoryStatus.checked = category.status;
    
    document.getElementById('categoryModalTitle').textContent = 'Chỉnh sửa Danh mục';
  },
  
  /**
   * Lưu danh mục
   * @param {HTMLFormElement} form - Biểu mẫu danh mục
   */
  saveCategory(form) {
    const categoryId = form.categoryId.value;
    
    const categoryData = {
      name: form.categoryName.value,
      status: form.categoryStatus.checked
    };
    
    // Xác thực
    if (!categoryData.name) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }
    
    if (categoryId) {
      // Cập nhật danh mục hiện có
      DB.update(DB.STORES.CATEGORIES, categoryId, categoryData);
    } else {
      // Thêm danh mục mới
      DB.add(DB.STORES.CATEGORIES, categoryData);
    }
    
    // Đóng modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
    if (modal) {
      modal.hide();
    }
    
    // Tải lại danh mục
    this.loadCategories();
    
    // Đặt lại biểu mẫu
    form.reset();
    form.categoryId.value = '';
    document.getElementById('categoryModalTitle').textContent = 'Thêm Danh mục';
  },
  
  /**
   * Xóa danh mục
   * @param {string} categoryId - ID danh mục
   */
  deleteCategory(categoryId) {
    // Kiểm tra xem danh mục có đang được sử dụng bởi sản phẩm không
    const products = DB.getAll(DB.STORES.PRODUCTS);
    const inUse = products.some(product => product.categoryId === categoryId);
    
    if (inUse) {
      alert('Không thể xóa danh mục vì nó đang được sử dụng bởi một hoặc nhiều sản phẩm');
      return;
    }
    
    const success = DB.remove(DB.STORES.CATEGORIES, categoryId);
    if (success) {
      this.loadCategories();
    } else {
      alert('Không thể xóa danh mục');
    }
  },
  
  /**
   * Chỉnh sửa người dùng
   * @param {string} userId - ID người dùng
   */
  editUser(userId) {
    const user = DB.getById(DB.STORES.USERS, userId);
    if (!user) return;
    
    const form = document.getElementById('userForm');
    if (!form) return;
    
    // Thiết lập các trường biểu mẫu
    form.userId.value = user.id;
    form.username.value = user.username;
    form.fullName.value = user.fullName;
    form.email.value = user.email;
    form.role.value = user.role;
    form.active.checked = user.active;
    
    // Ẩn hoặc hiển thị trường mật khẩu
    const passwordGroup = document.getElementById('passwordGroup');
    if (passwordGroup) {
      passwordGroup.style.display = 'none';
    }
    
    document.getElementById('userModalTitle').textContent = 'Chỉnh sửa Người dùng';
  }
};

// Khởi tạo chức năng admin khi tài liệu được tải
document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
}); 