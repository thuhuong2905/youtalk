// Xử lý chức năng trang hồ sơ người dùng
// Bao gồm: tải hồ sơ, upload avatar, đổi mật khẩu, quản lý tài khoản, hệ thống theo dõi

/**
 * Khởi tạo trang hồ sơ người dùng khi DOM đã tải xong
 * - Tải thông tin hồ sơ người dùng từ API
 * - Thiết lập các tab navigation (posts, reviews, comments, followers, following, settings)
 * - Khởi tạo chức năng upload avatar
 * - Thiết lập form đổi mật khẩu với validation
 * - Cấu hình quản lý tài khoản (vô hiệu hóa/xóa)
 * - Thiết lập hệ thống theo dõi (follow/unfollow)
 */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Trang hồ sơ đã tải. Đang khởi tạo...");
    await loadUserProfile();        // Tải thông tin hồ sơ người dùng
    initializeProfileTabs();        // Khởi tạo các tab hồ sơ
    initializeAvatarUpload();       // Khởi tạo chức năng upload avatar
    initializePasswordChange();     // Khởi tạo chức năng đổi mật khẩu
    initializeAccountManagement();  // Khởi tạo quản lý tài khoản
    initializeFollowSystem();       // Khởi tạo hệ thống theo dõi
});

/**
 * Hàm trợ giúp để hiển thị avatar sử dụng logic avatar.js cho trang hồ sơ
 * Hàm này giữ nguyên nút upload bằng cách chỉ cập nhật nội dung avatar
 * container - Phần tử chứa avatar
 * imageUrl - URL của ảnh avatar
 * fullName - Tên đầy đủ để tạo chữ cái thay thế
 * size - Kích thước của avatar (ví dụ: '150px')
 */
function renderProfileAvatar(container, imageUrl, fullName, size) {
    if (!container) return;
    
    // Chỉ xóa nội dung avatar, không xóa toàn bộ container
    const existingAvatar = container.querySelector('img, .profile-avatar-fallback, .user-avatar-fallback');
    if (existingAvatar) {
        existingAvatar.remove();
    }

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Avatar của ${fullName}`;
        img.className = 'profile-avatar-img';
        img.style.width = size;
        img.style.height = size;
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        
        img.onerror = () => {
            console.warn(`Ảnh avatar không thể tải: ${imageUrl}. Sử dụng ảnh dự phòng.`);
            img.remove();
            // Sử dụng Avatar.createFallback() trực tiếp để tránh div lồng nhau
            const fallbackElement = Avatar.createFallback(fullName, size);
            fallbackElement.className = 'profile-avatar-fallback';
            container.appendChild(fallbackElement);
        };
        container.appendChild(img);
    } else {
        // Nếu không có URL ảnh, sử dụng trực tiếp Avatar.createFallback()
        const fallbackElement = Avatar.createFallback(fullName, size);
        fallbackElement.className = 'profile-avatar-fallback';
        container.appendChild(fallbackElement);
    }
}

/**
 * Hàm trợ giúp để hiển thị avatar cho các component khác (bình luận, v.v.)
 * container - Phần tử chứa avatar
 * imageUrl - URL của ảnh avatar
 * fullName - Tên đầy đủ để tạo chữ cái thay thế
 * size - Kích thước của avatar (ví dụ: '100px')
 */
function renderAvatar(container, imageUrl, fullName, size) {
    if (!container) return;
    container.innerHTML = ''; // Xóa nội dung trước đó

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Avatar của ${fullName}`;
        img.style.width = size;
        img.style.height = size;
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        
        img.onerror = () => {
            console.warn(`Ảnh avatar không thể tải: ${imageUrl}. Sử dụng ảnh dự phòng.`);
            container.innerHTML = Avatar.createFallbackHTML(fullName, size);
        };
        container.appendChild(img);
    } else {
        // Nếu không có URL ảnh, sử dụng trực tiếp ảnh dự phòng
        container.innerHTML = Avatar.createFallbackHTML(fullName, size);
    }
}

/**
 * Tải dữ liệu hồ sơ người dùng dựa trên người dùng đã đăng nhập
 * - Xác định user ID từ URL parameter hoặc session hiện tại
 * - Kiểm tra quyền truy cập (own profile vs other's profile)
 * - Lấy dữ liệu chi tiết từ API users.php
 * - Hiển thị thông tin hồ sơ và các thống kê
 * - Cấu hình visibility cho các nút và tab dựa trên quyền
 */
