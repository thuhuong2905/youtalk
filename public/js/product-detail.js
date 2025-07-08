// Xử lý chức năng trang chi tiết sản phẩm
// Quản lý tải chi tiết sản phẩm, đánh giá và sản phẩm liên quan

document.addEventListener('DOMContentLoaded', async () => {
    console.log('YouTalk Product Detail JS Loaded');
    
    // Lấy ID sản phẩm từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    let productName = '';
    
    if (productId) {
        // Tải chi tiết sản phẩm
        const product = await loadProductDetails(productId);
        productName = product && product.name ? product.name : '';
        
        // Khởi tạo hệ thống đánh giá
        await initializeReviewSystem(productId);
        
        // Thiết lập sắp xếp đánh giá
        setupReviewSorting(productId);
        
        // Tăng số lượt xem
        incrementViewCount(productId);
    } else {
        // Không có ID sản phẩm, hiển thị lỗi hoặc chuyển hướng
        document.getElementById('product-name').textContent = 'Sản phẩm không hợp lệ';
        document.querySelector('.product-main-info').innerHTML = '<p>Vui lòng chọn một sản phẩm hợp lệ.</p>';
    }
});

/**
 * Tải chi tiết sản phẩm từ backend
 * Gọi API để lấy thông tin đầy đủ của sản phẩm và cập nhật UI
 */
async function loadProductDetails(productId) {
    try {
        const response = await fetchApi(`/src/api/products.php?action=get&id=${productId}`);
        // Đọc đúng nhánh dữ liệu trả về từ API (response.data.product hoặc response.product)
        let product = null;
        if (response && response.data && response.data.product) {
            product = response.data.product;
        } else if (response && response.product) {
            product = response.product;
        }
        if (response.success && product) {
            // Cập nhật tiêu đề trang
            document.title = `${product.name} - YouTalk`;
            
            // Cập nhật tên sản phẩm
            document.getElementById('product-name').textContent = product.name;
            document.getElementById('breadcrumb-product-name').textContent = product.name;
            
            // Cập nhật danh mục trong breadcrumb
            if (product.category_id && product.category_name) {
                const categoryLink = document.getElementById('breadcrumb-category');
                categoryLink.textContent = product.category_name;
                categoryLink.href = `category.html?id=${product.category_id}`;
            }
            
            // Cập nhật giá
            const priceDisplay = product.price 
                ? `${Number(product.price).toLocaleString('vi-VN')} VND` 
                : 'Liên hệ để biết giá';
            document.getElementById('product-price').textContent = priceDisplay;
            
            // Cập nhật mô tả trong tóm tắt sản phẩm
            const productDescElement = document.getElementById('product-description');
            if (productDescElement) {
                productDescElement.innerHTML = product.description || 'Không có mô tả chi tiết.';
            }
            
            // Cập nhật thông số kỹ thuật trong tóm tắt sản phẩm
            updateProductSpecs(product.specs);
            
            // Cập nhật hình ảnh
            updateProductImages(product.images);
            
            // Cập nhật rating và số lượng đánh giá
            updateProductRating(product.avg_rating || 0, product.review_count || 0);
            
            // Thiết lập liên kết mua hàng
            setupPurchaseLinks(product);
            
            return product;
        } else {
            console.error('Failed to load product details:', response.message);
            document.getElementById('product-name').textContent = 'Không tìm thấy sản phẩm';
            document.querySelector('.product-main-info').innerHTML = '<p>Sản phẩm không tồn tại hoặc đã bị xóa.</p>';
            return null;
        }
    } catch (error) {
        console.error('Error loading product details:', error);
        return null;
    }
}

/**
 * Tạo sao cho rating
 * Hiển thị số sao đầy, nửa sao và sao rỗng dựa trên rating
 */
function generateStars(rating) {
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0) rating = 0;
    if (numRating > 5) rating = 5;
    const fullStars = Math.floor(numRating);
    const halfStar = numRating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    let starsHTML = "";
    for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
    if (halfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>';
    return starsHTML;
}

/**
 * Cập nhật hiển thị rating sản phẩm (thông tin chính)
 * Hiển thị sao rating và số lượng đánh giá
 */
function updateProductRating(avgRating, reviewCount) {
    const ratingElement = document.getElementById('product-avg-rating');
    const countElement = document.getElementById('product-review-count');
    if (ratingElement) {
        ratingElement.innerHTML = generateStars(avgRating) + (avgRating > 0 ? ` <span class="rating-number">${avgRating.toFixed(1)}</span>` : '');
    }
    if (countElement) {
        countElement.textContent = `(${reviewCount} đánh giá)`;
    }
}

