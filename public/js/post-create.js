// Xử lý chức năng trang tạo bài viết
// Quản lý gửi form, quản lý thẻ, và tải lên media

document.addEventListener('DOMContentLoaded', function() {
    console.log('YouTalk Post Create JS Loaded');
    // Khởi tạo trang tạo bài viết
    initPostCreatePage();
});

/**
 * Khởi tạo chức năng trang tạo bài viết
 */
function initPostCreatePage() {
    checkAuthForPostCreate();     // Kiểm tra trạng thái xác thực
    loadCategories();             // Tải danh mục cho dropdown
    loadPostTypes();              // Tải loại bài viết cho dropdown
    initTagsInput();              // Khởi tạo input thẻ
    initMediaUpload();            // Khởi tạo tải lên media
    setupFormSubmission();        // Thiết lập gửi form
    setupRealtimeValidation();    // Thiết lập kiểm tra dữ liệu thời gian thực
}

/**
 * Kiểm tra xác thực người dùng để tạo bài viết
 * Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
 */
async function checkAuthForPostCreate() {
    try {
        // Sử dụng hàm checkLoginStatus đã được gán vào window từ auth.js
        if (typeof window.checkLoginStatus === 'function') {
            const user = await window.checkLoginStatus();
            if (!user) {
                // Thêm thông báo vào URL để hiển thị khi chuyển hướng đến trang login
                window.location.href = 'login-register.html?message=login_required&redirect=post-create.html';
            }
        } else {
            // Fallback nếu window.checkLoginStatus chưa có (hiếm khi xảy ra)
            const res = await fetchApi('/auth.php?action=status');
            if (!res.success || !res.data || !res.data.authenticated) {
                window.location.href = 'login-register.html?message=login_required&redirect=post-create.html';
            }
        }
    } catch (err) {
        showError('Không thể kiểm tra trạng thái đăng nhập. Vui lòng thử lại sau.');
        setTimeout(() => {
            window.location.href = 'login-register.html?message=login_required&redirect=post-create.html';
        }, 2000);
    }
}

/**
 * Tải danh mục cho dropdown từ backend
 * Cập nhật cả dropdown chọn danh mục cho bài viết và dropdown sản phẩm mới
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
 * Tải các loại bài viết cho dropdown từ backend ENUM
 * Nếu backend không hỗ trợ, sử dụng danh sách cứng làm fallback
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
 * Khởi tạo chức năng nhập thẻ (tags)
 * Xử lý thêm/xóa thẻ, kiểm tra trùng lặp và giới hạn số lượng
 */
function initTagsInput() {
    const tagsContainer = document.getElementById('tags-container');
    const tagsInput = document.getElementById('tags-input');
    const hiddenTagsInput = document.getElementById('post-tags');
    const tagError = document.getElementById('tag-error');
    
    if (!tagsContainer || !tagsInput || !hiddenTagsInput || !tagError) return;
    
    const tags = [];
    
    // Thêm thẻ khi nhấn Enter hoặc dấu phẩy
    tagsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            
            const tagText = tagsInput.value.trim();
            if (tagText) {
                if (tags.includes(tagText)) {
                    // Hiển thị lỗi khi thẻ bị trùng
                    tagError.textContent = 'Thẻ này đã tồn tại!';
                    tagError.style.display = 'block';
                    return;
                }
                
                if (tags.length >= 5) {
                    // Hiển thị lỗi khi vượt quá số thẻ tối đa
                    tagError.textContent = 'Bạn chỉ có thể thêm tối đa 5 thẻ!';
                    tagError.style.display = 'block';
                    return;
                }
                
                // Xóa lỗi trước đó
                tagError.textContent = '';
                tagError.style.display = 'none';
                
                addTag(tagText);
                tagsInput.value = '';
                updateHiddenInput();
            }
        }
    });
    
    // Thêm thẻ khi input mất focus
    tagsInput.addEventListener('blur', () => {
        const tagText = tagsInput.value.trim();
        if (tagText) {
            if (tags.includes(tagText)) {
                // Hiển thị lỗi khi thẻ bị trùng
                tagError.textContent = 'Thẻ này đã tồn tại!';
                tagError.style.display = 'block';
                return;
            }
            
            if (tags.length >= 5) {
                // Hiển thị lỗi khi vượt quá số thẻ tối đa
                tagError.textContent = 'Bạn chỉ có thể thêm tối đa 5 thẻ!';
                tagError.style.display = 'block';
                return;
            }
            
            // Xóa lỗi trước đó
            tagError.textContent = '';
            tagError.style.display = 'none';
            
            addTag(tagText);
            tagsInput.value = '';
            updateHiddenInput();
        }
    });
    
    // Hàm thêm một thẻ
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
            
            // Xóa lỗi khi xóa thẻ
            tagError.textContent = '';
            tagError.style.display = 'none';
        });
        
        tagElement.appendChild(removeButton);
        tagsContainer.appendChild(tagElement);
    }
    
    // Cập nhật input ẩn với chuỗi JSON của thẻ
    function updateHiddenInput() {
        hiddenTagsInput.value = JSON.stringify(tags);
    }
    
    // Khởi tạo input ẩn
    updateHiddenInput();
}

