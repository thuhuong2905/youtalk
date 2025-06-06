/**
 * post-create.js - JavaScript for the post creation page functionality
 * Handles form submission, tag management, and media uploads
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize post creation page
    initPostCreatePage();
});

/**
 * Initialize the post creation page functionality
 */
function initPostCreatePage() {
    // Check authentication status
    checkAuthForPostCreate();
    
    // Load categories for dropdown
    loadCategories();
    
    // Load post types for the dropdown (from backend or static if needed)
    loadPostTypes();
    
    // Initialize tags input
    initTagsInput();
    
    // Initialize media upload
    initMediaUpload();
    
    // Set up preview functionality
    setupPreviewFunctionality();
    
    // Set up form submission
    setupFormSubmission();
}

/**
 * Check if user is authenticated for post creation
 */
async function checkAuthForPostCreate() {
    try {
        // Sử dụng hàm checkLoginStatus đã được gán vào window từ auth.js
        if (typeof window.checkLoginStatus === 'function') {
            const user = await window.checkLoginStatus();
            if (!user) {
                window.location.href = 'login-register.html';
            }
        } else {
            // Fallback nếu window.checkLoginStatus chưa có (hiếm khi xảy ra)
            const res = await fetchApi('/auth.php?action=status');
            if (!res.success || !res.data || !res.data.authenticated) {
                window.location.href = 'login-register.html';
            }
        }
    } catch (err) {
        showError('Không thể kiểm tra trạng thái đăng nhập. Vui lòng thử lại sau.');
        setTimeout(() => {
            window.location.href = 'login-register.html';
        }, 2000);
    }
}

/**
 * Load categories for the dropdown
 */
async function loadCategories() {
    try {
        const res = await fetchApi('/categories.php?action=list');
        if (res.success && res.data && Array.isArray(res.data.categories)) {
            const select = document.getElementById('post-category');
            select.innerHTML = '<option value="" disabled selected>Chọn danh mục</option>' +
                res.data.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            // Nếu có form thêm sản phẩm mới, cũng load danh mục cho select đó
            const newProductCat = document.getElementById('new-product-category');
            if (newProductCat) {
                newProductCat.innerHTML = '<option value="">Chọn danh mục</option>' +
                    res.data.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            }
        } else {
            alert('Không thể tải danh mục.');
        }
    } catch (err) {
        alert('Lỗi khi tải danh mục.');
    }
}

/**
 * Load post types for the dropdown (from backend ENUM)
 */
async function loadPostTypes() {
    const postTypeSelect = document.getElementById('post-type');
    if (!postTypeSelect) return;
    // Gọi API backend để lấy danh sách loại bài viết từ ENUM posts.post_type
    try {
        const res = await fetch('/src/api/posts.php?action=list_post_types');
        if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                postTypeSelect.innerHTML = data.data.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
                return;
            }
        }
    } catch (e) {}
    // Nếu backend không hỗ trợ, fallback cứng
    const types = [
        { value: 'discussion', label: 'Thảo luận' },
        { value: 'question', label: 'Câu hỏi' },
        { value: 'review', label: 'Đánh giá sản phẩm' },
        { value: 'news', label: 'Tin tức' }
    ];
    postTypeSelect.innerHTML = types.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
}

/**
 * Initialize tags input
 */