/**
 * Cập nhật thông số kỹ thuật/chi tiết sản phẩm
 * Hiển thị specs dưới dạng danh sách hoặc ẩn nếu không có
 */
function updateProductSpecs(specs) {
    const specsList = document.getElementById('product-specs-list');
    if (!specsList) return;
    
    if (!specs || Object.keys(specs).length === 0) {
        // Ẩn phần specs nếu không có specs
        const specsContainer = document.getElementById('product-specs');
        if (specsContainer) {
            specsContainer.style.display = 'none';
        }
        return;
    }
    
    // Hiển thị phần specs
    const specsContainer = document.getElementById('product-specs');
    if (specsContainer) {
        specsContainer.style.display = 'block';
    }
    
    specsList.innerHTML = '';
    
    // Nếu specs là mảng các object có name/value
    if (Array.isArray(specs)) {
        specs.forEach(spec => {
            const li = document.createElement('li');
            li.innerHTML = `• <strong>${spec.name}:</strong> ${spec.value}`;
            specsList.appendChild(li);
        });
    } 
    // Nếu specs là object với key/value
    else {
        for (const [key, value] of Object.entries(specs)) {
            const li = document.createElement('li');
            li.innerHTML = `• <strong>${key}:</strong> ${value}`;
            specsList.appendChild(li);
        }
    }
}

/**
 * Cập nhật hình ảnh sản phẩm với hỗ trợ fallback
 * Hiển thị ảnh chính và thumbnails, hoặc placeholder nếu không có ảnh
 */
function updateProductImages(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailList = document.querySelector('.thumbnail-list');
    const imageContainer = document.querySelector('.product-image-main');
    
    if (!mainImage || !thumbnailList || !imageContainer) {
        console.error('Product image elements not found');
        return;
    }
    
    // Lấy tên sản phẩm cho fallback
    const productName = document.getElementById('product-name')?.textContent || 'Product';
    
    // Parse images nếu là string
    let imageArray = [];
    if (typeof images === 'string' && images.trim()) {
        try {
            imageArray = JSON.parse(images);
        } catch (e) {
            // Nếu không phải JSON, xem như single image path
            imageArray = [images];
        }
    } else if (Array.isArray(images)) {
        imageArray = images;
    }
    
    // Lọc bỏ images rỗng/null
    imageArray = imageArray.filter(img => img && typeof img === 'string' && img.trim());
    
    if (imageArray.length === 0) {
        // Không có images - hiển thị fallback
        mainImage.style.display = 'none';
        
        // Tạo hoặc hiển thị fallback container
        let fallbackContainer = imageContainer.querySelector('.product-main-fallback');
        if (!fallbackContainer) {
            fallbackContainer = document.createElement('div');
            fallbackContainer.className = 'product-main-fallback';
            imageContainer.appendChild(fallbackContainer);
        }
        
        fallbackContainer.innerHTML = Avatar.createProductFallbackHTML(productName, '300px');
        fallbackContainer.style.display = 'flex';
        
        // Xóa thumbnails
        thumbnailList.innerHTML = '';
        return;
    }
    
    // Ẩn fallback nếu tồn tại
    const fallbackContainer = imageContainer.querySelector('.product-main-fallback');
    if (fallbackContainer) {
        fallbackContainer.style.display = 'none';
    }
    
    // Đặt ảnh chính là ảnh đầu tiên với xử lý lỗi
    mainImage.src = imageArray[0];
    mainImage.alt = productName;
    mainImage.style.display = 'block';
    
    // Xử lý lỗi ảnh chính
    mainImage.onerror = function() {
        this.style.display = 'none';
        let fallbackContainer = imageContainer.querySelector('.product-main-fallback');
        if (!fallbackContainer) {
            fallbackContainer = document.createElement('div');
            fallbackContainer.className = 'product-main-fallback';
            imageContainer.appendChild(fallbackContainer);
        }
        fallbackContainer.innerHTML = Avatar.createProductFallbackHTML(productName, '300px');
        fallbackContainer.style.display = 'flex';
    };
    
    // Tạo thumbnails nếu có nhiều ảnh
    thumbnailList.innerHTML = '';
    if (imageArray.length > 1) {
        imageArray.forEach((image, index) => {
            const thumbnailWrapper = document.createElement('div');
            thumbnailWrapper.className = 'thumbnail-wrapper';
            thumbnailWrapper.style.cssText = `
                position: relative;
                width: 80px;
                height: 80px;
                border-radius: var(--border-radius-sm);
                overflow: hidden;
                cursor: pointer;
                border: 2px solid ${index === 0 ? 'var(--color-primary)' : 'transparent'};
            `;
            
            const thumbnail = document.createElement('img');
            thumbnail.src = image;
            thumbnail.alt = `${productName} ${index + 1}`;
            thumbnail.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;
            
            // Xử lý lỗi thumbnail
            thumbnail.onerror = function() {
                this.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.style.cssText = `
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--color-background-alt);
                `;
                placeholder.innerHTML = Avatar.createProductFallbackHTML(productName, '60px');
                thumbnailWrapper.appendChild(placeholder);
            };
            
            thumbnail.addEventListener('click', () => {
                // Cập nhật ảnh chính
                mainImage.src = image;
                
                // Cập nhật thumbnail active
                thumbnailList.querySelectorAll('.thumbnail-wrapper').forEach(wrapper => {
                    wrapper.style.borderColor = 'transparent';
                });
                thumbnailWrapper.style.borderColor = 'var(--color-primary)';
            });
            
            thumbnailWrapper.appendChild(thumbnail);
            thumbnailList.appendChild(thumbnailWrapper);
        });
    }
}

