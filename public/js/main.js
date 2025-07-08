/**
 * Chức năng chính - JavaScript cho các tính năng chung
 * Mô tả: Xử lý menu mobile, dropdown, điều hướng, cuộn mượt và trạng thái đăng nhập
 */

// Khởi tạo khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", function () {
    // Khởi tạo các thành phần và chức năng chung của trang
    initializeMobileMenu();
    initializeDropdowns();
    initializeActiveNavHighlighting();
    initializeSmoothScroll();
    updateHeaderLoginStatus(); // Thêm cuộc gọi này để cập nhật header dựa trên trạng thái đăng nhập
});

/**
 * Lấy chữ cái đầu từ chuỗi tên
 * Mục đích: Trích xuất chữ cái đầu tiên từ tên để tạo avatar fallback
 * Chức năng:
 * - Lấy chữ cái đầu tiên của từ đầu tiên trong tên
 * - Chuyển thành chữ hoa
 * - Xử lý an toàn với chuỗi null/undefined
 * - Trả về "?" nếu không có tên hợp lệ
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    // Lấy chữ cái đầu tiên của phần tên đầu tiên
    const targetPart = parts[0];
    return targetPart.charAt(0).toUpperCase();
}

/**
 * Thay thế ảnh bị lỗi bằng avatar dự phòng hiển thị chữ cái đầu
 * Mục đích: Xử lý khi ảnh avatar không tải được và hiển thị fallback
 * Chức năng:
 * - Thay thế phần tử ảnh bị lỗi bằng div chứa chữ cái đầu
 * - Sử dụng màu nền được chỉ định
 * - Xử lý lỗi một cách an toàn
 * - Có fallback text nếu tạo div thất bại
 */
function displayFallbackAvatar(imageElement, initial, bgColor) {
    try {
        if (!imageElement || !imageElement.parentNode) {
            console.error("Không thể hiển thị avatar dự phòng: Phần tử ảnh hoặc parent không hợp lệ.");
            return;
        }

        const fallbackDiv = document.createElement('div');
        // Sử dụng class để styling, tương tự như home.js nếu có
        fallbackDiv.className = 'user-avatar-fallback user-avatar-header'; // Thêm user-avatar-header cho styling cụ thể
        fallbackDiv.style.backgroundColor = bgColor;
        fallbackDiv.textContent = initial;

        // Thay thế phần tử ảnh bị lỗi bằng fallback div
        imageElement.parentNode.replaceChild(fallbackDiv, imageElement);
        console.log("Đã thay thế avatar header bị lỗi bằng chữ cái đầu dự phòng.");

    } catch (error) {
        console.error("Lỗi trong displayFallbackAvatar:", error);
        // Tùy chọn: Thêm fallback text rất cơ bản nếu việc tạo div thất bại
        if (imageElement && imageElement.parentNode) {
             const fallbackText = document.createTextNode(initial || '?');
             imageElement.parentNode.replaceChild(fallbackText, imageElement);
        }
    }
}


/**
 * Khởi tạo chức năng toggle menu mobile
 * Mục đích: Thiết lập menu hamburger cho giao diện mobile
 * Chức năng:
 * - Xử lý sự kiện click trên nút hamburger
 * - Toggle hiển thị/ẩn menu chính
 * - Đóng menu khi click bên ngoài
 * - Responsive cho thiết bị di động
 */
function initializeMobileMenu() {
    const hamburger = document.querySelector(".hamburger");
    const mainNav = document.querySelector(".main-nav");

    if (hamburger && mainNav) {
        hamburger.addEventListener("click", function () {
            mainNav.classList.toggle("active");
        });

        // Đóng menu mobile khi click bên ngoài
        document.addEventListener("click", function (e) {
            if (mainNav.classList.contains("active")) {
                if (!mainNav.contains(e.target) && e.target !== hamburger) {
                    mainNav.classList.remove("active");
                }
            }
        });
    }
}

