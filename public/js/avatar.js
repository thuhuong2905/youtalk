// Quản lý avatar và fallback cho người dùng và sản phẩm

class Avatar {

  /**
   * Lấy ký tự đầu tiên từ tên - Tạo chữ cái hiển thị trong avatar
   */
  static _getInitial(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0 || parts[0].length === 0) return '?';
    return parts[0].charAt(0).toUpperCase();
  }

  /**
   * Lấy màu nền dựa trên ký tự đầu - Tạo màu avatar nhất quán
   */
  static _getBackgroundColor(initial) {
    const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#03417F", "#7f8c8d"];
    if (initial === '?') return colors[colors.length - 1];
    const charCode = initial.charCodeAt(0);
    if (isNaN(charCode)) return colors[colors.length - 1]; 
    const colorIndex = charCode % colors.length;
    return colors[colorIndex];
  }

  /**
   * Tạo avatar fallback DOM element - Tạo avatar mặc định khi không có ảnh
   */
  static createFallback(fullName, size = '40px') {
    const initial = this._getInitial(fullName);
    const bgColor = this._getBackgroundColor(initial);

    const avatar = document.createElement('div');
    avatar.className = 'user-avatar-fallback user-avatar-header'; 
    avatar.style.cssText = `
      width: 100%; 
      height: 100%; 
      border-radius: 50%; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
      background-color: ${bgColor};
      color: white; 
      font-weight: 600; 
      font-size: calc(${size} * 0.5)
      line-height: 1;
      text-align: center;
      box-sizing: border-box;
    `;
    avatar.textContent = initial;
    return avatar;
  }

  /**
   * Tạo HTML string cho fallback - Tạo avatar dạng string HTML
   */
  static createFallbackHTML(fullName, size = '40px') {
    const initial = this._getInitial(fullName);
    const bgColor = this._getBackgroundColor(initial);

    return `
      <div class="user-avatar-fallback user-avatar-header" style="
        width: 100%; 
        height: 100%; 
        border-radius: 50%; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        background-color: ${bgColor};
        color: white; 
        font-weight: 600; 
        font-size: calc(${size} * 0.5);
        line-height: 1;
        text-align: center;
        box-sizing: border-box;
      ">
        ${initial}
      </div>
    `;
  }

  /**
   * Xử lý lỗi ảnh cho img tag - Thay thế ảnh lỗi bằng avatar fallback
   */
  static handleImageError(imgElement, fullName) {
    let parentElement = imgElement ? imgElement.parentNode : null;
    
    if (!parentElement) {
      console.error("Cannot handle image error: Invalid image element or parent.");
      return;
    }
    
    const fallback = this.createFallback(fullName);
    parentElement.replaceChild(fallback, imgElement);
  }

  /**
   * Cắt ngắn text cho tên sản phẩm - Giới hạn độ dài hiển thị
   */
  static _truncateText(text, maxLength = 30) {
    if (!text || typeof text !== 'string') return 'Product';
    text = text.trim();
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Lấy ảnh đầu tiên từ JSON sản phẩm - Trích xuất ảnh chính từ dữ liệu
   */
  static _getFirstProductImage(images) {
    if (!images) return null;
    
    try {
      if (typeof images === 'string') {
        if (images.startsWith('[') || images.startsWith('{')) {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0];
          }
          if (parsed.main) return parsed.main;
        } else {
          return images.trim();
        }
      }
      if (Array.isArray(images) && images.length > 0) {
        return images[0];
      }
    } catch (e) {
      console.warn('Error parsing product images:', e);
    }
    return null;
  }

  /**
   * Tạo product fallback DOM element - Tạo placeholder hình chữ nhật cho sản phẩm
   */
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

  /**
   * Tạo HTML string cho product fallback - Tạo placeholder sản phẩm dạng string
   */
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

  /**
   * Xử lý lỗi ảnh sản phẩm với fallback - Thay thế ảnh sản phẩm lỗi bằng placeholder
   */
  static handleProductImageError(imgElement, productName, size = '100px') {
    if (!imgElement) {
      console.error("Cannot handle product image error: Invalid image element.");
      return;
    }

    try {
      imgElement.style.display = 'none';
      
      const container = imgElement.parentElement;
      if (!container) {
        console.error("Cannot find container for product image fallback.");
        return;
      }

      let placeholder = container.querySelector('.product-fallback-placeholder');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'product-fallback-placeholder';
        placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;';
        container.appendChild(placeholder);
      }

      placeholder.style.display = 'flex';
      placeholder.innerHTML = this.createProductFallbackHTML(productName, size);
    } catch (error) {
      console.error("Error handling product image error:", error);
    }
  }
}

// Xuất cho môi trường ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Avatar;
}