// avatar.js - Refactored to align fallback logic with header (main.js)

class Avatar {

  // Helper function to get initial (consistent with main.js)
  static _getInitial(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0 || parts[0].length === 0) return '?';
    return parts[0].charAt(0).toUpperCase();
  }

  // Helper function to get background color (consistent with main.js)
  static _getBackgroundColor(initial) {
    const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#03417F", "#7f8c8d"];
    if (initial === '?') return colors[colors.length - 1]; // Default color for '?'
    const charCode = initial.charCodeAt(0);
    // Handle potential non-alphanumeric initials gracefully
    if (isNaN(charCode)) return colors[colors.length - 1]; 
    const colorIndex = charCode % colors.length;
    return colors[colorIndex];
  }

  // Tạo avatar fallback DOM element (consistent with header)
  static createFallback(fullName, size = '40px') {
    const initial = this._getInitial(fullName);
    const bgColor = this._getBackgroundColor(initial);

    const avatar = document.createElement('div');
    // Use classes consistent with header fallback
    avatar.className = 'user-avatar-fallback user-avatar-header'; 
    avatar.style.cssText = `
      width: 100%; 
      height: 100%; 
      border-radius: 50%; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
      background-color: ${bgColor}; /* Use calculated color */
      color: white; 
      font-weight: 600; 
      font-size: calc(${size} * 0.5) /* Dynamic font size based on container */
      line-height: 1; /* Better line height for centering */
      text-align: center; /* Ensure horizontal centering */
      box-sizing: border-box; /* Include padding/border in size calculation */
    `;
    avatar.textContent = initial; // Use single initial
    return avatar;
  }

  // Tạo HTML string cho fallback (consistent with header)
  static createFallbackHTML(fullName, size = '40px') {
    const initial = this._getInitial(fullName);
    const bgColor = this._getBackgroundColor(initial);

    // Use classes consistent with header fallback
    return `
      <div class="user-avatar-fallback user-avatar-header" style="
        width: 100%; 
        height: 100%; 
        border-radius: 50%; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        background-color: ${bgColor}; /* Use calculated color */
        color: white; 
        font-weight: 600; 
        font-size: calc(${size} * 0.5); /* Dynamic font size based on container */
        line-height: 1; /* Better line height for centering */
        text-align: center; /* Ensure horizontal centering */
        box-sizing: border-box; /* Include padding/border in size calculation */
      ">
        ${initial} <!-- Use single initial -->
      </div>
    `;
  }

  // Xử lý lỗi ảnh cho img tag có sẵn (uses updated createFallback)
  static handleImageError(imgElement, fullName) {
    // Get the parent element to determine size
    let parentElement = imgElement ? imgElement.parentNode : null;
    
    if (!parentElement) {
      console.error("Cannot handle image error: Invalid image element or parent.");
      return;
    }
    
    const fallback = this.createFallback(fullName);
    parentElement.replaceChild(fallback, imgElement);
  }

  // Helper function to truncate text for product names
  static _truncateText(text, maxLength = 30) {
    if (!text || typeof text !== 'string') return 'Product';
    text = text.trim();
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  // Extract first image from product images JSON/text
  static _getFirstProductImage(images) {
    if (!images) return null;
    
    try {
      // If it's a JSON string, parse it
      if (typeof images === 'string') {
        if (images.startsWith('[') || images.startsWith('{')) {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0];
          }
          if (parsed.main) return parsed.main;
        } else {
          // If it's a simple string path
          return images.trim();
        }
      }
      // If it's already an array
      if (Array.isArray(images) && images.length > 0) {
        return images[0];
      }
    } catch (e) {
      console.warn('Error parsing product images:', e);
    }
    return null;
  }

  // Tạo product fallback DOM element (rectangular)
  static createProductFallback(productName, size = '100px') {
    const text = this._truncateText(productName || 'Product');
    const initial = this._getInitial(productName);
    const bgColor = this._getBackgroundColor(initial);

    const fallback = document.createElement('div');
    fallback.className = 'product-fallback';
    fallback.style.cssText = `
      width: ${size}; 
      height: ${size}; 
      border-radius: 8px; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
      background-color: ${bgColor}; 
      color: white; 
      font-weight: 600; 
      font-size: 14px;
      line-height: 1.2; 
      text-align: center; 
      box-sizing: border-box;
      padding: 8px;
      word-wrap: break-word;
      overflow: hidden;
    `;
    fallback.textContent = text;
    return fallback;
  }

  // Tạo HTML string cho product fallback
  static createProductFallbackHTML(productName, size = '100px') {
    const text = this._truncateText(productName || 'Product');
    const initial = this._getInitial(productName);
    const bgColor = this._getBackgroundColor(initial);

    return `
      <div class="product-fallback" style="
        width: ${size}; 
        height: ${size}; 
        border-radius: 8px; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        background-color: ${bgColor}; 
        color: white; 
        font-weight: 600; 
        font-size: 14px;
        line-height: 1.2; 
        text-align: center; 
        box-sizing: border-box;
        padding: 8px;
        word-wrap: break-word;
        overflow: hidden;
      ">
        ${text}
      </div>
    `;
  }

  // Xử lý lỗi ảnh sản phẩm với fallback 
  static handleProductImageError(imgElement, productName, size = '100px') {
    if (!imgElement) {
      console.error("Cannot handle product image error: Invalid image element.");
      return;
    }

    try {
      // Ẩn ảnh lỗi
      imgElement.style.display = 'none';
      
      // Tìm container để thêm fallback
      const container = imgElement.parentElement;
      if (!container) {
        console.error("Cannot find container for product image fallback.");
        return;
      }

      // Tìm placeholder container hoặc tạo mới
      let placeholder = container.querySelector('.product-fallback-placeholder');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'product-fallback-placeholder';
        placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;';
        container.appendChild(placeholder);
      }

      // Hiển thị placeholder và thêm fallback
      placeholder.style.display = 'flex';
      placeholder.innerHTML = this.createProductFallbackHTML(productName, size);
    } catch (error) {
      console.error("Error handling product image error:", error);
    }
  }
}

// Export cho môi trường ES6 modules (nếu cần)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Avatar;
}