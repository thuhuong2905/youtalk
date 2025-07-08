// Xử lý chức năng trang chi tiết bài viết
// Quản lý tải chi tiết bài viết, bình luận và bài viết liên quan

document.addEventListener('DOMContentLoaded', async () => {
    console.log('YouTalk Post Detail JS Loaded');
    
    // Lấy ID bài viết từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (postId) {
        console.log('Loading post with ID:', postId);
        
        try {
            // Hiển thị trạng thái đang tải
            showLoadingState();
            
            // Thiết lập UI phụ thuộc xác thực trước
            await setupAuthDependentUI();
            
            // Tải tất cả dữ liệu song song để cải thiện hiệu suất
            await Promise.allSettled([
                loadPostDetails(postId),
                loadComments(postId),
                loadRelatedPosts(postId)
            ]);
            
            // Thiết lập form bình luận sau khi kiểm tra xác thực
            setupCommentForm(postId);
            
        } catch (error) {
            console.error('Error initializing post detail page:', error);
            showErrorState('Có lỗi xảy ra khi tải trang');
        } finally {
            hideLoadingState();
        }
        
    } else {
        // Không có ID bài viết, hiển thị lỗi
        console.error('No post ID provided');
        document.getElementById('post-title').textContent = 'Bài viết không hợp lệ';
        document.getElementById('post-body').innerHTML = '<p>Vui lòng chọn một bài viết hợp lệ.</p>';
    }
});

/**
 * Tải chi tiết bài viết từ backend
 * Gọi API để lấy thông tin đầy đủ của bài viết
 */
async function loadPostDetails(postId) {
    try {
        console.log('Fetching post details for ID:', postId);
        
        // Sử dụng tiện ích API tập trung thay vì fetchApi
        const response = await (window.fetchApi || fetchApi)(`posts.php?action=get&id=${postId}`);
        
        console.log('Post API response:', response);
        
        if (response && response.success && response.data) {
            const post = response.data;
            renderPostDetails(post);
        } else {
            throw new Error(response?.message || 'Failed to load post details');
        }
    } catch (error) {
        console.error('Error loading post details:', error);
        showPostError('Không tìm thấy bài viết', 'Bài viết không tồn tại hoặc đã bị xóa.');
    }
}

/**
 * Hiển thị chi tiết bài viết lên DOM
 * Cập nhật tất cả thông tin bài viết, tác giả và thống kê
 */
function renderPostDetails(post) {
    // Cập nhật tiêu đề trang
    document.title = `${post.title} - YouTalk`;
    
    // Cập nhật nội dung bài viết
    safeSetTextContent('post-title', post.title || 'Không có tiêu đề');
    safeSetInnerHTML('post-body', post.content || 'Không có nội dung');
    safeSetTextContent('post-date', formatDate(post.created_at));
    
    // Cập nhật danh mục
    if (post.category_name) {
        safeSetTextContent('post-category', post.category_name);
    }
    
    // Cập nhật thông tin tác giả
    const authorName = post.full_name || post.username || 'Ẩn danh';
    safeSetTextContent('author-name', authorName);
    safeSetTextContent('author-bio-name', authorName);
    safeSetTextContent('author-bio-description', post.user_bio || 'Chưa có thông tin về tác giả.');
    safeSetTextContent('author-post-count', post.user_post_count || 0);
    safeSetTextContent('author-comment-count', post.user_comment_count || 0);
    safeSetTextContent('author-join-date', formatDate(post.user_created_at));
    
    // Cập nhật thống kê
    safeSetTextContent('view-count', post.view_count || 0);
    safeSetTextContent('comment-count', post.comment_count || 0);
    safeSetTextContent('total-comments', post.comment_count || 0);
    
    // Cập nhật thẻ và avatar
    updatePostTags(post.tags);
    updateAuthorAvatars(post.profile_picture, post.username, post.full_name);
    
    // Cập nhật thư viện media
    updateMediaGallery(post.media);
}

/**
 * Tải bình luận cho bài viết từ backend
 * Gọi API để lấy danh sách bình luận và hiển thị
 */
