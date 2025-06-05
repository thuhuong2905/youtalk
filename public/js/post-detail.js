/**
 * post-detail.js - JavaScript for post detail page functionality
 * Handles fetching and displaying post details, comments, and related posts
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('YouTalk Post Detail JS Loaded');
    
    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
        showError('Không tìm thấy ID bài đăng trong URL');
        return;
    }
    
    // Initialize page
    initPostDetail(postId);
    
    // Set up comment form submission
    setupCommentForm(postId);
    
});

/**
 * Initialize post detail page with data
 * @param {string} postId - The ID of the post to display
 */
async function initPostDetail(postId) {
    try {
        // Kiểm tra đăng nhập để hiển thị form bình luận
        let isLoggedIn = false;
        if (typeof window.checkLoginStatus === 'function') {
            const user = await window.checkLoginStatus();
            isLoggedIn = !!user;
        } else {
            // Fallback nếu không có hàm checkLoginStatus
            try {
                const res = await fetchApi('/auth.php?action=status');
                isLoggedIn = res && res.success && res.data && res.data.authenticated;
            } catch (e) { isLoggedIn = false; }
        }
        // Hiển thị/ẩn form bình luận
        const commentFormContainer = document.querySelector('.comment-form-container.auth-required');
        const loginPrompt = document.querySelector('.login-prompt.guest-only');
        if (isLoggedIn) {
            if (commentFormContainer) commentFormContainer.style.display = '';
            if (loginPrompt) loginPrompt.style.display = 'none';
        } else {
            if (commentFormContainer) commentFormContainer.style.display = 'none';
            if (loginPrompt) loginPrompt.style.display = '';
        }
        // Load post details
        await loadPostDetails(postId);
        // Load comments
        await loadComments(postId);
        // Load related posts
        await loadRelatedPosts(postId);
        // Update login prompt redirect URL
        updateLoginPromptUrl(postId);
    } catch (error) {
        console.error('Error initializing post detail page:', error);
        showError('Đã xảy ra lỗi khi tải dữ liệu bài đăng. Vui lòng thử lại sau.');
    }
}

/**
 * Helper function to render avatar using avatar.js logic
 * @param {HTMLElement} container - The container element for the avatar
 * @param {string} imageUrl - The URL of the avatar image
 * @param {string} fullName - The full name for fallback initials
 * @param {string} size - The size of the avatar (e.g., '50px')
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
 * Load and display post details
 * @param {string} postId - The ID of the post to display
 */
