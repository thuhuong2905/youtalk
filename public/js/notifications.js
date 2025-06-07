// notifications.js - Hệ thống thông báo chung cho toàn bộ ứng dụng

/**
 * Hiển thị thông báo dạng toast notification ở góc phải màn hình
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Thời gian hiển thị (ms), mặc định 4000ms
 */
function showNotification(message, type = 'info', duration = 4000) {
    console.log('showNotification được gọi:', { message, type, duration });
    
    // Xóa notification cũ nếu có
    const oldNotification = document.getElementById('app-notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Tạo notification mới
    const notification = document.createElement('div');
    notification.id = 'app-notification';
    
    // Đặt style trực tiếp để đảm bảo hiển thị
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '16px 24px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontWeight = '500';
    notification.style.fontSize = '14px';
    notification.style.zIndex = '99999';
    notification.style.minWidth = '300px';
    notification.style.maxWidth = '500px';
    notification.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
    notification.style.transition = 'all 0.3s ease';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    notification.style.wordWrap = 'break-word';
    notification.style.lineHeight = '1.5';
    notification.style.fontFamily = 'Arial, sans-serif';
    
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
    
    // Thêm vào body
    document.body.appendChild(notification);
    console.log('Notification added to DOM:', notification);
    
    // Force reflow để đảm bảo element được render
    notification.offsetHeight;
    
    // Hiển thị notification với animation
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
        console.log('Notification should be visible now');
    }, 50);
    
    // Ẩn sau khoảng thời gian được chỉ định
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    console.log('Notification removed from DOM');
                }
            }, 300);
        }
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
    console.log('showError được gọi với message:', message);
    
    // Thử showNotification trước
    try {
        showNotification(message, 'error', duration);
    } catch (error) {
        console.error('Lỗi khi hiển thị notification:', error);
        // Fallback: tạo thông báo đơn giản
        showSimpleErrorNotification(message, duration);
    }
}

/**
 * Fallback notification đơn giản đảm bảo luôn hiển thị
 */
function showSimpleErrorNotification(message, duration = 4000) {
    console.log('Sử dụng fallback notification cho:', message);
    
    // Xóa notification cũ
    const oldNotif = document.getElementById('simple-error-notification');
    if (oldNotif) oldNotif.remove();
    
    // Tạo notification đơn giản
    const notif = document.createElement('div');
    notif.id = 'simple-error-notification';
    notif.innerHTML = `
        <div style="
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: #dc2626 !important;
            color: white !important;
            padding: 15px 20px !important;
            border-radius: 5px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            z-index: 999999 !important;
            font-family: Arial, sans-serif !important;
            font-size: 14px !important;
            max-width: 400px !important;
            border: 2px solid #b91c1c !important;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notif);
    
    // Xóa sau thời gian quy định
    setTimeout(() => {
        if (notif && notif.parentNode) {
            notif.remove();
        }
    }, duration);
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