/**
 * Cập nhật thẻ sản phẩm
 * Hiển thị danh sách thẻ hoặc ẩn container nếu không có thẻ
 */
function updateProductTags(tags) {
    const tagsContainer = document.getElementById('product-tags');
    if (!tagsContainer) return;
    
    if (!tags || tags.length === 0) {
        tagsContainer.style.display = 'none';
        return;
    }
    
    tagsContainer.innerHTML = '';
    tagsContainer.style.display = 'block';
    
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
    });
}

/**
 * Thiết lập liên kết mua hàng cho các nền tảng thương mại điện tử
 * Cấu hình links cho Shopee, Lazada, Tiki với URL trực tiếp hoặc tìm kiếm
 */
function setupPurchaseLinks(product) {
    // Lấy các element liên kết mua hàng
    const shopeeLink = document.getElementById('shopee-link');
    const lazadaLink = document.getElementById('lazada-link');
    const tikiLink = document.getElementById('tiki-link');
    
    // Reset tất cả links về trạng thái ẩn
    if (shopeeLink) shopeeLink.style.display = 'none';
    if (lazadaLink) lazadaLink.style.display = 'none';
    if (tikiLink) tikiLink.style.display = 'none';
    
    if (!product) return;
    
    // Kiểm tra nếu sản phẩm có dữ liệu purchase_links (JSON field)
    let purchaseLinks = null;
    if (product.purchase_links) {
        try {
            purchaseLinks = typeof product.purchase_links === 'string' 
                ? JSON.parse(product.purchase_links) 
                : product.purchase_links;
        } catch (e) {
            console.warn('Invalid purchase_links JSON:', e);
        }
    }
    
    // Thiết lập link Shopee
    if (purchaseLinks && purchaseLinks.shopee) {
        if (shopeeLink) {
            shopeeLink.href = purchaseLinks.shopee;
            shopeeLink.style.display = 'inline-flex';
        }
    } else if (product.name) {
        // Tạo link tìm kiếm nếu không có link trực tiếp - chuyển thành chữ thường
        const searchQuery = encodeURIComponent(product.name.toLowerCase());
        if (shopeeLink) {
            shopeeLink.href = `https://shopee.vn/search?keyword=${searchQuery}`;
            shopeeLink.style.display = 'inline-flex';
        }
    }
    
    // Thiết lập link Lazada
    if (purchaseLinks && purchaseLinks.lazada) {
        if (lazadaLink) {
            lazadaLink.href = purchaseLinks.lazada;
            lazadaLink.style.display = 'inline-flex';
        }
    } else if (product.name) {
        // Tạo link tìm kiếm nếu không có link trực tiếp - chuyển thành chữ thường
        const searchQuery = encodeURIComponent(product.name.toLowerCase());
        if (lazadaLink) {
            lazadaLink.href = `https://www.lazada.vn/catalog/?q=${searchQuery}`;
            lazadaLink.style.display = 'inline-flex';
        }
    }
    
    // Thiết lập link Tiki
    if (purchaseLinks && purchaseLinks.tiki) {
        if (tikiLink) {
            tikiLink.href = purchaseLinks.tiki;
            tikiLink.style.display = 'inline-flex';
        }
    } else if (product.name) {
        // Tạo link tìm kiếm nếu không có link trực tiếp - chuyển thành chữ thường
        const searchQuery = encodeURIComponent(product.name.toLowerCase());
        if (tikiLink) {
            tikiLink.href = `https://tiki.vn/search?q=${searchQuery}`;
            tikiLink.style.display = 'inline-flex';
        }
    }
    
    // Thêm click tracking cho analytics (tùy chọn)
    [shopeeLink, lazadaLink, tikiLink].forEach(link => {
        if (link && link.style.display !== 'none') {
            link.addEventListener('click', (e) => {
                const platform = link.id.replace('-link', '');
                console.log(`User clicked ${platform} link for product: ${product.name}`);
                // Có thể thêm analytics tracking ở đây
            });
        }
    });
}

