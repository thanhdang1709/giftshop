/**
 * Products Manager
 * Handles displaying and filtering products
 */
const Products = {
  /**
   * Initialize the products functionality
   */
  init() {
    // Add sample products if there are none
    this.addSampleProducts();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Display products if we're on the product listing page
    if (document.getElementById('productList')) {
      this.displayProducts();
    }
    
    // Display product details if we're on the product detail page
    if (document.getElementById('productDetail')) {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');
      if (productId) {
        this.displayProductDetail(productId);
      } else {
        document.getElementById('productDetail').innerHTML = '<div class="alert alert-danger">Product not found</div>';
      }
    }
  },
  
  /**
   * Set up event listeners for product-related functionality
   */
  setupEventListeners() {
    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchQuery = document.getElementById('searchInput').value.trim();
        this.searchProducts(searchQuery);
      });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        const categoryId = categoryFilter.value;
        this.filterByCategory(categoryId);
      });
      
      // Populate category filter
      this.populateCategoryFilter();
    }
    
    // Price range filter
    const priceRangeBtn = document.getElementById('priceRangeBtn');
    if (priceRangeBtn) {
      priceRangeBtn.addEventListener('click', () => {
        const minPrice = parseInt(document.getElementById('minPrice').value) || 0;
        const maxPrice = parseInt(document.getElementById('maxPrice').value) || Number.MAX_SAFE_INTEGER;
        this.filterByPriceRange(minPrice, maxPrice);
      });
    }
    
    // Sort options
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.sortProducts(sortSelect.value);
      });
    }
  },
  
  /**
   * Add sample products if there are none in the database
   */
  addSampleProducts() {
    const products = DB.getAll(DB.STORES.PRODUCTS);
    if (products.length === 0) {
      const sampleProducts = [
        {
          name: 'Quạt nhựa cầm tay Moji Gấu trúc Pandabiz yummy time',
          price: 10000,
          categoryId: this.getCategoryIdByName('Phụ kiện'),
          description: 'Quạt nhựa cầm tay hình gấu trúc, thiết kế dễ thương, nhỏ gọn dễ mang theo.',
          image: 'assets/images/products/quat_gau_truc.jpg',
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
          image: 'assets/images/products/tui_binh_nuoc.jpg',
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
          image: 'assets/images/products/quat_usb.jpg',
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
          image: 'assets/images/products/case_airpods.jpg',
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
          image: 'assets/images/products/kuromi.jpg',
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
          image: 'assets/images/products/moc_khoa_stitch.jpg',
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
   * Get a category ID by name
   * @param {string} name - The name of the category
   * @returns {string|null} - The category ID or null if not found
   */
  getCategoryIdByName(name) {
    const categories = DB.getAll(DB.STORES.CATEGORIES);
    const category = categories.find(c => c.name === name);
    return category ? category.id : null;
  },
  
  /**
   * Display products in the product list container
   * @param {Array} products - Array of products to display (optional, defaults to all products)
   */
  displayProducts(products = null) {
    const productList = document.getElementById('productList');
    if (!productList) return;
    
    const allProducts = products || DB.getAll(DB.STORES.PRODUCTS).filter(p => p.status);
    
    if (allProducts.length === 0) {
      productList.innerHTML = '<div class="col-12 text-center"><p>No products found</p></div>';
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
   * Display product details on the product detail page
   * @param {string} productId - The product ID
   */
  displayProductDetail(productId) {
    const productDetail = document.getElementById('productDetail');
    if (!productDetail) return;
    
    const product = DB.getById(DB.STORES.PRODUCTS, productId);
    
    if (!product) {
      productDetail.innerHTML = '<div class="alert alert-danger">Product not found</div>';
      return;
    }
    
    // Get the category name
    let categoryName = 'Unknown';
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
          <p>${product.description || 'No description available'}</p>
          <p>In stock: ${product.stock || 0}</p>
          
          <div class="d-flex mt-4">
            <input type="number" class="form-control me-2" id="quantityInput" value="1" min="1" max="${product.stock}" style="width: 80px;">
            <button class="btn btn-primary add-to-cart-detail" data-id="${product.id}">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
      
      <div class="row mt-5">
        <div class="col-12">
          <h3>Related Products</h3>
          <div class="row" id="relatedProducts"></div>
        </div>
      </div>
    `;
    
    productDetail.innerHTML = html;
    
    // Add event listener for the Add to Cart button
    const addToCartBtn = document.querySelector('.add-to-cart-detail');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('quantityInput').value, 10);
        if (quantity > 0 && quantity <= product.stock) {
          Cart.addItem(productId, quantity);
        } else {
          alert('Please enter a valid quantity');
        }
      });
    }
    
    // Display related products
    this.displayRelatedProducts(product.categoryId, productId);
  },
  
  /**
   * Display related products for a product
   * @param {string} categoryId - The category ID
   * @param {string} currentProductId - The current product ID to exclude
   */
  displayRelatedProducts(categoryId, currentProductId) {
    const relatedProducts = document.getElementById('relatedProducts');
    if (!relatedProducts) return;
    
    const products = DB.getAll(DB.STORES.PRODUCTS).filter(p => 
      p.status && p.categoryId === categoryId && p.id !== currentProductId
    );
    
    if (products.length === 0) {
      relatedProducts.innerHTML = '<p>No related products found</p>';
      return;
    }
    
    // Show up to 3 related products
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
   * Populate the category filter dropdown
   */
  populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const categories = DB.getAll(DB.STORES.CATEGORIES).filter(c => c.status);
    
    let html = '<option value="">All Categories</option>';
    categories.forEach(category => {
      html += `<option value="${category.id}">${category.name}</option>`;
    });
    
    categoryFilter.innerHTML = html;
  },
  
  /**
   * Filter products by category
   * @param {string} categoryId - The category ID
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
   * Filter products by price range
   * @param {number} minPrice - The minimum price
   * @param {number} maxPrice - The maximum price
   */
  filterByPriceRange(minPrice, maxPrice) {
    const filteredProducts = DB.getAll(DB.STORES.PRODUCTS).filter(p => 
      p.status && p.price >= minPrice && p.price <= maxPrice
    );
    
    this.displayProducts(filteredProducts);
  },
  
  /**
   * Search products by name or description
   * @param {string} query - The search query
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
   * Sort products by the specified criteria
   * @param {string} sortBy - The sort criteria
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
        // Default: featured first, then newest
        products.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }
    
    this.displayProducts(products);
  }
};

// Initialize products when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  Products.init();
}); 