function initTagsInput() {
    const tagsContainer = document.getElementById('tags-container');
    const tagsInput = document.getElementById('tags-input');
    const hiddenTagsInput = document.getElementById('post-tags');
    const tagError = document.getElementById('tag-error');
    
    if (!tagsContainer || !tagsInput || !hiddenTagsInput || !tagError) return;
    
    const tags = [];
    
    // Add tag when Enter or comma is pressed
    tagsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            
            const tagText = tagsInput.value.trim();
            if (tagText) {
                if (tags.includes(tagText)) {
                    // Show error for duplicate tag
                    tagError.textContent = 'Thẻ này đã tồn tại!';
                    tagError.style.display = 'block';
                    return;
                }
                
                if (tags.length >= 5) {
                    // Show error for max tags
                    tagError.textContent = 'Bạn chỉ có thể thêm tối đa 5 thẻ!';
                    tagError.style.display = 'block';
                    return;
                }
                
                // Clear any previous error
                tagError.textContent = '';
                tagError.style.display = 'none';
                
                addTag(tagText);
                tagsInput.value = '';
                updateHiddenInput();
            }
        }
    });
    
    // Add tag when input loses focus
    tagsInput.addEventListener('blur', () => {
        const tagText = tagsInput.value.trim();
        if (tagText) {
            if (tags.includes(tagText)) {
                // Show error for duplicate tag
                tagError.textContent = 'Thẻ này đã tồn tại!';
                tagError.style.display = 'block';
                return;
            }
            
            if (tags.length >= 5) {
                // Show error for max tags
                tagError.textContent = 'Bạn chỉ có thể thêm tối đa 5 thẻ!';
                tagError.style.display = 'block';
                return;
            }
            
            // Clear any previous error
            tagError.textContent = '';
            tagError.style.display = 'none';
            
            addTag(tagText);
            tagsInput.value = '';
            updateHiddenInput();
        }
    });
    
    // Function to add a tag
    function addTag(text) {
        tags.push(text);
        
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = text;
        
        const removeButton = document.createElement('span');
        removeButton.className = 'remove-tag';
        removeButton.textContent = '×';
        removeButton.addEventListener('click', () => {
            tagsContainer.removeChild(tagElement);
            const index = tags.indexOf(text);
            if (index !== -1) {
                tags.splice(index, 1);
            }
            updateHiddenInput();
            
            // Clear any error when removing a tag
            tagError.textContent = '';
            tagError.style.display = 'none';
        });
        
        tagElement.appendChild(removeButton);
        tagsContainer.appendChild(tagElement);
    }
    
    // Update hidden input with JSON string of tags
    function updateHiddenInput() {
        hiddenTagsInput.value = JSON.stringify(tags);
    }
    
    // Initialize hidden input
    updateHiddenInput();
}

/**
 * Khởi tạo upload ảnh, preview và giới hạn số lượng ảnh
 */