/**
 * Thiết lập các nút hành động sản phẩm
 * Cấu hình nút chia sẻ và liên hệ nhà cung cấp
 */
function setupProductActions(product) {    
    // Nút chia sẻ
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            // Implementation chia sẻ đơn giản
            if (navigator.share) {
                navigator.share({
                    title: product.name,
                    text: `Xem sản phẩm ${product.name} trên YouTalk`,
                    url: window.location.href
                });
            } else {
                // Fallback cho browsers không hỗ trợ Web Share API
                prompt('Sao chép liên kết này để chia sẻ:', window.location.href);
            }
        });
    }
    
    // Nút liên hệ nhà cung cấp
    const contactBtn = document.getElementById('contact-supplier-btn');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            // Có thể mở form liên hệ hoặc chuyển hướng đến trang liên hệ
            alert('Tính năng liên hệ nhà cung cấp đang được phát triển.');
        });
    }
}

/**
 * Tải đánh giá sản phẩm với phân trang và sắp xếp
 * Gọi API để lấy danh sách đánh giá và cập nhật UI
 */
async function loadProductReviews(productId, page = 1, sortBy = 'newest') {
    try {
        // Map tùy chọn sắp xếp thành tham số API
        let sortParams = {};
        switch (sortBy) {
            case 'newest':
                sortParams = { sort_by: 'created_at', sort_order: 'DESC' };
                break;
            case 'helpful':
                sortParams = { sort_by: 'helpful_count', sort_order: 'DESC' };
                break;
            case 'highest':
                sortParams = { sort_by: 'rating', sort_order: 'DESC' };
                break;
            case 'lowest':
                sortParams = { sort_by: 'rating', sort_order: 'ASC' };
                break;
        }
        
        // Sử dụng GET và query params để tương thích backend
        const query = new URLSearchParams({
            product_id: productId,
            limit: 3, // 3 đánh giá mỗi trang theo yêu cầu
            offset: (page - 1) * 3,
            ...sortParams
        }).toString();
        
        const reviewsResponse = await fetchApi(`/src/api/reviews.php?action=get_by_product&${query}`, {
            method: 'GET'
        });
        
        const statsResponse = await fetchApi(`/src/api/reviews.php?action=get_stats&product_id=${productId}`, {
            method: 'GET'
        });
        
        // Cập nhật rating và số lượng đánh giá từ stats
        if (statsResponse && statsResponse.success) {
            let stats = null;
            if (statsResponse.data && statsResponse.data.stats) {
                stats = statsResponse.data.stats;
            } else if (statsResponse.stats) {
                stats = statsResponse.stats;
            }
            if (stats) {
                updateProductRating(stats.average_rating, stats.total_reviews);
            }
        }
        
        const reviewsList = document.getElementById('reviews-list');
        if (!reviewsList) return;
        
        // Xóa đánh giá hiện có
        reviewsList.innerHTML = '';
        
        // Lấy reviews từ response
        let reviews = [];
        if (reviewsResponse && reviewsResponse.data && Array.isArray(reviewsResponse.data.reviews)) {
            reviews = reviewsResponse.data.reviews;
        } else if (reviewsResponse && Array.isArray(reviewsResponse.reviews)) {
            reviews = reviewsResponse.reviews;
        }
        
        if (reviewsResponse.success && reviews.length > 0) {
            reviews.forEach(review => {
                const reviewCard = createReviewCard(review);
                reviewsList.appendChild(reviewCard);
            });
            
            // Thiết lập phân trang - chỉ hiển thị nếu có hơn 3 đánh giá tổng
            const totalReviews = reviewsResponse.data?.pagination?.total || reviewsResponse.pagination?.total || 0;
            if (totalReviews > 3) {
                const totalPages = Math.ceil(totalReviews / 3);
                setupReviewsPagination(productId, page, totalPages, sortBy, totalReviews);
            } else {
                // Ẩn phân trang nếu có 3 hoặc ít hơn đánh giá
                const paginationContainer = document.getElementById('reviews-pagination');
                if (paginationContainer) paginationContainer.innerHTML = '';
            }
        } else {
            reviewsList.innerHTML = '<div class="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</div>';
            // Ẩn phân trang khi không có đánh giá
            const paginationContainer = document.getElementById('reviews-pagination');
            if (paginationContainer) paginationContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Error loading product reviews:', error);
        const reviewsList = document.getElementById('reviews-list');
        if (reviewsList) {
            reviewsList.innerHTML = '<div class="error-message">Có lỗi xảy ra khi tải đánh giá.</div>';
        }
    }
}

/**
 * Tạo card element cho đánh giá
 * Tạo HTML structure cho một đánh giá với avatar, rating và actions
 */
function createReviewCard(review) {
    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    
    // Định dạng ngày
    const reviewDate = new Date(review.created_at);
    const formattedDate = reviewDate.toLocaleDateString('vi-VN');
    
    // Tạo hiển thị sao
    const stars = generateStars(review.rating);
    
    // Lấy HTML avatar của user sử dụng hệ thống avatar hiện có
    const avatarHtml = getUserAvatarHtml(review, 'review-avatar');
    
    reviewCard.innerHTML = `
        <div class="review-header">
            ${avatarHtml}
            <div class="review-user-info">
                <span class="reviewer-name">${getDisplayName(review)}</span>
                <div class="review-rating">${stars}</div>
                <div class="review-date">${formattedDate}</div>
            </div>
        </div>
        <div class="review-content">${review.comment || ''}</div>
        <div class="review-actions">
            <button class="review-action-btn helpful-btn" data-review-id="${review.id}" data-action="helpful">
                <i class="fas fa-thumbs-up"></i> Hữu ích (${review.helpful_count || 0})
            </button>
        </div>
    `;
    
    // Thêm event listeners cho actions
    setupReviewActions(reviewCard, review);
    
    // Khởi tạo trạng thái nút hữu ích (async)
    initializeHelpfulButtonState(reviewCard, review).catch(console.error);
    
    return reviewCard;
}

/**
 * Thiết lập các hành động đánh giá (chỉ có nút hữu ích)
 * Gắn event listeners cho nút hữu ích
 */
function setupReviewActions(reviewCard, review) {
    const helpfulBtn = reviewCard.querySelector('.helpful-btn');
    
    // Nút hữu ích
    if (helpfulBtn) {
        helpfulBtn.addEventListener('click', async () => {
            await handleHelpfulAction(review.id, helpfulBtn);
        });
    }
}

/**
 * Xử lý hành động đánh dấu hữu ích
 * Kiểm tra đăng nhập và gửi request đánh dấu hữu ích
 */
async function handleHelpfulAction(reviewId, button) {
    try {
        // Kiểm tra user đã đăng nhập bằng global function
        const currentUser = await (window.checkLoginStatus ? window.checkLoginStatus() : null);
        if (!currentUser || !currentUser.user_id) {
            showError('Vui lòng đăng nhập để đánh dấu hữu ích');
            return;
        }
        
        // Kiểm tra user đã đánh dấu hữu ích cho đánh giá này chưa
        if (hasUserMarkedHelpful(reviewId, currentUser.user_id)) {
            showError('Bạn đã đánh dấu hữu ích cho đánh giá này rồi');
            return;
        }
        
        const response = await fetchApi('/src/api/reviews.php?action=mark_helpful', {
            method: 'POST',
            body: { review_id: reviewId }
        });
        
        if (response.success) {
            // Đánh dấu đánh giá này là hữu ích bởi user hiện tại
            markReviewAsHelpful(reviewId, currentUser.user_id);
            
            // Cập nhật text nút với số lượng mới
            const newCount = response.data?.helpful_count || 0;
            button.innerHTML = `<i class="fas fa-thumbs-up"></i> Hữu ích (${newCount})`;
            button.classList.add('active');
            button.disabled = true; // Disable nút sau khi click
            showSuccess('Đã đánh dấu hữu ích');
        } else {
            showError(response.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Error marking review as helpful:', error);
        showError('Có lỗi xảy ra');
    }
}

/**
 * Thiết lập phân trang đánh giá
 * Tạo UI phân trang với logic tương tự forum
 */
function setupReviewsPagination(productId, currentPage, totalPages, sortBy, totalReviews) {
    const paginationContainer = document.getElementById('reviews-pagination');
    if (!paginationContainer) return;
    
    // Chỉ hiển thị phân trang nếu có hơn 3 đánh giá tổng (logic tương tự forum)
    if (!totalReviews || totalReviews <= 3 || totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Nút Previous
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}">←</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>←</button>`;
    }
    
    // Số trang (logic tương tự forum pagination)
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button class="pagination-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Nút Next
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" data-page="${currentPage + 1}">→</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>→</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Thêm event listeners cho các nút phân trang
    paginationContainer.querySelectorAll('.pagination-btn:not([disabled]):not(.pagination-ellipsis)').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.getAttribute('data-page'));
            if (page && page !== currentPage) {
                loadProductReviews(productId, page, sortBy);
            }
        });
    });
}