async function loadUserProfile() {
    console.log("Đang cố gắng tải hồ sơ người dùng...");
    try {
        // Lấy dữ liệu người dùng đã đăng nhập
        const currentUser = await window.checkLoginStatus();
        // Lấy user_id từ tham số URL (ưu tiên user_id, fallback id cho backward compatibility)
        const urlParams = new URLSearchParams(window.location.search);
        const urlUserId = urlParams.get('user_id') || urlParams.get('id');
        let targetUserId;
        let isOwnProfile = false;
        if (urlUserId) {
            // Đang xem profile người khác hoặc chính mình qua URL
            targetUserId = urlUserId;
            isOwnProfile = currentUser && currentUser.user_id.toString() === urlUserId;
            console.log(`Đang xem hồ sơ qua tham số URL: ${urlUserId}`);
            // Nếu là profile chính mình nhưng có user_id trên URL, redirect về profile.html
            if (isOwnProfile && (urlParams.has('user_id') || urlParams.has('id'))) {
                window.location.href = 'profile.html';
                return;
            }
        } else if (currentUser) {
            // Không có user_id trên URL, xem profile của chính mình
            targetUserId = currentUser.user_id;
            isOwnProfile = true;
            console.log("Đang xem hồ sơ của chính mình (không có tham số URL). Sử dụng currentUser.");
        } else {
            // Chưa đăng nhập và không có tham số URL
            console.log("Người dùng chưa đăng nhập. Chuyển hướng đến trang đăng nhập.");
            window.location.href = 'login-register.html?message=profile_login_required&redirect=profile.html';
            return;
        }
        // Lưu lại targetUserId và tên để các hàm khác dùng
        window.profileUserId = targetUserId;
        // Lấy dữ liệu hồ sơ chi tiết từ API
        console.log(`Đang lấy hồ sơ chi tiết cho user ID: ${targetUserId}`);
        const profileDataResponse = await fetchApi(`/src/api/users.php?action=get_profile_details&user_id=${targetUserId}`);
        console.log("Phản hồi API đầy đủ:", profileDataResponse);
        if (profileDataResponse && (profileDataResponse.success === 200 || profileDataResponse.success === true)) {
            let profileData = profileDataResponse.message || profileDataResponse.data;
            if (profileData && profileData.data && typeof profileData.data === 'object') {
                profileData = profileData.data;
            }
            if (profileData && profileData.user && profileData.counts) {
                // Lưu tên user toàn cục để cập nhật các tab
                window.profileUserFullName = profileData.user.full_name || 'Ẩn danh';
                // Lưu thông tin để kiểm tra quyền xóa bài đăng
                window.isOwnProfile = isOwnProfile;
                window.currentUserId = currentUser ? currentUser.user_id : null;
                
                // Cập nhật tên động cho các tab
                const dynamicUsernames = document.querySelectorAll('.dynamic-username');
                dynamicUsernames.forEach(element => {
                    element.textContent = window.profileUserFullName;
                });
                displayUserProfile(profileData.user, profileData.counts, isOwnProfile);
                loadProfileTabContent("posts", targetUserId);
                // Ẩn/hiện tab settings
                const tabSettings = document.querySelector('[data-tab="settings"]');
                const tabSettingsContent = document.getElementById('tab-settings');
                if (isOwnProfile) {
                    if (tabSettings) tabSettings.style.display = '';
                    if (tabSettingsContent) tabSettingsContent.style.display = '';
                } else {
                    if (tabSettings) tabSettings.style.display = 'none';
                    if (tabSettingsContent) tabSettingsContent.style.display = 'none';
                }
            } else {
                console.error("Thiếu dữ liệu user hoặc counts. Cấu trúc ProfileData:", profileData);
                displayProfileError("Dữ liệu hồ sơ không đầy đủ.");
            }
        } else {
            var errorMessage = "Lỗi không xác định";
            if (profileDataResponse && profileDataResponse.message && typeof profileDataResponse.message === 'string') {
                errorMessage = profileDataResponse.message;
            } else if (profileDataResponse && profileDataResponse.error) {
                errorMessage = profileDataResponse.error;
            }
            displayProfileError("Không thể tải thông tin hồ sơ: " + errorMessage);
        }
    } catch (error) {
        console.error("Lỗi khi tải hồ sơ người dùng:", error);
        displayProfileError("Đã xảy ra lỗi khi tải hồ sơ: " + error.message);
    }
}

/**
 * Hiển thị thông tin hồ sơ người dùng trên trang
 * - Cập nhật tất cả elements UI với dữ liệu người dùng
 * - Hiển thị avatar với fallback logic
 * - Cấu hình visibility cho buttons (edit, follow/unfollow)
 * - Thiết lập số liệu thống kê (posts, reviews, followers)
 * - Populate form settings nếu là own profile
 * userData - Dữ liệu người dùng
 * counts - Số liệu thống kê (bài đăng, đánh giá, người theo dõi...)
 * isOwnProfile - Có phải là hồ sơ của chính mình không
 */
function displayUserProfile(userData, counts, isOwnProfile = false) {
    console.log("Đang hiển thị hồ sơ người dùng cho:", userData.full_name || 'Ẩn danh');

    // Cập nhật các phần tử hồ sơ
    const elements = {
        profileFullName: document.getElementById("profile-fullname"),
        profileBio: document.getElementById("profile-bio"),
        profileJoinDate: document.getElementById("profile-joindate"),
        profilePostCount: document.getElementById("profile-post-count"),
        profileReviewCount: document.getElementById("profile-review-count"),
        profileFollowerCount: document.getElementById("profile-follower-count"),
        profileFollowingCount: document.getElementById("profile-following-count"),
        profilePictureContainer: document.getElementById("profile-picture-container"), // Sử dụng container div
        editProfileButton: document.getElementById("edit-profile-button"),
        followButton: document.getElementById("follow-button"),
        unfollowButton: document.getElementById("unfollow-button"),
        avatarUploadContainer: document.getElementById("avatar-upload-container")
    };

    // Cập nhật tiêu đề trang
    document.title = `Hồ sơ của ${userData.full_name || 'Ẩn danh'} - YouTalk`;

    // Cập nhật nội dung văn bản
    if (elements.profileFullName) {
        elements.profileFullName.textContent = userData.full_name || 'Ẩn danh';
    }
    
    if (elements.profileBio) {
        elements.profileBio.textContent = userData.bio || "Chưa cập nhật tiểu sử.";
    }

    if (elements.profileJoinDate && userData.created_at) {
        try {
            const joinDate = new Date(userData.created_at);
            elements.profileJoinDate.innerHTML = `<i class="icon-calendar"></i> Tham gia ${joinDate.toLocaleDateString("vi-VN")}`;
        } catch (e) {
            console.error("Định dạng ngày không hợp lệ:", userData.created_at);
            elements.profileJoinDate.innerHTML = `<i class="icon-calendar"></i> Tham gia ngày không rõ`;
        }
    }

    // Cập nhật số liệu thống kê (đảm bảo chúng là số)
    if (elements.profilePostCount) {
        elements.profilePostCount.textContent = Number(counts.posts || 0);
    }
    if (elements.profileReviewCount) {
        elements.profileReviewCount.textContent = Number(counts.reviews || 0);
    }
    if (elements.profileFollowerCount) {
        elements.profileFollowerCount.textContent = Number(counts.followers || 0);
    }
    if (elements.profileFollowingCount) {
        elements.profileFollowingCount.textContent = Number(counts.following || 0);
    }

    // Cập nhật ảnh hồ sơ sử dụng renderProfileAvatar (giữ nguyên nút upload)
    // Xác định kích thước từ CSS hoặc đặt mặc định (ví dụ: '150px' dựa trên profile.css)
    const profilePicSize = elements.profilePictureContainer?.style.width || '150px';
    renderProfileAvatar(elements.profilePictureContainer, userData.profile_picture, userData.full_name || 'Ẩn danh', profilePicSize);

    // Cập nhật tên người dùng động trong header tab
    const dynamicUsernames = document.querySelectorAll('.dynamic-username');
    dynamicUsernames.forEach(element => {
        element.textContent = userData.full_name || 'Ẩn danh';
    });

    // Hiển thị/ẩn các nút phù hợp
    if (elements.editProfileButton) {
        elements.editProfileButton.style.display = isOwnProfile ? "inline-block" : "none";
        if (isOwnProfile) {
            elements.editProfileButton.onclick = () => {
                switchToTab('settings');
            };
        } else {
            elements.editProfileButton.onclick = null;
        }
    }
    if (elements.followButton) {
        elements.followButton.style.display = isOwnProfile ? "none" : "inline-block";
    }
    if (elements.unfollowButton) {
        elements.unfollowButton.style.display = isOwnProfile ? "none" : "inline-block";
    }
    // Hiển thị/ẩn nút upload avatar cho hồ sơ của chính mình
    if (elements.avatarUploadContainer) {
        elements.avatarUploadContainer.style.display = isOwnProfile ? "block" : "none";
    }
    // Điền form cài đặt nếu tồn tại
    if (isOwnProfile) {
        populateSettingsForm(userData);
    }
}

