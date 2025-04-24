/**
 * Products Management Module
 * Handles the admin products interface including listing, adding, editing and deleting products
 */
const ProductsManager = {
    products: [],
    categories: [],
    currentPage: 1,
    productsPerPage: 10,
    totalPages: 1,
    isEditing: false,
    currentProductId: null,

    init: function() {
        // Admin protection - redirect if not admin
        if (!Utils.isAdmin()) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        this.loadProducts();
        this.loadCategories();
        this.setupImageUpload();
    },

    setupEventListeners: function() {
        // Add product button
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.showProductForm();
        });

        // Product form submission
        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Cancel button
        document.getElementById('cancel-product-btn').addEventListener('click', () => {
            this.hideProductForm();
        });

        // Search products
        document.getElementById('search-products').addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });

        // Filter by category
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        // Pagination
        document.getElementById('pagination-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            }
        });

        // Bulk actions
        document.getElementById('bulk-action-btn').addEventListener('click', () => {
            const action = document.getElementById('bulk-action').value;
            if (action) {
                this.applyBulkAction(action);
            }
        });

        // Export products
        document.getElementById('export-products-btn').addEventListener('click', () => {
            this.exportProducts();
        });
    },

    loadProducts: function() {
        // Show loading state
        document.getElementById('products-container').innerHTML = '<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Đang tải...</span></div></div>';
        
        // In a real app, this would be an API call
        // For now, simulate API call with timeout
        setTimeout(() => {
            try {
                // Simulate fetching products from server
                this.products = this.generateSampleProducts(50);
                this.totalPages = Math.ceil(this.products.length / this.productsPerPage);
                this.renderProducts();
                this.renderPagination();
            } catch (error) {
                Utils.showToast('Không thể tải dữ liệu sản phẩm', 'error');
                console.error('Error loading products:', error);
            }
        }, 800);
    },

    loadCategories: function() {
        // In a real app, this would be an API call
        // For now, simulate API call with timeout
        setTimeout(() => {
            try {
                // Simulate fetching categories from server
                this.categories = [
                    { id: 1, name: 'Điện thoại' },
                    { id: 2, name: 'Laptop' },
                    { id: 3, name: 'Máy tính bảng' },
                    { id: 4, name: 'Phụ kiện' },
                    { id: 5, name: 'Đồng hồ thông minh' }
                ];
                this.renderCategoryFilter();
                this.populateCategorySelect();
            } catch (error) {
                Utils.showToast('Không thể tải danh mục sản phẩm', 'error');
                console.error('Error loading categories:', error);
            }
        }, 500);
    },

    renderProducts: function() {
        const container = document.getElementById('products-container');
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const productsToShow = this.products.slice(startIndex, endIndex);

        if (productsToShow.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Không tìm thấy sản phẩm nào.</div>';
            return;
        }

        let html = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th width="40px">
                            <input type="checkbox" class="form-check-input" id="select-all-products">
                        </th>
                        <th width="60px">Ảnh</th>
                        <th>Tên sản phẩm</th>
                        <th>Mã SP</th>
                        <th>Danh mục</th>
                        <th>Giá</th>
                        <th>Kho</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
        `;

        productsToShow.forEach(product => {
            const categoryName = this.getCategoryName(product.categoryId);
            const statusClass = product.status === 'active' ? 'bg-success' : 'bg-danger';
            const statusText = product.status === 'active' ? 'Đang bán' : 'Ẩn';
            
            html += `
                <tr>
                    <td>
                        <input type="checkbox" class="form-check-input product-checkbox" data-id="${product.id}">
                    </td>
                    <td>
                        <img src="${product.image}" class="img-thumbnail" alt="${product.name}" width="50">
                    </td>
                    <td>${product.name}</td>
                    <td>${product.sku}</td>
                    <td>${categoryName}</td>
                    <td>${this.formatCurrency(product.price)}</td>
                    <td>${product.stock}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary edit-product" data-id="${product.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-product" data-id="${product.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;

        // Setup event listeners for edit and delete buttons
        this.setupProductActionButtons();
        
        // Setup select all functionality
        this.setupSelectAll();
    },

    setupProductActionButtons: function() {
        // Edit product buttons
        document.querySelectorAll('.edit-product').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.id);
                this.editProduct(productId);
            });
        });

        // Delete product buttons
        document.querySelectorAll('.delete-product').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.id);
                this.confirmDeleteProduct(productId);
            });
        });
    },

    setupSelectAll: function() {
        const selectAllCheckbox = document.getElementById('select-all-products');
        const productCheckboxes = document.querySelectorAll('.product-checkbox');

        selectAllCheckbox.addEventListener('change', function() {
            productCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    },

    renderPagination: function() {
        const container = document.getElementById('pagination-container');
        
        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<ul class="pagination justify-content-center">';
        
        // Previous button
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Next button
        html += `
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;

        html += '</ul>';
        container.innerHTML = html;
    },

    renderCategoryFilter: function() {
        const select = document.getElementById('category-filter');
        let options = '<option value="">Tất cả danh mục</option>';
        
        this.categories.forEach(category => {
            options += `<option value="${category.id}">${category.name}</option>`;
        });
        
        select.innerHTML = options;
    },

    populateCategorySelect: function() {
        const select = document.getElementById('product-category');
        let options = '<option value="">Chọn danh mục</option>';
        
        this.categories.forEach(category => {
            options += `<option value="${category.id}">${category.name}</option>`;
        });
        
        select.innerHTML = options;
    },

    goToPage: function(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.renderProducts();
        this.renderPagination();
    },

    searchProducts: function(query) {
        if (!query) {
            this.loadProducts();
            return;
        }

        query = query.toLowerCase();
        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(query) || 
            product.sku.toLowerCase().includes(query)
        );

        // Update products with filtered results
        this.products = filteredProducts;
        this.totalPages = Math.ceil(this.products.length / this.productsPerPage);
        this.currentPage = 1;
        this.renderProducts();
        this.renderPagination();
    },

    filterByCategory: function(categoryId) {
        if (!categoryId) {
            this.loadProducts();
            return;
        }

        categoryId = parseInt(categoryId);
        const filteredProducts = this.generateSampleProducts(50).filter(product => 
            product.categoryId === categoryId
        );

        // Update products with filtered results
        this.products = filteredProducts;
        this.totalPages = Math.ceil(this.products.length / this.productsPerPage);
        this.currentPage = 1;
        this.renderProducts();
        this.renderPagination();
    },

    showProductForm: function() {
        document.getElementById('product-form-title').textContent = this.isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới';
        document.getElementById('products-list-section').classList.add('d-none');
        document.getElementById('product-form-section').classList.remove('d-none');
    },

    hideProductForm: function() {
        // Reset form fields
        document.getElementById('product-form').reset();
        document.getElementById('product-image-preview').src = 'assets/img/product-placeholder.jpg';
        
        // Hide form, show list
        document.getElementById('products-list-section').classList.remove('d-none');
        document.getElementById('product-form-section').classList.add('d-none');
        
        // Reset editing state
        this.isEditing = false;
        this.currentProductId = null;
    },

    editProduct: function(productId) {
        const product = this.products.find(p => p.id === productId);
        
        if (!product) {
            Utils.showToast('Không tìm thấy sản phẩm', 'error');
            return;
        }

        // Set form to editing mode
        this.isEditing = true;
        this.currentProductId = productId;
        
        // Populate form with product data
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-sku').value = product.sku;
        document.getElementById('product-category').value = product.categoryId;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-status').value = product.status;
        document.getElementById('product-image-preview').src = product.image;
        
        // Show the form
        this.showProductForm();
    },

    saveProduct: function() {
        // Get form data
        const formData = {
            name: document.getElementById('product-name').value,
            sku: document.getElementById('product-sku').value,
            categoryId: parseInt(document.getElementById('product-category').value),
            price: parseFloat(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value),
            description: document.getElementById('product-description').value,
            status: document.getElementById('product-status').value,
            image: document.getElementById('product-image-preview').src
        };

        // Validate form data
        if (!this.validateProductForm(formData)) {
            return;
        }

        // Show loading state
        const saveBtn = document.getElementById('save-product-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang lưu...';
        saveBtn.disabled = true;

        // Simulate API call with timeout
        setTimeout(() => {
            try {
                if (this.isEditing) {
                    // Update existing product
                    const index = this.products.findIndex(p => p.id === this.currentProductId);
                    if (index !== -1) {
                        this.products[index] = {
                            ...this.products[index],
                            ...formData
                        };
                        Utils.showToast('Sản phẩm đã được cập nhật thành công', 'success');
                    }
                } else {
                    // Add new product
                    const newProduct = {
                        id: Date.now(), // Generate a temporary ID
                        ...formData,
                        createdAt: new Date().toISOString()
                    };
                    this.products.unshift(newProduct);
                    Utils.showToast('Sản phẩm mới đã được thêm thành công', 'success');
                }

                // Reset form and show product list
                this.hideProductForm();
                this.renderProducts();
            } catch (error) {
                Utils.showToast('Không thể lưu sản phẩm', 'error');
                console.error('Error saving product:', error);
            } finally {
                // Reset button state
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        }, 1000);
    },

    validateProductForm: function(data) {
        if (!data.name || data.name.trim() === '') {
            Utils.showToast('Vui lòng nhập tên sản phẩm', 'error');
            return false;
        }

        if (!data.sku || data.sku.trim() === '') {
            Utils.showToast('Vui lòng nhập mã sản phẩm', 'error');
            return false;
        }

        if (!data.categoryId) {
            Utils.showToast('Vui lòng chọn danh mục sản phẩm', 'error');
            return false;
        }

        if (isNaN(data.price) || data.price <= 0) {
            Utils.showToast('Vui lòng nhập giá sản phẩm hợp lệ', 'error');
            return false;
        }

        if (isNaN(data.stock) || data.stock < 0) {
            Utils.showToast('Vui lòng nhập số lượng kho hợp lệ', 'error');
            return false;
        }

        return true;
    },

    confirmDeleteProduct: function(productId) {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
            this.deleteProduct(productId);
        }
    },

    deleteProduct: function(productId) {
        // Simulate API call with timeout
        setTimeout(() => {
            try {
                // Remove product from array
                this.products = this.products.filter(p => p.id !== productId);
                
                // Update pagination if needed
                this.totalPages = Math.ceil(this.products.length / this.productsPerPage);
                if (this.currentPage > this.totalPages) {
                    this.currentPage = Math.max(1, this.totalPages);
                }
                
                // Re-render products
                this.renderProducts();
                this.renderPagination();
                
                Utils.showToast('Sản phẩm đã được xóa thành công', 'success');
            } catch (error) {
                Utils.showToast('Không thể xóa sản phẩm', 'error');
                console.error('Error deleting product:', error);
            }
        }, 500);
    },

    applyBulkAction: function(action) {
        const selectedIds = [];
        document.querySelectorAll('.product-checkbox:checked').forEach(checkbox => {
            selectedIds.push(parseInt(checkbox.dataset.id));
        });

        if (selectedIds.length === 0) {
            Utils.showToast('Vui lòng chọn ít nhất một sản phẩm', 'warning');
            return;
        }

        switch (action) {
            case 'delete':
                if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn không?`)) {
                    this.bulkDeleteProducts(selectedIds);
                }
                break;
            case 'active':
                this.bulkUpdateStatus(selectedIds, 'active');
                break;
            case 'inactive':
                this.bulkUpdateStatus(selectedIds, 'inactive');
                break;
            default:
                Utils.showToast('Hành động không hợp lệ', 'error');
        }
    },

    bulkDeleteProducts: function(productIds) {
        // Simulate API call with timeout
        setTimeout(() => {
            try {
                // Remove products from array
                this.products = this.products.filter(p => !productIds.includes(p.id));
                
                // Update pagination if needed
                this.totalPages = Math.ceil(this.products.length / this.productsPerPage);
                if (this.currentPage > this.totalPages) {
                    this.currentPage = Math.max(1, this.totalPages);
                }
                
                // Re-render products
                this.renderProducts();
                this.renderPagination();
                
                Utils.showToast(`Đã xóa ${productIds.length} sản phẩm thành công`, 'success');
            } catch (error) {
                Utils.showToast('Không thể xóa sản phẩm', 'error');
                console.error('Error bulk deleting products:', error);
            }
        }, 800);
    },

    bulkUpdateStatus: function(productIds, status) {
        // Simulate API call with timeout
        setTimeout(() => {
            try {
                // Update product status
                this.products = this.products.map(p => {
                    if (productIds.includes(p.id)) {
                        return { ...p, status: status };
                    }
                    return p;
                });
                
                // Re-render products
                this.renderProducts();
                
                const statusText = status === 'active' ? 'kích hoạt' : 'ẩn';
                Utils.showToast(`Đã ${statusText} ${productIds.length} sản phẩm thành công`, 'success');
            } catch (error) {
                Utils.showToast(`Không thể ${status === 'active' ? 'kích hoạt' : 'ẩn'} sản phẩm`, 'error');
                console.error('Error bulk updating product status:', error);
            }
        }, 800);
    },

    exportProducts: function() {
        // Show loading state
        const exportBtn = document.getElementById('export-products-btn');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xuất...';
        exportBtn.disabled = true;

        // Simulate export with timeout
        setTimeout(() => {
            try {
                // In a real app, this would generate a CSV/Excel file
                // For this demo, just show a success message
                Utils.showToast('Dữ liệu sản phẩm đã được xuất thành công', 'success');
                
                // Simulate file download
                const a = document.createElement('a');
                a.href = '#';
                a.download = 'products_export_' + new Date().toISOString().slice(0, 10) + '.csv';
                a.click();
            } catch (error) {
                Utils.showToast('Không thể xuất dữ liệu sản phẩm', 'error');
                console.error('Error exporting products:', error);
            } finally {
                // Reset button state
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            }
        }, 1500);
    },

    setupImageUpload: function() {
        const imageInput = document.getElementById('product-image');
        const imagePreview = document.getElementById('product-image-preview');
        
        imageInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                }
                
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    },

    getCategoryName: function(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Không có danh mục';
    },

    formatCurrency: function(amount) {
        return amount.toLocaleString('vi-VN') + ' ₫';
    },

    generateSampleProducts: function(count) {
        const products = [];
        const productNames = [
            'iPhone 15 Pro Max', 'Samsung Galaxy S23 Ultra', 'MacBook Pro M3', 'iPad Air',
            'Dell XPS 15', 'Asus ROG Strix', 'Surface Pro 9', 'Galaxy Tab S9',
            'AirPods Pro 2', 'Galaxy Buds Pro', 'Apple Watch Series 9', 'Galaxy Watch 6',
            'Xiaomi Redmi Note 12', 'Oppo Reno 10', 'Sony WH-1000XM5', 'Bose QuietComfort'
        ];
        
        for (let i = 0; i < count; i++) {
            const nameIndex = Math.floor(Math.random() * productNames.length);
            const categoryId = Math.floor(Math.random() * 5) + 1;
            const price = Math.floor(Math.random() * 20000000) + 1000000;
            const stock = Math.floor(Math.random() * 100);
            const status = Math.random() > 0.2 ? 'active' : 'inactive';
            
            products.push({
                id: i + 1,
                name: productNames[nameIndex] + ' ' + (Math.floor(Math.random() * 100) + 1),
                sku: 'SKU' + (Math.floor(Math.random() * 10000) + 10000),
                categoryId: categoryId,
                price: price,
                stock: stock,
                status: status,
                description: 'Mô tả chi tiết về sản phẩm ' + productNames[nameIndex],
                image: `assets/img/products/product-${(i % 8) + 1}.jpg`,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        return products;
    }
};

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    ProductsManager.init();
}); 