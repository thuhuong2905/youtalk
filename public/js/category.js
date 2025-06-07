/**
 * Category Page - Grid Layout with Detail View Integration
 * Displays categories in a grid format similar to home page
 * Also handles category detail view when URL contains category ID
 */

let currentPage = 1;
let currentCategoryId = null;
let currentFilter = 'all';
let currentSort = 'newest';
let isDetailView = false;

document.addEventListener("DOMContentLoaded", function() {
    initCategoryPage();
});

/**
 * Initialize the category page
 */
async function initCategoryPage() {
    try {
        // Check if we have a category ID in URL (for detail view)
        const urlParams = new URLSearchParams(window.location.search);
        currentCategoryId = urlParams.get('id') || urlParams.get('slug');
        
        console.log('URL Params:', Object.fromEntries(urlParams));
        console.log('Current Category ID:', currentCategoryId);
        
        if (currentCategoryId) {
            // Switch to detail view
            await switchToDetailView();
        } else {
            // Show categories grid
            await switchToGridView();
        }
    } catch (error) {
        console.error("Error initializing category page:", error);
        showError("Không thể tải trang danh mục. Vui lòng thử lại.");
    }
}

/**
 * Switch to categories grid view
 */
async function switchToGridView() {
    isDetailView = false;
    
    // Show grid section, hide detail section
    document.getElementById('categories-grid-section').style.display = 'block';
    document.getElementById('category-detail-section').style.display = 'none';
    
    // Update banner for grid view
    const banner = document.getElementById('category-banner');
    banner.querySelector('h1').textContent = 'Khám phá danh mục';
    banner.querySelector('p').textContent = 'Chọn danh mục bạn quan tâm để khám phá sản phẩm và dịch vụ tuyệt vời';
    
    // Remove detail-view class to restore full padding
    banner.classList.remove('detail-view');
    
    // Hide subcategory tabs in banner
    const subcategoryTabs = document.getElementById('subcategory-tabs');
    if (subcategoryTabs) {
        subcategoryTabs.style.display = 'none';
    }
    
    await loadCategories();
}

/**
 * Switch to category detail view
 */
async function switchToDetailView() {
    if (!currentCategoryId) return;
    
    isDetailView = true;
    
    // Hide grid section, show detail section
    document.getElementById('categories-grid-section').style.display = 'none';
    document.getElementById('category-detail-section').style.display = 'block';
    
    // Add detail-view class to reduce banner padding
    const banner = document.getElementById('category-banner');
    banner.classList.add('detail-view');
    
    try {
        // Load all detail data
        await Promise.all([
            loadCategoryInfo(),
            loadProducts(),
            loadRelatedCategories()
        ]);

        // Initialize event listeners for detail view
        initDetailEventListeners();

    } catch (error) {
        console.error("Error loading category detail:", error);
        showError("Không thể tải chi tiết danh mục. Vui lòng thử lại.");
    }
}

/**
 * Load categories from API and display them in grid
 */