/**
 * Điền form cài đặt với dữ liệu người dùng
 * userData - Dữ liệu người dùng
 */
function populateSettingsForm(userData) {
    const usernameInput = document.getElementById("username");
    const fullNameInput = document.getElementById("full_name");
    const emailInput = document.getElementById("email");
    const bioInput = document.getElementById("bio");
    if (usernameInput) usernameInput.value = userData.username || '';
    if (fullNameInput) fullNameInput.value = userData.full_name || '';
    if (emailInput) emailInput.value = userData.email || '';
    if (bioInput) bioInput.value = userData.bio || '';

    // ✅ ĐÃ SỬA: Thêm handler submit cho form cài đặt (instance duy nhất)
    const settingsForm = document.getElementById("profile-settings-form");
    if (settingsForm) {
        // Xóa event listener hiện tại nếu có
        settingsForm.onsubmit = null;
        settingsForm.addEventListener('submit', handleSettingsFormSubmit);
    }
}

/**
 * ✅ ĐÃ SỬA: Xử lý submit form cài đặt (tách ra để tránh trùng lặp)
 */
async function handleSettingsFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const full_name = formData.get('full_name');
    const email = formData.get('email');
    const bio = formData.get('bio');
    const errorDiv = document.getElementById('profile-error');
    const successDiv = document.getElementById('profile-success');
    
    if (errorDiv) errorDiv.textContent = '';
    if (successDiv) successDiv.textContent = '';
    
    if (!full_name || !email) {
        showError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
        return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showError('Email không hợp lệ.');
        return;
    }
    try {
        const res = await fetch('/src/api/users.php?action=update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, bio })
        });
        const data = await res.json();
        console.log('Phản hồi cập nhật hồ sơ:', data);
        
        // Kiểm tra các định dạng phản hồi thành công khác nhau
        if (data.success === 200 || data.success === true || data.success === 'true') {
            showSuccess('Cập nhật thông tin thành công!');
            
            // Nếu backend trả về user mới, cập nhật lại form ngay lập tức
            if (data.user) {
                populateSettingsForm(data.user);
            }
            
            // Reload sau 2 giây để người dùng có thể đọc thông báo
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            let msg = data.message;
            if (typeof msg === 'object') {
                msg = JSON.stringify(msg);
            }
            // Xử lý thông báo lỗi email cụ thể
            if (msg && msg.includes('Địa chỉ email này đã được sử dụng')) {
                showError('Địa chỉ email này đã được sử dụng bởi tài khoản khác.');
            } else {
                showError(msg || 'Có lỗi xảy ra khi cập nhật thông tin.');
            }
        }
    } catch (error) {
        console.error('Lỗi cập nhật hồ sơ:', error);
        showError('Không thể kết nối máy chủ.');
    }
}

/**
 * Hiển thị thông báo lỗi
 * message - Nội dung thông báo lỗi
 */
function displayProfileError(message) {
    const profileContent = document.getElementById("profile-content");
    if (profileContent) {
        profileContent.innerHTML = `<p class="error-message">${message}</p>`;
    }
}

/**
 * Khởi tạo các tab hồ sơ - Cập nhật để khớp với cấu trúc HTML
 * - Thiết lập event listener cho tất cả tab links
 * - Quản lý active state của tabs
 * - Tải nội dung động cho các tab (posts, reviews, comments, followers, following)
 * - Thiết lập tab mặc định (posts)
 */
