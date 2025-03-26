// Utility helper functions for Tiny-ERP

const TinyERPHelpers = {
  /**
   * Generate a unique ID
   * @param {string} prefix - Optional prefix for the ID
   * @returns {string} - Unique ID
   */
  generateId(prefix = '') {
    return prefix + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Format date to display format
   * @param {string|Date} date - Date to format
   * @param {string} format - Optional format (default: 'YYYY-MM-DD')
   * @returns {string} - Formatted date string
   */
  formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    let result = format;
    result = result.replace('YYYY', year);
    result = result.replace('MM', month);
    result = result.replace('DD', day);
    
    return result;
  },

  /**
   * Format currency value
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency symbol (default: '$')
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {string} - Formatted currency string
   */
  formatCurrency(amount, currency = '$', decimals = 2) {
    if (amount === null || amount === undefined) return '';
    return currency + parseFloat(amount).toFixed(decimals);
  },

  /**
   * Deep clone an object
   * @param {Object} obj - Object to clone
   * @returns {Object} - Cloned object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Calculate due date from today
   * @param {number} days - Number of days to add
   * @returns {string} - Due date in YYYY-MM-DD format
   */
  calculateDueDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid email
   */
  isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },

  /**
   * Validate phone number format
   * @param {string} phone - Phone to validate
   * @returns {boolean} - True if valid phone
   */
  isValidPhone(phone) {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(String(phone));
  },

  /**
   * Debounce function to limit how often a function can be called
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} - Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  },

  /**
   * Convert string to title case
   * @param {string} str - String to convert
   * @returns {string} - Title cased string
   */
  toTitleCase(str) {
    if (!str) return '';
    return str.replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  /**
   * Get status badge class based on status
   * @param {string} status - Status value
   * @returns {string} - Bootstrap badge class
   */
  getStatusBadgeClass(status) {
    const statusMap = {
      'active': 'badge-success',
      'inactive': 'badge-secondary',
      'pending': 'badge-warning',
      'completed': 'badge-success',
      'cancelled': 'badge-danger',
      'draft': 'badge-info',
      'approved': 'badge-success',
      'rejected': 'badge-danger',
      'paid': 'badge-success',
      'unpaid': 'badge-danger',
      'partial': 'badge-warning',
      'overdue': 'badge-danger'
    };
    
    return statusMap[status.toLowerCase()] || 'badge-secondary';
  }
};

// Make helpers available globally
window.TinyERPHelpers = TinyERPHelpers;
