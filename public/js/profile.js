// profile.js - Updated to include new features: avatar upload, followers, password change, account management

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Profile page loaded. Initializing...");
    await loadUserProfile();
    initializeProfileTabs();
    initializeAvatarUpload();
    initializePasswordChange();
    initializeAccountManagement();
    initializeFollowSystem();
});

/**
 * Helper function to render avatar using avatar.js logic
 * @param {HTMLElement} container - The container element for the avatar
 * @param {string} imageUrl - The URL of the avatar image
 * @param {string} fullName - The full name for fallback initials
 * @param {string} size - The size of the avatar (e.g., '100px')
 */
function renderAvatar(container, imageUrl, fullName, size) {
    if (!container) return;
    container.innerHTML = ''; // Clear previous content

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Avatar của ${fullName}`;
        img.style.width = size;
        img.style.height = size;
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        
        img.onerror = () => {
            console.warn(`Avatar image failed to load: ${imageUrl}. Using fallback.`);
            // Use createFallbackHTML directly to avoid class dependency issues if needed
            container.innerHTML = Avatar.createFallbackHTML(fullName, size);
        };
        container.appendChild(img);
    } else {
        // If no image URL, directly use fallback
        container.innerHTML = Avatar.createFallbackHTML(fullName, size);
    }
}

/**
 * Loads the user profile data based on the logged-in user.
 */
async function loadUserProfile() {
    console.log("Attempting to load user profile...");
    try {
        // Get logged-in user data
        const currentUser = await window.checkLoginStatus();
        // Get user_id from URL parameter (ưu tiên user_id, fallback id cho backward compatibility)
        const urlParams = new URLSearchParams(window.location.search);
        const urlUserId = urlParams.get('user_id') || urlParams.get('id');
        let targetUserId;
        let isOwnProfile = false;
        if (urlUserId) {
            // Đang xem profile người khác hoặc chính mình qua URL
            targetUserId = urlUserId;
            isOwnProfile = currentUser && currentUser.user_id.toString() === urlUserId;
            console.log(`Viewing profile via URL parameter: ${urlUserId}`);
            // Nếu là profile chính mình nhưng có user_id trên URL, redirect về profile.html
            if (isOwnProfile && (urlParams.has('user_id') || urlParams.has('id'))) {
                window.location.href = 'profile.html';
                return;
            }
        } else if (currentUser) {
            // Không có user_id trên URL, xem profile của chính mình
            targetUserId = currentUser.user_id;
            isOwnProfile = true;
            console.log("Viewing own profile (no URL parameter). Using currentUser.");
        } else {
            // Not logged in and no URL parameter
            console.log("User not logged in. Redirecting to login page.");
            displayLoggedOutProfile();
            return;
        }
        // Lưu lại targetUserId và tên để các hàm khác dùng
        window.profileUserId = targetUserId;
        // Fetch detailed profile data from API
        console.log(`Fetching detailed profile for user ID: ${targetUserId}`);
        const profileDataResponse = await fetchApi(`/src/api/users.php?action=get_profile_details&user_id=${targetUserId}`);
        console.log("Complete API response:", profileDataResponse);
        if (profileDataResponse && (profileDataResponse.success === 200 || profileDataResponse.success === true)) {
            let profileData = profileDataResponse.message || profileDataResponse.data;
            if (profileData && profileData.data && typeof profileData.data === 'object') {
                profileData = profileData.data;
            }
            if (profileData && profileData.user && profileData.counts) {
                // Lưu tên user toàn cục để cập nhật các tab
                window.profileUserFullName = profileData.user.full_name || 'Ẩn danh';
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
                console.error("Missing user or counts data. ProfileData structure:", profileData);
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
        console.error("Error loading user profile:", error);
        displayProfileError("Đã xảy ra lỗi khi tải hồ sơ: " + error.message);
    }
}

/**
 * Displays the user profile information on the page.
 */
function displayUserProfile(userData, counts, isOwnProfile = false) {
    console.log("Displaying user profile for:", userData.full_name || 'Ẩn danh');

    // Update profile elements
    const elements = {
        profileFullName: document.getElementById("profile-fullname"),
        profileBio: document.getElementById("profile-bio"),
        profileJoinDate: document.getElementById("profile-joindate"),
        profilePostCount: document.getElementById("profile-post-count"),
        profileReviewCount: document.getElementById("profile-review-count"),
        profileFollowerCount: document.getElementById("profile-follower-count"),
        profileFollowingCount: document.getElementById("profile-following-count"),
        profilePictureContainer: document.getElementById("profile-picture-container"), // Use the container div
        editProfileButton: document.getElementById("edit-profile-button"),
        followButton: document.getElementById("follow-button"),
        unfollowButton: document.getElementById("unfollow-button"),
        avatarUploadContainer: document.getElementById("avatar-upload-container")
    };

    // Update page title
    document.title = `Hồ sơ của ${userData.full_name || 'Ẩn danh'} - YouTalk`;

    // Update text content
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
            console.error("Invalid date format:", userData.created_at);
            elements.profileJoinDate.innerHTML = `<i class="icon-calendar"></i> Tham gia ngày không rõ`;
        }
    }

    // Update counts (ensure they are numbers)
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

    // Update profile picture using renderAvatar
    // Determine size from CSS or set a default (e.g., '100px' based on profile.css)
    const profilePicSize = elements.profilePictureContainer?.style.width || '150px'; // Adjust size as needed
    renderAvatar(elements.profilePictureContainer, userData.profile_picture, userData.full_name || 'Ẩn danh', profilePicSize);

    // Update dynamic usernames in tab headers
    const dynamicUsernames = document.querySelectorAll('.dynamic-username');
    dynamicUsernames.forEach(element => {
        element.textContent = userData.full_name || 'Ẩn danh';
    });

    // Show/hide appropriate buttons
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
    // Show/hide avatar upload button for own profile
    if (elements.avatarUploadContainer) {
        elements.avatarUploadContainer.style.display = isOwnProfile ? "block" : "none";
    }
    // Populate settings form if it exists
    if (isOwnProfile) {
        populateSettingsForm(userData);
    }
}

/**
 * Populates the settings form with user data
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

    // Add form submit handler
    const settingsForm = document.getElementById("profile-settings-form");
    if (settingsForm) {
        // Remove existing event listener if any
        settingsForm.onsubmit = null;
        settingsForm.addEventListener('submit', handleSettingsFormSubmit);
    }
}

/**
 * Handle settings form submission
 */
async function handleSettingsFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const full_name = formData.get('full_name');
    const email = formData.get('email');
    const bio = formData.get('bio');
    const errorDiv = document.getElementById('profile-error');
    const successDiv = document.getElementById('profile-success');
    errorDiv.textContent = '';
    successDiv.textContent = '';
    if (!full_name || !email) {
        errorDiv.textContent = 'Vui lòng nhập đầy đủ thông tin bắt buộc.';
        return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        errorDiv.textContent = 'Email không hợp lệ.';
        return;
    }
    try {
        const res = await fetch('/src/api/users.php?action=update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, bio })
        });
        const data = await res.json();
        if (data.success) {
            successDiv.textContent = 'Cập nhật thông tin thành công!';
            setTimeout(() => {
                location.reload();
            }, 1500); // Reload sau 1.5 giây để người dùng có thể đọc thông báo

            // Nếu backend trả về user mới, cập nhật lại form
            if (data.user) {
                populateSettingsForm(data.user);
            }
        } else {
            let msg = data.message;
            if (typeof msg === 'object') {
                msg = JSON.stringify(msg);
            }
            errorDiv.textContent = msg || 'Có lỗi xảy ra.';
        }
    } catch (error) {
        errorDiv.textContent = 'Không thể kết nối máy chủ.';
    }
}

// Lưu thay đổi thông tin cá nhân
const profileForm = document.getElementById('profile-settings-form');
if (profileForm) {
  profileForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    // Username là mặc định, không cho phép chỉnh sửa
    // const username = document.getElementById('username').value.trim(); // Không gửi username
    const full_name = document.getElementById('full_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const errorDiv = document.getElementById('profile-error');
    const successDiv = document.getElementById('profile-success');
    errorDiv.textContent = '';
    successDiv.textContent = '';
    // Validate đơn giản
    if (!full_name || !email) {
      errorDiv.textContent = 'Vui lòng nhập đầy đủ thông tin bắt buộc.';
      return;
    }
    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errorDiv.textContent = 'Email không hợp lệ.';
      return;
    }
    // Gửi API lưu thay đổi
    try {
      const res = await fetch('/src/api/users.php?action=update_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, bio })
      });
      const data = await res.json();
      if (data.success) {
        successDiv.textContent = 'Cập nhật thông tin thành công!';
        setTimeout(() => {
            location.reload();
        }, 1500); // Reload sau 1.5 giây để người dùng có thể đọc thông báo

      } else {
        let msg = data.message;
        if (typeof msg === 'object') {
          msg = JSON.stringify(msg);
        }
        errorDiv.textContent = msg || 'Có lỗi xảy ra.';
      }
    } catch (error) {
      errorDiv.textContent = 'Không thể kết nối máy chủ.';
    }
});
}

// Ẩn/hiện mật khẩu cho form đổi mật khẩu
function setupPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(function (icon) {
    icon.addEventListener('click', function () {
      const targetId = icon.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.textContent = '🙈';
        } else {
          input.type = 'password';
          icon.textContent = '👁️';
        }
      }
    });
  });
}

setupPasswordToggle();

// Đổi mật khẩu với kiểm tra và thông báo bằng JS
const changePasswordForm = document.getElementById('change-password-form');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const errorDiv = document.getElementById('password-error');
    const successDiv = document.getElementById('password-success');
    errorDiv.textContent = '';
    successDiv.textContent = '';
    // Kiểm tra nhập đủ
    if (!currentPassword || !newPassword || !confirmPassword) {
      errorDiv.textContent = 'Vui lòng nhập đầy đủ các trường.';
      return;
    }
    // Kiểm tra độ mạnh mật khẩu mới
    if (newPassword.length < 8) {
      errorDiv.textContent = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      errorDiv.textContent = 'Mật khẩu mới phải có chữ hoa, chữ thường và số.';
      return;
    }
    // Kiểm tra xác nhận
    if (newPassword !== confirmPassword) {
      errorDiv.textContent = 'Xác nhận mật khẩu không khớp.';
      return;
    }
    // Gửi API đổi mật khẩu
    try {
      const res = await fetch('/src/api/change_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword })
      });
      const data = await res.json();
      if (data.success) {
        successDiv.textContent = 'Đổi mật khẩu thành công!';
        changePasswordForm.reset();
      } else {
        errorDiv.textContent = data.message || 'Có lỗi xảy ra.';
      }
    } catch (err) {
      errorDiv.textContent = 'Không thể kết nối máy chủ.';
    }
});
}

/**
 * Shows logged out state
 */
function displayLoggedOutProfile() {
    const profileContainer = document.querySelector(".profile-header-content");
    const profileContent = document.getElementById("profile-content");

    if (profileContainer) {
        profileContainer.innerHTML = `
            <div class="profile-logged-out-message">
                <h2>Vui lòng đăng nhập</h2>
                <p>Bạn cần đăng nhập để xem hồ sơ.</p>
                <a href="login-register.html" class="cta-button">Đăng nhập / Đăng ký</a>
            </div>
        `;
    }
    
    if (profileContent) {
        profileContent.style.display = "none";
    }
}

/**
 * Shows error message
 */
function displayProfileError(message) {
    const profileContent = document.getElementById("profile-content");
    if (profileContent) {
        profileContent.innerHTML = `<p class="error-message">${message}</p>`;
    }
}

/**
 * Initialize profile tabs - Updated to match HTML structure
 */
function initializeProfileTabs() {
    const tabLinks = document.querySelectorAll(".tab-link");
    const tabContents = document.querySelectorAll(".tab-content");

    if (!tabLinks.length || !tabContents.length) {
        console.log("Tab elements not found");
        return;
    }

    tabLinks.forEach(tabLink => {
        tabLink.addEventListener("click", async (event) => {
            event.preventDefault();
            // Remove active class from all tabs and contents
            tabLinks.forEach(link => link.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            // Add active class to clicked tab
            tabLink.classList.add("active");
            const tabType = tabLink.getAttribute("data-tab");
            const targetContent = document.getElementById(`tab-${tabType}`);
            if (targetContent) {
                targetContent.classList.add("active");
                // Load content for dynamic tabs
                if (["posts", "reviews", "comments", "followers", "following"].includes(tabType)) {
                    try {
                        // Luôn dùng window.profileUserId để load đúng user
                        await loadProfileTabContent(tabType, window.profileUserId);
                    } catch (error) {
                        console.error("Error loading tab content:", error);
                    }
                }
            }
        });
    });
    // Load initial content for posts tab
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
 * Switch to a specific tab programmatically
 */
function switchToTab(tabType) {
    const tabLink = document.querySelector(`.tab-link[data-tab="${tabType}"]`);
    if (tabLink) {
        tabLink.click();
    }
}

/**
 * Load content for profile tabs
 */
async function loadProfileTabContent(tabType, userId) {
    const contentContainer = document.querySelector(`#tab-${tabType}`);
    const listContainer = document.querySelector(`#user-${tabType}-list`);
    
    if (!listContainer) {
        console.log(`List container for ${tabType} not found`);
        return;
    }

    // Show loading state
    listContainer.innerHTML = '<p>Đang tải...</p>';

    console.log(`Loading content for tab: ${tabType}, User ID: ${userId}`);

    try {
        let apiUrl = "";
        let dataKey = "";
        
        switch (tabType) {
            case "posts":
                apiUrl = `/src/api/posts.php?action=list_by_user&user_id=${userId}`;
                dataKey = "posts";
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
        console.log(`Tab ${tabType} API response:`, response);

        if (response && (response.success === true || response.success === 200)) {
            let responseData = extractDataFromResponse(response, dataKey);

            if (responseData && responseData.length > 0) {
                renderTabContent(tabType, responseData, listContainer);
            } else {
                listContainer.innerHTML = `<p>${getEmptyStateMessage(tabType)}</p>`;
            }
        } else {
            listContainer.innerHTML = `<p>Lỗi khi tải dữ liệu.</p>`;
        }
    } catch (error) {
        console.error("Error loading tab content:", error);
        listContainer.innerHTML = `<p>Lỗi khi tải dữ liệu.</p>`;
    }
}

/**
 * Extract data from API response based on expected structure
 */
function extractDataFromResponse(response, dataKey) {
    if (!response) return null;
    
    // Try different response structures
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
 * Get empty state message for different tabs
 */
function getEmptyStateMessage(tabType) {
    const messages = {
        posts: "Chưa có bài đăng nào.",
        reviews: "Chưa có đánh giá nào.",
        comments: "Chưa có bình luận nào.",
        followers: "Chưa có người theo dõi nào.",
        following: "Chưa theo dõi ai."
    };
    
    return `<p class="empty-state">${messages[tabType] || "Không có dữ liệu."}</p>`;
}

/**
 * Render content for different tabs
 */
function renderTabContent(tabType, data, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
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
 * Render posts list
 */
function renderPostsList(posts, container) {
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'discussion-item';
        
        const date = new Date(post.created_at);
        const formattedDate = date.toLocaleDateString('vi-VN');
        
        postElement.innerHTML = `
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
 * Render reviews list
 */
function renderReviewsList(reviews, container) {
    reviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-item';
        
        const date = new Date(review.created_at);
        const formattedDate = date.toLocaleDateString('vi-VN');
        
        // Generate star rating HTML using Font Awesome
        const stars = generateStars(review.rating);
        
        reviewElement.innerHTML = `
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
 * Render comments list
 */
function renderCommentsList(comments, container) {
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
        
        commentElement.innerHTML = `
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
 * Render users list (followers/following)
 */
function renderUsersList(users, container) {
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-grid-item';
        
        // Create avatar container
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'user-avatar';
        
        // Render avatar
        renderAvatar(avatarContainer, user.profile_picture, user.full_name || 'Ẩn danh', '70px');
        
        userElement.appendChild(avatarContainer);
        
        // Add user info
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        
        userInfo.innerHTML = `
            <a href="profile.html?id=${user.id}" class="username"">${user.full_name || 'Ẩn danh'}</a>
        `;
        
        userElement.appendChild(userInfo);
        container.appendChild(userElement);
    });
}

/**
 * Helper function to generate star rating HTML
 */
function generateStars(rating) {
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0) rating = 0;
    if (numRating > 5) rating = 5;

    const fullStars = Math.floor(numRating);
    const halfStar = numRating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    let starsHTML = "";
    for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
    if (halfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>';

    return starsHTML;
}

/**
 * Initialize avatar upload functionality
 */
function initializeAvatarUpload() {
    const changeAvatarButton = document.getElementById('change-avatar-button');
    const avatarUploadModal = document.getElementById('avatar-upload-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal, #cancel-avatar-upload');
    const avatarUploadForm = document.getElementById('avatar-upload-form');
    const avatarFileInput = document.getElementById('avatar-file');
    const avatarPreviewContainer = document.getElementById('avatar-preview-container');
    
    // Hide avatar upload container initially (will be shown only for own profile)
    const avatarUploadContainer = document.getElementById('avatar-upload-container');
    if (avatarUploadContainer) {
        avatarUploadContainer.style.display = 'none';
    }
    
    // Open modal when change avatar button is clicked
    if (changeAvatarButton) {
        changeAvatarButton.addEventListener('click', () => {
            if (avatarUploadModal) {
                avatarUploadModal.style.display = 'block';
            }
        });
    }
    
    // Close modal when close buttons are clicked
    if (closeModalButtons) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (avatarUploadModal) {
                    avatarUploadModal.style.display = 'none';
                    // Clear preview and file input
                    if (avatarFileInput) avatarFileInput.value = '';
                    if (avatarPreviewContainer) avatarPreviewContainer.innerHTML = '';
                }
            });
        });
    }
    
    // Preview selected image
    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', () => {
            if (avatarPreviewContainer) {
                avatarPreviewContainer.innerHTML = '';
                
                if (avatarFileInput.files && avatarFileInput.files[0]) {
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.alt = 'Avatar preview';
                        avatarPreviewContainer.appendChild(img);
                    };
                    
                    reader.readAsDataURL(avatarFileInput.files[0]);
                }
            }
        });
    }
    
    // Handle form submission
    if (avatarUploadForm) {
        avatarUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!avatarFileInput.files || !avatarFileInput.files[0]) {
                alert('Vui lòng chọn một tệp ảnh.');
                return;
            }
            
            const formData = new FormData();
            formData.append('avatarFile', avatarFileInput.files[0]);
            
            try {
                const response = await fetch('/src/api/avatar_upload.php', {
                    method: 'POST',
                    body: formData,
                    // Don't set Content-Type header when using FormData
                });
                
                const result = await response.json();
                
                if (result.success === 200 || result.success === true) {
                    alert('Cập nhật ảnh đại diện thành công!');
                    // Close modal
                    avatarUploadModal.style.display = 'none';
                    // Reload profile to show new avatar
                    await loadUserProfile();
                } else {
                    alert('Lỗi: ' + (result.message || 'Không thể cập nhật ảnh đại diện.'));
                }
            } catch (error) {
                console.error('Error uploading avatar:', error);
                alert('Đã xảy ra lỗi khi tải lên ảnh đại diện.');
            }
        });
    }
}

/**
 * Initialize password change functionality
 */
function initializePasswordChange() {
    const changePasswordForm = document.getElementById('change-password-form');
    
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Basic validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                alert('Vui lòng điền đầy đủ thông tin.');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                alert('Mật khẩu mới và xác nhận mật khẩu không khớp.');
                return;
            }
            
            if (newPassword.length < 8) {
                alert('Mật khẩu mới phải có ít nhất 8 ký tự.');
                return;
            }
            
            try {
                const response = await fetchApi('/src/api/change_password.php', {
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
                
                if (response && response.success === 200) {
                    alert('Đổi mật khẩu thành công!');
                    // Clear form
                    changePasswordForm.reset();
                } else {
                    alert('Lỗi: ' + (response.message || 'Không thể đổi mật khẩu.'));
                }
            } catch (error) {
                console.error('Error changing password:', error);
                alert('Đã xảy ra lỗi khi đổi mật khẩu.');
          }
        });
    }
}


/**
 * Initialize account management functionality
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
    
    // Open modal with appropriate action when buttons are clicked
    if (deactivateButton) {
        deactivateButton.addEventListener('click', () => {
            if (accountActionModal) {
                accountActionTitle.textContent = 'Xác nhận vô hiệu hóa tài khoản';
                accountActionMessage.textContent = 'Bạn có chắc chắn muốn vô hiệu hóa tài khoản? Tài khoản của bạn sẽ bị ẩn và không thể truy cập cho đến khi bạn đăng nhập lại.';
                accountActionType.value = 'deactivate_account';
                accountActionModal.style.display = 'block';
            }
        });
    }
    
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (accountActionModal) {
                accountActionTitle.textContent = 'Xác nhận xóa tài khoản';
                accountActionMessage.textContent = 'Bạn có chắc chắn muốn xóa tài khoản? Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.';
                accountActionType.value = 'delete_account';
                accountActionModal.style.display = 'block';
            }
        });
    }
    
    // Close modal when close buttons are clicked
    if (closeModalButtons) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (accountActionModal) {
                    accountActionModal.style.display = 'none';
                    // Clear password field
                    document.getElementById('confirm-password-action').value = '';
                }
            });
        });
    }
    
    // Handle form submission
    if (accountActionForm) {
        accountActionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('confirm-password-action').value;
            const action = accountActionType.value;
            
            if (!password) {
                alert('Vui lòng nhập mật khẩu để xác nhận.');
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
                    alert(response.message || 'Thao tác thành công!');
                    // Redirect to home page after successful account action
                    window.location.href = 'index.html';
                } else {
                    alert('Lỗi: ' + (response.message || 'Không thể thực hiện thao tác.'));
                }
            } catch (error) {
                console.error('Error performing account action:', error);
                alert('Đã xảy ra lỗi khi thực hiện thao tác.');
            }
        });
    }
}

/**
 * Initialize follow system functionality
 */
function initializeFollowSystem() {
    const followButton = document.getElementById('follow-button');
    const unfollowButton = document.getElementById('unfollow-button');
    if (!followButton || !unfollowButton) return;

    const urlParams = new URLSearchParams(window.location.search);
    const profileUserId = urlParams.get('user_id') || urlParams.get('id');
    window.checkLoginStatus().then(currentUser => {
        if (!currentUser || !profileUserId || currentUser.id == profileUserId) {
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
                    // Không cần reloadFollowerCount vì sẽ reload trang
                    window.location.reload(); // Reload lại trang ngay sau khi theo dõi
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
                    // Không cần reloadFollowerCount vì sẽ reload trang
                    window.location.reload(); // Reload lại trang ngay sau khi hủy theo dõi
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
 * Reload follower count after follow/unfollow
 */
function reloadFollowerCount() {
    const urlParams = new URLSearchParams(window.location.search);
    const profileUserId = urlParams.get('user_id') || urlParams.get('id');
    fetch(`/src/api/followers.php?action=get_followers&user_id=${profileUserId}`)
        .then(res => res.json())
        .then(data => {
            const count = data.followers ? data.followers.length : 0;
            const followerCountEl = document.getElementById('profile-follower-count');
            if (followerCountEl) {
                followerCountEl.textContent = count;
            }
        })
        .catch(err => console.error('Error reloading follower count:', err));
}