/**
 * Khởi tạo hệ thống đánh giá
 * Kiểm tra đăng nhập và thiết lập form, sau đó tải đánh giá
 */
async function initializeReviewSystem(productId) {
    await checkLoginStatusForReviews();
    setupReviewForm(productId);
    loadProductReviews(productId, 1, 'newest');
}

/**
 * Kiểm tra trạng thái đăng nhập và hiển thị section đánh giá phù hợp
 * Hiển thị form đánh giá nếu đã đăng nhập, prompt đăng nhập nếu chưa
 */
async function checkLoginStatusForReviews() {
    const loginPrompt = document.getElementById('login-prompt');
    const reviewForm = document.getElementById('review-form-container');
    
    try {
        // Sử dụng global checkLoginStatus function từ auth.js
        const userData = await (window.checkLoginStatus ? window.checkLoginStatus() : null);
        const isLoggedIn = !!userData;
        
        if (isLoggedIn) {
            // User đã đăng nhập - hiển thị form đánh giá
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (reviewForm) reviewForm.style.display = 'block';
            
            // Thiết lập thông tin user trong form đánh giá
            setupCurrentUserInfo(userData);
        } else {
            // User chưa đăng nhập - hiển thị prompt đăng nhập
            if (loginPrompt) loginPrompt.style.display = 'block';
            if (reviewForm) reviewForm.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking login status for reviews:', error);
        // Mặc định về trạng thái guest khi có lỗi
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (reviewForm) reviewForm.style.display = 'none';
    }
}

/**
 * Thiết lập thông tin user hiện tại trong form đánh giá
 * Hiển thị avatar và tên user trong phần form đánh giá
 */
function setupCurrentUserInfo(userData = null) {
    try {
        // Sử dụng userData parameter nếu được cung cấp, nếu không fallback về localStorage/sessionStorage
        const user = userData || JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        
        const avatarElement = document.getElementById('current-user-avatar');
        const nameElement = document.getElementById('current-user-name');
        
        // Sử dụng display name từ auth system
        const displayName = user.full_name || user.username || 'Người dùng';
        
        if (nameElement) {
            nameElement.textContent = displayName;
        }
        
        if (avatarElement) {
            // Sử dụng hệ thống avatar hiện có từ main.js
            const avatarHtml = getUserAvatarHtml(user, 'current-user-avatar');
            if (avatarHtml) {
                // Thay thế image element bằng HTML avatar phù hợp
                avatarElement.outerHTML = avatarHtml;
            } else {
                // Fallback hiển thị đơn giản
                avatarElement.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error setting up user info:', error);
        // Đặt hiển thị fallback
        const nameElement = document.getElementById('current-user-name');
        if (nameElement) {
            nameElement.textContent = 'Người dùng';
        }
    }
}

/**
 * Thiết lập sắp xếp đánh giá
 * Gắn event listener cho dropdown sắp xếp đánh giá
 */
function setupReviewSorting(productId) {
    const sortSelect = document.getElementById('review-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const sortBy = e.target.value;
            loadProductReviews(productId, 1, sortBy);
        });
    }
}

/**
 * Thiết lập form đánh giá với rating sao
 * Cấu hình tương tác rating sao và xử lý submit
 */
function setupReviewForm(productId) {
    const stars = document.querySelectorAll('#user-rating-stars .star');
    const ratingValue = document.getElementById('user-rating-value');
    const submitBtn = document.getElementById('submit-review-btn');
    const contentTextarea = document.getElementById('review-content');
    
    // Thiết lập tương tác rating sao
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = index + 1;
            ratingValue.value = rating;
            updateStarDisplay(stars, rating);
        });
        
        star.addEventListener('mouseover', () => {
            updateStarDisplay(stars, index + 1);
        });
    });
    
    // Reset sao khi rời chuột
    const starContainer = document.getElementById('user-rating-stars');
    if (starContainer) {
        starContainer.addEventListener('mouseleave', () => {
            updateStarDisplay(stars, parseInt(ratingValue.value || '0'));
        });
    }
    
    // Thiết lập nút submit
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await submitReview(productId);
        });
    }
}