/**
 * Khởi tạo tải lên ảnh với preview và giới hạn số lượng
 * Cho phép preview ảnh và giới hạn tối đa 10 ảnh
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

// Cấu hình endpoint API
const API_BASE = '/src/api';

/**
 * Xây dựng URL API từ đường dẫn
 * Đảm bảo không lặp lại tiền tố /src/api/
 */
function buildApiUrl(path) {
    // Đảm bảo không lặp /src/api/src/api/ khi gọi fetchApi
    if (path.startsWith('/')) path = path.slice(1);
    if (path.startsWith('src/api/')) path = path.replace(/^src\/api\//, '');
    return API_BASE + '/' + path;
}

/**
 * Hàm hỗ trợ thực hiện yêu cầu API
 * Tự động xử lý JSON và gửi credentials
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
 * Đặt trạng thái lỗi cho một trường form
 * Thêm class 'error' và xóa class 'success' khỏi form-group
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
 * Đặt trạng thái thành công cho một trường form
 * Thêm class 'success' và xóa class 'error' khỏi form-group
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
 * Xóa trạng thái validation cho một trường form
 * Xóa cả class 'error' và 'success' khỏi form-group
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
 * Xóa tất cả trạng thái validation
 * Xóa class 'error' và 'success' khỏi tất cả form-group
 */
function clearAllValidationStates() {
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.classList.remove('error', 'success');
    });
}

/**
 * Thiết lập gửi form
 * Xử lý validation và gửi dữ liệu đến server
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
    
    /**
     * Kiểm tra tính hợp lệ của form tạo bài viết
     * Validates tất cả các trường bắt buộc và format
     */
    function validatePostForm() {
        // Xóa tất cả trạng thái lỗi trước đó
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
    
    /**
     * Gửi bài viết đến server
     * Xử lý FormData và phản hồi từ API
     */
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
 * Định dạng tiền tệ theo kiểu Việt Nam
 * Chuyển đổi số thành định dạng VND
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

/**
 * Thiết lập kiểm tra dữ liệu thời gian thực cho các trường bắt buộc
 * Validate khi người dùng rời khỏi trường và khi nhập liệu
 */
function setupRealtimeValidation() {
    const titleInput = document.getElementById('post-title');
    const categorySelect = document.getElementById('post-category');
    const postTypeSelect = document.getElementById('post-type');
    const contentTextarea = document.getElementById('post-content');

    let lastErrorTime = 0;
    const debounceTime = 2000; // 2 giây giữa các thông báo lỗi

    /**
     * Hiển thị lỗi validation với debounce
     * Tránh spam thông báo lỗi liên tục
     */
    function showValidationError(message) {
        const now = Date.now();
        if (now - lastErrorTime > debounceTime) {
            showError(message);
            lastErrorTime = now;
        }
    }

    // Validation cho tiêu đề
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

    // Validation cho loại bài viết
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

    // Validation cho danh mục
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

    // Validation cho nội dung
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