async function loadComments(postId) {
    try {
        console.log('Loading comments for post:', postId);
        
        const response = await (window.fetchApi || fetchApi)(`posts.php?action=get_comments&post_id=${postId}`);
        
        console.log('Comments API response:', response);
        
        if (response && response.success && response.data && response.data.comments) {
            const comments = response.data.comments;
            displayComments(comments);
        } else {
            console.log('No comments found or error loading comments');
            safeSetInnerHTML('comments-list', '<p class="no-comments">Chưa có bình luận nào.</p>');
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        safeSetInnerHTML('comments-list', '<p class="error-message">Có lỗi xảy ra khi tải bình luận.</p>');
    }
}

/**
 * Tải bài viết liên quan từ backend
 * Gọi API để lấy danh sách bài viết có liên quan và hiển thị
 */
async function loadRelatedPosts(postId) {
    try {
        console.log('Loading related posts for post:', postId);
        
        const response = await (window.fetchApi || fetchApi)(`posts.php?action=get_related&post_id=${postId}`);
        
        console.log('Related posts API response:', response);
        
        if (response && response.success && response.data && response.data.posts) {
            const relatedPosts = response.data.posts;
            displayRelatedPosts(relatedPosts);
        } else {
            console.log('No related posts found');
            safeSetInnerHTML('related-posts-list', '<p class="no-related">Không có bài viết liên quan.</p>');
        }
    } catch (error) {
        console.error('Error loading related posts:', error);
        safeSetInnerHTML('related-posts-list', '<p class="error-message">Có lỗi xảy ra khi tải bài viết liên quan.</p>');
    }
}

/**
 * Hiển thị danh sách bình luận lên DOM
 * Tạo HTML cho từng bình luận với thông tin tác giả và thời gian
 */
function displayComments(comments) {
    const commentsList = document.getElementById('comments-list');
    
    if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<p>Chưa có bình luận nào.</p>';
        return;
    }
    
    let commentsHTML = '';
    comments.forEach(comment => {
        commentsHTML += `
            <div class="comment-item">
                <div class="comment-author">
                    <div class="comment-avatar">
                        ${generateAvatarHtml(comment.profile_picture, comment.username, comment.full_name)}
                    </div>
                    <div class="comment-info">
                        <span class="comment-author-name">${comment.full_name || comment.username || 'Ẩn danh'}</span>
                        <span class="comment-date">${formatDate(comment.created_at)}</span>
                    </div>
                </div>
                <div class="comment-content">
                    ${comment.content || ''}
                </div>
            </div>
        `;
    });
    
    commentsList.innerHTML = commentsHTML;
}

/**
 * Hiển thị danh sách bài viết liên quan lên DOM
 * Tạo HTML cho từng bài viết với title, meta và excerpt
 */
function displayRelatedPosts(posts) {
    const relatedPostsList = document.getElementById('related-posts-list');
    
    if (!posts || posts.length === 0) {
        relatedPostsList.innerHTML = '<p>Không có bài viết liên quan.</p>';
        return;
    }
    
    let postsHTML = '';
    posts.forEach(post => {
        postsHTML += `
            <div class="related-post-item">
                <h4><a href="post-detail.html?id=${post.id}">${post.title}</a></h4>
                <div class="related-post-meta">
                    <span class="author">${post.full_name || post.username || 'Ẩn danh'}</span>
                    <span class="date">${formatDate(post.created_at)}</span>
                </div>
                <p class="related-post-excerpt">${truncateText(post.content, 100)}</p>
            </div>
        `;
    });
    
    relatedPostsList.innerHTML = postsHTML;
}

/**
 * Cập nhật hiển thị thẻ bài viết
 * Hiển thị danh sách thẻ hoặc ẩn container nếu không có thẻ
 */
function updatePostTags(tags) {
    const tagsContainer = document.getElementById('post-tags');
    
    if (!tags || tags.length === 0) {
        tagsContainer.style.display = 'none';
        return;
    }
    
    let tagsHTML = '';
    tags.forEach(tag => {
        tagsHTML += `<span class="tag">${tag}</span>`;
    });
    
    tagsContainer.innerHTML = tagsHTML;
    tagsContainer.style.display = 'block';
}

/**
 * Cập nhật avatar tác giả
 * Cập nhật tất cả container avatar với ảnh đại diện hoặc fallback
 */