function initializeProfileTabs() {
    const tabLinks = document.querySelectorAll(".tab-link");
    const tabContents = document.querySelectorAll(".tab-content");

    if (!tabLinks.length || !tabContents.length) {
        console.log("Không tìm thấy các phần tử tab");
        return;
    }

    tabLinks.forEach(tabLink => {
        tabLink.addEventListener("click", async (event) => {
            event.preventDefault();
            // Xóa class active khỏi tất cả tab và nội dung
            tabLinks.forEach(link => link.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            // Thêm class active cho tab được click
            tabLink.classList.add("active");
            const tabType = tabLink.getAttribute("data-tab");
            const targetContent = document.getElementById(`tab-${tabType}`);
            if (targetContent) {
                targetContent.classList.add("active");
                // Tải nội dung cho các tab động
                if (["posts", "reviews", "comments", "followers", "following"].includes(tabType)) {
                    try {
                        // Luôn dùng window.profileUserId để load đúng user
                        await loadProfileTabContent(tabType, window.profileUserId);
                    } catch (error) {
                        console.error("Lỗi khi tải nội dung tab:", error);
                    }
                }
            }
        });
    });
    // Tải nội dung ban đầu cho tab posts
    const postsTab = document.querySelector(".tab-link[data-tab='posts']");
    if (postsTab) {
        postsTab.classList.add("active");
        const postsContent = document.getElementById("tab-posts");
        if (postsContent) {
            postsContent.classList.add("active");
        }
    }
}

/**
 * Chuyển đến tab cụ thể một cách tự động
 * tabType - Loại tab cần chuyển đến
 */
function switchToTab(tabType) {
    const tabLink = document.querySelector(`.tab-link[data-tab="${tabType}"]`);
    if (tabLink) {
        tabLink.click();
    }
}

/**
 * ✅ ĐÃ SỬA: Tải nội dung cho các tab hồ sơ - Sửa lỗi "Đang tải..." vẫn hiển thị
 * tabType - Loại tab (posts, reviews, comments, followers, following)
 * userId - ID người dùng
 */
async function loadProfileTabContent(tabType, userId) {
    const contentContainer = document.querySelector(`#tab-${tabType}`);
    const listContainer = document.querySelector(`#user-${tabType}-list`);
    
    if (!listContainer) {
        console.log(`Không tìm thấy list container cho ${tabType}`);
        return;
    }

    // Hiển thị trạng thái đang tải
    listContainer.innerHTML = '<p>Đang tải...</p>';

    console.log(`Đang tải nội dung cho tab: ${tabType}, User ID: ${userId}`);

    try {
        let apiUrl = "";
        let dataKey = "";
        
        switch (tabType) {
            case "posts":
                try {
                    const response = await window.api.loadUserPosts(userId);
                    console.log('Phản hồi posts tab hồ sơ:', response); // Debug log
                    
                    // ✅ ĐÃ SỬA: Luôn xóa trạng thái loading trước
                    listContainer.innerHTML = '';
                    
                    if (response?.success && response?.data?.posts && Array.isArray(response.data.posts)) {
                        if (response.data.posts.length > 0) {
                            renderPostsList(response.data.posts, listContainer);
                        } else {
                            listContainer.innerHTML = `<p class="empty-state">${getEmptyStateMessage("posts")}</p>`;
                        }
                    } else {
                        console.warn('Cấu trúc phản hồi posts không hợp lệ:', response);
                        listContainer.innerHTML = `<p class="empty-state">${getEmptyStateMessage("posts")}</p>`;
                    }
                    return;
                } catch (error) {
                    console.error("Lỗi khi tải bài đăng người dùng:", error);
                    listContainer.innerHTML = '<p class="error-message">Lỗi khi tải bài đăng.</p>';
                    return;
                }
                break;
            case "reviews":
                apiUrl = `/src/api/reviews.php?action=get_by_user&user_id=${userId}`;
                dataKey = "reviews";
                break;
            case "comments":
                apiUrl = `/src/api/comments.php?action=get_user_comments&user_id=${userId}`;
                dataKey = "comments";
                break;
            case "followers":
                apiUrl = `/src/api/followers.php?action=get_followers&user_id=${userId}`;
                dataKey = "followers";
                break;
            case "following":
                apiUrl = `/src/api/followers.php?action=get_following&user_id=${userId}`;
                dataKey = "following";
                break;
            default:
                listContainer.innerHTML = `<p>Nội dung cho mục này chưa được triển khai.</p>`;
                return;
        }

        const response = await fetchApi(apiUrl);
        console.log(`Tab ${tabType} phản hồi API:`, response);

        // ✅ ĐÃ SỬA: Luôn xóa trạng thái loading trước khi xử lý phản hồi
        listContainer.innerHTML = '';

        if (response && (response.success === true || response.success === 200)) {
            let responseData = extractDataFromResponse(response, dataKey);

            if (responseData && responseData.length > 0) {
                renderTabContent(tabType, responseData, listContainer);
            } else {
                listContainer.innerHTML = `<p class="empty-state">${getEmptyStateMessage(tabType)}</p>`;
            }
        } else {
            listContainer.innerHTML = `<p class="error-message">Lỗi khi tải dữ liệu.</p>`;
        }
    } catch (error) {
        console.error("Lỗi khi tải nội dung tab:", error);
        listContainer.innerHTML = `<p class="error-message">Lỗi khi tải dữ liệu.</p>`;
    }
}

/**
 * Trích xuất dữ liệu từ phản hồi API dựa trên cấu trúc mong đợi
 * response - Phản hồi từ API
 * dataKey - Khóa dữ liệu cần trích xuất
 * returns Dữ liệu đã trích xuất
 */
function extractDataFromResponse(response, dataKey) {
    if (!response) return null;
    
    // Thử các cấu trúc phản hồi khác nhau
    if (response.data && response.data[dataKey]) {
        return response.data[dataKey];
    } else if (response.message && response.message[dataKey]) {
        return response.message[dataKey];
    } else if (response[dataKey]) {
        return response[dataKey];
    } else if (Array.isArray(response)) {
        return response;
    } else if (response.data && Array.isArray(response.data)) {
        return response.data;
    } else if (response.message && Array.isArray(response.message)) {
        return response.message;
    }
    
    return null;
}

/**
 /**
 * Lấy thông báo trạng thái trống cho các tab khác nhau
 * tabType - Loại tab
 * returns Thông báo trạng thái trống
 */
function getEmptyStateMessage(tabType) {
    const messages = {
        posts: "Chưa có bài đăng nào.",
        reviews: "Chưa có đánh giá nào.",
        comments: "Chưa có bình luận nào.",
        followers: "Chưa có người theo dõi nào.",
        following: "Chưa theo dõi ai."
    };
    
    return messages[tabType] || "Không có dữ liệu.";
}

/**
 * Hiển thị nội dung cho các tab khác nhau
 * tabType - Loại tab
 * data - Dữ liệu cần hiển thị
 * container - Container chứa nội dung
 */
function renderTabContent(tabType, data, container) {
    if (!container) return;
    
    // ✅ ĐÃ SỬA: Đảm bảo container sạch trước khi render
    if (container.innerHTML.includes('Đang tải...')) {
        container.innerHTML = '';
    }
    
    switch (tabType) {
        case "posts":
            renderPostsList(data, container);
            break;
        case "reviews":
            renderReviewsList(data, container);
            break;
        case "comments":
            renderCommentsList(data, container);
            break;
        case "followers":
        case "following":
            renderUsersList(data, container);
            break;
    }
}

/**
 * ✅ ĐÃ SỬA: Hiển thị danh sách bài đăng - Đảm bảo trạng thái loading được xóa
 * posts - Danh sách bài đăng
 * container - Container chứa danh sách
 */
function renderPostsList(posts, container) {
    // ✅ Đảm bảo container trống trước khi thêm posts
    if (container.innerHTML.includes('Đang tải...') || container.innerHTML.includes('loading')) {
        container.innerHTML = '';
    }
    
    if (!Array.isArray(posts) || posts.length === 0) {
        container.innerHTML = `<p class="empty-state">${getEmptyStateMessage("posts")}</p>`;
        return;
    }
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'discussion-item';
        
        const date = new Date(post.created_at);
        const formattedDate = date.toLocaleDateString('vi-VN');
        
        // Kiểm tra xem có phải bài đăng của chính mình không
        const isOwnPost = window.isOwnProfile && window.currentUserId && 
                         post.user_id && window.currentUserId.toString() === post.user_id.toString();
        
        postElement.innerHTML = `
            ${isOwnPost ? `<button class="delete-post-btn" onclick="deletePost(${post.id}, this)" title="Xóa bài đăng">Xóa</button>` : ''}
            <div class="discussion-title">
                <a href="post-detail.html?id=${post.id}">${post.title}</a>
            </div>
            <div class="discussion-meta">
                <span>Ngày đăng: <i class="icon-calendar"></i> ${formattedDate}</span>
                <span><i class="icon-comment"></i> ${post.comment_count || 0} bình luận</span>
                <span><i class="icon-eye"></i> ${post.view_count || 0} lượt xem</span>
            </div>
        `;
        
        container.appendChild(postElement);
    });
}