async function loadPostDetails(postId) {
    try {
        const response = await fetchApi(`/src/api/posts.php?action=get&id=${postId}`);
        if (!response.success) {
            throw new Error(response.message || 'Failed to load post details');
        }
        const post = response.data;
        document.title = `${post.title} - YouTalk`;
        document.getElementById('post-title').textContent = post.title;
        document.getElementById('post-category').textContent = post.category_name || 'Chưa phân loại';
        const postDate = new Date(post.created_at);
        document.getElementById('post-date').textContent = postDate.toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        // Hiển thị fullname nếu có, fallback username
        document.getElementById('author-name').textContent = getDisplayName(post);
        document.getElementById('author-role').textContent = post.role === 'admin' ? 'Quản trị viên' : 'Thành viên';
        const authorAvatarContainer = document.getElementById('author-avatar-container');
        renderAvatar(authorAvatarContainer, post.profile_picture, getDisplayName(post), '50px');
        document.getElementById('post-body').innerHTML = post.content;
        document.getElementById('view-count').textContent = post.view_count || 0;
        document.getElementById('comment-count').textContent = post.comment_count || 0;
        document.getElementById('total-comments').textContent = post.comment_count || 0;
        if (post.tags && post.tags.length > 0) {
            const tagsContainer = document.getElementById('post-tags');
            tagsContainer.innerHTML = '';
            const tags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
            tags.forEach(tag => {
                const tagElement = document.createElement('a');
                tagElement.href = `forum.html?tag=${encodeURIComponent(tag)}`;
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        } else {
            document.getElementById('post-tags').style.display = 'none';
        }
        // Update author bio: fullname và bio
        document.getElementById('author-bio-name').textContent = getDisplayName(post);
        document.getElementById('author-bio-description').textContent = post.user_bio && post.user_bio.trim() ? post.user_bio : 'Người dùng chưa cập nhật thông tin giới thiệu.';
        const authorBioAvatarContainer = document.getElementById('author-bio-avatar-container');
        renderAvatar(authorBioAvatarContainer, post.profile_picture, getDisplayName(post), '50px');
        // Sửa lỗi join date: kiểm tra và lấy đúng ngày tạo tài khoản tác giả
        if (post.user_created_at) {
            const joinDate = new Date(post.user_created_at);
            document.getElementById('author-join-date').textContent = joinDate.toLocaleDateString('vi-VN');
        } else {
            document.getElementById('author-join-date').textContent = '--/--/----';
        }
        document.getElementById('author-post-count').textContent = post.user_post_count || 0;
        document.getElementById('author-comment-count').textContent = post.user_comment_count || 0;
    } catch (error) {
        console.error('Error loading post details:', error);
        showError('Không thể tải thông tin bài đăng. Vui lòng thử lại sau.');
    }
}

/**
 * Load and display comments for the post
 * @param {string} postId - The ID of the post
 * @param {number} page - The page number for pagination
 */
async function loadComments(postId, page = 1) {
    try {
        const commentsContainer = document.getElementById('comments-list');
        
        // Show loading state on first load
        if (page === 1) {
            commentsContainer.innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                    <p>Đang tải bình luận...</p>
                </div>
            `;
        }
        
        const response = await fetchApi(`/src/api/posts.php?action=get_comments&post_id=${postId}&page=${page}`);
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to load comments');
        }
        
        const comments = response.data.comments;
        const totalComments = response.data.total || 0;
        const totalPages = response.data.total_pages || 1;
        
        // Update total comments count
        document.getElementById('total-comments').textContent = totalComments;
        document.getElementById('comment-count').textContent = totalComments;
        
        // Clear loading placeholder on first page
        if (page === 1) {
            commentsContainer.innerHTML = '';
        }
        
        if (comments.length === 0 && page === 1) {
            commentsContainer.innerHTML = '<p class="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>';
            return;
        }
        
        // Append comments to container
        comments.forEach(comment => {
            const commentElement = createCommentElement(comment);
            commentsContainer.appendChild(commentElement);
        });
        
        // Show/hide load more button
        const loadMoreContainer = document.getElementById('load-more-container');
        if (page < totalPages) {
            loadMoreContainer.style.display = 'block';
            
            // Set up load more button
            const loadMoreButton = document.getElementById('load-more-comments');
            loadMoreButton.onclick = () => loadComments(postId, page + 1);
        } else {
            loadMoreContainer.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById('comments-list').innerHTML = '<p class="error-message">Không thể tải bình luận. Vui lòng thử lại sau.</p>';
    }
}

/**
 * Create a comment element from comment data
 * @param {Object} comment - The comment data
 * @returns {HTMLElement} - The comment element
 */
function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    
    // Format date
    const commentDate = new Date(comment.created_at);
    const formattedDate = commentDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Create a unique ID for the avatar container if needed, or use a class
    const avatarContainerId = `comment-avatar-${comment.id || Math.random().toString(36).substring(7)}`;

    commentElement.innerHTML = `
        <div class="comment-author">
            <div id="${avatarContainerId}" class="comment-avatar-container" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 1rem; flex-shrink: 0;"></div>
            <div class="comment-author-info">
                <span class="comment-author-name">${getDisplayName(comment)}</span>
                <span class="comment-date">${formattedDate}</span>
            </div>
        </div>
        <div class="comment-content">
            ${comment.content}
        </div>
    `;

    // Render the avatar after the element is created
    const avatarContainer = commentElement.querySelector(`#${avatarContainerId}`);
    renderAvatar(avatarContainer, comment.profile_picture, getDisplayName(comment), '40px');
    
    return commentElement;
}

/**
 * Load and display related posts
 * @param {string} postId - The ID of the current post
 */
async function loadRelatedPosts(postId) {
    try {
        const response = await fetchApi(`/src/api/posts.php?action=get_related&post_id=${postId}`);
        if (!response.success) throw new Error(response.message || 'Không thể tải bài đăng liên quan.');
        const posts = response.data.posts || [];
        const relatedPostsContainer = document.getElementById('related-posts-list');
        if (!posts.length) {
            relatedPostsContainer.innerHTML = '<p class="no-related-posts">Không có bài đăng liên quan.</p>';
            return;
        }
        relatedPostsContainer.innerHTML = '';
        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'related-post-card';
            postCard.innerHTML = `
                <a href="post-detail.html?id=${post.id}"><strong>${post.title}</strong></a>
                <div class="related-post-meta">
                    Bởi <span class="related-author">${getDisplayName(post)}</span>
                    <span class="related-date">${new Date(post.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
            `;
            relatedPostsContainer.appendChild(postCard);
        });
    } catch (error) {
        document.getElementById('related-posts-list').innerHTML = '<p class="error-message">Không thể tải bài đăng liên quan. Vui lòng thử lại sau.</p>';
    }
}

/**
 * Set up comment form submission
 * @param {string} postId - The ID of the post
 */
function setupCommentForm(postId) {
    const commentForm = document.getElementById('comment-form');
    
    if (!commentForm) return;
    
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const commentContent = document.getElementById('comment-content').value.trim();
        
        if (!commentContent) {
            alert('Vui lòng nhập nội dung bình luận');
            return;
        }
        
        try {
            const submitButton = commentForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Đang gửi...';
            
            const response = await fetchApi('/src/api/comments.php?action=create', {
                method: 'POST',
                body: {
                    post_id: postId,
                    content: commentContent
                }
            });
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to add comment');
            }
            
            // Comment added successfully, reload comments
            await loadComments(postId);
            
            // Clear comment form
            document.getElementById('comment-content').value = '';
            
            alert('Bình luận của bạn đã được gửi đi!');
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Đã xảy ra lỗi khi gửi bình luận. Vui lòng thử lại sau.');
        } finally {
            const submitButton = commentForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Gửi bình luận';
        }
    });
}

/**
 * Show an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
    const errorContainer = document.getElementById('error-message');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    } else {
        alert(message);
    }
}

/**
 * Update the login prompt URL for the current post
 * @param {string} postId - The ID of the post
 */
function updateLoginPromptUrl(postId) {
    const loginPrompt = document.querySelector('.login-prompt.guest-only a');
    if (loginPrompt) {
        loginPrompt.href = `login.html?redirect_to=${encodeURIComponent(window.location.href)}`;
    }
}

/**
 * Fetch API helper function
 * @param {string} url - The API endpoint URL
 * @param {Object} options - The fetch options
 * @returns {Promise<Object>} - The JSON response from the API
 */
async function fetchApi(url, options = {}) {
    const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}

