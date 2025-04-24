/**
 * Admin Category Management JavaScript
 * Handles category listing, editing, and deletion
 */

const AdminCategories = {
  // Modal instances
  categoryModal: null,
  deleteConfirmModal: null,
  
  // State variables
  categoryToDelete: null,
  isEditing: false,
  currentSearchTerm: '',
  showInactive: false,
  
  /**
   * Initialize the category management page
   */
  init() {
    // Check if user is admin
    if (!Auth.isLoggedIn() || (!Auth.isAdmin() && !Auth.isStaff())) {
      window.location.href = '../../pages/customer/login.html';
      return;
    }
    
    // Initialize modals
    this.categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    this.deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load categories
    this.loadCategories();
  },
  
  /**
   * Set up event listeners for the page
   */
  setupEventListeners() {
    // Add category button
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
      this.resetCategoryForm();
      document.getElementById('categoryModalLabel').textContent = 'Thêm danh mục mới';
      this.isEditing = false;
      this.categoryModal.show();
    });
    
    // Save category button
    document.getElementById('saveCategoryBtn').addEventListener('click', () => {
      this.saveCategory();
    });
    
    // Confirm delete button
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      this.deleteCategory();
    });
    
    // Search button
    document.getElementById('searchCategoryBtn').addEventListener('click', () => {
      this.currentSearchTerm = document.getElementById('searchCategory').value.trim();
      this.loadCategories();
    });
    
    // Search input (Enter key)
    document.getElementById('searchCategory').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.currentSearchTerm = e.target.value.trim();
        this.loadCategories();
      }
    });
    
    // Show inactive checkbox
    document.getElementById('showInactiveCheckbox').addEventListener('change', (e) => {
      this.showInactive = e.target.checked;
      this.loadCategories();
    });
    
    // Color picker synchronization
    document.getElementById('categoryColor').addEventListener('input', (e) => {
      document.getElementById('categoryColorHex').value = e.target.value;
    });
    
    document.getElementById('categoryColorHex').addEventListener('input', (e) => {
      document.getElementById('categoryColor').value = e.target.value;
    });
    
    // Admin logout
    document.getElementById('adminLogoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
      window.location.href = '../../login.html';
    });
  },
  
  /**
   * Load and display categories
   */
  loadCategories() {
    const categoriesList = document.getElementById('categoriesList');
    
    // Show loading state
    categoriesList.innerHTML = '<tr><td colspan="7" class="text-center py-4">Đang tải danh mục...</td></tr>';
    
    let categories = [];
    if (typeof DB !== 'undefined' && DB.getAll) {
      categories = DB.getAll(DB.STORES.CATEGORIES) || [];
    } else {
      // Fallback to localStorage
      categories = JSON.parse(localStorage.getItem('categories') || '[]');
    }
    
    // Filter by status if showing inactive is disabled
    if (!this.showInactive) {
      categories = categories.filter(category => category.status !== false);
    }
    
    // Filter by search term if provided
    if (this.currentSearchTerm) {
      const searchTermLower = this.currentSearchTerm.toLowerCase();
      categories = categories.filter(category => 
        category.name.toLowerCase().includes(searchTermLower) || 
        (category.description && category.description.toLowerCase().includes(searchTermLower))
      );
    }
    
    // Handle empty results
    if (categories.length === 0) {
      categoriesList.innerHTML = '<tr><td colspan="7" class="text-center py-4">Không tìm thấy danh mục nào</td></tr>';
      return;
    }
    
    // Sort categories by name
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    // Generate HTML for each category
    let html = '';
    categories.forEach((category, index) => {
      // Count products in this category
      let productCount = 0;
      if (typeof DB !== 'undefined' && DB.getAll) {
        const products = DB.getAll(DB.STORES.PRODUCTS) || [];
        productCount = products.filter(product => product.categoryId === category.id).length;
      }
      
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>
            ${category.icon ? `<i class="bi ${category.icon} me-2"></i>` : ''}
            ${category.name}
          </td>
          <td>${category.description || '<em class="text-muted">Không có mô tả</em>'}</td>
          <td>
            <span class="category-badge" style="background-color: ${category.color || '#cccccc'}"></span>
            ${category.color || 'Không có màu'}
          </td>
          <td>${productCount}</td>
          <td>
            ${category.status !== false 
              ? '<span class="badge bg-success">Hiện</span>' 
              : '<span class="badge bg-secondary">Ẩn</span>'}
          </td>
          <td>
            <div class="btn-group">
              <button type="button" class="btn btn-sm btn-outline-secondary edit-category" data-id="${category.id}">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger delete-category" 
                      data-id="${category.id}" 
                      data-name="${category.name}"
                      data-product-count="${productCount}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    
    categoriesList.innerHTML = html;
    
    // Add event listeners to buttons
    const editButtons = document.querySelectorAll('.edit-category');
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const categoryId = e.currentTarget.dataset.id;
        this.editCategory(categoryId);
      });
    });
    
    const deleteButtons = document.querySelectorAll('.delete-category');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const categoryId = e.currentTarget.dataset.id;
        const categoryName = e.currentTarget.dataset.name;
        const productCount = parseInt(e.currentTarget.dataset.productCount);
        this.confirmDeleteCategory(categoryId, categoryName, productCount);
      });
    });
  },
  
  /**
   * Reset category form fields
   */
  resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryColor').value = '#3498db';
    document.getElementById('categoryColorHex').value = '#3498db';
  },
  
  /**
   * Load category data for editing
   * @param {string} categoryId - ID of the category to edit
   */
  editCategory(categoryId) {
    let category;
    if (typeof DB !== 'undefined' && DB.getById) {
      category = DB.getById(DB.STORES.CATEGORIES, categoryId);
    } else {
      // Fallback to localStorage
      const categories = JSON.parse(localStorage.getItem('categories') || '[]');
      category = categories.find(cat => cat.id === categoryId);
    }
    
    if (!category) {
      Utils.showToast('Không tìm thấy danh mục', 'error');
      return;
    }
    
    // Set modal title for edit mode
    document.getElementById('categoryModalLabel').textContent = 'Chỉnh sửa danh mục';
    
    // Fill form with category data
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name || '';
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryColor').value = category.color || '#3498db';
    document.getElementById('categoryColorHex').value = category.color || '#3498db';
    document.getElementById('categoryIcon').value = category.icon || '';
    document.getElementById('categoryStatus').checked = category.status !== false;
    
    this.isEditing = true;
    this.categoryModal.show();
  },
  
  /**
   * Show delete confirmation modal
   * @param {string} categoryId - ID of the category to delete
   * @param {string} categoryName - Name of the category
   * @param {number} productCount - Number of products in the category
   */
  confirmDeleteCategory(categoryId, categoryName, productCount) {
    this.categoryToDelete = categoryId;
    document.getElementById('deleteCategoryName').textContent = categoryName;
    
    const warningEl = document.getElementById('categoryHasProductsWarning');
    const countEl = document.getElementById('productCount');
    
    if (productCount > 0) {
      countEl.textContent = productCount;
      warningEl.classList.remove('d-none');
    } else {
      warningEl.classList.add('d-none');
    }
    
    this.deleteConfirmModal.show();
  },
  
  /**
   * Delete a category
   */
  deleteCategory() {
    if (!this.categoryToDelete) return;
    
    if (typeof DB !== 'undefined' && DB.delete) {
      DB.delete(DB.STORES.CATEGORIES, this.categoryToDelete);
    } else {
      // Fallback to localStorage
      const categories = JSON.parse(localStorage.getItem('categories') || '[]');
      const updatedCategories = categories.filter(cat => cat.id !== this.categoryToDelete);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
    }
    
    // Close modal and reload the list
    this.deleteConfirmModal.hide();
    this.loadCategories();
    
    // Show success message
    Utils.showToast('Danh mục đã được xóa thành công', 'success');
    
    this.categoryToDelete = null;
  },
  
  /**
   * Save a category (add new or update existing)
   */
  saveCategory() {
    // Validate form
    const form = document.getElementById('categoryForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    // Get form data
    const categoryId = document.getElementById('categoryId').value.trim();
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    const color = document.getElementById('categoryColor').value;
    const icon = document.getElementById('categoryIcon').value.trim();
    const status = document.getElementById('categoryStatus').checked;
    
    // Create category object
    const category = {
      name,
      description,
      color,
      icon,
      status
    };
    
    if (this.isEditing && categoryId) {
      // Update existing category
      category.id = categoryId;
      
      if (typeof DB !== 'undefined' && DB.update) {
        DB.update(DB.STORES.CATEGORIES, categoryId, category);
      } else {
        // Fallback to localStorage
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const index = categories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
          categories[index] = {...categories[index], ...category};
          localStorage.setItem('categories', JSON.stringify(categories));
        }
      }
      
      Utils.showToast('Danh mục đã được cập nhật thành công', 'success');
    } else {
      // Add new category
      category.id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      category.createdAt = new Date().toISOString();
      
      if (typeof DB !== 'undefined' && DB.add) {
        DB.add(DB.STORES.CATEGORIES, category);
      } else {
        // Fallback to localStorage
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        categories.push(category);
        localStorage.setItem('categories', JSON.stringify(categories));
      }
      
      Utils.showToast('Danh mục mới đã được thêm thành công', 'success');
    }
    
    // Close modal and reload the list
    this.categoryModal.hide();
    this.loadCategories();
  }
};

// Initialize the admin categories page when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  AdminCategories.init();
}); 