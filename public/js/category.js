/**
 * Trang Danh Mục - Bố cục Lưới với Tích hợp Xem Chi tiết
 * Hiển thị danh mục theo định dạng lưới tương tự trang chủ
 * Cũng xử lý xem chi tiết danh mục khi URL chứa ID danh mục
 */

// Biến toàn cục để lưu trạng thái trang
let currentPage = 1;           // Trang hiện tại đang xem
let currentCategoryId = null;  // ID danh mục hiện tại
let currentFilter = 'all';     // Bộ lọc danh mục con hiện tại
let currentSort = 'newest';    // Sắp xếp hiện tại
let isDetailView = false;      // Cờ kiểm tra có đang ở chế độ xem chi tiết

// Khởi tạo trang khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", function() {
    initCategoryPage();
});

/**
 * Khởi tạo trang danh mục
 * Mục đích: Xác định chế độ hiển thị (lưới hoặc chi tiết) dựa trên URL
 * - Nếu có ID/slug trong URL: chuyển sang chế độ xem chi tiết
 * - Nếu không có: hiển thị lưới danh mục
 */
async function initCategoryPage() {
    try {
        // Kiểm tra xem có ID danh mục trong URL không (cho chế độ xem chi tiết)
        const urlParams = new URLSearchParams(window.location.search);
        currentCategoryId = urlParams.get('id') || urlParams.get('slug');
        
        console.log('Tham số URL:', Object.fromEntries(urlParams));
        console.log('ID Danh mục hiện tại:', currentCategoryId);
        
        if (currentCategoryId) {
            // Chuyển sang chế độ xem chi tiết
            await switchToDetailView();
        } else {
            // Hiển thị lưới danh mục
            await switchToGridView();
        }
    } catch (error) {
        console.error("Lỗi khởi tạo trang danh mục:", error);
        showError("Không thể tải trang danh mục. Vui lòng thử lại.");
    }
}

/**
 * Chuyển sang chế độ xem lưới danh mục
 * Mục đích: Hiển thị tất cả danh mục dưới dạng lưới
 * - Ẩn phần chi tiết danh mục, hiện phần lưới
 * - Cập nhật banner với nội dung tổng quát
 * - Ẩn các tab danh mục con
 * - Tải và hiển thị danh sách danh mục
 */
async function switchToGridView() {
    isDetailView = false;
    
    // Hiển thị phần lưới, ẩn phần chi tiết
    document.getElementById('categories-grid-section').style.display = 'block';
    document.getElementById('category-detail-section').style.display = 'none';
    
    // Cập nhật banner cho chế độ xem lưới
    const banner = document.getElementById('category-banner');
    banner.querySelector('h1').textContent = 'Khám phá danh mục';
    banner.querySelector('p').textContent = 'Chọn danh mục bạn quan tâm để khám phá sản phẩm và dịch vụ tuyệt vời';
    
    // Xóa class detail-view để khôi phục padding đầy đủ
    banner.classList.remove('detail-view');
    
    // Ẩn các tab danh mục con trong banner
    const subcategoryTabs = document.getElementById('subcategory-tabs');
    if (subcategoryTabs) {
        subcategoryTabs.style.display = 'none';
    }
    
    await loadCategories();
}

/**
 * Chuyển sang chế độ xem chi tiết danh mục
 * Mục đích: Hiển thị thông tin chi tiết của một danh mục cụ thể
 * - Ẩn phần lưới, hiện phần chi tiết
 * - Thêm class để điều chỉnh giao diện banner
 * - Tải thông tin danh mục, sản phẩm và danh mục liên quan
 * - Khởi tạo các event listener cho chế độ chi tiết
 */
async function switchToDetailView() {
    if (!currentCategoryId) return;
    
    isDetailView = true;
    
    // Ẩn phần lưới, hiển thị phần chi tiết
    document.getElementById('categories-grid-section').style.display = 'none';
    document.getElementById('category-detail-section').style.display = 'block';
    
    // Thêm class detail-view để giảm padding banner
    const banner = document.getElementById('category-banner');
    banner.classList.add('detail-view');
    
    try {
        // Tải tất cả dữ liệu chi tiết song song
        await Promise.all([
            loadCategoryInfo(),
            loadProducts(),
            loadRelatedCategories()
        ]);

        // Khởi tạo event listener cho chế độ xem chi tiết
        initDetailEventListeners();

    } catch (error) {
        console.error("Lỗi tải chi tiết danh mục:", error);
        showError("Không thể tải chi tiết danh mục. Vui lòng thử lại.");
    }
}