function initMediaUpload() {
    const mediaInput = document.getElementById('post-media');
    const mediaPreview = document.getElementById('media-preview');
    if (!mediaInput || !mediaPreview) return;
    mediaInput.addEventListener('change', function() {
        mediaPreview.innerHTML = '';
        const files = Array.from(mediaInput.files);
        if (files.length > 10) {
            alert('Chỉ cho phép tối đa 10 hình ảnh.');
            mediaInput.value = '';
            return;
        }
        files.forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'media-preview-img';
                img.style.maxWidth = '100px';
                img.style.margin = '5px';
                mediaPreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
}

// API endpoint config
const API_BASE = '/src/api';

function buildApiUrl(path) {
    // Đảm bảo không lặp /src/api/src/api/ khi gọi fetchApi
    if (path.startsWith('/')) path = path.slice(1);
    if (path.startsWith('src/api/')) path = path.replace(/^src\/api\//, '');
    return API_BASE + '/' + path;
}

/**
 * Helper function to make API requests
 */
async function fetchApi(url, options = {}) {
    // Đảm bảo body là JSON string nếu là object
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        options.body = JSON.stringify(options.body);
    }
    try {
        // Chuẩn hóa url
        let apiUrl = url;
        if (!url.startsWith('http')) {
            apiUrl = buildApiUrl(url);
        }
        const response = await fetch(apiUrl, {
            ...options,
            credentials: 'include', // Đảm bảo luôn gửi cookie/session
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        // Nếu trả về HTML (ví dụ lỗi 404), trả về lỗi rõ ràng
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            const text = await response.text();
            throw new Error('API trả về không phải JSON: ' + text.substring(0, 100));
        }
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * Set up preview functionality
 */
function setupPreviewFunctionality() {
    const previewBtn = document.getElementById('preview-post-btn');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const previewContainer = document.getElementById('post-preview-container');
    const previewContent = document.querySelector('.preview-content');
    const form = document.getElementById('post-create-form');
    
    if (!previewBtn || !closePreviewBtn || !previewContainer || !previewContent || !form) return;
    
    previewBtn.addEventListener('click', () => {
        // Get form data
        const title = document.getElementById('post-title').value;
        const categorySelect = document.getElementById('post-category');
        const categoryText = categorySelect.options[categorySelect.selectedIndex]?.text || '';
        // Lấy nội dung từ textarea thay vì editor cũ
        const content = document.getElementById('post-content').value;
        
        // Get tags
        const tagsValue = document.getElementById('post-tags').value;
        let tagsHtml = '';
        if (tagsValue) {
            try {
                const tags = JSON.parse(tagsValue);
                if (tags.length > 0) {
                    tagsHtml = `<div class="preview-tags">Thẻ: ${tags.map(t => `<span class='tag'>${t}</span>`).join(' ')}</div>`;
                }
            } catch (e) {
                console.error('Error parsing tags:', e);
            }
        }
        // Build preview HTML
        const previewHtml = `
            <h2>${title || 'Tiêu đề bài viết'}</h2>
            ${categoryText ? `<p class="preview-category">Danh mục: ${categoryText}</p>` : ''}
            <div class="preview-content-body">
                ${content ? content.replace(/\n/g, '<br>') : 'Nội dung bài viết'}
            </div>
            ${tagsHtml}
        `;
        // Update preview content
        previewContent.innerHTML = previewHtml;
        // Show preview container
        form.style.display = 'none';
        previewContainer.style.display = 'block';
    });
    closePreviewBtn.addEventListener('click', () => {
        // Hide preview container
        previewContainer.style.display = 'none';
        form.style.display = 'block';
    });
}

/**
 * Set up form submission
 */
function setupFormSubmission() {
    const form = document.getElementById('post-create-form');
    const submitBtn = document.getElementById('submit-post-btn');
    if (!form || !submitBtn) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validatePostForm()) return;
        await submitPost();
    });
    function validatePostForm() {
        const title = document.getElementById('post-title').value.trim();
        const category = document.getElementById('post-category').value;
        const postType = document.getElementById('post-type').value;
        const content = document.getElementById('post-content').value.trim();
        const tagsValue = document.getElementById('post-tags').value;
        let tags = [];
        try { tags = JSON.parse(tagsValue); } catch (e) { tags = []; }
        const mediaInput = document.getElementById('post-media');
        const files = mediaInput ? mediaInput.files : [];
        if (!title) {
            showError('Vui lòng nhập tiêu đề bài viết.');
            return false;
        }
        if (title.length > 100) {
            showError('Tiêu đề không được vượt quá 100 ký tự.');
            return false;
        }
        if (!postType) {
            showError('Vui lòng chọn loại bài viết.');
            return false;
        }
        if (!category) {
            showError('Vui lòng chọn danh mục.');
            return false;
        }
        if (!content) {
            showError('Vui lòng nhập nội dung bài viết.');
            return false;
        }
        if (tags.length > 5) {
            showError('Bạn chỉ có thể thêm tối đa 5 thẻ.');
            return false;
        }
        for (let tag of tags) {
            if (typeof tag !== 'string' || tag.length > 30) {
                showError('Mỗi thẻ phải là chuỗi tối đa 30 ký tự.');
                return false;
            }
        }
        if (files && files.length > 10) {
            showError('Bạn chỉ có thể tải lên tối đa 10 ảnh.');
            return false;
        }
        return true;
    }
    async function submitPost() {
        try {
            submitBtn.disabled = true;
            const formData = new FormData(form);
            if (!formData.get('post_type')) {
                formData.set('post_type', 'discussion');
            }
            const response = await fetch('/src/api/posts.php?action=create', {
                method: 'POST',
                body: formData
            });
            let data;
            try {
                data = await response.json();
            } catch (err) {
                showError('Lỗi hệ thống hoặc kết nối. Vui lòng thử lại sau.');
                submitBtn.disabled = false;
                return;
            }
            if (data.success) {
                showSuccess('Đăng bài thành công! Đang chuyển hướng...');
                setTimeout(() => {
                    window.location.href = `post-detail.html?id=${data.data.post_id}`;
                }, 1200);
            } else {
                showError(`Không thể đăng bài: ${data.message || 'Lỗi không xác định.'}`);
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error submitting post:', error);
            showError('Đã xảy ra lỗi khi đăng bài. Vui lòng thử lại sau.');
            submitBtn.disabled = false;
        }
    }
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}