/**
 * Hiển thị danh sách đánh giá
 * reviews - Danh sách đánh giá
 * container - Container chứa danh sách
 */
function renderReviewsList(reviews, container) {
    if (!Array.isArray(reviews) || reviews.length === 0) {
        container.innerHTML = `<p class="empty-state">${getEmptyStateMessage("reviews")}</p>`;
        return;
    }
    
    reviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-item';
        
        const date = new Date(review.created_at);
        const formattedDate = date.toLocaleDateString('vi-VN');
        
        // Tạo HTML đánh giá sao sử dụng Font Awesome
        const stars = generateStars(review.rating);
        
        // Kiểm tra xem có phải đánh giá của chính mình không
        const isOwnReview = window.isOwnProfile && window.currentUserId && 
                           review.user_id && window.currentUserId.toString() === review.user_id.toString();
        
        reviewElement.innerHTML = `
            ${isOwnReview ? `<button class="delete-review-btn" onclick="deleteReview(${review.id}, this)" title="Xóa đánh giá">Xóa</button>` : ''}
            <div class="review-header">
                <div class="review-title">
                    Đánh giá cho: <a href="product-detail.html?id=${review.product_id}">${review.product_name}</a>
                </div>
                <div class="review-rating">Đánh giá: ${stars}</div>
            </div>
            <div class="review-content">Nội dung: ${review.comment}</div>
            <div class="review-meta">
                <span>Ngày đăng: <i class="icon-calendar"></i> ${formattedDate}</span>
            </div>
        `;
        
        container.appendChild(reviewElement);
    });
}

/**
 * Hiển thị danh sách bình luận
 * comments - Danh sách bình luận
 * container - Container chứa danh sách
 */
function renderCommentsList(comments, container) {
    if (!Array.isArray(comments) || comments.length === 0) {
        container.innerHTML = `<p class="empty-state">${getEmptyStateMessage("comments")}</p>`;
        return;
    }
    
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        
        const date = new Date(comment.created_at);
        const formattedDate = date.toLocaleDateString('vi-VN');
        
        let targetUrl = '#';
        let targetTitle = 'Nội dung';
        
        if (comment.post_id) {
            targetUrl = `post-detail.html?id=${comment.post_id}`;
            targetTitle = comment.post_title || 'Bài viết';
        } else if (comment.product_id) {
            targetUrl = `product-detail.html?id=${comment.product_id}`;
            targetTitle = comment.product_name || 'Sản phẩm';
        }
        
        // Kiểm tra xem có phải bình luận của chính mình không
        const isOwnComment = window.isOwnProfile && window.currentUserId && 
                            comment.user_id && window.currentUserId.toString() === comment.user_id.toString();
        
        commentElement.innerHTML = `
            ${isOwnComment ? `<button class="delete-comment-btn" onclick="deleteComment(${comment.id}, this)" title="Xóa bình luận">Xóa</button>` : ''}
            <div class="comment-content">Nội dung bình luận: ${comment.content}</div>
            <div class="comment-meta">
                <span>Ngày đăng: <i class="icon-calendar"></i> ${formattedDate}</span>
                <span><i class="icon-link"></i> bình luận trong <a href="${targetUrl}">${targetTitle}</a></span>
            </div>
        `;
        
        container.appendChild(commentElement);
    });
}

/**
 * Hiển thị danh sách người dùng (followers/following)
 * users - Danh sách người dùng
 * container - Container chứa danh sách
 */
function renderUsersList(users, container) {
    if (!Array.isArray(users) || users.length === 0) {
        const tabType = container.id.includes('followers') ? 'followers' : 'following';
        container.innerHTML = `<p class="empty-state">${getEmptyStateMessage(tabType)}</p>`;
        return;
    }
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-grid-item';
        
        // Tạo container avatar
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'user-avatar';
        
        // Hiển thị avatar
        renderAvatar(avatarContainer, user.profile_picture, user.full_name || 'Ẩn danh', '70px');
        
        userElement.appendChild(avatarContainer);
        
        // Thêm thông tin người dùng
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        
        userInfo.innerHTML = `
            <a href="profile.html?user_id=${user.id}" class="username">${user.full_name || 'Ẩn danh'}</a>
        `;
        
        userElement.appendChild(userInfo);
        container.appendChild(userElement);
    });
}

/**
 * Hàm trợ giúp để tạo HTML đánh giá sao
 * rating - Điểm đánh giá (0-5)
 * returns HTML string của các sao
 */
