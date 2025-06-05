// JavaScript for category page functionality
// Handles loading products by category and filtering

document.addEventListener('DOMContentLoaded', () => {
    console.log('YouTalk Category JS Loaded');
    
    // Get category ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('slug');
    
    if (categoryId) {
        // Load category details
        loadCategoryDetails(categoryId);
        
        // Load products for this category
        loadCategoryProducts(categoryId);
        
        // Load discussions for this category
        loadCategoryDiscussions(categoryId);
    } else {
        // No category ID provided, show error or redirect
        document.getElementById('category-title').textContent = 'Danh mục không hợp lệ';
        document.getElementById('product-list-category').innerHTML = '<p>Vui lòng chọn một danh mục hợp lệ.</p>';
    }
    
    // Set up event listeners for filters and sorting
    setupFilterHandlers(categoryId);
});

// Load category details
async function loadCategoryDetails(categoryId) {
    try {
        const response = await fetchApi('/src/api/products.php?action=get_category', {
            method: 'POST',
            body: { id: categoryId }
        });
        
        if (response && response.success) {
            // Update page title
            const categoryName = response.category?.name || response.data?.category?.name || response.name || 'Danh mục';
            document.getElementById('category-title').textContent = categoryName;
            document.title = `${categoryName} - YouTalk`;
            
            // Update breadcrumb if exists
            const breadcrumbCategory = document.getElementById('breadcrumb-category');
            if (breadcrumbCategory) {
                breadcrumbCategory.textContent = categoryName;
            }
        } else {
            console.error('Failed to load category details:', response?.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error loading category details:', error);
    }
}

// Load products for a category
async function loadCategoryProducts(categoryId, filters = {}) {
    try {
        // Get sort options
        const sortSelect = document.getElementById('sort-options');
        const sortBy = sortSelect ? sortSelect.value : 'newest';
        
        // Map sort option to API parameters
        let sortParams = {};
        switch (sortBy) {
            case 'newest':
                sortParams = { sort_by: 'created_at', sort_order: 'DESC' };
                break;
            case 'popular':
                sortParams = { sort_by: 'view_count', sort_order: 'DESC' };
                break;
            case 'rating_high':
                sortParams = { sort_by: 'avg_rating', sort_order: 'DESC' };
                break;
            // Add more sort options as needed
        }
        
        // Combine filters and sort parameters
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
        
        if (response && response.success) {
            const productList = document.getElementById('product-list-category');
            if (!productList) return;
            
            // Clear loading placeholder
            productList.innerHTML = '';
            
            // Safely extract products data with fallback
            const products = response.products || response.data?.products || [];
            
            if (!Array.isArray(products) || products.length === 0) {
                productList.innerHTML = '<p>Không tìm thấy sản phẩm nào trong danh mục này.</p>';
                return;
            }
            
            products.forEach(product => {
                // Get first image or use default
                const imageUrl = product.images && Array.isArray(product.images) && product.images.length > 0 
                    ? product.images[0] 
                    : 'images/products/default.png'; // Changed from food.png to default.png
                
                // Format price or show "Contact for price"
                const priceDisplay = product.price 
                    ? `${product.price.toLocaleString('vi-VN')} đ` 
                    : 'Liên hệ để biết giá';
                
                // Calculate star rating display
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
            
            // Update pagination if data exists
            if (response.pagination || response.data?.pagination) {
                updatePagination(response.pagination || response.data?.pagination);
            }
        } else {
            console.error('Failed to load category products:', response?.message || 'Unknown error');
            const productList = document.getElementById('product-list-category');
            if (productList) {
                productList.innerHTML = '<p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading category products:', error);
        const productList = document.getElementById('product-list-category');
        if (productList) {
            productList.innerHTML = '<p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>';
        }
    }
}

// Load discussions for a category
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
        
        if (response && response.success) {
            const discussionList = document.getElementById('category-discussion-list');
            if (!discussionList) return;
            
            // Clear loading placeholder
            discussionList.innerHTML = '';
            
            // Safely extract posts data with fallback
            const posts = response.posts || response.data?.posts || [];
            
            if (!Array.isArray(posts) || posts.length === 0) {
                discussionList.innerHTML = '<p>Chưa có thảo luận nào trong danh mục này.</p>';
                return;
            }
            
            posts.forEach(post => {
                const discussionItem = document.createElement('div');
                discussionItem.className = 'discussion-item';
                
                // Format date
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
            console.error('Failed to load category discussions:', response?.message || 'Unknown error');
            const discussionList = document.getElementById('category-discussion-list');
            if (discussionList) {
                discussionList.innerHTML = '<p>Không thể tải thảo luận. Vui lòng thử lại sau.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading category discussions:', error);
        const discussionList = document.getElementById('category-discussion-list');
        if (discussionList) {
            discussionList.innerHTML = '<p>Không thể tải thảo luận. Vui lòng thử lại sau.</p>';
        }
    }
}

// Set up event handlers for filters and sorting
function setupFilterHandlers(categoryId) {
    // Sort dropdown change handler
    const sortSelect = document.getElementById('sort-options');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            loadCategoryProducts(categoryId, getFilterValues());
        });
    }
    
    // Search input handler
    const searchInput = document.getElementById('category-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchValue = searchInput.value.trim();
                if (searchValue) {
                    loadCategoryProducts(categoryId, { 
                        ...getFilterValues(),
                        search: searchValue 
                    });
                } else {
                    loadCategoryProducts(categoryId, getFilterValues());
                }
            }, 500); // Debounce search input
        });
    }
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            loadCategoryProducts(categoryId, getFilterValues());
        });
    }
}

// Get values from filter inputs
function getFilterValues() {
    const filters = {};
    
    // Example: Get rating filter values
    const ratingInputs = document.querySelectorAll('input[name="rating"]:checked');
    if (ratingInputs.length > 0) {
        filters.rating = Array.from(ratingInputs).map(input => input.value);
    }
    
    // Example: Get price range filter values
    const minPrice = document.querySelector('input[name="min_price"]');
    const maxPrice = document.querySelector('input[name="max_price"]');
    if (minPrice && minPrice.value) {
        filters.min_price = minPrice.value;
    }
    if (maxPrice && maxPrice.value) {
        filters.max_price = maxPrice.value;
    }
    
    // Add more filters as needed
    
    return filters;
}

// Update pagination controls
function updatePagination(pagination) {
    const paginationContainer = document.getElementById('pagination-category');
    if (!paginationContainer) return;
    
    // Simple pagination implementation
    // In a real app, you would calculate total pages and show proper pagination controls
    paginationContainer.innerHTML = '';
    
    // Check if pagination data exists and has expected properties
    if (pagination && typeof pagination === 'object') {
        const total = pagination.total || 0;
        const limit = pagination.limit || 12;
        
        if (total > limit) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'cta-button';
            loadMoreBtn.textContent = 'Tải thêm sản phẩm';
            loadMoreBtn.addEventListener('click', () => {
                // Load next page of products
                // Implementation would depend on your pagination strategy
            });
            paginationContainer.appendChild(loadMoreBtn);
        }
    }
}
