/**
 * Quản lý Cơ sở dữ liệu cho localStorage
 * Quản lý tất cả các hoạt động lưu trữ và truy xuất dữ liệu
 */
const DB = {
  /**
   * Hằng số tên kho lưu trữ
   */
  STORES: {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    USERS: 'users',
    CART: 'cart',
    ORDERS: 'orders',
    REVIEWS: 'reviews'
  },

  /**
   * Vai trò người dùng
   */
  ROLES: {
    ADMIN: 'admin',
    STAFF: 'staff',
    CUSTOMER: 'customer'
  },

  /**
   * Trạng thái đơn hàng
   */
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },

  /**
   * Khởi tạo cơ sở dữ liệu với dữ liệu mặc định nếu trống
   */
  init() {
    // Khởi tạo mỗi kho lưu trữ nếu nó không tồn tại
    Object.values(this.STORES).forEach(store => {
      if (!localStorage.getItem(store)) {
        localStorage.setItem(store, JSON.stringify([]));
      }
    });

    // Thêm người dùng admin nếu không có người dùng nào tồn tại
    const users = this.getAll(this.STORES.USERS);
    if (users.length === 0) {
      this.add(this.STORES.USERS, {
        id: this.generateId(),
        username: 'admin',
        password: 'admin123', // Nên được mã hóa trong ứng dụng thực tế
        fullName: 'Admin User',
        role: this.ROLES.ADMIN,
        email: 'admin@giftshop.com',
        active: true,
        createdAt: new Date().toISOString()
      });
    }

    // Thêm danh mục mặc định nếu không có danh mục nào tồn tại
    const categories = this.getAll(this.STORES.CATEGORIES);
    if (categories.length === 0) {
      const defaultCategories = [
        { id: this.generateId(), name: 'Thú bông', status: true },
        { id: this.generateId(), name: 'Móc khóa', status: true },
        { id: this.generateId(), name: 'Phụ kiện', status: true },
        { id: this.generateId(), name: 'Đồ chơi', status: true },
        { id: this.generateId(), name: 'Mô hình', status: true },
        { id: this.generateId(), name: 'Trang trí', status: true }
      ];
      
      defaultCategories.forEach(category => {
        this.add(this.STORES.CATEGORIES, category);
      });
    }
  },

  /**
   * Lấy tất cả các mục từ một kho lưu trữ
   * @param {string} storeName - Tên của kho lưu trữ
   * @returns {Array} - Mảng các mục
   */
  getAll(storeName) {
    try {
      return JSON.parse(localStorage.getItem(storeName)) || [];
    } catch (error) {
      console.error(`Lỗi khi lấy dữ liệu từ ${storeName}:`, error);
      return [];
    }
  },

  /**
   * Lấy một mục duy nhất theo id
   * @param {string} storeName - Tên của kho lưu trữ
   * @param {string} id - Id của mục
   * @returns {Object|null} - Mục hoặc null nếu không tìm thấy
   */
  getById(storeName, id) {
    try {
      const items = this.getAll(storeName);
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error(`Lỗi khi lấy mục từ ${storeName}:`, error);
      return null;
    }
  },

  /**
   * Thêm một mục vào kho lưu trữ
   * @param {string} storeName - Tên của kho lưu trữ
   * @param {Object} item - Mục cần thêm
   * @returns {Object} - Mục đã thêm
   */
  add(storeName, item) {
    try {
      const items = this.getAll(storeName);
      const newItem = { ...item, id: item.id || this.generateId() };
      items.push(newItem);
      localStorage.setItem(storeName, JSON.stringify(items));
      return newItem;
    } catch (error) {
      console.error(`Lỗi khi thêm mục vào ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Cập nhật một mục trong kho lưu trữ
   * @param {string} storeName - Tên của kho lưu trữ
   * @param {string} id - Id của mục cần cập nhật
   * @param {Object} updates - Các cập nhật cần áp dụng
   * @returns {Object|null} - Mục đã cập nhật hoặc null nếu không tìm thấy
   */
  update(storeName, id, updates) {
    try {
      const items = this.getAll(storeName);
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) return null;
      
      items[index] = { ...items[index], ...updates };
      localStorage.setItem(storeName, JSON.stringify(items));
      return items[index];
    } catch (error) {
      console.error(`Lỗi khi cập nhật mục trong ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Xóa một mục khỏi kho lưu trữ
   * @param {string} storeName - Tên của kho lưu trữ
   * @param {string} id - Id của mục cần xóa
   * @returns {boolean} - Liệu mục có được xóa hay không
   */
  remove(storeName, id) {
    try {
      const items = this.getAll(storeName);
      const filteredItems = items.filter(item => item.id !== id);
      
      if (filteredItems.length === items.length) return false;
      
      localStorage.setItem(storeName, JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error(`Lỗi khi xóa mục khỏi ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Lọc các mục theo tiêu chí
   * @param {string} storeName - Tên của kho lưu trữ
   * @param {Function} filterFn - Hàm lọc
   * @returns {Array} - Các mục đã lọc
   */
  filter(storeName, filterFn) {
    try {
      const items = this.getAll(storeName);
      return items.filter(filterFn);
    } catch (error) {
      console.error(`Lỗi khi lọc các mục trong ${storeName}:`, error);
      return [];
    }
  },

  /**
   * Xóa tất cả các mục khỏi kho lưu trữ
   * @param {string} storeName - Tên của kho lưu trữ
   */
  clear(storeName) {
    try {
      localStorage.setItem(storeName, JSON.stringify([]));
    } catch (error) {
      console.error(`Lỗi khi xóa kho lưu trữ ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Tạo một ID duy nhất
   * @returns {string} - Một ID duy nhất
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },
  
  /**
   * Tìm kiếm các mục theo văn bản trong bất kỳ thuộc tính nào
   * @param {string} storeName - Tên của kho lưu trữ
   * @param {string} searchText - Văn bản cần tìm kiếm
   * @returns {Array} - Các mục phù hợp
   */
  search(storeName, searchText) {
    try {
      if (!searchText) return this.getAll(storeName);
      
      const items = this.getAll(storeName);
      const searchLower = searchText.toLowerCase();
      
      return items.filter(item => {
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          return false;
        });
      });
    } catch (error) {
      console.error(`Lỗi khi tìm kiếm các mục trong ${storeName}:`, error);
      return [];
    }
  }
};

// Khởi tạo cơ sở dữ liệu khi script này được tải
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
}); 