/**
 * Khởi tạo chức năng menu dropdown (hover cho desktop, click cho mobile)
 * Mục đích: Thiết lập hành vi dropdown menu tương thích với nhiều thiết bị
 * Chức năng:
 * - Phát hiện kích thước màn hình (desktop/mobile)
 * - Desktop: Hover để hiện dropdown
 * - Mobile: Click để toggle dropdown
 * - Đóng dropdown khi click bên ngoài
 * - Quản lý trạng thái mở/đóng của các dropdown
 */
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll(".dropdown");

    // Đảm bảo các menu dropdown ban đầu được ẩn
    const allDropdownMenus = document.querySelectorAll(".dropdown-menu");
    allDropdownMenus.forEach((menu) => {
        menu.style.display = "none";
    });

    if (window.innerWidth <= 768) {
        // Mobile: Click để toggle dropdown
        dropdowns.forEach((dropdown) => {
            const link = dropdown.querySelector("a");
            const menu = dropdown.querySelector(".dropdown-menu");

            if (link && menu) {
                link.addEventListener("click", function (e) {
                    // Cho phép điều hướng nếu nó không chỉ là toggle dropdown
                    if (link.getAttribute("href") === "#" || link.getAttribute("href") === "") {
                         e.preventDefault();
                    }
                    // Toggle trạng thái mở
                    const currentlyOpen = dropdown.classList.contains("open");
                    // Đóng các dropdown khác đang mở
                    dropdowns.forEach(d => d.classList.remove("open"));
                    // Toggle dropdown hiện tại
                    if (!currentlyOpen) {
                        dropdown.classList.add("open");
                        menu.style.display = "block"; // Đảm bảo display là block khi mở
                    } else {
                         menu.style.display = "none"; // Đảm bảo display là none khi đóng
                    }
                });
            }
        });
         // Đóng dropdown khi click bên ngoài trên mobile
        document.addEventListener("click", (e) => {
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove("open");
                     const menu = dropdown.querySelector(".dropdown-menu");
                     if(menu) menu.style.display = "none";
                }
            });
        });

    } else {
        // Desktop: Hover để hiện/ẩn dropdown
        dropdowns.forEach((dropdown) => {
            const menu = dropdown.querySelector(".dropdown-menu");
            if (menu) {
                dropdown.addEventListener("mouseenter", () => {
                    menu.style.display = "block";
                });
                dropdown.addEventListener("mouseleave", () => {
                    menu.style.display = "none";
                });
            }
        });
    }
}

/**
 * Đánh dấu liên kết điều hướng đang hoạt động dựa trên URL hiện tại
 * Mục đích: Highlight menu item tương ứng với trang hiện tại
 * Chức năng:
 * - So sánh đường dẫn hiện tại với các liên kết menu
 * - Thêm class "active" cho liên kết phù hợp
 * - Xử lý trường hợp đặc biệt cho trang chủ
 * - Chuẩn hóa đường dẫn để so sánh chính xác
 */
function initializeActiveNavHighlighting() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".main-nav a");

    navLinks.forEach((link) => {
        const linkPath = link.getAttribute("href");
        // Chuẩn hóa đường dẫn để so sánh
        const normalizedCurrentPath = currentPath.endsWith("/") ? currentPath + "index.html" : currentPath;
        const normalizedLinkPath = linkPath;

        // Xóa class active hiện có
        link.parentElement.classList.remove("active");

        if (normalizedLinkPath && normalizedCurrentPath.endsWith(normalizedLinkPath) && normalizedLinkPath !== "#") {
             // Xử lý khớp chính xác hoặc khớp cuối cho các trang như index.html
             if (normalizedLinkPath === "index.html" && !normalizedCurrentPath.endsWith("index.html")) {
                 // Không highlight index.html nếu không ở đường dẫn gốc
             } else {
                link.parentElement.classList.add("active");
             }
        } 
    });
     // Trường hợp đặc biệt cho đường dẫn gốc highlight index.html
     if (currentPath === "/" || currentPath.endsWith("/index.html")) {
         const homeLink = document.querySelector(".main-nav a[href=\"index.html\"]");
         if (homeLink) {
             homeLink.parentElement.classList.add("active");
         }
     }
}

/**
 * Khởi tạo cuộn mượt cho các liên kết anchor
 * Mục đích: Tạo hiệu ứng cuộn mượt khi click vào liên kết nội bộ
 * Chức năng:
 * - Xử lý các liên kết bắt đầu bằng "#"
 * - Cuộn mượt đến phần tử đích
 * - Điều chỉnh vị trí cuộn để tránh che khuất bởi header
 * - Xử lý lỗi với selector không hợp lệ
 */