function updateAuthorAvatars(profilePicture, username, fullName = null) {
    const displayName = fullName || username || 'User';
    const avatarContainers = [
        document.getElementById('author-avatar-container'),
        document.getElementById('author-bio-avatar-container')
    ];
    
    avatarContainers.forEach(container => {
        if (container) {
            container.innerHTML = generateAvatarHtml(profilePicture, username, displayName);
        }
    });
}

/**
 * Tạo HTML cho avatar
 * Hiển thị ảnh đại diện hoặc fallback nếu không có ảnh
 */
function generateAvatarHtml(profilePicture, username, fullName = null) {
    // Xác định tên hiển thị (ưu tiên fullName, fallback về username)
    const displayName = fullName || username || 'User';
    
    if (profilePicture) {
        // Nếu có ảnh đại diện, hiển thị ảnh với xử lý lỗi
        return `<img src="images/profiles/${profilePicture}" alt="${displayName}" class="avatar-img" 
                 onerror="this.parentNode.innerHTML = Avatar.createFallbackHTML('${displayName}', '40px')">`;
    } else {
        // Nếu không có ảnh đại diện, sử dụng Avatar fallback trực tiếp
        return Avatar.createFallbackHTML(displayName, '40px');
    }
}

/**
 * Thiết lập form bình luận
 * Xử lý gửi bình luận với kiểm tra xác thực
 */
function setupCommentForm(postId) {
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const contentInput = document.getElementById('comment-content');
            const content = contentInput.value.trim();
            if (!content) {
                showWarning('Vui lòng nhập nội dung bình luận.');
                return;
            }
            // Kiểm tra xác thực trước khi gửi
            const isLoggedIn = await (window.checkLoginStatus ? !!(await window.checkLoginStatus()) : (window.checkAuthStatus ? window.checkAuthStatus() : false));
            if (!isLoggedIn) {
                showError('Bạn cần đăng nhập để bình luận.');
                return;
            }
            const submitButton = commentForm.querySelector('button[type="submit"]');
            const originalText = submitButton?.textContent || 'Gửi bình luận';
            try {
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Đang gửi...';
                }
                const response = await (window.fetchApi || fetchApi)('comments.php?action=create', {
                    method: 'POST',
                    body: {
                        post_id: postId,
                        content: content
                    }
                });
                if (response && response.success) {
                    showSuccess('Bình luận đã được thêm thành công!');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    throw new Error(response?.message || 'Lỗi không xác định');
                }
            } catch (error) {
                console.error('Error submitting comment:', error);
                showError('Có lỗi xảy ra khi gửi bình luận: ' + error.message);
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            }
        });
    }
}

/**
 * Ẩn các placeholder đang tải
 * Ẩn tất cả element có class loading-placeholder
 */
function hideLoadingPlaceholders() {
    const loadingPlaceholders = document.querySelectorAll('.loading-placeholder');
    loadingPlaceholders.forEach(placeholder => {
        placeholder.style.display = 'none';
    });
}

/**
 * Cập nhật thư viện media - phiên bản đơn giản
 * Hiển thị grid ảnh mà không có lightbox
 */
function updateMediaGallery(media) {
    const galleryContainer = document.getElementById('post-media-gallery');
    const mediaGrid = document.getElementById('media-grid');
    const postBody = document.getElementById('post-body');
    
    if (!media || !Array.isArray(media) || media.length === 0) {
        galleryContainer.style.display = 'none';
        if (postBody) postBody.classList.remove('has-gallery');
        return;
    }
    
    // Thêm class has-gallery vào post body
    if (postBody) postBody.classList.add('has-gallery');
    
    // Xóa nội dung hiện có
    mediaGrid.innerHTML = '';
    
    // Layout grid đơn giản
    mediaGrid.className = 'media-grid';
    
    // Tạo các media item đơn giản
    media.forEach((imagePath, index) => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.style.cssText = `
            border-radius: 8px;
            overflow: hidden;
            background: #f5f5f5;
        `;
        
        mediaItem.innerHTML = `
            <img src="${imagePath}" alt="Hình ảnh ${index + 1}" loading="lazy" 
                 style="width: 100%; height: 200px; object-fit: cover; display: block;"
                 onerror="this.style.display='none'">
        `;
        
        // Không có click handler - chỉ hiển thị ảnh
        
        mediaGrid.appendChild(mediaItem);
    });
    
    // Hiển thị gallery
    galleryContainer.style.display = 'block';
}

