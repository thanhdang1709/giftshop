/**
 * Chức năng trang chủ
 * Xử lý các tính năng đặc biệt của trang chủ
 */
const Home = {
  /**
   * Khởi tạo chức năng trang chủ
   */
  init() {
    this.loadFeaturedProducts();
    this.loadCategories();
    this.loadNewArrivals();
    this.populateCategoriesMenu();
    this.setupEventListeners();
  },
  
  /**
   * Thiết lập các trình lắng nghe sự kiện cho các phần tử trang chủ
   */
  setupEventListeners() {
    // Thêm ủy quyền sự kiện toàn cục cho các nút thêm vào giỏ hàng
    document.addEventListener('click', (e) => {
      if (e.target && (e.target.classList.contains('add-to-cart') || 
          e.target.closest('.add-to-cart'))) {
        
        const button = e.target.classList.contains('add-to-cart') ? 
                       e.target : e.target.closest('.add-to-cart');
        const productId = button.dataset.id;
        
        if (productId) {
          e.preventDefault();
          Cart.addItem(productId, 1);
          Utils.showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
        }
      }
    });
  },
  
  /**
   * Tải sản phẩm nổi bật cho trang chủ
   */
  loadFeaturedProducts() {
    const featuredProducts = document.getElementById('featuredProducts');
    if (!featuredProducts) return;
    
    const products = DB.getAll(DB.STORES.PRODUCTS)
      .filter(product => product.status && product.featured)
      .slice(0, 4); // Hiển thị tối đa 4 sản phẩm nổi bật
    
    if (products.length === 0) {
      featuredProducts.innerHTML = '<div class="col-12 text-center"><p>Không có sản phẩm nổi bật</p></div>';
      return;
    }
    
    let html = '';
    products.forEach(product => {
      html += `
        <div class="col-md-3 col-sm-6 mb-4">
          <div class="product-card card h-100">
            <div class="position-relative">
              <a href="pages/customer/product-detail.html?id=${product.id}">
                <img src="${product.image || 'assets/images/placeholder.jpg'}" class="card-img-top" alt="${product.name}">
                <span class="badge bg-danger position-absolute top-0 end-0 m-2">Nổi bật</span>
              </a>
            </div>
            <div class="card-body d-flex flex-column">
              <a href="pages/customer/product-detail.html?id=${product.id}" class="text-decoration-none">
                <h5 class="card-title">${product.name}</h5>
              </a>
              <p class="card-text flex-grow-1">${product.description ? Utils.truncateText(product.description, 60) : ''}</p>
              <div class="d-flex justify-content-between align-items-center mt-auto">
                <span class="price">${Utils.formatCurrency(product.price)}</span>
                <div>
                  <button class="btn btn-sm btn-primary add-to-cart" data-id="${product.id}">
                    <i class="bi bi-cart-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    featuredProducts.innerHTML = html;
  },
  
  /**
   * Tải danh mục cho trang chủ
   */
  loadCategories() {
    const categoriesSection = document.getElementById('categoriesSection');
    if (!categoriesSection) return;
    
    const categories = DB.getAll(DB.STORES.CATEGORIES).filter(category => category.status);
    
    if (categories.length === 0) {
      categoriesSection.innerHTML = '<div class="col-12 text-center"><p>Không có danh mục nào</p></div>';
      return;
    }
    
    let html = '';
    categories.forEach(category => {
      html += `
        <div class="col-md-4 col-sm-6 mb-4">
          <a href="pages/customer/products.html?category=${category.id}" class="text-decoration-none">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body text-center p-4">
                <div class="mb-3">
                  <i class="bi bi-${this.getCategoryIcon(category.name)} text-primary" style="font-size: 3rem;"></i>
                </div>
                <h4 class="card-title">${category.name}</h4>
                <p class="card-text text-muted">Khám phá bộ sưu tập ${category.name.toLowerCase()} của chúng tôi</p>
              </div>
            </div>
          </a>
        </div>
      `;
    });
    
    categoriesSection.innerHTML = html;
  },
  
  /**
   * Tải sản phẩm mới về cho trang chủ
   */
  loadNewArrivals() {
    const newArrivals = document.getElementById('newArrivals');
    if (!newArrivals) return;
    
    const products = DB.getAll(DB.STORES.PRODUCTS)
      .filter(product => product.status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4); // Hiển thị tối đa 4 sản phẩm mới
    
    if (products.length === 0) {
      newArrivals.innerHTML = '<div class="col-12 text-center"><p>Không có sản phẩm mới</p></div>';
      return;
    }
    
    let html = '';
    products.forEach(product => {
      html += `
        <div class="col-md-3 col-sm-6 mb-4">
          <div class="product-card card h-100">
            <div class="position-relative">
              <a href="pages/customer/product-detail.html?id=${product.id}">
                <img src="${product.image || 'assets/images/placeholder.jpg'}" class="card-img-top" alt="${product.name}">
                <span class="badge bg-success position-absolute top-0 end-0 m-2">Mới</span>
              </a>
            </div>
            <div class="card-body d-flex flex-column">
              <a href="pages/customer/product-detail.html?id=${product.id}" class="text-decoration-none">
                <h5 class="card-title">${product.name}</h5>
              </a>
              <p class="card-text flex-grow-1">${product.description ? Utils.truncateText(product.description, 60) : ''}</p>
              <div class="d-flex justify-content-between align-items-center mt-auto">
                <span class="price">${Utils.formatCurrency(product.price)}</span>
                <div>
                  <button class="btn btn-sm btn-primary add-to-cart" data-id="${product.id}">
                    <i class="bi bi-cart-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    newArrivals.innerHTML = html;
  },
  
  /**
   * Điền danh mục vào menu điều hướng
   */
  populateCategoriesMenu() {
    const categoriesMenu = document.getElementById('categoriesMenu');
    const footerCategories = document.getElementById('footerCategories');
    
    if (!categoriesMenu && !footerCategories) return;
    
    const categories = DB.getAll(DB.STORES.CATEGORIES).filter(category => category.status);
    
    let menuHtml = '';
    let footerHtml = '';
    
    categories.forEach(category => {
      menuHtml += `
        <li><a class="dropdown-item" href="pages/customer/products.html?category=${category.id}">${category.name}</a></li>
      `;
      
      footerHtml += `
        <li class="mb-2"><a href="pages/customer/products.html?category=${category.id}" class="text-white-50">${category.name}</a></li>
      `;
    });
    
    if (categoriesMenu) categoriesMenu.innerHTML = menuHtml;
    if (footerCategories) footerCategories.innerHTML = footerHtml;
  },
  
  /**
   * Lấy tên biểu tượng cho danh mục
   * @param {string} categoryName - Tên của danh mục
   * @returns {string} - Tên biểu tượng
   */
  getCategoryIcon(categoryName) {
    const lowerName = categoryName.toLowerCase();
    
    if (lowerName.includes('thú bông') || lowerName.includes('plush')) {
      return 'heart-fill';
    } else if (lowerName.includes('móc khóa') || lowerName.includes('keychain')) {
      return 'key-fill';
    } else if (lowerName.includes('phụ kiện') || lowerName.includes('accessory')) {
      return 'bag-fill';
    } else if (lowerName.includes('đồ chơi') || lowerName.includes('toy')) {
      return 'controller';
    } else if (lowerName.includes('mô hình') || lowerName.includes('figure')) {
      return 'trophy-fill';
    } else if (lowerName.includes('trang trí') || lowerName.includes('decor')) {
      return 'house-fill';
    } else {
      return 'gift-fill';
    }
  }
};

// Khởi tạo chức năng trang chủ khi tài liệu được tải
document.addEventListener('DOMContentLoaded', () => {
  Home.init();
}); 