function generateStars(rating) {
    const numRating = parseFloat(rating);
    let finalRating = numRating;
    if (isNaN(numRating) || numRating < 0) finalRating = 0;
    if (numRating > 5) finalRating = 5;

    const fullStars = Math.floor(finalRating);
    const halfStar = finalRating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    let starsHTML = "";
    for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
    if (halfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>';

    return starsHTML;
}

/**
 * Khởi tạo chức năng upload avatar
 * - Thiết lập modal upload với preview functionality
 * - Validate file type và size (5MB limit)
 * - Xử lý upload qua FormData API
 * - Cập nhật UI sau khi upload thành công
 * - Quản lý loading states và error handling
 */
function initializeAvatarUpload() {
    const changeAvatarButton = document.getElementById('change-avatar-button');
    const avatarUploadModal = document.getElementById('avatar-upload-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal, #cancel-avatar-upload');
    const avatarUploadForm = document.getElementById('avatar-upload-form');
    const avatarFileInput = document.getElementById('avatar-file');
    const avatarPreviewContainer = document.getElementById('avatar-preview-container');
    
    // Hiển thị container upload avatar sẽ được điều khiển bởi displayUserProfile()
    // dựa trên việc có phải hồ sơ của chính người dùng hay không
    
    // Mở modal khi nút thay đổi avatar được click
    if (changeAvatarButton) {
        changeAvatarButton.addEventListener('click', () => {
            if (avatarUploadModal) {
                avatarUploadModal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Ngăn cuộn background
                // Focus vào input file
                if (avatarFileInput) {
                    setTimeout(() => avatarFileInput.focus(), 100);
                }
            }
        });
    }
    
    // Đóng modal khi các nút đóng được click
    if (closeModalButtons && closeModalButtons.length > 0) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (avatarUploadModal) {
                    avatarUploadModal.style.display = 'none';
                    document.body.style.overflow = ''; // Khôi phục cuộn
                    // Xóa preview và file input
                    if (avatarFileInput) avatarFileInput.value = '';
                    if (avatarPreviewContainer) avatarPreviewContainer.innerHTML = '';
                }
            });
        });
    }
    
    // Đóng modal khi click bên ngoài
    if (avatarUploadModal) {
        avatarUploadModal.addEventListener('click', (e) => {
            if (e.target === avatarUploadModal) {
                avatarUploadModal.style.display = 'none';
                document.body.style.overflow = ''; // Khôi phục cuộn
                // Xóa preview và file input
                if (avatarFileInput) avatarFileInput.value = '';
                if (avatarPreviewContainer) avatarPreviewContainer.innerHTML = '';
            }
        });
    }
    
    // Preview ảnh đã chọn
    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', () => {
            if (avatarPreviewContainer) {
                avatarPreviewContainer.innerHTML = '';
                
                if (avatarFileInput.files && avatarFileInput.files[0]) {
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.alt = 'Preview avatar';
                        avatarPreviewContainer.appendChild(img);
                    };
                    
                    reader.readAsDataURL(avatarFileInput.files[0]);
                }
            }
        });
    }
    
    // Xử lý submit form
    if (avatarUploadForm) {
        avatarUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!avatarFileInput.files || !avatarFileInput.files[0]) {
                showError('Vui lòng chọn một tệp ảnh.');
                return;
            }
            
            const file = avatarFileInput.files[0];
            
            // Kiểm tra loại file
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showError('Vui lòng chọn tệp ảnh hợp lệ (JPG, PNG, GIF, WEBP).');
                return;
            }
            
            // Kiểm tra kích thước file (5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                showError('Kích thước tệp quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
                return;
            }
            
            const formData = new FormData();
            formData.append('avatarFile', file);
            
            // Hiển thị trạng thái loading
            const submitButton = avatarUploadForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Đang tải lên...';
            submitButton.disabled = true;
            
            try {
                const response = await fetch('/src/api/avatar_upload.php', {
                    method: 'POST',
                    body: formData,
                    // Không set Content-Type header khi sử dụng FormData
                });
                
                const result = await response.json();
                
                if (result.success === 200 || result.success === true) {
                    showSuccess('Cập nhật ảnh đại diện thành công!');
                    // Đóng modal
                    avatarUploadModal.style.display = 'none';
                    document.body.style.overflow = ''; // Khôi phục cuộn
                    // Xóa form
                    avatarFileInput.value = '';
                    if (avatarPreviewContainer) avatarPreviewContainer.innerHTML = '';
                    // Reload hồ sơ để hiển thị avatar mới
                    await loadUserProfile();
                } else {
                    showError('Lỗi: ' + (result.message || 'Không thể cập nhật ảnh đại diện.'));
                }
            } catch (error) {
                console.error('Lỗi khi upload avatar:', error);
                showError('Đã xảy ra lỗi khi tải lên ảnh đại diện.');
            } finally {
                // Khôi phục trạng thái nút
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }
}

/**
 * ✅ ĐÃ SỬA: Khởi tạo chức năng đổi mật khẩu - Loại bỏ duplicate code
 * - Thiết lập form validation cho current/new/confirm password
 * - Kiểm tra độ mạnh mật khẩu (8+ chars, uppercase, lowercase, number)
 * - Gửi request đến change_password.php API
 * - Thiết lập password toggle visibility
 * - Xử lý success/error responses
 */
function initializePasswordChange() {
    const changePasswordForm = document.getElementById('change-password-form');
    
    if (changePasswordForm) {
        // ✅ Xóa các event listener hiện tại để tránh trùng lặp
        changePasswordForm.onsubmit = null;
        
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current_password').value;
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            const errorDiv = document.getElementById('password-error');
            const successDiv = document.getElementById('password-success');
            
            // Xóa thông báo trước đó
            if (errorDiv) errorDiv.textContent = '';
            if (successDiv) successDiv.textContent = '';
            
            // Kiểm tra cơ bản
            if (!currentPassword || !newPassword || !confirmPassword) {
                showError('Vui lòng điền đầy đủ thông tin.');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
                return;
            }
            
            if (newPassword.length < 8) {
                showError('Mật khẩu mới phải có ít nhất 8 ký tự.');
                return;
            }
            
            // Kiểm tra mật khẩu nâng cao
            if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
                showError('Mật khẩu mới phải có chữ hoa, chữ thường và số.');
                return;
            }
            
            try {
                const response = await fetch('/src/api/change_password.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });
                
                const result = await response.json();
                
                if (result && result.success) {
                    showSuccess('Đổi mật khẩu thành công!');
                    // Xóa form
                    changePasswordForm.reset();
                } else {
                    showError(result.message || 'Không thể đổi mật khẩu.');
                }
            } catch (error) {
                console.error('Lỗi khi đổi mật khẩu:', error);
                showError('Đã xảy ra lỗi khi đổi mật khẩu.');
            }
        });
    }

    // ✅ ĐÃ SỬA: Thiết lập chức năng toggle password (instance duy nhất)
    setupPasswordToggle();
}

/**
 * ✅ ĐÃ SỬA: Thiết lập chức năng toggle password - đồng bộ với auth.js
 */
function setupPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(function (toggle) {
        // Xóa listener hiện tại để tránh trùng lặp
        toggle.onclick = null;
        
        toggle.addEventListener('click', function () {
            const passwordWrapper = this.closest(".password-input-wrapper");
            const passwordInput = passwordWrapper.querySelector("input[type='password'], input[type='text']");
            const icon = this.querySelector("i");

            if (passwordInput && passwordInput.type === "password") {
                passwordInput.type = "text";
                if (icon) {
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                }
            } else if (passwordInput) {
                passwordInput.type = "password";
                if (icon) {
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            }
        });
    });
}

/**
 * Khởi tạo chức năng quản lý tài khoản
 * - Thiết lập modal confirmation cho deactivate/delete account
 * - Yêu cầu xác nhận mật khẩu cho security
 * - Gửi request đến account_management.php API
 * - Redirect user sau khi thực hiện thành công
 * - Xử lý error cases và user feedback
 */
