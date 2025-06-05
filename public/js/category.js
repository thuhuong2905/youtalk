// JavaScript cho chức năng trang danh mục
// Xử lý tải sản phẩm theo danh mục và lọc

document.addEventListener('DOMContentLoaded', () => {
    console.log('YouTalk Category JS Loaded');
    
    // Lấy category ID từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');
    
    if (categoryId) {
        // Tải thông tin danh mục
        loadCategoryDetails(categoryId);
        
        // Tải sản phẩm cho danh mục này
        loadCategoryProducts(categoryId);
        
        // Tải thảo luận cho danh mục này
        loadCategoryDiscussions(categoryId);
    } else {
        // Không có category ID, hiển thị lỗi
        document.getElementById('category-title').textContent = 'Danh mục không hợp lệ';
        const productList = document.getElementById('products-grid');
        if (productList) productList.innerHTML = '<p>Vui lòng chọn một danh mục hợp lệ.</p>';
    }
    
    // Thiết lập sự kiện cho filter và sort
    setupFilterHandlers(categoryId);
});

// Tải thông tin danh mục
async function loadCategoryDetails(categoryId) {
    try {
        const response = await fetchApi('/src/api/products.php?action=get_category', {
            method: 'POST',
            body: { id: categoryId }
        });
        
        if (response && response.success) {
            // Cập nhật tiêu đề trang
            const categoryName = response.category?.name || response.data?.category?.name || response.name || 'Danh mục';
            document.getElementById('category-title').textContent = categoryName;
            document.title = `${categoryName} - YouTalk`;
            
            // Cập nhật breadcrumb nếu có
            const breadcrumbCategory = document.getElementById('breadcrumb-category');
            if (breadcrumbCategory) {
                breadcrumbCategory.textContent = categoryName;
            }
            // Cập nhật mô tả nếu có
            const categoryDesc = response.category?.description || response.data?.category?.description || '';
            document.getElementById('category-description').textContent = categoryDesc;
        } else {
            console.error('Không tải được thông tin danh mục:', response?.message || 'Unknown error');
            document.getElementById('category-title').textContent = 'Không tìm thấy danh mục';
        }
    } catch (error) {
        console.error('Lỗi khi tải thông tin danh mục:', error);
        document.getElementById('category-title').textContent = 'Lỗi tải danh mục';
    }
}