/**
 * Cập nhật hiển thị sao
 * Cập nhật trạng thái hiển thị của các sao dựa trên rating
 */
function updateStarDisplay(stars, rating) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas');
            star.classList.add('active');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
            star.classList.remove('active');
        }
    });
}

/**
 * Gửi đánh giá
 * Validate form và gửi đánh giá đến server
 */
async function submitReview(productId) {
    const rating = document.getElementById('user-rating-value').value;
    const content = document.getElementById('review-content').value.trim();
    
    if (!rating || rating === '0') {
        showError('Vui lòng chọn số sao đánh giá');
        return;
    }
    
    if (!content) {
        showError('Vui lòng nhập nội dung đánh giá');
        return;
    }
    
    try {
        // Sử dụng endpoint 'create' đúng thay vì 'add'
        const response = await fetchApi('/src/api/reviews.php?action=create', {
            method: 'POST',
            body: {
                product_id: productId,
                rating: parseInt(rating),
                comment: content
            }
        });
        
        if (response.success) {
            showSuccess('Đánh giá của bạn đã được gửi thành công!');
            
            // Reset form
            document.getElementById('user-rating-value').value = '0';
            document.getElementById('review-content').value = '';
            const stars = document.querySelectorAll('#user-rating-stars .star');
            updateStarDisplay(stars, 0);
            
            // Reload đánh giá
            loadProductReviews(productId, 1, document.getElementById('review-sort').value);
        } else {
            showError(response.message || 'Có lỗi xảy ra khi gửi đánh giá');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showError('Có lỗi xảy ra khi gửi đánh giá');
    }
}

/**
 * Tăng số lượt xem
 * Gửi request tăng view count cho sản phẩm
 */
async function incrementViewCount(productId) {
    try {
        await fetchApi('/src/api/products.php?action=view', {
            method: 'POST',
            body: { product_id: productId }
        });
    } catch (error) {
        console.error('Error incrementing view count:', error);
    }
}

/**
 * Kiểm tra trạng thái xác thực
 * Fallback function kiểm tra auth status
 */
async function checkAuthStatus() {
    try {
        const response = await fetchApi('/src/api/auth.php?action=status');
        return response;
    } catch (error) {
        console.error('Error checking auth status:', error);
        return { authenticated: false };
    }
}

// Các hàm helper để hiển thị đánh giá (đảm bảo tương thích nếu functions main.js không có)
if (typeof getDisplayName === 'undefined') {
    /**
     * Lấy tên hiển thị của user
     * Ưu tiên full_name, fallback về username
     */
    function getDisplayName(user) {
        if (!user) return "Ẩn danh";
        if (user.full_name && user.full_name.trim()) return user.full_name;
        if (user.username && user.username.trim()) return user.username;
        return "Ẩn danh";
    }
}

if (typeof getUserAvatarHtml === 'undefined') {
    /**
     * Tạo HTML avatar cho user
     * Hiển thị ảnh đại diện hoặc fallback với chữ cái đầu
     */
    function getUserAvatarHtml(user, sizeClass = '', altText = '') {
        const fullName = (user && user.full_name && user.full_name.trim()) ? user.full_name : 'Ẩn danh';
        const firstInitial = getInitials(fullName);
        const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#03417F", "#7f8c8d"];
        const colorIndex = firstInitial.charCodeAt(0) % colors.length;
        const bgColor = colors[colorIndex];
        
        if (user && user.profile_picture && user.profile_picture.trim() !== '') {
            const escapedAlt = altText || fullName.replace(/"/g, '&quot;');
            return `<img src="${encodeURI(user.profile_picture)}" alt="${escapedAlt}" class="user-avatar ${sizeClass}" onerror="displayFallbackAvatar(this, '${firstInitial}', '${bgColor}')">`;
        } else {
            return `<div class="user-avatar-fallback ${sizeClass}" style="background-color: ${bgColor};">${firstInitial}</div>`;
        }
    }
}

if (typeof getInitials === 'undefined') {
    /**
     * Lấy chữ cái đầu tiên của tên
     * Trả về chữ cái đầu hoặc '?' nếu không có tên
     */
    function getInitials(name) {
        if (!name || typeof name !== 'string') return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 0 || parts[0].length === 0) return '?';
        return parts[0].charAt(0).toUpperCase();
    }
}

if (typeof displayFallbackAvatar === 'undefined') {
    /**
     * Hiển thị avatar fallback khi ảnh bị lỗi
     * Thay thế element ảnh bằng div với chữ cái đầu
     */
    function displayFallbackAvatar(imageElement, initial, bgColor) {
        try {
            if (!imageElement || !imageElement.parentNode) {
                console.error("Cannot display fallback avatar: Invalid image element or parent.");
                return;
            }

            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'user-avatar-fallback user-avatar-header';
            fallbackDiv.style.backgroundColor = bgColor;
            fallbackDiv.textContent = initial;

            imageElement.parentNode.replaceChild(fallbackDiv, imageElement);
            console.log("Replaced broken avatar with fallback initial.");

        } catch (error) {
            console.error("Error in displayFallbackAvatar:", error);
            if (imageElement && imageElement.parentNode) {
                const fallbackText = document.createTextNode(initial || '?');
                imageElement.parentNode.replaceChild(fallbackText, imageElement);
            }
        }
    }
}

// Các hàm helper để quản lý trạng thái helpful review (để tránh user ấn helpful nhiều lần)
/**
 * Kiểm tra user hiện tại đã đánh dấu đánh giá là hữu ích chưa
 */
function hasUserMarkedHelpful(reviewId, userId = null) {
    try {
        if (!userId) {
            // Lấy current user ID để lưu trữ theo user
            const currentUser = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
            userId = currentUser.user_id || currentUser.id; // Thử cả hai để tương thích
        }
        
        if (!userId) {
            return false; // User chưa đăng nhập
        }
        
        // Tạo key theo user
        const storageKey = `helpful_reviews_${userId}`;
        const helpfulReviews = JSON.parse(localStorage.getItem(storageKey) || '[]');
        return helpfulReviews.includes(parseInt(reviewId));
    } catch (error) {
        console.error('Error checking helpful status:', error);
        return false;
    }
}

/**
 * Đánh dấu một đánh giá là hữu ích bởi user hiện tại
*/
function markReviewAsHelpful(reviewId, userId = null) {
    try {
        if (!userId) {
            // Lấy current user ID để lưu trữ theo user
            const currentUser = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
            userId = currentUser.user_id || currentUser.id; // Thử cả hai để tương thích
        }
        
        if (!userId) {
            console.warn('Cannot mark helpful: User not logged in');
            return;
        }
        
        // Tạo key theo user
        const storageKey = `helpful_reviews_${userId}`;
        const helpfulReviews = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        if (!helpfulReviews.includes(parseInt(reviewId))) {
            helpfulReviews.push(parseInt(reviewId));
            localStorage.setItem(storageKey, JSON.stringify(helpfulReviews));
        }
    } catch (error) {
        console.error('Error marking review as helpful:', error);
    }
}

/**
 * Khởi tạo trạng thái nút helpful khi tải đánh giá
 */
async function initializeHelpfulButtonState(reviewCard, review) {
    try {
        // Lấy current user để kiểm tra trạng thái helpful
        const currentUser = await (window.checkLoginStatus ? window.checkLoginStatus() : null);
        if (currentUser && currentUser.user_id) {
            const helpfulBtn = reviewCard.querySelector('.helpful-btn');
            if (helpfulBtn && hasUserMarkedHelpful(review.id, currentUser.user_id)) {
                helpfulBtn.classList.add('active');
                helpfulBtn.disabled = true;
                helpfulBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Hữu ích (${review.helpful_count || 0})`;
            }
        }
    } catch (error) {
        console.error('Error initializing helpful button state:', error);
    }
}