function initializeAccountManagement() {
    const deactivateButton = document.getElementById('deactivate-account-button');
    const deleteButton = document.getElementById('delete-account-button');
    const accountActionModal = document.getElementById('account-action-modal');
    const closeModalButtons = document.querySelectorAll('#account-action-modal .close-modal, #cancel-account-action');
    const accountActionForm = document.getElementById('account-action-form');
    const accountActionTitle = document.getElementById('account-action-title');
    const accountActionMessage = document.getElementById('account-action-message');
    const accountActionType = document.getElementById('account-action-type');
    
    // Mở modal với hành động phù hợp khi các nút được click
    if (deactivateButton) {
        deactivateButton.addEventListener('click', () => {
            if (accountActionModal && accountActionTitle && accountActionMessage && accountActionType) {
                accountActionTitle.textContent = 'Xác nhận vô hiệu hóa tài khoản';
                accountActionMessage.textContent = 'Bạn có chắc chắn muốn vô hiệu hóa tài khoản? Tài khoản của bạn sẽ bị ẩn và không thể truy cập cho đến khi bạn kích hoạt lại.';
                accountActionType.value = 'deactivate_account';
                accountActionModal.style.display = 'block';
            }
        });
    }
    
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (accountActionModal && accountActionTitle && accountActionMessage && accountActionType) {
                accountActionTitle.textContent = 'Xác nhận xóa tài khoản';
                accountActionMessage.textContent = 'Bạn có chắc chắn muốn xóa tài khoản? Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.';
                accountActionType.value = 'delete_account';
                accountActionModal.style.display = 'block';
            }
        });
    }
    
    // Đóng modal khi các nút đóng được click
    if (closeModalButtons) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (accountActionModal) {
                    accountActionModal.style.display = 'none';
                    // Xóa trường mật khẩu
                    const passwordField = document.getElementById('confirm-password-action');
                    if (passwordField) passwordField.value = '';
                }
            });
        });
    }
    
    // Xử lý submit form
    if (accountActionForm) {
        accountActionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('confirm-password-action').value;
            const action = accountActionType.value;
            if (!password) {
                showError('Vui lòng nhập mật khẩu để xác nhận.');
                return;
            }
            try {
                const response = await fetchApi('/src/api/account_management.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: action,
                        password: password
                    })
                });
                if (response && response.success === 200) {
                    showSuccess(response.message || 'Thao tác thành công!');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1200);
                } else {
                    showError('Lỗi: ' + (response.message || 'Không thể thực hiện thao tác.'));
                }
            } catch (error) {
                console.error('Lỗi khi thực hiện hành động tài khoản:', error);
                showError('Đã xảy ra lỗi khi thực hiện thao tác.');
            }
        });
    }
}

/**
 * Khởi tạo chức năng hệ thống theo dõi
 * - Kiểm tra trạng thái đăng nhập và quyền follow
 * - Lấy follow status từ followers.php API
 * - Thiết lập visibility cho follow/unfollow buttons
 * - Xử lý follow/unfollow actions với confirmation
 * - Reload page để cập nhật số liệu sau thao tác
 */
function initializeFollowSystem() {
    const followButton = document.getElementById('follow-button');
    const unfollowButton = document.getElementById('unfollow-button');
    if (!followButton || !unfollowButton) return;

    const urlParams = new URLSearchParams(window.location.search);
    const profileUserId = urlParams.get('user_id') || urlParams.get('id');
    
    window.checkLoginStatus().then(currentUser => {
        if (!currentUser || !profileUserId || currentUser.user_id == profileUserId) {
            followButton.style.display = 'none';
            unfollowButton.style.display = 'none';
            return;
        }
        
        // Kiểm tra trạng thái theo dõi
        fetch(`/src/api/followers.php?action=check_follow_status&target_user_id=${profileUserId}`)
            .then(res => res.json())
            .then(data => {
                // Hỗ trợ cả trường hợp trả về ở root hoặc lồng trong message
                let isFollowing = false;
                if (data && typeof data.is_following !== 'undefined') {
                    isFollowing = data.is_following === true;
                } else if (data && data.message && typeof data.message.is_following !== 'undefined') {
                    isFollowing = data.message.is_following === true;
                }
                
                if (isFollowing) {
                    followButton.style.display = 'none';
                    unfollowButton.style.display = '';
                } else {
                    followButton.style.display = '';
                    unfollowButton.style.display = 'none';
                }
            })
            .catch(() => {
                followButton.style.display = '';
                unfollowButton.style.display = 'none';
            });
    });

    // Sự kiện theo dõi
    followButton.onclick = function () {
        const urlParams = new URLSearchParams(window.location.search);
        const profileUserId = urlParams.get('user_id') || urlParams.get('id');
        
        fetch(`/src/api/followers.php?action=follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ following_user_id: profileUserId })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success === 201 || data.success === true) {
                    followButton.style.display = 'none';
                    unfollowButton.style.display = '';
                    // Reload lại trang để cập nhật số liệu
                    window.location.reload();
                } else {
                    alert(typeof data.message === 'string' ? data.message : JSON.stringify(data.message) || 'Có lỗi xảy ra.');
                }
            })
            .catch(() => {
                alert('Có lỗi xảy ra khi gửi yêu cầu theo dõi.');
            });
    };

    // Sự kiện hủy theo dõi
    unfollowButton.onclick = function () {
        if (!confirm('Bạn có chắc chắn muốn hủy theo dõi người này?')) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const profileUserId = urlParams.get('user_id') || urlParams.get('id');
        
        fetch(`/src/api/followers.php?action=unfollow&following_user_id=${profileUserId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success === 200 || data.success === true) {
                    followButton.style.display = '';
                    unfollowButton.style.display = 'none';
                    // Reload lại trang để cập nhật số liệu
                    window.location.reload();
                } else {
                    alert(typeof data.message === 'string' ? data.message : JSON.stringify(data.message) || 'Có lỗi xảy ra.');
                }
            })
            .catch(() => {
                alert('Có lỗi xảy ra khi gửi yêu cầu hủy theo dõi.');
            });
    };
}

