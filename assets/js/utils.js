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
   * Kiểm tra địa chỉ email hợp lệ
   * @param {string} email - Email cần kiểm tra
   * @returns {boolean} - Email có hợp lệ hay không
   */
  isValidEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  },
  
  /**
   * Kiểm tra số điện thoại hợp lệ
   * @param {string} phone - Số điện thoại cần kiểm tra
   * @returns {boolean} - Số điện thoại có hợp lệ hay không
   */
  isValidPhone(phone) {
    const re = /^[0-9]{10,11}$/;
    return re.test(String(phone).replace(/\s/g, ''));
  },
  
  /**
   * Lấy tham số URL dưới dạng đối tượng
   * @returns {Object} - Tham số URL
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
   * Tạo URL với tham số truy vấn
   * @param {string} base - URL cơ sở
   * @param {Object} params - Tham số truy vấn
   * @returns {string} - URL với tham số truy vấn
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
   * Debounce một lời gọi hàm
   * @param {Function} func - Hàm cần debounce
   * @param {number} delay - Độ trễ tính bằng mili giây
   * @returns {Function} - Hàm đã được debounce
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
   * Tạo thành phần phân trang
   * @param {Object} options - Tùy chọn phân trang
   * @param {number} options.currentPage - Trang hiện tại
   * @param {number} options.totalPages - Tổng số trang
   * @param {Function} options.onPageChange - Hàm callback khi thay đổi trang
   * @param {string} options.containerId - ID của container
   */
  createPagination({ currentPage, totalPages, onPageChange, containerId }) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Xóa container
    container.innerHTML = '';
    
    // Không hiển thị phân trang nếu chỉ có một trang
    if (totalPages <= 1) return;
    
    // Tạo điều hướng phân trang
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Điều hướng trang');
    
    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';
    
    // Nút trước
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Trước');
    prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);
    
    if (currentPage > 1) {
      prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        onPageChange(currentPage - 1);
      });
    }
    
    // Số trang
    const maxPages = 5; // Hiển thị tối đa 5 số trang
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
    
    // Nút tiếp theo
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Tiếp');
    nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);
    
    if (currentPage < totalPages) {
      nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        onPageChange(currentPage + 1);
      });
    }
    
    // Thêm phân trang vào container
    nav.appendChild(ul);
    container.appendChild(nav);
  },
  
  /**
   * Định dạng giá với đơn vị tiền tệ
   * @param {number} price - Giá cần định dạng
   * @param {string} currency - Ký hiệu tiền tệ
   * @returns {string} - Giá đã định dạng
   */
  formatPrice(price, currency = '$') {
    return `${currency}${parseFloat(price).toFixed(2)}`;
  }
};

// Khởi tạo tiện ích khi tài liệu được tải
document.addEventListener('DOMContentLoaded', () => {
  // Không cần khởi tạo gì cho tiện ích
}); 