// Tải sản phẩm theo danh mục
async function loadCategoryProducts(categoryId, filters = {}) {
    try {
        // Lấy options sắp xếp
        const sortSelect = document.getElementById('sort-options');
        const sortBy = sortSelect ? sortSelect.value : 'newest';
        
        // Map option sắp xếp sang API
        let sortParams = {};
        switch (sortBy) {
            case 'newest': sortParams = { sort_by: 'created_at', sort_order: 'DESC' }; break;
            case 'popular': sortParams = { sort_by: 'view_count', sort_order: 'DESC' }; break;
            case 'rating_high': sortParams = { sort_by: 'avg_rating', sort_order: 'DESC' }; break;
            case 'rating_low': sortParams = { sort_by: 'avg_rating', sort_order: 'ASC' }; break;
            case 'price_high': sortParams = { sort_by: 'price', sort_order: 'DESC' }; break;
            case 'price_low': sortParams = { sort_by: 'price', sort_order: 'ASC' }; break;
            default: sortParams = { sort_by: 'created_at', sort_order: 'DESC' };
        }
        
        // Kết hợp filter và sort
        const requestData = {
            category_id: categoryId,
            limit: 12,
            offset: 0,
            ...sortParams,
            ...filters
        };
        
        const response = await fetchApi('/src/api/products.php?action=get_by_category', {
            method: 'POST',
            body: requestData
        });
        
        const productList = document.getElementById('products-grid');
        if (!productList) return;
        
        // Xóa loading
        productList.innerHTML = '';
        
        if (response && response.success) {
            const products = response.products || response.data?.products || [];
            
            if (!Array.isArray(products) || products.length === 0) {
                productList.innerHTML = '<p>Không tìm thấy sản phẩm nào trong danh mục này.</p>';
                return;
            }
            
            products.forEach(product => {
                // Lấy ảnh đầu tiên hoặc ảnh mặc định
                const imageUrl = product.images && Array.isArray(product.images) && product.images.length > 0 
                    ? product.images[0] 
                    : 'images/products/default.png';
                
                // Hiển thị giá hoặc "Liên hệ"
                const priceDisplay = product.price 
                    ? `${product.price.toLocaleString('vi-VN')} đ` 
                    : 'Liên hệ để biết giá';
                
                // Tính sao đánh giá
                const rating = product.avg_rating || 0;
                const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
                
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${product.name}" onerror="this.src='images/products/default.png'">
                    <div class="product-card-content">
                        <h3>${product.name}</h3>
                        <div class="rating">${stars} (${product.review_count || 0})</div>
                        <div class="price">${priceDisplay}</div>
                        <a href="product-detail.html?id=${product.id}" class="cta-button">Xem chi tiết</a>
                    </div>
                `;
                productList.appendChild(productCard);
            });
            
            // Cập nhật phân trang nếu có
            if (response.pagination || response.data?.pagination) {
                updatePagination(response.pagination || response.data?.pagination);
            }
        } else {
            productList.innerHTML = '<p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>';
        }
    } catch (error) {
        const productList = document.getElementById('products-grid');
        if (productList) {
            productList.innerHTML = '<p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>';
        }
    }
}

// Tải thảo luận theo danh mục
async function loadCategoryDiscussions(categoryId) {
    try {
        const response = await fetchApi('/src/api/posts.php?action=get_by_category', {
            method: 'POST',
            body: {
                category_id: categoryId,
                limit: 5,
                sort_by: 'created_at',
                sort_order: 'DESC'
            }
        });
        
        const discussionList = document.getElementById('category-discussion-list');
        if (!discussionList) return;
        
        // Xóa loading
        discussionList.innerHTML = '';
        
        if (response && response.success) {
            const posts = response.posts || response.data?.posts || [];
            
            if (!Array.isArray(posts) || posts.length === 0) {
                discussionList.innerHTML = '<p>Chưa có thảo luận nào trong danh mục này.</p>';
                return;
            }
            
            posts.forEach(post => {
                const discussionItem = document.createElement('div');
                discussionItem.className = 'discussion-item';
                const postDate = new Date(post.created_at);
                const formattedDate = postDate.toLocaleDateString('vi-VN');
                discussionItem.innerHTML = `
                    <h3><a href="post-detail.html?id=${post.id}">${post.title}</a></h3>
                    <div class="meta">
                        <span class="author">Bởi: ${getDisplayName(post) || 'Người dùng ẩn danh'}</span>
                        <span class="date">${formattedDate}</span>
                        <span class="comments">${post.comment_count || 0} bình luận</span>
                    </div>
                `;
                discussionList.appendChild(discussionItem);
            });
        } else {
            discussionList.innerHTML = '<p>Không thể tải thảo luận. Vui lòng thử lại sau.</p>';
        }
    } catch (error) {
        const discussionList = document.getElementById('category-discussion-list');
        if (discussionList) {
            discussionList.innerHTML = '<p>Không thể tải thảo luận. Vui lòng thử lại sau.</p>';
        }
    }
}

// Thiết lập sự kiện filter, sort
function setupFilterHandlers(categoryId) {
    // Sort
    const sortSelect = document.getElementById('sort-options');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            loadCategoryProducts(categoryId, getFilterValues());
        });
    }
    // (Có thể thêm filter khác như giá, rating...)
}

// Lấy giá trị filter
function getFilterValues() {
    const filters = {};
    // Có thể bổ sung filter giá, rating, brand...
    return filters;
}

// Cập nhật phân trang
function updatePagination(pagination) {
    const paginationContainer = document.getElementById('pagination-category');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    if (pagination && typeof pagination === 'object') {
        const total = pagination.total || 0;
        const limit = pagination.limit || 12;
        if (total > limit) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'cta-button';
            loadMoreBtn.textContent = 'Tải thêm sản phẩm';
            loadMoreBtn.addEventListener('click', () => {
                // Load more logic (paging)
            });
            paginationContainer.appendChild(loadMoreBtn);
        }
    }
}

// Helper: Lấy tên hiển thị
function getDisplayName(obj) {
    if (obj.full_name) return obj.full_name;
    if (obj.username) return obj.username;
    if (obj.author_name) return obj.author_name;
    return 'Ẩn danh';
}