/**
 * Xóa bài đăng của người dùng
 * - Hiển thị confirmation dialog trước khi xóa
 * - Disable button và hiển thị loading state
 * - Gửi DELETE request đến posts.php API
 * - Xóa element khỏi DOM với animation
 * - Cập nhật post count và hiển thị empty state nếu cần
 * postId - ID của bài đăng cần xóa
 * buttonElement - Element nút xóa để disable
 */
async function deletePost(postId, buttonElement) {
    // Hiển thị modal xác nhận
    if (!confirm('Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.')) {
        return;
    }
    
    try {
        // Disable nút để tránh click nhiều lần
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.textContent = 'Đang xóa...';
        }
        
        // Gọi API xóa bài đăng
        const response = await fetchApi(`/src/api/posts.php?action=delete&id=${postId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response && (response.success === true || response.success === 200)) {
            // Hiển thị thông báo thành công
            showNotification('Xóa bài đăng thành công!', 'success');
            
            // Xóa element khỏi DOM
            const postElement = buttonElement.closest('.discussion-item');
            if (postElement) {
                postElement.style.opacity = '0.5';
                postElement.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    postElement.remove();
                    
                    // Kiểm tra nếu không còn bài đăng nào
                    const container = document.getElementById('user-posts-list');
                    if (container && container.children.length === 0) {
                        container.innerHTML = `<p class="empty-state">${getEmptyStateMessage("posts")}</p>`;
                    }
                }, 300);
            }
            
            // Cập nhật số đếm bài đăng
            const postCountElement = document.getElementById('profile-post-count');
            if (postCountElement) {
                const currentCount = parseInt(postCountElement.textContent) || 0;
                if (currentCount > 0) {
                    postCountElement.textContent = currentCount - 1;
                }
            }
            
        } else {
            throw new Error(response?.message || 'Không thể xóa bài đăng');
        }
        
    } catch (error) {
        console.error('Lỗi khi xóa bài đăng:', error);
        showNotification('Có lỗi xảy ra khi xóa bài đăng: ' + error.message, 'error');
        
        // Khôi phục nút nếu có lỗi
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Xóa';
        }
    }
}

/**
 * Hiển thị thông báo notification với animation
 * - Tạo dynamic notification element với styling
 * - Thiết lập màu sắc dựa trên type (success, error, warning, info)
 * - Hiển thị với slide-in animation từ bên phải
 * - Tự động ẩn sau 4 giây hoặc khi user click
 * - Hỗ trợ click to dismiss functionality
 * message - Nội dung thông báo
 * type - Loại thông báo (success, error, warning)
 */
function showNotification(message, type = 'info') {
    // Tạo element thông báo
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Thiết lập màu sắc theo loại
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ffc107';
            notification.style.color = '#212529';
            break;
        default:
            notification.style.backgroundColor = '#17a2b8';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Hiển thị thông báo
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Tự động ẩn sau 4 giây
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
    
    // Cho phép click để đóng
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

/**
 * Xóa đánh giá của người dùng
 * - Confirmation dialog với thông báo warning
 * - Disable button với loading state
 * - DELETE request đến reviews.php API
 * - Animated removal khỏi DOM
 * - Update empty state nếu không còn reviews
 * reviewId - ID của đánh giá cần xóa
 * buttonElement - Element nút xóa để disable
 */
async function deleteReview(reviewId, buttonElement) {
    // Hiển thị modal xác nhận
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.')) {
        return;
    }
    
    try {
        // Disable nút để tránh click nhiều lần
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.textContent = 'Đang xóa...';
        }
        
        // Gọi API xóa đánh giá
        const response = await fetchApi(`/src/api/reviews.php?action=delete&id=${reviewId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response && (response.success === true || response.success === 200)) {
            // Hiển thị thông báo thành công
            showNotification('Xóa đánh giá thành công!', 'success');
            
            // Xóa element khỏi DOM
            const reviewElement = buttonElement.closest('.review-item');
            if (reviewElement) {
                reviewElement.style.opacity = '0.5';
                reviewElement.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    reviewElement.remove();
                    
                    // Kiểm tra nếu không còn đánh giá nào
                    const container = document.getElementById('user-reviews-list');
                    if (container && container.children.length === 0) {
                        container.innerHTML = `<p class="empty-state">${getEmptyStateMessage("reviews")}</p>`;
                    }
                }, 300);
            }
            
        } else {
            throw new Error(response?.message || 'Không thể xóa đánh giá');
        }
        
    } catch (error) {
        console.error('Lỗi khi xóa đánh giá:', error);
        showNotification('Có lỗi xảy ra khi xóa đánh giá: ' + error.message, 'error');
        
        // Khôi phục nút nếu có lỗi
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Xóa';
        }
    }
}

/**
 * Xóa bình luận của người dùng
 * - Confirmation dialog trước khi xóa
 * - Loading state management cho button
 * - DELETE request đến comments.php API
 * - Smooth animation khi remove element
 * - Auto-update empty state message
 * commentId - ID của bình luận cần xóa
 * buttonElement - Element nút xóa để disable
 */
async function deleteComment(commentId, buttonElement) {
    // Hiển thị modal xác nhận
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.')) {
        return;
    }
    
    try {
        // Disable nút để tránh click nhiều lần
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.textContent = 'Đang xóa...';
        }
        
        // Gọi API xóa bình luận
        const response = await fetchApi(`/src/api/comments.php?action=delete&id=${commentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response && (response.success === true || response.success === 200)) {
            // Hiển thị thông báo thành công
            showNotification('Xóa bình luận thành công!', 'success');
            
            // Xóa element khỏi DOM
            const commentElement = buttonElement.closest('.comment-item');
            if (commentElement) {
                commentElement.style.opacity = '0.5';
                commentElement.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    commentElement.remove();
                    
                    // Kiểm tra nếu không còn bình luận nào
                    const container = document.getElementById('user-comments-list');
                    if (container && container.children.length === 0) {
                        container.innerHTML = `<p class="empty-state">${getEmptyStateMessage("comments")}</p>`;
                    }
                }, 300);
            }
            
        } else {
            throw new Error(response?.message || 'Không thể xóa bình luận');
        }
        
    } catch (error) {
        console.error('Lỗi khi xóa bình luận:', error);
        showNotification('Có lỗi xảy ra khi xóa bình luận: ' + error.message, 'error');
        
        // Khôi phục nút nếu có lỗi
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Xóa';
        }
    }
}

// Đảm bảo các hàm xóa có thể được gọi từ global scope cho onclick handlers
window.deletePost = deletePost;
window.deleteReview = deleteReview;
window.deleteComment = deleteComment;