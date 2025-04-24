/**
 * Các hàm tiện ích cho ứng dụng
 */
const Utils = {
  /**
   * Định dạng ngày tháng thành chuỗi dễ đọc
   * @param {string} dateString - Chuỗi ngày dạng ISO
   * @param {boolean} includeTime - Có bao gồm thời gian hay không
   * @returns {string} - Chuỗi ngày đã định dạng
   */
  formatDate(dateString, includeTime = false) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('vi-VN', options);
  },
  
  /**
   * Định dạng tiền tệ
   * @param {number} amount - Số tiền cần định dạng
   * @returns {string} - Chuỗi tiền tệ đã định dạng
   */
  formatCurrency(amount) {
    if (typeof amount !== 'number') return '0đ';
    return amount.toLocaleString() + 'đ';
  },
  
  /**
   * Cắt ngắn văn bản nếu dài hơn độ dài tối đa
   * @param {string} text - Văn bản cần cắt ngắn
   * @param {number} maxLength - Độ dài tối đa
   * @returns {string} - Văn bản đã cắt ngắn
   */
  truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },
  
  /**
   * Hiển thị thông báo dạng toast
   * @param {string} message - Tin nhắn cần hiển thị
   * @param {string} type - Loại thông báo (success, error, warning, info)
   * @param {number} duration - Thời gian hiển thị tính bằng mili giây
   */
  showToast(message, type = 'info', duration = 3000) {
    // Đảm bảo CSS cho toast đã được tải
    this.loadCss('/assets/css/toast.css');
    
    // Xóa toast hiện có nếu có
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    // Tạo phần tử toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    // Thêm vào tài liệu
    document.body.appendChild(toast);

    // Hiệu ứng hiện
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Tự động xóa sau khoảng thời gian
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300); // Đợi hiệu ứng mờ dần
    }, duration);
  },
  
  /**
   * Tải động file CSS
   * @param {string} href - Đường dẫn đến file CSS
   * @returns {HTMLLinkElement} - Phần tử link đã tạo
   */
  loadCss(href) {
    // Kiểm tra xem đã tải chưa
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) return existingLink;
    
    // Tạo phần tử link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    
    // Thêm vào head của tài liệu
    document.head.appendChild(link);
    return link;
  },
  
  /**
   * Validate an email address
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether the email is valid
   */
  isValidEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  },
  
  /**
   * Validate a phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Whether the phone number is valid
   */
  isValidPhone(phone) {
    const re = /^[0-9]{10,11}$/;
    return re.test(String(phone).replace(/\s/g, ''));
  },
  
  /**
   * Get URL parameters as an object
   * @returns {Object} - URL parameters
   */
  getUrlParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
    return params;
  },
  
  /**
   * Create a URL with query parameters
   * @param {string} base - Base URL
   * @param {Object} params - Query parameters
   * @returns {string} - URL with query parameters
   */
  createUrl(base, params = {}) {
    const url = new URL(base, window.location.origin);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    return url.href;
  },
  
  /**
   * Debounce a function call
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  },
  
  /**
   * Create a pagination component
   * @param {Object} options - Pagination options
   * @param {number} options.currentPage - Current page
   * @param {number} options.totalPages - Total pages
   * @param {Function} options.onPageChange - Page change callback
   * @param {string} options.containerId - Container ID
   */
  createPagination({ currentPage, totalPages, onPageChange, containerId }) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Don't show pagination if only one page
    if (totalPages <= 1) return;
    
    // Create pagination nav
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Page navigation');
    
    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Previous');
    prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);
    
    if (currentPage > 1) {
      prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        onPageChange(currentPage - 1);
      });
    }
    
    // Page numbers
    const maxPages = 5; // Show up to 5 page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === currentPage ? 'active' : ''}`;
      const link = document.createElement('a');
      link.className = 'page-link';
      link.href = '#';
      link.textContent = i;
      
      if (i !== currentPage) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          onPageChange(i);
        });
      }
      
      li.appendChild(link);
      ul.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Next');
    nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);
    
    if (currentPage < totalPages) {
      nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        onPageChange(currentPage + 1);
      });
    }
    
    // Add the pagination to the container
    nav.appendChild(ul);
    container.appendChild(nav);
  },
  
  /**
   * Format price with currency
   * @param {number} price - Price to format
   * @param {string} currency - Currency symbol
   * @returns {string} - Formatted price
   */
  formatPrice(price, currency = '$') {
    return `${currency}${parseFloat(price).toFixed(2)}`;
  }
};

// Initialize utilities when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Nothing to initialize for utilities
}); 