function initializeSmoothScroll() {
    document.querySelectorAll("a[href^=\"#\"]").forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            // Chỉ xử lý nếu là anchor nội bộ hợp lệ (bắt đầu với # và không chỉ là #)
            if (targetId && targetId.startsWith("#") && targetId.length > 1 && !targetId.includes("http")) {
                e.preventDefault();
                try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 80, // Điều chỉnh cho chiều cao header
                            behavior: "smooth",
                        });
                    }
                } catch (error) {
                    // Nếu querySelector thất bại (selector không hợp lệ), chỉ bỏ qua
                    console.warn('Selector không hợp lệ cho smooth scroll:', targetId);
                }
            }
        });
    });
}


/**
 * Kiểm tra trạng thái đăng nhập và cập nhật giao diện header tương ứng
 * Mục đích: Hiển thị thông tin user hoặc nút đăng nhập dựa trên trạng thái
 * Chức năng:
 * - Kiểm tra trạng thái đăng nhập từ API
 * - Hiển thị avatar và thông tin user nếu đã đăng nhập
 * - Hiển thị nút đăng nhập nếu chưa đăng nhập
 * - Xử lý fallback avatar khi ảnh profile không tải được
 * - Thêm sự kiện đăng xuất
 */
async function updateHeaderLoginStatus() {
    const userActionsDiv = document.getElementById("user-actions");
    if (!userActionsDiv) return;

    try {
        // Kiểm tra trạng thái đăng nhập bằng hàm từ auth.js (trả về dữ liệu user hoặc null)
        // Đảm bảo checkLoginStatus có sẵn globally hoặc được import
        const userData = await window.checkLoginStatus(); 

        if (userData) {
            // User đã đăng nhập
            const fullName = userData.full_name || 'Người dùng'; // Chỉ dùng full_name, không fallback sang username
            const profilePicture = userData.profile_picture;
            const firstInitial = getInitials(fullName); // Sử dụng hàm getInitials
            
            // Tạo màu đơn giản dựa trên chữ cái đầu để đảm bảo nhất quán
            const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#03417F", "#7f8c8d"];
            const colorIndex = firstInitial.charCodeAt(0) % colors.length;
            const bgColor = colors[colorIndex];
            
            // Chuẩn bị HTML fallback div (dùng khi không có ảnh profile)
            const fallbackAvatarHtml = `<div class="user-avatar-fallback user-avatar-header" style="background-color: ${bgColor};">${firstInitial}</div>`;

            let avatarContainerContent; // Nội dung cho thẻ <a>

            if (profilePicture && profilePicture.trim() !== '') {
                // User có ảnh profile - Thêm onerror handler gọi displayFallbackAvatar
                const escapedFullNameForAlt = fullName.replace(/"/g, '&quot;'); // Escape dấu ngoặc kép cho thuộc tính alt
                // SỬA ĐỔI onerror: Gọi displayFallbackAvatar với initial và màu
                avatarContainerContent = `<img src="${encodeURI(profilePicture)}" alt="${escapedFullNameForAlt}" class="user-avatar-header" onerror="displayFallbackAvatar(this, '${firstInitial}', '${bgColor}')">`;
            } else {
                // User không có ảnh profile, dùng fallback div trực tiếp
                avatarContainerContent = fallbackAvatarHtml;
            }

            // Xây dựng HTML cuối cùng cho userActionsDiv
            userActionsDiv.innerHTML = `
                <div class="user-profile-header">
                    <a href="profile.html" class="user-avatar-link">
                        ${avatarContainerContent}
                    </a>
                    <div class="user-info-header">
                         <a href="profile.html" class="username-header">${fullName}</a>
                         <button id="logout-button" class="logout-button">Đăng xuất</button>
                    </div>
                </div>
                <a href="post-create.html" class="cta-button-header">Đăng bài ngay</a>
            `;

            // Thêm event listener cho nút đăng xuất
            const logoutButton = document.getElementById("logout-button");
            if (logoutButton) {
                logoutButton.addEventListener("click", handleLogout);
            }
        } else {
            // User chưa đăng nhập - Đảm bảo hiển thị các liên kết mặc định
            userActionsDiv.innerHTML = `
                <a href="login-register.html" class="auth-link">Đăng nhập</a>
                <a href="post-create.html" class="cta-button-header">Đăng bài ngay</a>
            `;
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đăng nhập header:", error);
        // Tùy chọn hiển thị trạng thái mặc định hoặc thông báo lỗi trong header
        userActionsDiv.innerHTML = `
            <a href="login-register.html" class="auth-link">Đăng nhập</a>
            <a href="post-create.html" class="cta-button-header">Đăng bài ngay</a>
        `;
    }
}

/**
 * Xử lý đăng xuất người dùng
 * Mục đích: Thực hiện quá trình đăng xuất và chuyển hướng
 * Chức năng:
 * - Gọi API đăng xuất
 * - Xử lý phản hồi từ server
 * - Chuyển hướng về trang chủ nếu thành công
 * - Hiển thị thông báo lỗi nếu thất bại
 */
async function handleLogout() {
    try {
        // Đảm bảo fetchApi có sẵn globally hoặc được import
        const response = await fetchApi("auth.php?action=logout", { method: "POST" }); 
        if (response.success) {
            // Chuyển hướng về trang chủ hoặc reload sau khi đăng xuất thành công
            window.location.href = "index.html"; 
        } else {
            console.error("Đăng xuất thất bại:", response.message);
            alert("Đăng xuất thất bại. Vui lòng thử lại.");
        }
    } catch (error) {
        console.error("Lỗi trong quá trình đăng xuất:", error);
        alert("Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại sau.");
    }
}

/**
 * Lấy tên hiển thị ưu tiên full_name, fallback sang "Ẩn danh"
 * Mục đích: Trả về tên hiển thị phù hợp từ object user
 * Chức năng:
 * - Ưu tiên full_name nếu có và không rỗng
 * - Trả về "Ẩn danh" nếu không có tên hợp lệ
 * - Xử lý an toàn với object null/undefined
 */
function getDisplayName(user) {
    if (!user) return "";
    if (user.full_name && user.full_name.trim()) return user.full_name;
    return "Ẩn danh";
}

/**
 * Trả về HTML cho avatar user: ưu tiên profile_picture, fallback là chữ cái đầu
 * Mục đích: Tạo HTML hiển thị avatar của user với xử lý fallback
 * Chức năng:
 * - Sử dụng ảnh profile nếu có
 * - Fallback sang div chứa chữ cái đầu với màu nền
 * - Tạo màu nền ngẫu nhiên dựa trên chữ cái đầu
 * - Xử lý lỗi tải ảnh bằng onerror
 * - Hỗ trợ custom CSS class và alt text
 */
function getUserAvatarHtml(user, sizeClass = '', altText = '') {
    const fullName = (user && user.full_name && user.full_name.trim()) ? user.full_name : 'Ẩn danh';
    const firstInitial = getInitials(fullName);
    const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#03417F", "#7f8c8d"];
    const colorIndex = firstInitial.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    if (user && user.profile_picture && user.profile_picture.trim() !== '') {
        const escapedAlt = altText || fullName.replace(/"/g, '&quot;');
        return `<img src="${encodeURI(user.profile_picture)}" alt="${escapedAlt}" class="user-avatar ${sizeClass}" onerror="displayFallbackAvatar(this, '${firstInitial}', '${bgColor}')">`;
    } else {
        return `<div class="user-avatar-fallback ${sizeClass}" style="background-color: ${bgColor};">${firstInitial}</div>`;
    }
}

// Đảm bảo các hàm trợ giúp như checkLoginStatus và fetchApi được định nghĩa globally hoặc import
// Placeholder cho checkLoginStatus nếu không được định nghĩa ở nơi khác
if (typeof window.checkLoginStatus === 'undefined') {
    window.checkLoginStatus = async () => {
        try {
            const response = await fetchApi('/src/api/auth.php?action=status');
            return response.success && response.data.authenticated ? response.data.user : null;
        } catch (error) {
            console.error('Fallback checkLoginStatus thất bại:', error);
            return null;
        }
    };
}

// Placeholder cho fetchApi nếu không được định nghĩa ở nơi khác
if (typeof window.fetchApi === 'undefined') {
    window.fetchApi = async (url, options = {}) => {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Thêm các header mặc định khác nếu cần
            },
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        if (mergedOptions.body && typeof mergedOptions.body !== 'string') {
            mergedOptions.body = JSON.stringify(mergedOptions.body);
        }

        try {
            const response = await fetch(url, mergedOptions);
            if (!response.ok) {
                // Cố gắng parse thông báo lỗi từ response body
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Bỏ qua nếu response body không phải JSON
                }
                throw new Error(errorData?.message || `Lỗi HTTP! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Gọi API thất bại:', url, error);
            // Trả về cấu trúc lỗi nhất quán
            return { success: false, message: error.message || 'Lỗi mạng hoặc phản hồi không hợp lệ' };
        }
    };
}