async function loadCategories() {
    try {
        const categoriesGrid = document.getElementById("categories-grid");
        if (!categoriesGrid) return;

        // Show loading state
        categoriesGrid.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Đang tải danh mục...</p>
            </div>
        `;

        // Fetch categories from API using same endpoint as home page
        const response = await fetchApi("/categories.php?action=list&root=true&count=true");

        if (!response || !response.success || !response.data || !response.data.categories) {
            console.error("API Error loading categories:", response?.message || "Invalid API response");
            showError("Không thể tải danh mục từ server.");
            return;
        }

        const categories = response.data.categories;
        console.log("Categories loaded:", categories);

        if (categories.length === 0) {
            showNoData("Không có danh mục nào.");
            return;
        }

        // Clear loading state
        categoriesGrid.innerHTML = "";

        // Define the color palette (matches home.js)
        const colorPalette = [
            { bg: "#FEF3C7", text: "#92400E" },
            { bg: "#DBEAFE", text: "#1E40AF" },
            { bg: "#FCE7F3", text: "#9D174D" },
            { bg: "#D1FAE5", text: "#065F46" },
            { bg: "#EDE4D8", text: "#5C4033" },
            { bg: "#F5ECE1", text: "#8A4A3C" }
        ];

        // Render categories
        categories.forEach((category, index) => {
            const colorIndex = index % colorPalette.length;
            
            const categoryCard = document.createElement("a");
            categoryCard.href = `category.html?id=${category.id}`;
            categoryCard.className = `category-card category-color-${colorIndex}`;
            
            categoryCard.innerHTML = `
                <div class="category-icon">
                    <i class="${getCategoryIcon(category.name)}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${formatCount(category.item_count || 0)} bài viết</p>
            `;

            categoriesGrid.appendChild(categoryCard);
        });

    } catch (error) {
        console.error("Error loading categories:", error);
        showError("Đã xảy ra lỗi khi tải danh mục.");
    }
}

/**
 * Get appropriate icon for category
 * @param {string} categoryName - Category name
 * @returns {string} Font Awesome icon class
 */
function getCategoryIcon(categoryName) {
    if (!categoryName) return "fas fa-folder"; // Default icon

    const name = categoryName.toLowerCase().trim();
    
    // Technology/Tech
    if (name.includes("công nghệ") || name.includes("technology") || name.includes("tech")) {
        return "fas fa-laptop-code";
    }
    // Fashion
    if (name.includes("thời trang") || name.includes("fashion")) {
        return "fas fa-tshirt";
    }
    // Travel
    if (name.includes("du lịch") || name.includes("travel")) {
        return "fas fa-map-marked-alt";
    }
    // Food
    if (name.includes("ẩm thực") || name.includes("đồ ăn") || name.includes("food")) {
        return "fas fa-utensils";
    }
    // Education
    if (name.includes("giáo dục") || name.includes("education")) {
        return "fas fa-graduation-cap";
    }
    // Health
    if (name.includes("sức khỏe") || name.includes("health")) {
        return "fas fa-heartbeat";
    }
    // Entertainment
    if (name.includes("giải trí") || name.includes("entertainment")) {
        return "fas fa-film";
    }
    // Furniture
    if (name.includes("nội thất") || name.includes("furniture")) {
        return "fas fa-couch";
    }
    // Beauty
    if (name.includes("làm đẹp") || name.includes("beauty")) {
        return "fas fa-spa";
    }
    // Sports
    if (name.includes("thể thao") || name.includes("sports")) {
        return "fas fa-dumbbell";
    }
    // Automotive
    if (name.includes("ô tô") || name.includes("automotive") || name.includes("xe")) {
        return "fas fa-car";
    }
    // Books
    if (name.includes("sách") || name.includes("books")) {
        return "fas fa-book";
    }
    // Music
    if (name.includes("âm nhạc") || name.includes("music")) {
        return "fas fa-music";
    }
    
    return "fas fa-tag"; // Default fallback icon
}

/**
 * Format count numbers
 * @param {number} count - Number to format
 * @returns {string} Formatted count string
 */
function formatCount(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const categoriesGrid = document.getElementById("categories-grid");
    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Đã xảy ra lỗi</h3>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Show no data message
 * @param {string} message - No data message to display
 */
function showNoData(message) {
    const categoriesGrid = document.getElementById("categories-grid");
    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = `
        <div class="no-data-container">
            <i class="fas fa-folder-open"></i>
            <h3>Không có dữ liệu</h3>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Load category information for detail view
 */
async function loadCategoryInfo() {
    try {
        const response = await fetchApi(`/categories.php?action=get&id=${currentCategoryId}`);
        
        if (!response || !response.success || !response.data) {
            throw new Error("Failed to load category info");
        }

        const category = response.data.category || response.data;
        
        // Update page title and meta
        document.title = `${category.name} - YouTalk`;
        
        // Safely update category title
        const categoryTitle = document.getElementById('category-title');
        if (categoryTitle) {
            categoryTitle.textContent = category.name;
        }
        
        // Safely update breadcrumb
        const categoryBreadcrumb = document.getElementById('category-name-breadcrumb');
        if (categoryBreadcrumb) {
            categoryBreadcrumb.textContent = category.name;
        }
        
        // Update description
        const description = category.description || getCategoryDescription(category.name);
        const categoryDescription = document.getElementById('category-description');
        if (categoryDescription) {
            categoryDescription.textContent = description;
        }

        // Update banner for detail view with dynamic content
        const banner = document.getElementById('category-banner');
        if (banner) {
            const bannerH1 = banner.querySelector('h1');
            const bannerP = banner.querySelector('p');
            if (bannerH1) bannerH1.textContent = category.name;
            if (bannerP) bannerP.textContent = description;
        }

        // Show and load subcategory tabs in banner
        await loadSubcategoryTabsInBanner(category.id);

    } catch (error) {
        console.error("Error loading category info:", error);
        showError("Không thể tải thông tin danh mục.");
    }
}

/**
 * Load subcategory tabs in the banner for detail view
 */
async function loadSubcategoryTabsInBanner(categoryId) {
    try {
        const response = await fetchApi(`/categories.php?action=list&parent_id=${categoryId}`);
        
        const subcategoryTabs = document.getElementById('subcategory-tabs');
        
        if (response && response.success && response.data && response.data.categories) {
            const subcategories = response.data.categories;
            
            if (subcategories.length > 0) {
                // Show the subcategory tabs container
                subcategoryTabs.style.display = 'flex';
                
                // Clear existing tabs and add "Tất cả"
                subcategoryTabs.innerHTML = '<button class="filter-btn active" data-filter="all">Tất cả</button>';
                
                // Add subcategory tabs
                subcategories.forEach(subcategory => {
                    const tabBtn = document.createElement('button');
                    tabBtn.className = 'filter-btn';
                    tabBtn.setAttribute('data-filter', subcategory.id);
                    tabBtn.textContent = subcategory.name;
                    subcategoryTabs.appendChild(tabBtn);
                });
            } else {
                // Hide subcategory tabs if no subcategories found
                subcategoryTabs.style.display = 'none';
            }
        } else {
            // Hide subcategory tabs if no subcategories found
            subcategoryTabs.style.display = 'none';
        }
    } catch (error) {
        console.error("Error loading subcategory tabs:", error);
        // Hide subcategory tabs on error
        document.getElementById('subcategory-tabs').style.display = 'none';
    }
}

/**
 * Load subcategory filters for detail view (legacy - keeping for compatibility)
 */
async function loadSubcategoryFilters(categoryId) {
    try {
        const response = await fetchApi(`/categories.php?action=list&parent_id=${categoryId}`);
        
        if (response && response.success && response.data && response.data.categories) {
            const subcategories = response.data.categories;
            const filtersContainer = document.getElementById('subcategory-filters');
            
            if (filtersContainer) {
                // Clear existing filters except "Tất cả"
                filtersContainer.innerHTML = '<button class="filter-btn active" data-filter="all">Tất cả</button>';
                
                // Add subcategory filters
                subcategories.forEach(subcategory => {
                    const filterBtn = document.createElement('button');
                    filterBtn.className = 'filter-btn';
                    filterBtn.setAttribute('data-filter', subcategory.id);
                    filterBtn.textContent = subcategory.name;
                    filtersContainer.appendChild(filterBtn);
                });
            }
        }
    } catch (error) {
        console.error("Error loading subcategory filters:", error);
    }
}

/**
 * Load products for the category
 */
async function loadProducts(page = 1) {
    try {
        const productsGrid = document.getElementById('products-grid');
        
        // Validate currentCategoryId before making API call
        if (!currentCategoryId) {
            console.error('No category ID available for loading products');
            productsGrid.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Lỗi</h3>
                    <p>Không tìm thấy ID danh mục. Vui lòng kiểm tra URL.</p>
                </div>
            `;
            return;
        }
        
        // Show loading state
        productsGrid.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Đang tải sản phẩm...</p>
            </div>
        `;

        // Build API URL with filters using the new endpoint
        let apiUrl = `/products.php?action=get_products_by_category&category_id=${currentCategoryId}&page=${page}&limit=9`;
        
        if (currentFilter !== 'all') {
            apiUrl += `&subcategory_id=${currentFilter}`;
        }
        
        if (currentSort) {
            apiUrl += `&sort=${currentSort}`;
        }

        console.log('API URL for products:', apiUrl);
        console.log('Request params:', {
            category_id: currentCategoryId,
            page: page,
            limit: 9,
            subcategory_id: currentFilter !== 'all' ? currentFilter : undefined,
            sort: currentSort
        });

        const response = await fetchApi(apiUrl);
        
        console.log('Products API response:', response);
        
        if (!response || !response.success) {
            throw new Error(`Failed to load products: ${response?.message || 'Unknown error'}`);
        }

        // Handle different response structures
        let products, totalPages, currentPageNum;
        
        if (response.data && response.data.data) {
            // New structure: response.data.data contains products
            products = response.data.data;
            totalPages = response.data.total_pages || 1;
            currentPageNum = response.data.page || page;
        } else if (response.data && response.data.products) {
            // Old structure: response.data.products
            products = response.data.products;
            totalPages = response.data.total_pages || 1;
            currentPageNum = response.data.current_page || page;
        } else {
            // Fallback
            products = response.data || [];
            totalPages = 1;
            currentPageNum = page;
        }
        
        // Clear loading state
        productsGrid.innerHTML = "";

        if (!products || products.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>Không có sản phẩm nào</h3>
                    <p>Chưa có sản phẩm trong danh mục này.</p>
                </div>
            `;
            return;
        }

        // Render products
        products.forEach(product => {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        });

        // Update pagination
        updatePagination(currentPageNum, totalPages);
        currentPage = currentPageNum;

    } catch (error) {
        console.error("Error loading products:", error);
        const productsGrid = document.getElementById('products-grid');
        productsGrid.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Đã xảy ra lỗi</h3>
                <p>Không thể tải sản phẩm. Vui lòng thử lại.</p>
                <small>Chi tiết lỗi: ${error.message}</small>
            </div>
        `;
    }
}

/**
 * Create product card element
 */
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Format price safely
    const price = product.price ? formatPrice(product.price) : 'Liên hệ';
    
    // Generate star rating safely
    const rating = product.rating || 0;
    const stars = generateStarRating(rating);
    
    // Handle image safely - similar to home.js logic
    const productImage = Avatar._getFirstProductImage(product.images || product.image);
    const hasImage = productImage && productImage.trim();
    
    productCard.innerHTML = `
        <div class="product-image-container">
            ${hasImage ? 
                `<img src="${productImage}" 
                     alt="${product.name || 'Sản phẩm'}" 
                     class="product-image"
                     onerror="Avatar.handleProductImageError(this, '${product.name || 'Sản phẩm'}', '160px')"
                     loading="lazy"
                     style="display: block">
                 <div class="product-fallback-placeholder" style="display: none;"></div>` 
                :
                `<img style="display: none" class="product-image">
                 <div class="product-fallback-placeholder" style="display: flex;">
                     ${Avatar.createProductFallbackHTML(product.name || 'Sản phẩm', '160px')}
                 </div>`
            }
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name || 'Không có tên'}</h3>
            <div class="product-rating">
                ${stars}
                <span class="review-count">(${product.review_count || 0} đánh giá)</span>
            </div>
            <div class="product-price">${price}</div>
            <p class="product-description">${product.short_description || product.description || ''}</p>
            <a href="product-detail.html?id=${product.id}" class="product-link">Xem chi tiết</a>
        </div>
    `;
    
    return productCard;
}

/**
 * Load related categories (limit to 4)
 */
async function loadRelatedCategories() {
    try {
        const response = await fetchApi(`/categories.php?action=list&root=true&count=true&exclude=${currentCategoryId}&limit=4`);
        
        if (!response || !response.success || !response.data || !response.data.categories) {
            return;
        }

        const categories = response.data.categories;
        const relatedGrid = document.getElementById('related-categories-grid');
        
        // Clear loading state
        relatedGrid.innerHTML = "";

        if (categories.length === 0) {
            document.getElementById('related-categories').style.display = 'none';
            return;
        }

        // Render related categories (max 4)
        categories.slice(0, 4).forEach((category, index) => {
            const colorIndex = index % 6; // 6 colors available
            
            const categoryCard = document.createElement('a');
            categoryCard.href = `category.html?id=${category.id}`;
            categoryCard.className = `category-card category-color-${colorIndex}`;
            
            categoryCard.innerHTML = `
                <div class="category-icon">
                    <i class="${getCategoryIcon(category.name)}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${formatCount(category.item_count || 0)} bài viết</p>
            `;
            
            relatedGrid.appendChild(categoryCard);
        });

    } catch (error) {
        console.error("Error loading related categories:", error);
        document.getElementById('related-categories').style.display = 'none';
    }
}

/**
 * Initialize event listeners for detail view
 */
function initDetailEventListeners() {
    // Filter buttons (banner subcategory tabs only)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-btn') && isDetailView) {
            // Only handle banner subcategory tabs
            const subcategoryTabs = document.getElementById('subcategory-tabs');
            if (subcategoryTabs && subcategoryTabs.contains(e.target)) {
                // Update active state in banner tabs
                subcategoryTabs.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update filter and reload products
                const filterValue = e.target.getAttribute('data-filter');
                currentFilter = filterValue;
                currentPage = 1;
                loadProducts(1);
            }
        }
    });

    // Sort dropdown
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', function(e) {
            currentSort = e.target.value;
            currentPage = 1;
            loadProducts(1);
        });
    }
}

