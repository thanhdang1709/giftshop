/**
 * Admin functionality manager
 * Handles admin panel features and operations
 */
const Admin = {
  /**
   * Initialize admin functionality
   */
  init() {
    // Check if user is admin
    if (!this.checkAccess()) return;
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load content based on current page
    this.loadPageContent();
  },
  
  /**
   * Check if the current user has admin access
   * @returns {boolean} - Whether the user has access
   */
  checkAccess() {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/pages/customer/login.html?redirect=/pages/admin/dashboard.html';
      return false;
    }
    
    if (!Auth.isAdmin() && !Auth.isStaff()) {
      alert('You do not have permission to access this page');
      window.location.href = '/index.html';
      return false;
    }
    
    return true;
  },
  
  /**
   * Set up event listeners for admin functionality
   */
  setupEventListeners() {
    // Product form submission
    const productForm = document.getElementById('productForm');
    if (productForm) {
      productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProduct(productForm);
      });
    }
    
    // Category form submission
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
      categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCategory(categoryForm);
      });
    }
    
    // User form submission
    const userForm = document.getElementById('userForm');
    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveUser(userForm);
      });
    }
    
    // Order status update
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('order-status-select')) {
        const orderId = e.target.dataset.id;
        const newStatus = e.target.value;
        this.updateOrderStatus(orderId, newStatus);
      }
    });
    
    // Delete buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-product-btn')) {
        const productId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this product?')) {
          this.deleteProduct(productId);
        }
      }
      
      if (e.target.classList.contains('delete-category-btn')) {
        const categoryId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this category?')) {
          this.deleteCategory(categoryId);
        }
      }
      
      if (e.target.classList.contains('delete-user-btn')) {
        const userId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this user?')) {
          this.deleteUser(userId);
        }
      }
    });
  },
  
  /**
   * Load content based on current page
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
   * Load products for admin management
   */
  loadProducts() {
    const products = DB.getAll(DB.STORES.PRODUCTS);
    const productList = document.getElementById('productList');
    if (!productList) return;
    
    if (products.length === 0) {
      productList.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
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
          <td>${product.status ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-danger">Inactive</span>'}</td>
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
    
    // Add event listeners to edit buttons
    const editButtons = document.querySelectorAll('.edit-product-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const productId = button.dataset.id;
        this.editProduct(productId);
      });
    });
  },
  
  /**
   * Load categories for admin management
   */
  loadCategories() {
    const categories = DB.getAll(DB.STORES.CATEGORIES);
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;
    
    if (categories.length === 0) {
      categoryList.innerHTML = '<tr><td colspan="3" class="text-center">No categories found</td></tr>';
      return;
    }
    
    let html = '';
    categories.forEach(category => {
      html += `
        <tr>
          <td>${category.name}</td>
          <td>${category.status ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-danger">Inactive</span>'}</td>
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
    
    // Add event listeners to edit buttons
    const editButtons = document.querySelectorAll('.edit-category-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const categoryId = button.dataset.id;
        this.editCategory(categoryId);
      });
    });
  },
  
  /**
   * Load users for admin management
   */
  loadUsers() {
    const users = DB.getAll(DB.STORES.USERS);
    const userList = document.getElementById('userList');
    if (!userList) return;
    
    if (users.length === 0) {
      userList.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
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
          <td>${user.active ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-danger">Inactive</span>'}</td>
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
    
    // Add event listeners to edit buttons
    const editButtons = document.querySelectorAll('.edit-user-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.dataset.id;
        this.editUser(userId);
      });
    });
  },
  
  /**
   * Load orders for admin management
   */
  loadOrders() {
    const orders = DB.getAll(DB.STORES.ORDERS);
    const orderList = document.getElementById('orderList');
    if (!orderList) return;
    
    if (orders.length === 0) {
      orderList.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
      return;
    }
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    let html = '';
    orders.forEach(order => {
      const user = DB.getById(DB.STORES.USERS, order.userId);
      html += `
        <tr>
          <td>${order.id}</td>
          <td>${user ? user.fullName : 'Unknown'}</td>
          <td>${Utils.formatDate(order.orderDate, true)}</td>
          <td>${order.totalAmount.toLocaleString()}đ</td>
          <td>
            <select class="form-select form-select-sm order-status-select" data-id="${order.id}">
              <option value="${DB.ORDER_STATUS.PENDING}" ${order.status === DB.ORDER_STATUS.PENDING ? 'selected' : ''}>Pending</option>
              <option value="${DB.ORDER_STATUS.PROCESSING}" ${order.status === DB.ORDER_STATUS.PROCESSING ? 'selected' : ''}>Processing</option>
              <option value="${DB.ORDER_STATUS.SHIPPED}" ${order.status === DB.ORDER_STATUS.SHIPPED ? 'selected' : ''}>Shipped</option>
              <option value="${DB.ORDER_STATUS.DELIVERED}" ${order.status === DB.ORDER_STATUS.DELIVERED ? 'selected' : ''}>Delivered</option>
              <option value="${DB.ORDER_STATUS.CANCELLED}" ${order.status === DB.ORDER_STATUS.CANCELLED ? 'selected' : ''}>Cancelled</option>
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
    
    // Add event listeners to view buttons
    const viewButtons = document.querySelectorAll('.view-order-btn');
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.dataset.id;
        this.viewOrderDetails(orderId);
      });
    });
  },
  
  /**
   * Load dashboard data
   */
  loadDashboardData() {
    // Product count
    const productCount = DB.getAll(DB.STORES.PRODUCTS).length;
    const productCountEl = document.getElementById('productCount');
    if (productCountEl) {
      productCountEl.textContent = productCount;
    }
    
    // User count
    const userCount = DB.getAll(DB.STORES.USERS).length;
    const userCountEl = document.getElementById('userCount');
    if (userCountEl) {
      userCountEl.textContent = userCount;
    }
    
    // Order count
    const orders = DB.getAll(DB.STORES.ORDERS);
    const orderCount = orders.length;
    const orderCountEl = document.getElementById('orderCount');
    if (orderCountEl) {
      orderCountEl.textContent = orderCount;
    }
    
    // Total revenue
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.status !== DB.ORDER_STATUS.CANCELLED) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);
    const revenueEl = document.getElementById('totalRevenue');
    if (revenueEl) {
      revenueEl.textContent = totalRevenue.toLocaleString() + 'đ';
    }
    
    // Recent orders
    this.loadRecentOrders();
    
    // Top products
    this.loadTopProducts();
  },
  
  /**
   * Load recent orders for dashboard
   */
  loadRecentOrders() {
    const recentOrdersList = document.getElementById('recentOrders');
    if (!recentOrdersList) return;
    
    const orders = DB.getAll(DB.STORES.ORDERS);
    
    if (orders.length === 0) {
      recentOrdersList.innerHTML = '<tr><td colspan="5" class="text-center">No orders found</td></tr>';
      return;
    }
    
    // Sort orders by date (newest first) and take the first 5
    const recentOrders = orders
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
      .slice(0, 5);
    
    let html = '';
    recentOrders.forEach(order => {
      const user = DB.getById(DB.STORES.USERS, order.userId);
      html += `
        <tr>
          <td>${order.id.substring(0, 8)}...</td>
          <td>${user ? user.fullName : 'Unknown'}</td>
          <td>${Utils.formatDate(order.orderDate)}</td>
          <td>${order.totalAmount.toLocaleString()}đ</td>
          <td>
            <span class="badge bg-${this.getStatusColorClass(order.status)}">${order.status}</span>
          </td>
        </tr>
      `;
    });
    
    recentOrdersList.innerHTML = html;
  },
  
  /**
   * Load top products for dashboard
   */
  loadTopProducts() {
    const topProductsList = document.getElementById('topProducts');
    if (!topProductsList) return;
    
    const products = DB.getAll(DB.STORES.PRODUCTS);
    const orders = DB.getAll(DB.STORES.ORDERS);
    
    if (products.length === 0) {
      topProductsList.innerHTML = '<tr><td colspan="3" class="text-center">No products found</td></tr>';
      return;
    }
    
    // Calculate total sold for each product
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
    
    // Create array of products with sales data
    const productsWithSales = products.map(product => ({
      ...product,
      totalSold: productSales[product.id] || 0
    }));
    
    // Sort by total sold and take the top 5
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
   * Get status color class for Bootstrap
   * @param {string} status - Order status
   * @returns {string} - Color class
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
   * Load categories for select dropdown
   */
  loadCategoriesForSelect() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;
    
    const categories = DB.getAll(DB.STORES.CATEGORIES).filter(c => c.status);
    
    let html = '<option value="">Select Category</option>';
    categories.forEach(category => {
      html += `<option value="${category.id}">${category.name}</option>`;
    });
    
    categorySelect.innerHTML = html;
  },
  
  /**
   * Edit a product
   * @param {string} productId - The product ID
   */
  editProduct(productId) {
    const product = DB.getById(DB.STORES.PRODUCTS, productId);
    if (!product) return;
    
    const form = document.getElementById('productForm');
    if (!form) return;
    
    // Set form fields
    form.productId.value = product.id;
    form.productName.value = product.name;
    form.productPrice.value = product.price;
    form.productCategory.value = product.categoryId;
    form.productDescription.value = product.description || '';
    form.productImage.value = product.image || '';
    form.productStock.value = product.stock || 0;
    form.productStatus.checked = product.status;
    form.productFeatured.checked = product.featured;
    
    document.getElementById('productModalTitle').textContent = 'Edit Product';
  },
  
  /**
   * Save a product
   * @param {HTMLFormElement} form - The product form
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
    
    // Validation
    if (!productData.name || isNaN(productData.price) || !productData.categoryId) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (productId) {
      // Update existing product
      DB.update(DB.STORES.PRODUCTS, productId, productData);
    } else {
      // Add new product
      productData.createdAt = new Date().toISOString();
      DB.add(DB.STORES.PRODUCTS, productData);
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    if (modal) {
      modal.hide();
    }
    
    // Reload products
    this.loadProducts();
    
    // Reset form
    form.reset();
    form.productId.value = '';
    document.getElementById('productModalTitle').textContent = 'Add Product';
  },
  
  /**
   * Delete a product
   * @param {string} productId - The product ID
   */
  deleteProduct(productId) {
    const success = DB.remove(DB.STORES.PRODUCTS, productId);
    if (success) {
      this.loadProducts();
    } else {
      alert('Failed to delete product');
    }
  },
  
  /**
   * Edit a category
   * @param {string} categoryId - The category ID
   */
  editCategory(categoryId) {
    const category = DB.getById(DB.STORES.CATEGORIES, categoryId);
    if (!category) return;
    
    const form = document.getElementById('categoryForm');
    if (!form) return;
    
    // Set form fields
    form.categoryId.value = category.id;
    form.categoryName.value = category.name;
    form.categoryStatus.checked = category.status;
    
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
  },
  
  /**
   * Save a category
   * @param {HTMLFormElement} form - The category form
   */
  saveCategory(form) {
    const categoryId = form.categoryId.value;
    
    const categoryData = {
      name: form.categoryName.value,
      status: form.categoryStatus.checked
    };
    
    // Validation
    if (!categoryData.name) {
      alert('Please enter a category name');
      return;
    }
    
    if (categoryId) {
      // Update existing category
      DB.update(DB.STORES.CATEGORIES, categoryId, categoryData);
    } else {
      // Add new category
      DB.add(DB.STORES.CATEGORIES, categoryData);
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
    if (modal) {
      modal.hide();
    }
    
    // Reload categories
    this.loadCategories();
    
    // Reset form
    form.reset();
    form.categoryId.value = '';
    document.getElementById('categoryModalTitle').textContent = 'Add Category';
  },
  
  /**
   * Delete a category
   * @param {string} categoryId - The category ID
   */
  deleteCategory(categoryId) {
    // Check if category is in use by products
    const products = DB.getAll(DB.STORES.PRODUCTS);
    const inUse = products.some(product => product.categoryId === categoryId);
    
    if (inUse) {
      alert('Cannot delete category because it is being used by one or more products');
      return;
    }
    
    const success = DB.remove(DB.STORES.CATEGORIES, categoryId);
    if (success) {
      this.loadCategories();
    } else {
      alert('Failed to delete category');
    }
  },
  
  /**
   * Edit a user
   * @param {string} userId - The user ID
   */
  editUser(userId) {
    const user = DB.getById(DB.STORES.USERS, userId);
    if (!user) return;
    
    const form = document.getElementById('userForm');
    if (!form) return;
    
    // Set form fields
    form.userId.value = user.id;
    form.username.value = user.username;
    form.fullName.value = user.fullName;
    form.email.value = user.email;
    form.role.value = user.role;
    form.active.checked = user.active;
    
    // Hide or show password field
    const passwordGroup = document.getElementById('passwordGroup');
    if (passwordGroup) {
      passwordGroup.style.display = 'none';
    }
    
    document.getElementById('userModalTitle').textContent = 'Edit User';
  }
};

// Initialize admin functionality when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
}); 