// Hiển thị ảnh đơn giản - không cần chức năng lightbox

// Thay thế các hàm showNotification cũ bằng showSuccess/showError/showWarning từ notifications.js

// Các hàm tiện ích cho thao tác DOM và xử lý lỗi
/**
 * Thiết lập nội dung text an toàn cho element
 * Kiểm tra element tồn tại trước khi set content
 */
function safeSetTextContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = content || '';
    }
}

/**
 * Thiết lập innerHTML an toàn cho element
 * Kiểm tra element tồn tại trước khi set HTML content
 */
function safeSetInnerHTML(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content || '';
    }
}

/**
 * Hiển thị lỗi bài viết
 * Cập nhật title và body với thông báo lỗi và nút quay lại
 */
function showPostError(title, message) {
    document.getElementById('post-title').textContent = title;
    document.getElementById('post-body').innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <p class="error-message">${message}</p>
            <a href="index.html" class="back-link">← Quay lại trang chủ</a>
        </div>
    `;
}

/**
 * Hiển thị trạng thái đang tải
 * Hiển thị tất cả indicator tải với class loading-placeholder
 */
function showLoadingState() {
    // Hiển thị các indicator đang tải
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(el => {
        if (el) el.style.display = 'flex';
    });
}

/**
 * Ẩn trạng thái đang tải
 * Ẩn tất cả indicator tải với class loading-placeholder
 */
function hideLoadingState() {
    // Ẩn các indicator đang tải
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(el => {
        if (el) el.style.display = 'none';
    });
}

/**
 * Hiển thị trạng thái lỗi
 * Gọi function showError hoặc fallback alert nếu không có
 */
function showErrorState(message) {
    console.error('Error state:', message);
    if (typeof showError === 'function') {
        showError(message);
    } else {
        alert(message);
    }
}

/**
 * Định dạng ngày tháng
 * Chuyển đổi chuỗi ngày thành định dạng tiếng Việt
 */
function formatDate(dateString) {
    if (!dateString) return '--/--/----';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '--/--/----';
    }
}

/**
 * Thiết lập UI phụ thuộc vào xác thực
 * Hiển thị/ẩn các element dựa trên trạng thái đăng nhập
 */
async function setupAuthDependentUI() {
    try {
        // Kiểm tra người dùng đã đăng nhập bằng global auth check
        const isLoggedIn = await (window.checkLoginStatus ? !!(await window.checkLoginStatus()) : false);
        
        const authRequired = document.querySelectorAll('.auth-required');
        const guestOnly = document.querySelectorAll('.guest-only');
        
        if (isLoggedIn) {
            authRequired.forEach(el => el.style.display = 'block');
            guestOnly.forEach(el => el.style.display = 'none');
        } else {
            authRequired.forEach(el => el.style.display = 'none');
            guestOnly.forEach(el => el.style.display = 'block');
        }
    } catch (error) {
        console.error('Error setting up auth UI:', error);
        // Mặc định về trạng thái guest
        const authRequired = document.querySelectorAll('.auth-required');
        const guestOnly = document.querySelectorAll('.guest-only');
        authRequired.forEach(el => el.style.display = 'none');
        guestOnly.forEach(el => el.style.display = 'block');
    }
}

/**
 * Function fetchApi fallback nếu không có sẵn globally
 * Cung cấp implementation mặc định cho việc gọi API
 */
if (typeof window.fetchApi === 'undefined') {
    window.fetchApi = async function(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        if (mergedOptions.body && typeof mergedOptions.body === 'object') {
            mergedOptions.body = JSON.stringify(mergedOptions.body);
        }
        
        try {
            const response = await fetch(`/src/api/${url}`, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    };
}

/**
 * Helper function to truncate text with proper word boundary
*/
function truncateText(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    // Find the last space within the maxLength to avoid cutting words
    let truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength / 2) { // Only cut at space if it's reasonably far in
        truncated = truncated.substring(0, lastSpace);
    }
    return truncated + "...";
}