/**
 * Update pagination
 */
function updatePagination(currentPage, totalPages) {
    const container = document.getElementById('pagination-container');
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="loadProducts(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `<button class="pagination-btn" onclick="loadProducts(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="loadProducts(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
}

/**
 * Get category description
 */
function getCategoryDescription(categoryName) {
    const descriptions = {
        'Công nghệ': 'Khám phá các sản phẩm công nghệ mới nhất và thảo luận về xu hướng tech',
        'Thời trang': 'Khám phá các danh mục và thảo luận về thời trang, phụ kiện và xu hướng mới nhất',
        'Du lịch': 'Chia sẻ trải nghiệm du lịch và khám phá những điểm đến tuyệt vời',
        'Ẩm thực': 'Thảo luận về món ăn ngon và chia sẻ kinh nghiệm ẩm thực',
        'Giáo dục': 'Tài nguyên học tập và thảo luận về giáo dục',
        'Sức khỏe': 'Thông tin và lời khuyên về sức khỏe và lối sống lành mạnh',
        'Giải trí': 'Thảo luận về phim ảnh, âm nhạc và các hoạt động giải trí',
        'Nội thất': 'Ý tưởng trang trí và thiết kế nội thất cho ngôi nhà',
        'Làm đẹp': 'Mẹo làm đẹp, chăm sóc da và xu hướng beauty mới nhất',
        'Thể thao': 'Tin tức thể thao và thảo luận về các môn thể thao yêu thích',
        'Ô tô': 'Thông tin về xe hơi, moto và phương tiện giao thông',
        'Sách': 'Đánh giá sách và thảo luận về văn học',
        'Âm nhạc': 'Chia sẻ về âm nhạc và các nghệ sĩ yêu thích'
    };
    
    return descriptions[categoryName] || `Khám phá và thảo luận về ${categoryName.toLowerCase()}`;
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

/**
 * Format price
 */
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}
