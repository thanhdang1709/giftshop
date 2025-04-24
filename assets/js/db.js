/**
 * Database Manager for localStorage
 * Manages all data storage and retrieval operations
 */
const DB = {
  /**
   * Store names constants
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
   * User roles
   */
  ROLES: {
    ADMIN: 'admin',
    STAFF: 'staff',
    CUSTOMER: 'customer'
  },

  /**
   * Order statuses
   */
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },

  /**
   * Initialize the database with default data if empty
   */
  init() {
    // Initialize each store if it doesn't exist
    Object.values(this.STORES).forEach(store => {
      if (!localStorage.getItem(store)) {
        localStorage.setItem(store, JSON.stringify([]));
      }
    });

    // Add admin user if no users exist
    const users = this.getAll(this.STORES.USERS);
    if (users.length === 0) {
      this.add(this.STORES.USERS, {
        id: this.generateId(),
        username: 'admin',
        password: 'admin123', // Should be hashed in a real application
        fullName: 'Admin User',
        role: this.ROLES.ADMIN,
        email: 'admin@giftshop.com',
        active: true,
        createdAt: new Date().toISOString()
      });
    }

    // Add default categories if none exist
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
   * Get all items from a store
   * @param {string} storeName - The name of the store
   * @returns {Array} - Array of items
   */
  getAll(storeName) {
    try {
      return JSON.parse(localStorage.getItem(storeName)) || [];
    } catch (error) {
      console.error(`Error getting data from ${storeName}:`, error);
      return [];
    }
  },

  /**
   * Get a single item by id
   * @param {string} storeName - The name of the store
   * @param {string} id - The id of the item
   * @returns {Object|null} - The item or null if not found
   */
  getById(storeName, id) {
    try {
      const items = this.getAll(storeName);
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error(`Error getting item from ${storeName}:`, error);
      return null;
    }
  },

  /**
   * Add an item to a store
   * @param {string} storeName - The name of the store
   * @param {Object} item - The item to add
   * @returns {Object} - The added item
   */
  add(storeName, item) {
    try {
      const items = this.getAll(storeName);
      const newItem = { ...item, id: item.id || this.generateId() };
      items.push(newItem);
      localStorage.setItem(storeName, JSON.stringify(items));
      return newItem;
    } catch (error) {
      console.error(`Error adding item to ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Update an item in a store
   * @param {string} storeName - The name of the store
   * @param {string} id - The id of the item to update
   * @param {Object} updates - The updates to apply
   * @returns {Object|null} - The updated item or null if not found
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
      console.error(`Error updating item in ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Remove an item from a store
   * @param {string} storeName - The name of the store
   * @param {string} id - The id of the item to remove
   * @returns {boolean} - Whether the item was removed
   */
  remove(storeName, id) {
    try {
      const items = this.getAll(storeName);
      const filteredItems = items.filter(item => item.id !== id);
      
      if (filteredItems.length === items.length) return false;
      
      localStorage.setItem(storeName, JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error(`Error removing item from ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Filter items by criteria
   * @param {string} storeName - The name of the store
   * @param {Function} filterFn - The filter function
   * @returns {Array} - The filtered items
   */
  filter(storeName, filterFn) {
    try {
      const items = this.getAll(storeName);
      return items.filter(filterFn);
    } catch (error) {
      console.error(`Error filtering items in ${storeName}:`, error);
      return [];
    }
  },

  /**
   * Clear all items from a store
   * @param {string} storeName - The name of the store
   */
  clear(storeName) {
    try {
      localStorage.setItem(storeName, JSON.stringify([]));
    } catch (error) {
      console.error(`Error clearing store ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Generate a unique ID
   * @returns {string} - A unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },
  
  /**
   * Search items by text in any property
   * @param {string} storeName - The name of the store
   * @param {string} searchText - The text to search for
   * @returns {Array} - The matching items
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
      console.error(`Error searching items in ${storeName}:`, error);
      return [];
    }
  }
};

// Initialize the database when this script loads
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
}); 