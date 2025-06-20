// JavaScript for post detail page functionality
// Handles loading post details, comments, and related posts

document.addEventListener('DOMContentLoaded', async () => {
    console.log('YouTalk Post Detail JS Loaded');
    
    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (postId) {
        console.log('Loading post with ID:', postId);
        
        try {
            // Show loading state
            showLoadingState();
            
            // Setup authentication-dependent UI first
            await setupAuthDependentUI();
            
            // Load all data in parallel for better performance
            await Promise.allSettled([
                loadPostDetails(postId),
                loadComments(postId),
                loadRelatedPosts(postId)
            ]);
            
            // Set up comment form after auth check
            setupCommentForm(postId);
            
        } catch (error) {
            console.error('Error initializing post detail page:', error);
            showErrorState('Có lỗi xảy ra khi tải trang');
        } finally {
            hideLoadingState();
        }
        
    } else {
        // No post ID provided, show error
        console.error('No post ID provided');
        document.getElementById('post-title').textContent = 'Bài viết không hợp lệ';
        document.getElementById('post-body').innerHTML = '<p>Vui lòng chọn một bài viết hợp lệ.</p>';
    }
});

// Load post details
async function loadPostDetails(postId) {
    try {
        console.log('Fetching post details for ID:', postId);
        
        // Use the centralized API utility instead of fetchApi
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

// Render post details to DOM
function renderPostDetails(post) {
    // Update page title
    document.title = `${post.title} - YouTalk`;
    
    // Update post content
    safeSetTextContent('post-title', post.title || 'Không có tiêu đề');
    safeSetInnerHTML('post-body', post.content || 'Không có nội dung');
    safeSetTextContent('post-date', formatDate(post.created_at));
    
    // Update category
    if (post.category_name) {
        safeSetTextContent('post-category', post.category_name);
    }
    
    // Update author info
    const authorName = post.full_name || post.username || 'Ẩn danh';
    safeSetTextContent('author-name', authorName);
    safeSetTextContent('author-bio-name', authorName);
    safeSetTextContent('author-bio-description', post.user_bio || 'Chưa có thông tin về tác giả.');
    safeSetTextContent('author-post-count', post.user_post_count || 0);
    safeSetTextContent('author-comment-count', post.user_comment_count || 0);
    safeSetTextContent('author-join-date', formatDate(post.user_created_at));
    
    // Update stats
    safeSetTextContent('view-count', post.view_count || 0);
    safeSetTextContent('comment-count', post.comment_count || 0);
    safeSetTextContent('total-comments', post.comment_count || 0);
    
    // Update tags and avatars
    updatePostTags(post.tags);
    updateAuthorAvatars(post.profile_picture, post.username, post.full_name);
    
    // Update media gallery
    updateMediaGallery(post.media);
}

// Load comments for the post
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

// Load related posts
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

// Display comments
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

// Display related posts
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

// Update post tags
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

// Update author avatars
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

// Generate avatar HTML
function generateAvatarHtml(profilePicture, username, fullName = null) {
    // Determine the display name (prefer fullName, fallback to username)
    const displayName = fullName || username || 'User';
    
    if (profilePicture) {
        // If profile picture exists, show image with error handling
        return `<img src="images/profiles/${profilePicture}" alt="${displayName}" class="avatar-img" 
                 onerror="this.parentNode.innerHTML = Avatar.createFallbackHTML('${displayName}', '40px')">`;
    } else {
        // If no profile picture, use Avatar fallback directly
        return Avatar.createFallbackHTML(displayName, '40px');
    }
}

// Setup comment form
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
            // Check authentication before submitting
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

// Hide loading placeholders
function hideLoadingPlaceholders() {
    const loadingPlaceholders = document.querySelectorAll('.loading-placeholder');
    loadingPlaceholders.forEach(placeholder => {
        placeholder.style.display = 'none';
    });
}

// Update media gallery - simplified
function updateMediaGallery(media) {
    const galleryContainer = document.getElementById('post-media-gallery');
    const mediaGrid = document.getElementById('media-grid');
    const postBody = document.getElementById('post-body');
    
    if (!media || !Array.isArray(media) || media.length === 0) {
        galleryContainer.style.display = 'none';
        if (postBody) postBody.classList.remove('has-gallery');
        return;
    }
    
    // Add has-gallery class to post body
    if (postBody) postBody.classList.add('has-gallery');
    
    // Clear existing content
    mediaGrid.innerHTML = '';
    
    // Simple grid layout
    mediaGrid.className = 'media-grid';
    
    // Create simple media items
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
        
        // No click handler - just display images
        
        mediaGrid.appendChild(mediaItem);
    });
    
    // Show gallery
    galleryContainer.style.display = 'block';
}

// Simple image display - no lightbox functionality needed

// Thay thế các hàm showNotification cũ bằng showSuccess/showError/showWarning từ notifications.js

// Utility functions for DOM manipulation and error handling
function safeSetTextContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = content || '';
    }
}

function safeSetInnerHTML(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content || '';
    }
}

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

function showLoadingState() {
    // Show loading indicators
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(el => {
        if (el) el.style.display = 'flex';
    });
}

function hideLoadingState() {
    // Hide loading indicators
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(el => {
        if (el) el.style.display = 'none';
    });
}

function showErrorState(message) {
    console.error('Error state:', message);
    if (typeof showError === 'function') {
        showError(message);
    } else {
        alert(message);
    }
}

// Format date function
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

// Setup authentication-dependent UI
async function setupAuthDependentUI() {
    try {
        // Check if user is logged in using the global auth check
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
        // Default to guest state
        const authRequired = document.querySelectorAll('.auth-required');
        const guestOnly = document.querySelectorAll('.guest-only');
        authRequired.forEach(el => el.style.display = 'none');
        guestOnly.forEach(el => el.style.display = 'block');
    }
}

// Fallback fetchApi function if not available globally
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
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text with ellipsis
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