/**
 * Tải danh sách danh mục từ API và hiển thị dưới dạng lưới
 * Mục đích: Lấy dữ liệu danh mục và render thành card trong lưới
 * - Hiển thị trạng thái loading
 * - Gọi API để lấy danh sách danh mục gốc
 * - Tạo các card danh mục với màu sắc và icon phù hợp
 * - Xử lý trường hợp lỗi và không có dữ liệu
 */
async function loadCategories() {
    try {
        const categoriesGrid = document.getElementById("categories-grid");
        if (!categoriesGrid) return;

        // Hiển thị trạng thái loading
        categoriesGrid.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Đang tải danh mục...</p>
            </div>
        `;

        // Lấy danh mục từ API sử dụng cùng endpoint như trang chủ
        const response = await fetchApi("/categories.php?action=list&root=true&count=true");

        if (!response || !response.success || !response.data || !response.data.categories) {
            console.error("Lỗi API khi tải danh mục:", response?.message || "Phản hồi API không hợp lệ");
            showError("Không thể tải danh mục từ server.");
            return;
        }

        const categories = response.data.categories;
        console.log("Danh mục đã tải:", categories);

        if (categories.length === 0) {
            showNoData("Không có danh mục nào.");
            return;
        }

        // Xóa trạng thái loading
        categoriesGrid.innerHTML = "";

        // Định nghĩa bảng màu (khớp với home.js)
        const colorPalette = [
            { bg: "#FEF3C7", text: "#92400E" },
            { bg: "#DBEAFE", text: "#1E40AF" },
            { bg: "#FCE7F3", text: "#9D174D" },
            { bg: "#D1FAE5", text: "#065F46" },
            { bg: "#EDE4D8", text: "#5C4033" },
            { bg: "#F5ECE1", text: "#8A4A3C" }
        ];

        // Render danh mục
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
        console.error("Lỗi tải danh mục:", error);
        showError("Đã xảy ra lỗi khi tải danh mục.");
    }
}

/**
 * Lấy icon phù hợp cho danh mục
 * Mục đích: Trả về class icon Font Awesome phù hợp dựa trên tên danh mục
 */
function getCategoryIcon(categoryName) {
    if (!categoryName) return "fas fa-folder"; // Icon mặc định

    const name = categoryName.toLowerCase().trim();
    
    // Công nghệ/Tech
    if (name.includes("công nghệ") || name.includes("technology") || name.includes("tech")) {
        return "fas fa-laptop-code";
    }
    // Thời trang
    if (name.includes("thời trang") || name.includes("fashion")) {
        return "fas fa-tshirt";
    }
    // Du lịch
    if (name.includes("du lịch") || name.includes("travel")) {
        return "fas fa-map-marked-alt";
    }
    // Ẩm thực
    if (name.includes("ẩm thực") || name.includes("đồ ăn") || name.includes("food")) {
        return "fas fa-utensils";
    }
    // Giáo dục
    if (name.includes("giáo dục") || name.includes("education")) {
        return "fas fa-graduation-cap";
    }
    // Sức khỏe
    if (name.includes("sức khỏe") || name.includes("health")) {
        return "fas fa-heartbeat";
    }
    // Giải trí
    if (name.includes("giải trí") || name.includes("entertainment")) {
        return "fas fa-film";
    }
    // Nội thất
    if (name.includes("nội thất") || name.includes("furniture")) {
        return "fas fa-couch";
    }
    // Làm đẹp
    if (name.includes("làm đẹp") || name.includes("beauty")) {
        return "fas fa-spa";
    }
    // Thể thao
    if (name.includes("thể thao") || name.includes("sports")) {
        return "fas fa-dumbbell";
    }
    // Ô tô
    if (name.includes("ô tô") || name.includes("automotive") || name.includes("xe")) {
        return "fas fa-car";
    }
    // Sách
    if (name.includes("sách") || name.includes("books")) {
        return "fas fa-book";
    }
    // Âm nhạc
    if (name.includes("âm nhạc") || name.includes("music")) {
        return "fas fa-music";
    }
    
    return "fas fa-tag"; // Icon dự phòng mặc định
}

/**
 * Định dạng số lượng
 * Mục đích: Chuyển đổi số lượng lớn thành dạng viết tắt (K, M)
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
 * Hiển thị thông báo lỗi
 * Mục đích: Hiển thị thông báo lỗi trong container danh mục
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
 * Hiển thị thông báo không có dữ liệu
 * Mục đích: Hiển thị thông báo khi không có danh mục nào
 
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
 * Tải thông tin danh mục cho chế độ xem chi tiết
 * Mục đích: Lấy và hiển thị thông tin chi tiết của danh mục hiện tại
 * - Cập nhật tiêu đề trang và breadcrumb
 * - Hiển thị mô tả danh mục
 * - Cập nhật banner với nội dung động
 * - Tải các tab danh mục con trong banner
 */
async function loadCategoryInfo() {
    try {
        const response = await fetchApi(`/categories.php?action=get&id=${currentCategoryId}`);
        
        if (!response || !response.success || !response.data) {
            throw new Error("Không thể tải thông tin danh mục");
        }

        const category = response.data.category || response.data;
        
        // Cập nhật tiêu đề trang và meta
        document.title = `${category.name} - YouTalk`;
        
        // Cập nhật tiêu đề danh mục một cách an toàn
        const categoryTitle = document.getElementById('category-title');
        if (categoryTitle) {
            categoryTitle.textContent = category.name;
        }
        
        // Cập nhật breadcrumb một cách an toàn
        const categoryBreadcrumb = document.getElementById('category-name-breadcrumb');
        if (categoryBreadcrumb) {
            categoryBreadcrumb.textContent = category.name;
        }
        
        // Cập nhật mô tả
        const description = category.description || getCategoryDescription(category.name);
        const categoryDescription = document.getElementById('category-description');
        if (categoryDescription) {
            categoryDescription.textContent = description;
        }

        // Cập nhật banner cho chế độ xem chi tiết với nội dung động
        const banner = document.getElementById('category-banner');
        if (banner) {
            const bannerH1 = banner.querySelector('h1');
            const bannerP = banner.querySelector('p');
            if (bannerH1) bannerH1.textContent = category.name;
            if (bannerP) bannerP.textContent = description;
        }

        // Hiển thị và tải các tab danh mục con trong banner
        await loadSubcategoryTabsInBanner(category.id);

    } catch (error) {
        console.error("Lỗi tải thông tin danh mục:", error);
        showError("Không thể tải thông tin danh mục.");
    }
}

/**
 * Tải các tab danh mục con trong banner cho chế độ xem chi tiết
 * Mục đích: Hiển thị các danh mục con dưới dạng tab để lọc sản phẩm
 * - Lấy danh sách danh mục con từ API
 * - Tạo các button tab cho mỗi danh mục con
 * - Ẩn/hiện container tab tùy theo có danh mục con hay không
 */
async function loadSubcategoryTabsInBanner(categoryId) {
    try {
        const response = await fetchApi(`/categories.php?action=list&parent_id=${categoryId}`);
        
        const subcategoryTabs = document.getElementById('subcategory-tabs');
        
        if (response && response.success && response.data && response.data.categories) {
            const subcategories = response.data.categories;
            
            if (subcategories.length > 0) {
                // Hiển thị container các tab danh mục con
                subcategoryTabs.style.display = 'flex';
                
                // Xóa các tab hiện có và thêm "Tất cả"
                subcategoryTabs.innerHTML = '<button class="filter-btn active" data-filter="all">Tất cả</button>';
                
                // Thêm các tab danh mục con
                subcategories.forEach(subcategory => {
                    const tabBtn = document.createElement('button');
                    tabBtn.className = 'filter-btn';
                    tabBtn.setAttribute('data-filter', subcategory.id);
                    tabBtn.textContent = subcategory.name;
                    subcategoryTabs.appendChild(tabBtn);
                });
            } else {
                // Ẩn tab danh mục con nếu không tìm thấy danh mục con nào
                subcategoryTabs.style.display = 'none';
            }
        } else {
            // Ẩn tab danh mục con nếu không tìm thấy danh mục con nào
            subcategoryTabs.style.display = 'none';
        }
    } catch (error) {
        console.error("Lỗi tải tab danh mục con:", error);
        // Ẩn tab danh mục con khi có lỗi
        document.getElementById('subcategory-tabs').style.display = 'none';
    }
}

/**
 * Tải bộ lọc danh mục con cho chế độ xem chi tiết (legacy - giữ để tương thích)
 * Mục đích: Hàm cũ để tải filter, hiện tại đã được thay thế bởi loadSubcategoryTabsInBanner
 */
async function loadSubcategoryFilters(categoryId) {
    try {
        const response = await fetchApi(`/categories.php?action=list&parent_id=${categoryId}`);
        
        if (response && response.success && response.data && response.data.categories) {
            const subcategories = response.data.categories;
            const filtersContainer = document.getElementById('subcategory-filters');
            
            if (filtersContainer) {
                // Xóa các filter hiện có trừ "Tất cả"
                filtersContainer.innerHTML = '<button class="filter-btn active" data-filter="all">Tất cả</button>';
                
                // Thêm các filter danh mục con
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
        console.error("Lỗi tải bộ lọc danh mục con:", error);
    }
}

/**
 * Tải sản phẩm cho danh mục
 * Mục đích: Lấy và hiển thị danh sách sản phẩm thuộc danh mục hiện tại
 * - Kiểm tra tính hợp lệ của ID danh mục
 * - Gọi API với các tham số lọc và sắp xếp
 * - Hiển thị trạng thái loading và xử lý lỗi
 * - Render sản phẩm và cập nhật phân trang
 */
async function loadProducts(page = 1) {
    try {
        const productsGrid = document.getElementById('products-grid');
        
        // Kiểm tra tính hợp lệ của currentCategoryId trước khi gọi API
        if (!currentCategoryId) {
            console.error('Không có ID danh mục để tải sản phẩm');
            productsGrid.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Lỗi</h3>
                    <p>Không tìm thấy ID danh mục. Vui lòng kiểm tra URL.</p>
                </div>
            `;
            return;
        }
        
        // Hiển thị trạng thái loading
        productsGrid.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Đang tải sản phẩm...</p>
            </div>
        `;        // Xây dựng URL API với các bộ lọc sử dụng endpoint mới
        let apiUrl = `/src/api/products.php?action=get_products_by_category&category_id=${currentCategoryId}&page=${page}&limit=9`;
        
        if (currentFilter !== 'all') {
            apiUrl += `&subcategory_id=${currentFilter}`;
        }
        
        if (currentSort) {
            apiUrl += `&sort=${currentSort}`;
        }

        console.log('URL API cho sản phẩm:', apiUrl);
        console.log('Tham số yêu cầu:', {
            category_id: currentCategoryId,
            page: page,
            limit: 9,
            subcategory_id: currentFilter !== 'all' ? currentFilter : undefined,
            sort: currentSort
        });

        const response = await fetchApi(apiUrl);
        
        console.log('Phản hồi API sản phẩm:', response);
        
        if (!response || !response.success) {
            throw new Error(`Không thể tải sản phẩm: ${response?.message || 'Lỗi không xác định'}`);
        }

        // Xử lý các cấu trúc phản hồi khác nhau
        let products, totalPages, currentPageNum;
        
        if (response.data && response.data.data) {
            // Cấu trúc mới: response.data.data chứa sản phẩm
            products = response.data.data;
            totalPages = response.data.total_pages || 1;
            currentPageNum = response.data.page || page;
        } else if (response.data && response.data.products) {
            // Cấu trúc cũ: response.data.products
            products = response.data.products;
            totalPages = response.data.total_pages || 1;
            currentPageNum = response.data.current_page || page;
        } else {
            // Dự phòng
            products = response.data || [];
            totalPages = 1;
            currentPageNum = page;
        }
        
        // Xóa trạng thái loading
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

        // Render sản phẩm
        products.forEach(product => {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        });

        // Cập nhật phân trang
        updatePagination(currentPageNum, totalPages);
        currentPage = currentPageNum;

    } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
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
 * Tạo thẻ card sản phẩm
 * Mục đích: Tạo element HTML cho một sản phẩm với đầy đủ thông tin
 * - Xử lý hình ảnh an toàn với fallback
 * - Định dạng giá và đánh giá
 * - Tạo link đến trang chi tiết sản phẩm
*/
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Định dạng giá một cách an toàn
    const price = product.price ? formatPrice(product.price) : 'Liên hệ';
    
    // Tạo đánh giá sao một cách an toàn
    const rating = product.rating || 0;
    const stars = generateStarRating(rating);
    
    // Xử lý hình ảnh một cách an toàn - tương tự logic home.js
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
 * Tải danh mục liên quan (giới hạn 4 danh mục)
 * Mục đích: Hiển thị các danh mục khác để người dùng khám phá thêm
 * - Lấy danh mục gốc khác (loại trừ danh mục hiện tại)
 * - Chỉ hiển thị tối đa 4 danh mục
 * - Ẩn section nếu không có danh mục liên quan
 */
async function loadRelatedCategories() {
    try {
        const response = await fetchApi(`/categories.php?action=list&root=true&count=true&exclude=${currentCategoryId}&limit=4`);
        
        if (!response || !response.success || !response.data || !response.data.categories) {
            return;
        }

        const categories = response.data.categories;
        const relatedGrid = document.getElementById('related-categories-grid');
        
        // Xóa trạng thái loading
        relatedGrid.innerHTML = "";

        if (categories.length === 0) {
            document.getElementById('related-categories').style.display = 'none';
            return;
        }

        // Render danh mục liên quan (tối đa 4)
        categories.slice(0, 4).forEach((category, index) => {
            const colorIndex = index % 6; // 6 màu có sẵn
            
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
        console.error("Lỗi tải danh mục liên quan:", error);
        document.getElementById('related-categories').style.display = 'none';
    }
}

/**
 * Khởi tạo event listener cho chế độ xem chi tiết
 * Mục đích: Thiết lập các sự kiện tương tác trong chế độ xem chi tiết
 * - Xử lý click trên các button filter/tab danh mục con
 * - Xử lý thay đổi dropdown sắp xếp
 * - Cập nhật filter và tải lại sản phẩm khi có thay đổi
 */
function initDetailEventListeners() {
    // Các button filter (chỉ tab danh mục con trong banner)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('filter-btn') && isDetailView) {
            // Chỉ xử lý tab danh mục con trong banner
            const subcategoryTabs = document.getElementById('subcategory-tabs');
            if (subcategoryTabs && subcategoryTabs.contains(e.target)) {
                // Cập nhật trạng thái active trong tab banner
                subcategoryTabs.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Cập nhật filter và tải lại sản phẩm
                const filterValue = e.target.getAttribute('data-filter');
                currentFilter = filterValue;
                currentPage = 1;
                loadProducts(1);
            }
        }
    });

    // Dropdown sắp xếp
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
 * Cập nhật phân trang
 * Mục đích: Tạo và hiển thị các nút phân trang
 * - Hiển thị nút Previous/Next
 * - Tạo các số trang với logic rút gọn (...)
 * - Highlight trang hiện tại
 */
function updatePagination(currentPage, totalPages) {
    const container = document.getElementById('pagination-container');
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination">';
    
    // Nút Previous
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="loadProducts(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }
    
    // Số trang
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `<button class="pagination-btn" onclick="loadProducts(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
    }
    
    // Nút Next
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="loadProducts(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
}

/**
 * Lấy mô tả danh mục
 * Mục đích: Trả về mô tả phù hợp cho từng danh mục dựa trên tên
 * - Cung cấp mô tả có sẵn cho các danh mục phổ biến
 * - Tạo mô tả động cho danh mục chưa có trong danh sách
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
 * Tạo HTML đánh giá sao
 * Mục đích: Chuyển đổi điểm số thành hiển thị sao trực quan
 * - Hiển thị sao đầy, sao nửa và sao rỗng
 * - Hỗ trợ điểm số thập phân (ví dụ: 4.5 sao)
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Sao đầy
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Sao nửa
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Sao rỗng
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

/**
 * Định dạng giá tiền
 * Mục đích: Chuyển đổi số tiền thành định dạng tiền tệ Việt Nam
 * - Sử dụng Intl.NumberFormat để định dạng chuẩn
 * - Hiển thị theo định dạng VND
  */
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}
