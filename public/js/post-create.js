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
    
    // Set up form submission
    setupFormSubmission();
    
    // Set up realtime validation
    setupRealtimeValidation();
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
            showError('Không thể tải danh mục.');
        }
    } catch (err) {
        showError('Lỗi khi tải danh mục.');
    }
}

/**
 * Load post types for the dropdown (from backend ENUM)
 */
async function loadPostTypes() {
    const postTypeSelect = document.getElementById('post-type');
    if (!postTypeSelect) return;
    
    // Thêm option placeholder
    postTypeSelect.innerHTML = '<option value="" disabled selected>Chọn loại bài viết</option>';
    
    // Gọi API backend để lấy danh sách loại bài viết từ ENUM posts.post_type
    try {
        const res = await fetch('/src/api/posts.php?action=list_post_types');
        if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                postTypeSelect.innerHTML += data.data.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
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
    postTypeSelect.innerHTML += types.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
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
            showError('Chỉ cho phép tối đa 10 hình ảnh.');
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
 * Set error state for a form field
 */
function setFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('success');
            formGroup.classList.add('error');
        }
    }
}

/**
 * Set success state for a form field
 */
function setFieldSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('error');
            formGroup.classList.add('success');
        }
    }
}

/**
 * Clear validation state for a form field
 */
function clearFieldState(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('error', 'success');
        }
    }
}

/**
 * Clear all validation states
 */
function clearAllValidationStates() {
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.classList.remove('error', 'success');
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
        // Clear all previous error states
        clearAllValidationStates();
        
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
            setFieldError('post-title');
            document.getElementById('post-title').focus();
            return false;
        }
        if (title.length > 100) {
            showError('Tiêu đề không được vượt quá 100 ký tự.');
            setFieldError('post-title');
            document.getElementById('post-title').focus();
            return false;
        }
        if (!postType) {
            showError('Vui lòng chọn loại bài viết.');
            setFieldError('post-type');
            document.getElementById('post-type').focus();
            return false;
        }
        if (!category) {
            showError('Vui lòng chọn danh mục.');
            setFieldError('post-category');
            document.getElementById('post-category').focus();
            return false;
        }
        if (!content) {
            showError('Vui lòng nhập nội dung bài viết.');
            setFieldError('post-content');
            document.getElementById('post-content').focus();
            return false;
        }
        if (content.length < 10) {
            showError('Nội dung bài viết phải có ít nhất 10 ký tự.');
            setFieldError('post-content');
            document.getElementById('post-content').focus();
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

/**
 * Set up realtime validation for required fields
 */
function setupRealtimeValidation() {
    const titleInput = document.getElementById('post-title');
    const categorySelect = document.getElementById('post-category');
    const postTypeSelect = document.getElementById('post-type');
    const contentTextarea = document.getElementById('post-content');

    let lastErrorTime = 0;
    const debounceTime = 2000; // 2 giây giữa các thông báo lỗi

    function showValidationError(message) {
        const now = Date.now();
        if (now - lastErrorTime > debounceTime) {
            showError(message);
            lastErrorTime = now;
        }
    }

    // Title validation
    if (titleInput) {
        titleInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                setFieldError('post-title');
                showValidationError('Vui lòng nhập tiêu đề bài viết.');
            } else if (value.length > 100) {
                setFieldError('post-title');
                showValidationError('Tiêu đề không được vượt quá 100 ký tự.');
            } else {
                setFieldSuccess('post-title');
            }
        });
        
        titleInput.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldState('post-title');
            }
        });
    }

    // Post type validation
    if (postTypeSelect) {
        postTypeSelect.addEventListener('blur', function() {
            if (!this.value) {
                setFieldError('post-type');
                showValidationError('Vui lòng chọn loại bài viết.');
            } else {
                setFieldSuccess('post-type');
            }
        });
        
        postTypeSelect.addEventListener('change', function() {
            if (this.value) {
                clearFieldState('post-type');
            }
        });
    }

    // Category validation
    if (categorySelect) {
        categorySelect.addEventListener('blur', function() {
            if (!this.value) {
                setFieldError('post-category');
                showValidationError('Vui lòng chọn danh mục.');
            } else {
                setFieldSuccess('post-category');
            }
        });
        
        categorySelect.addEventListener('change', function() {
            if (this.value) {
                clearFieldState('post-category');
            }
        });
    }

    // Content validation
    if (contentTextarea) {
        contentTextarea.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                setFieldError('post-content');
                showValidationError('Vui lòng nhập nội dung bài viết.');
            } else if (value.length < 10) {
                setFieldError('post-content');
                showValidationError('Nội dung bài viết phải có ít nhất 10 ký tự.');
            } else {
                setFieldSuccess('post-content');
            }
        });
        
        contentTextarea.addEventListener('input', function() {
            if (this.value.trim()) {
                clearFieldState('post-content');
            }
        });
    }
}
