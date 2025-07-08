/**
 * Hệ thống thông báo - JavaScript cho thông báo toast notifications
 * Mô tả: Xử lý hiển thị thông báo dạng toast ở góc phải màn hình
 */

/**
 * Hiển thị thông báo dạng toast notification ở góc phải màn hình
 * Mục đích: Hiển thị thông báo tương tác với người dùng một cách trực quan
 * Chức năng:
 * - Tạo và hiển thị toast notification với animation
 * - Hỗ trợ 4 loại thông báo: success, error, warning, info
 * - Tự động ẩn sau thời gian quy định
 * - Xử lý xóa thông báo cũ khi có thông báo mới
 * - Responsive và có animation mượt mà
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
 * Mục đích: Wrapper function để hiển thị thông báo loại success
 * Chức năng:
 * - Gọi showNotification với type 'success'
 * - Sử dụng màu xanh lá cây cho thông báo tích cực
 * - Thường dùng cho các hành động hoàn thành thành công
 */
function showSuccess(message, duration = 4000) {
    showNotification(message, 'success', duration);
}

/**
 * Hiển thị thông báo lỗi
 * Mục đích: Wrapper function để hiển thị thông báo loại error với fallback
 * Chức năng:
 * - Gọi showNotification với type 'error'
 * - Có cơ chế fallback nếu showNotification thất bại
 * - Sử dụng màu đỏ cho thông báo lỗi
 * - Đảm bảo luôn hiển thị được thông báo lỗi quan trọng
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
 * Mục đích: Tạo thông báo lỗi dự phòng khi hệ thống chính thất bại
 * Chức năng:
 * - Tạo thông báo HTML đơn giản với inline styles
 * - Đảm bảo hiển thị ngay cả khi CSS hoặc JS bị lỗi
 * - Sử dụng z-index cao để luôn hiển thị trên cùng
 * - Có border để dễ nhận biết hơn
 * - Tự động xóa sau thời gian quy định
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
 * Mục đích: Wrapper function để hiển thị thông báo loại warning
 * Chức năng:
 * - Gọi showNotification với type 'warning'
 * - Sử dụng màu vàng/cam cho thông báo cảnh báo
 * - Thường dùng cho các cảnh báo hoặc xác nhận hành động
 */
function showWarning(message, duration = 4000) {
    showNotification(message, 'warning', duration);
}

/**
 * Hiển thị thông báo thông tin
 * Mục đích: Wrapper function để hiển thị thông báo loại info
 * Chức năng:
 * - Gọi showNotification với type 'info'
 * - Sử dụng màu xanh dương cho thông báo thông tin
 * - Thường dùng cho các thông tin hướng dẫn hoặc gợi ý
 */
function showInfo(message, duration = 4000) {
    showNotification(message, 'info', duration);
}

// Export các functions ra global scope để sử dụng trên toàn ứng dụng
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
