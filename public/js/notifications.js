// notifications.js - Hệ thống thông báo chung cho toàn bộ ứng dụng

/**
 * Hiển thị thông báo dạng toast notification ở góc phải màn hình
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Thời gian hiển thị (ms), mặc định 4000ms
 */
function showNotification(message, type = 'info', duration = 4000) {
    // Tạo hoặc cập nhật notification
    let notification = document.getElementById('app-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'app-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            font-size: 14px;
            z-index: 10000;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(100%);
            word-wrap: break-word;
            line-height: 1.5;
        `;
        document.body.appendChild(notification);
    }
    
    // Đặt nội dung và kiểu dựa trên loại thông báo
    notification.textContent = message;
    notification.className = `app-notification notification-${type}`;
    
    // Đặt màu sắc theo loại thông báo
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            break;
        default: // info
            notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }
    
    // Hiển thị notification với animation
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
    
    // Ẩn sau khoảng thời gian được chỉ định
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

/**
 * Hiển thị thông báo thành công
 * @param {string} message - Nội dung thông báo
 * @param {number} duration - Thời gian hiển thị (ms)
 */
function showSuccess(message, duration = 4000) {
    showNotification(message, 'success', duration);
}

/**
 * Hiển thị thông báo lỗi
 * @param {string} message - Nội dung thông báo
 * @param {number} duration - Thời gian hiển thị (ms)
 */
function showError(message, duration = 4000) {
    showNotification(message, 'error', duration);
}

/**
 * Hiển thị thông báo cảnh báo
 * @param {string} message - Nội dung thông báo
 * @param {number} duration - Thời gian hiển thị (ms)
 */
function showWarning(message, duration = 4000) {
    showNotification(message, 'warning', duration);
}

/**
 * Hiển thị thông báo thông tin
 * @param {string} message - Nội dung thông báo
 * @param {number} duration - Thời gian hiển thị (ms)
 */
function showInfo(message, duration = 4000) {
    showNotification(message, 'info', duration);
}

// Export functions to global scope
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
