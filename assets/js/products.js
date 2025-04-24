/**
 * Quản lý Sản phẩm
 * Xử lý hiển thị và lọc sản phẩm
 */
const Products = {
  /**
   * Khởi tạo chức năng sản phẩm
   */
  init() {
    // Thêm sản phẩm mẫu nếu không có sản phẩm nào
    this.addSampleProducts();
    
    // Thiết lập các trình lắng nghe sự kiện
    this.setupEventListeners();
    
    // Hiển thị sản phẩm nếu chúng ta đang ở trang danh sách sản phẩm
    if (document.getElementById('productList')) {
      this.displayProducts();
    }
    
    // Hiển thị chi tiết sản phẩm nếu chúng ta đang ở trang chi tiết sản phẩm
    if (document.getElementById('productDetail')) {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');
      if (productId) {
        this.displayProductDetail(productId);
      } else {
        document.getElementById('productDetail').innerHTML = '<div class="alert alert-danger">Không tìm thấy sản phẩm</div>';
      }
    }
  },
  
  /**
   * Thiết lập các trình lắng nghe sự kiện cho chức năng liên quan đến sản phẩm
   */
  setupEventListeners() {
    // Biểu mẫu tìm kiếm
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchQuery = document.getElementById('searchInput').value.trim();
        this.searchProducts(searchQuery);
      });
    }
    
    // Bộ lọc danh mục
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        const categoryId = categoryFilter.value;
        this.filterByCategory(categoryId);
      });
      
      // Điền danh mục vào bộ lọc
      this.populateCategoryFilter();
    }
    
    // Bộ lọc khoảng giá
    const priceRangeBtn = document.getElementById('priceRangeBtn');
    if (priceRangeBtn) {
      priceRangeBtn.addEventListener('click', () => {
        const minPrice = parseInt(document.getElementById('minPrice').value) || 0;
        const maxPrice = parseInt(document.getElementById('maxPrice').value) || Number.MAX_SAFE_INTEGER;
        this.filterByPriceRange(minPrice, maxPrice);
      });
    }
    
    // Tùy chọn sắp xếp
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.sortProducts(sortSelect.value);
      });
    }
  },
  
  /**
   * Thêm sản phẩm mẫu nếu không có sản phẩm nào trong cơ sở dữ liệu
   */
  addSampleProducts() {
    const products = DB.getAll(DB.STORES.PRODUCTS);
    if (products.length === 0) {
      const sampleProducts = [
        {
          name: 'Quạt nhựa cầm tay Nhóm5 Gấu trúc Pandabiz yummy time',
          price: 10000,
          categoryId: this.getCategoryIdByName('Phụ kiện'),
          description: 'Quạt nhựa cầm tay hình gấu trúc, thiết kế dễ thương, nhỏ gọn dễ mang theo.',
          image: '/assets/images/products/quat_gau_truc.jpg',
          status: true,
          featured: true,
          stock: 50,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Túi đựng bình nước Sanrio family Kuromi face little friend 9x14x27',
          price: 40000,
          categoryId: this.getCategoryIdByName('Phụ kiện'),
          description: 'Túi đựng bình nước họa tiết Kuromi, chất liệu vải canvas bền đẹp.',
          image: '/assets/images/products/tui_binh_nuoc.jpg',
          status: true,
          featured: true,
          stock: 30,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Quạt USB vòng cổ sạc tích điện Capybara nằm',
          price: 190000,
          categoryId: this.getCategoryIdByName('Phụ kiện'),
          description: 'Quạt USB vòng cổ dễ thương thiết kế nhân vật Capybara, có thể sạc và mang theo.',
          image: '/assets/images/products/quat_usb.jpg',
          status: true,
          featured: true,
          stock: 15,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Case Airpods Sanrio family Hello Kitty fall down',
          price: 60000,
          categoryId: this.getCategoryIdByName('Phụ kiện'),
          description: 'Ốp bảo vệ airpods thiết kế độc đáo hình Hello Kitty, chất liệu silicone mềm.',
          image: '/assets/images/products/case_airpods.jpg',
          status: true,
          featured: true,
          stock: 25,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Thú bông Kuromi nhỏ',
          price: 150000,
          categoryId: this.getCategoryIdByName('Thú bông'),
          description: 'Thú bông Kuromi kích thước nhỏ, thích hợp để bàn hoặc trưng bày.',
          image: '/assets/images/products/kuromi.jpg',
          status: true,
          featured: false,
          stock: 20,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Móc khóa Stitch mini',
          price: 35000,
          categoryId: this.getCategoryIdByName('Móc khóa'),
          description: 'Móc khóa hình Stitch kích thước mini, dễ thương.',
          image: '/assets/images/products/moc_khoa_stitch.jpg',
          status: true,
          featured: false,
          stock: 40,
          createdAt: new Date().toISOString()
        }
      ];
      
      sampleProducts.forEach(product => {
        DB.add(DB.STORES.PRODUCTS, product);
      });
    }
  },
  
  /**
   * Lấy ID danh mục theo tên
   * @param {string} name - Tên của danh mục
   * @returns {string|null} - ID danh mục hoặc null nếu không tìm thấy
   */
  getCategoryIdByName(name) {
    const categories = DB.getAll(DB.STORES.CATEGORIES);
    const category = categories.find(c => c.name === name);
    return category ? category.id : null;
  },
  
  /**
   * Hiển thị sản phẩm trong container danh sách sản phẩm
   * @param {Array} products - Mảng sản phẩm để hiển thị (tùy chọn, mặc định là tất cả sản phẩm)
   */
  displayProducts(products = null) {
    const productList = document.getElementById('productList');
    if (!productList) return;
    
    const allProducts = products || DB.getAll(DB.STORES.PRODUCTS).filter(p => p.status);
    
    if (allProducts.length === 0) {
      productList.innerHTML = '<div class="col-12 text-center"><p>Không tìm thấy sản phẩm nào</p></div>';
      return;
    }
    
    let html = '';
    allProducts.forEach(product => {
      html += `
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="product-card card h-100">
            <div class="position-relative">
              <img src="${product.image || 'assets/images/placeholder.jpg'}" class="card-img-top" alt="${product.name}">
              ${product.featured ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2">Hot</span>' : ''}
            </div>
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text flex-grow-1">${product.description ? product.description.substring(0, 60) + '...' : ''}</p>
              <div class="d-flex justify-content-between align-items-center mt-auto">
                <span class="price">${product.price.toLocaleString()}đ</span>
                <div>
                  <a href="product-detail.html?id=${product.id}" class="btn btn-sm btn-outline-secondary me-1">
                    <i class="bi bi-eye"></i>
                  </a>
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
    
    productList.innerHTML = html;
  },
  
  /**
   * Hiển thị chi tiết sản phẩm trên trang chi tiết sản phẩm
   * @param {string} productId - ID sản phẩm
   */
  displayProductDetail(productId) {
    const productDetail = document.getElementById('productDetail');
    if (!productDetail) return;
    
    const product = DB.getById(DB.STORES.PRODUCTS, productId);
    
    if (!product) {
      productDetail.innerHTML = '<div class="alert alert-danger">Không tìm thấy sản phẩm</div>';
      return;
    }
    
    // Lấy tên danh mục
    let categoryName = 'Không xác định';
    if (product.categoryId) {
      const category = DB.getById(DB.STORES.CATEGORIES, product.categoryId);
      if (category) {
        categoryName = category.name;
      }
    }
    
    const html = `
      <div class="row">
        <div class="col-md-6">
          <img src="${product.image || 'assets/images/placeholder.jpg'}" class="img-fluid" alt="${product.name}">
        </div>
        <div class="col-md-6">
          <h2>${product.name}</h2>
          <p class="badge bg-secondary">${categoryName}</p>
          <p class="fs-4 text-danger fw-bold">${product.price.toLocaleString()}đ</p>
          <p>${product.description || 'Không có mô tả'}</p>
          <p>Còn hàng: ${product.stock || 0}</p>
          
          <div class="d-flex mt-4">
            <input type="number" class="form-control me-2" id="quantityInput" value="1" min="1" max="${product.stock}" style="width: 80px;">
            <button class="btn btn-primary add-to-cart-detail" data-id="${product.id}">
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
      
      <div class="row mt-5">
        <div class="col-12">
          <h3>Sản phẩm liên quan</h3>
          <div class="row" id="relatedProducts"></div>
        </div>
      </div>
    `;
    
    productDetail.innerHTML = html;
    
    // Thêm trình lắng nghe sự kiện cho nút Thêm vào giỏ hàng
    const addToCartBtn = document.querySelector('.add-to-cart-detail');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('quantityInput').value, 10);
        if (quantity > 0 && quantity <= product.stock) {
          Cart.addItem(productId, quantity);
        } else {
          alert('Vui lòng nhập số lượng hợp lệ');
        }
      });
    }
    
    // Hiển thị sản phẩm liên quan
    this.displayRelatedProducts(product.categoryId, productId);
  },
  
  /**
   * Hiển thị sản phẩm liên quan cho một sản phẩm
   * @param {string} categoryId - ID danh mục
   * @param {string} currentProductId - ID sản phẩm hiện tại để loại trừ
   */
  displayRelatedProducts(categoryId, currentProductId) {
    const relatedProducts = document.getElementById('relatedProducts');
    if (!relatedProducts) return;
    
    const products = DB.getAll(DB.STORES.PRODUCTS).filter(p => 
      p.status && p.categoryId === categoryId && p.id !== currentProductId
    );
    
    if (products.length === 0) {
      relatedProducts.innerHTML = '<p>Không tìm thấy sản phẩm liên quan</p>';
      return;
    }
    
    // Hiển thị tối đa 3 sản phẩm liên quan
    const limitedProducts = products.slice(0, 3);
    
    let html = '';
    limitedProducts.forEach(product => {
      html += `
        <div class="col-md-4 col-sm-6 mb-4">
          <div class="product-card card h-100">
            <img src="${product.image || 'assets/images/placeholder.jpg'}" class="card-img-top" alt="${product.name}">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text flex-grow-1">${product.description ? product.description.substring(0, 60) + '...' : ''}</p>
              <div class="d-flex justify-content-between align-items-center mt-auto">
                <span class="price">${product.price.toLocaleString()}đ</span>
                <div>
                  <a href="product-detail.html?id=${product.id}" class="btn btn-sm btn-outline-secondary me-1">
                    <i class="bi bi-eye"></i>
                  </a>
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
    
    relatedProducts.innerHTML = html;
  },
  
  /**
   * Điền danh mục vào dropdown bộ lọc
   */
  populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const categories = DB.getAll(DB.STORES.CATEGORIES).filter(c => c.status);
    
    let html = '<option value="">Tất cả danh mục</option>';
    categories.forEach(category => {
      html += `<option value="${category.id}">${category.name}</option>`;
    });
    
    categoryFilter.innerHTML = html;
  },
  
  /**
   * Lọc sản phẩm theo danh mục
   * @param {string} categoryId - ID danh mục
   */
  filterByCategory(categoryId) {
    if (!categoryId) {
      this.displayProducts();
      return;
    }
    
    const filteredProducts = DB.getAll(DB.STORES.PRODUCTS).filter(p => 
      p.status && p.categoryId === categoryId
    );
    
    this.displayProducts(filteredProducts);
  },
  
  /**
   * Lọc sản phẩm theo khoảng giá
   * @param {number} minPrice - Giá tối thiểu
   * @param {number} maxPrice - Giá tối đa
   */
  filterByPriceRange(minPrice, maxPrice) {
    const filteredProducts = DB.getAll(DB.STORES.PRODUCTS).filter(p => 
      p.status && p.price >= minPrice && p.price <= maxPrice
    );
    
    this.displayProducts(filteredProducts);
  },
  
  /**
   * Tìm kiếm sản phẩm theo tên hoặc mô tả
   * @param {string} query - Truy vấn tìm kiếm
   */
  searchProducts(query) {
    if (!query) {
      this.displayProducts();
      return;
    }
    
    const searchLower = query.toLowerCase();
    
    const filteredProducts = DB.getAll(DB.STORES.PRODUCTS).filter(p => {
      return p.status && (
        p.name.toLowerCase().includes(searchLower) || 
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    });
    
    this.displayProducts(filteredProducts);
  },
  
  /**
   * Sắp xếp sản phẩm theo tiêu chí chỉ định
   * @param {string} sortBy - Tiêu chí sắp xếp
   */
  sortProducts(sortBy) {
    let products = DB.getAll(DB.STORES.PRODUCTS).filter(p => p.status);
    
    switch (sortBy) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Mặc định: sản phẩm nổi bật trước, sau đó là mới nhất
        products.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }
    
    this.displayProducts(products);
  }
};

// Khởi tạo sản phẩm khi tài liệu được tải
document.addEventListener('DOMContentLoaded', () => {
  Products.init();
}); 