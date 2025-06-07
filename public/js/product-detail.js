// JavaScript for product detail page functionality
// Handles loading product details, reviews, and related products

document.addEventListener('DOMContentLoaded', async () => {
    console.log('YouTalk Product Detail JS Loaded');
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    let productName = '';
    
    if (productId) {
        // Load product details
        const product = await loadProductDetails(productId);
        productName = product && product.name ? product.name : '';
        
        // Initialize review system
        await initializeReviewSystem(productId);
        
        // Set up review sorting
        setupReviewSorting(productId);
        
        // Increment view count
        incrementViewCount(productId);
    } else {
        // No product ID provided, show error or redirect
        document.getElementById('product-name').textContent = 'Sản phẩm không hợp lệ';
        document.querySelector('.product-main-info').innerHTML = '<p>Vui lòng chọn một sản phẩm hợp lệ.</p>';
    }
});

// Load product details
async function loadProductDetails(productId) {
    try {
        const response = await fetchApi('/src/api/products.php?action=get_by_id', {
            method: 'POST',
            body: { id: productId }
        });
        // Đọc đúng nhánh dữ liệu trả về từ API (response.data.product hoặc response.product)
        let product = null;
        if (response && response.data && response.data.product) {
            product = response.data.product;
        } else if (response && response.product) {
            product = response.product;
        }
        if (response.success && product) {
            // Update page title
            document.title = `${product.name} - YouTalk`;
            
            // Update product name
            document.getElementById('product-name').textContent = product.name;
            document.getElementById('breadcrumb-product-name').textContent = product.name;
            
            // Update category in breadcrumb
            if (product.category_id && product.category_name) {
                const categoryLink = document.getElementById('breadcrumb-category');
                categoryLink.textContent = product.category_name;
                categoryLink.href = `category.html?id=${product.category_id}`;
            }
            
            // Update price
            const priceDisplay = product.price 
                ? `${Number(product.price).toLocaleString('vi-VN')} VND` 
                : 'Liên hệ để biết giá';
            document.getElementById('product-price').textContent = priceDisplay;
            
            // Update description in product summary
            const productDescElement = document.getElementById('product-description');
            if (productDescElement) {
                productDescElement.innerHTML = product.description || 'Không có mô tả chi tiết.';
            }
            
            // Update specs/details in product summary
            updateProductSpecs(product.specs);
            
            // Update images
            updateProductImages(product.images);
            
            // Update rating and review count
            updateProductRating(product.avg_rating || 0, product.review_count || 0);
            
            // Set up purchase links
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

// Helper: generate stars for ratings
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

// Update product rating display (main info)
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

// Update product specs/details
function updateProductSpecs(specs) {
    const specsList = document.getElementById('product-specs-list');
    if (!specsList) return;
    
    if (!specs || Object.keys(specs).length === 0) {
        // Hide the specs section if no specs available
        const specsContainer = document.getElementById('product-specs');
        if (specsContainer) {
            specsContainer.style.display = 'none';
        }
        return;
    }
    
    // Show the specs section
    const specsContainer = document.getElementById('product-specs');
    if (specsContainer) {
        specsContainer.style.display = 'block';
    }
    
    specsList.innerHTML = '';
    
    // If specs is an array of objects with name/value pairs
    if (Array.isArray(specs)) {
        specs.forEach(spec => {
            const li = document.createElement('li');
            li.innerHTML = `• <strong>${spec.name}:</strong> ${spec.value}`;
            specsList.appendChild(li);
        });
    } 
    // If specs is an object with key/value pairs
    else {
        for (const [key, value] of Object.entries(specs)) {
            const li = document.createElement('li');
            li.innerHTML = `• <strong>${key}:</strong> ${value}`;
            specsList.appendChild(li);
        }
    }
}

// Update product images with fallback support
function updateProductImages(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailList = document.querySelector('.thumbnail-list');
    const imageContainer = document.querySelector('.product-image-main');
    
    if (!mainImage || !thumbnailList || !imageContainer) {
        console.error('Product image elements not found');
        return;
    }
    
    // Get product name for fallback
    const productName = document.getElementById('product-name')?.textContent || 'Product';
    
    // Parse images if it's a string
    let imageArray = [];
    if (typeof images === 'string' && images.trim()) {
        try {
            imageArray = JSON.parse(images);
        } catch (e) {
            // If not JSON, treat as single image path
            imageArray = [images];
        }
    } else if (Array.isArray(images)) {
        imageArray = images;
    }
    
    // Filter out empty/null images
    imageArray = imageArray.filter(img => img && typeof img === 'string' && img.trim());
    
    if (imageArray.length === 0) {
        // No images available - show fallback
        mainImage.style.display = 'none';
        
        // Create or show fallback container
        let fallbackContainer = imageContainer.querySelector('.product-main-fallback');
        if (!fallbackContainer) {
            fallbackContainer = document.createElement('div');
            fallbackContainer.className = 'product-main-fallback';
            imageContainer.appendChild(fallbackContainer);
        }
        
        fallbackContainer.innerHTML = Avatar.createProductFallbackHTML(productName, '300px');
        fallbackContainer.style.display = 'flex';
        
        // Clear thumbnails
        thumbnailList.innerHTML = '';
        return;
    }
    
    // Hide fallback if exists
    const fallbackContainer = imageContainer.querySelector('.product-main-fallback');
    if (fallbackContainer) {
        fallbackContainer.style.display = 'none';
    }
    
    // Set main image to first image with error handling
    mainImage.src = imageArray[0];
    mainImage.alt = productName;
    mainImage.style.display = 'block';
    
    // Handle main image error
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
    
    // Create thumbnails if multiple images
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
            
            // Handle thumbnail error
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
                // Update main image
                mainImage.src = image;
                
                // Update active thumbnail
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

// Update product tags
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

// Setup purchase links for e-commerce platforms
function setupPurchaseLinks(product) {
    // Get purchase link elements
    const shopeeLink = document.getElementById('shopee-link');
    const lazadaLink = document.getElementById('lazada-link');
    const tikiLink = document.getElementById('tiki-link');
    
    // Reset all links to hidden state
    if (shopeeLink) shopeeLink.style.display = 'none';
    if (lazadaLink) lazadaLink.style.display = 'none';
    if (tikiLink) tikiLink.style.display = 'none';
    
    if (!product) return;
    
    // Check if product has purchase_links data (JSON field)
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
    
    // Setup Shopee link
    if (purchaseLinks && purchaseLinks.shopee) {
        if (shopeeLink) {
            shopeeLink.href = purchaseLinks.shopee;
            shopeeLink.style.display = 'inline-flex';
        }
    } else if (product.name) {
        // Generate search link if no direct link available - convert to lowercase
        const searchQuery = encodeURIComponent(product.name.toLowerCase());
        if (shopeeLink) {
            shopeeLink.href = `https://shopee.vn/search?keyword=${searchQuery}`;
            shopeeLink.style.display = 'inline-flex';
        }
    }
    
    // Setup Lazada link
    if (purchaseLinks && purchaseLinks.lazada) {
        if (lazadaLink) {
            lazadaLink.href = purchaseLinks.lazada;
            lazadaLink.style.display = 'inline-flex';
        }
    } else if (product.name) {
        // Generate search link if no direct link available - convert to lowercase
        const searchQuery = encodeURIComponent(product.name.toLowerCase());
        if (lazadaLink) {
            lazadaLink.href = `https://www.lazada.vn/catalog/?q=${searchQuery}`;
            lazadaLink.style.display = 'inline-flex';
        }
    }
    
    // Setup Tiki link
    if (purchaseLinks && purchaseLinks.tiki) {
        if (tikiLink) {
            tikiLink.href = purchaseLinks.tiki;
            tikiLink.style.display = 'inline-flex';
        }
    } else if (product.name) {
        // Generate search link if no direct link available - convert to lowercase
        const searchQuery = encodeURIComponent(product.name.toLowerCase());
        if (tikiLink) {
            tikiLink.href = `https://tiki.vn/search?q=${searchQuery}`;
            tikiLink.style.display = 'inline-flex';
        }
    }
    
    // Add click tracking for analytics (optional)
    [shopeeLink, lazadaLink, tikiLink].forEach(link => {
        if (link && link.style.display !== 'none') {
            link.addEventListener('click', (e) => {
                const platform = link.id.replace('-link', '');
                console.log(`User clicked ${platform} link for product: ${product.name}`);
                // Could add analytics tracking here
            });
        }
    });
}

// Set up product action buttons
function setupProductActions(product) {    
    // Share button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            // Simple share implementation
            if (navigator.share) {
                navigator.share({
                    title: product.name,
                    text: `Xem sản phẩm ${product.name} trên YouTalk`,
                    url: window.location.href
                });
            } else {
                // Fallback for browsers that don't support Web Share API
                prompt('Sao chép liên kết này để chia sẻ:', window.location.href);
            }
        });
    }
    
    // Contact supplier button
    const contactBtn = document.getElementById('contact-supplier-btn');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            // This could open a contact form or redirect to a contact page
            alert('Tính năng liên hệ nhà cung cấp đang được phát triển.');
        });
    }
}

// Load product reviews
// Load product reviews with pagination and sorting
async function loadProductReviews(productId, page = 1, sortBy = 'newest') {
    try {
        // Map sort option to API parameters
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
        
        // Use GET and query params for backend compatibility
        const query = new URLSearchParams({
            product_id: productId,
            limit: 3, // 3 reviews per page as per requirement
            offset: (page - 1) * 3,
            ...sortParams
        }).toString();
        
        const reviewsResponse = await fetchApi(`/src/api/reviews.php?action=get_by_product&${query}`, {
            method: 'GET'
        });
        
        const statsResponse = await fetchApi(`/src/api/reviews.php?action=get_stats&product_id=${productId}`, {
            method: 'GET'
        });
        
        // Update rating and review count from stats
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
        
        // Clear existing reviews
        reviewsList.innerHTML = '';
        
        // Get reviews from response
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
            
            // Setup pagination - only show if more than 3 reviews total
            const totalReviews = reviewsResponse.data?.pagination?.total || reviewsResponse.pagination?.total || 0;
            if (totalReviews > 3) {
                const totalPages = Math.ceil(totalReviews / 3);
                setupReviewsPagination(productId, page, totalPages, sortBy, totalReviews);
            } else {
                // Hide pagination if 3 or fewer reviews
                const paginationContainer = document.getElementById('reviews-pagination');
                if (paginationContainer) paginationContainer.innerHTML = '';
            }
        } else {
            reviewsList.innerHTML = '<div class="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</div>';
            // Hide pagination when no reviews
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

// Create review card element
function createReviewCard(review) {
    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    
    // Format date
    const reviewDate = new Date(review.created_at);
    const formattedDate = reviewDate.toLocaleDateString('vi-VN');
    
    // Create star display
    const stars = generateStars(review.rating);
    
    // Get user avatar HTML using existing avatar system
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
    
    // Add event listeners for actions
    setupReviewActions(reviewCard, review);
    
    // Initialize helpful button state (async)
    initializeHelpfulButtonState(reviewCard, review).catch(console.error);
    
    return reviewCard;
}

// Setup review actions (helpful only)
function setupReviewActions(reviewCard, review) {
    const helpfulBtn = reviewCard.querySelector('.helpful-btn');
    
    // Helpful button
    if (helpfulBtn) {
        helpfulBtn.addEventListener('click', async () => {
            await handleHelpfulAction(review.id, helpfulBtn);
        });
    }
}

// Handle helpful action
async function handleHelpfulAction(reviewId, button) {
    try {
        // Check if user is logged in using global function
        const currentUser = await (window.checkLoginStatus ? window.checkLoginStatus() : null);
        if (!currentUser || !currentUser.user_id) {
            showError('Vui lòng đăng nhập để đánh dấu hữu ích');
            return;
        }
        
        // Check if user has already marked this review as helpful
        if (hasUserMarkedHelpful(reviewId, currentUser.user_id)) {
            showError('Bạn đã đánh dấu hữu ích cho đánh giá này rồi');
            return;
        }
        
        const response = await fetchApi('/src/api/reviews.php?action=mark_helpful', {
            method: 'POST',
            body: { review_id: reviewId }
        });
        
        if (response.success) {
            // Mark this review as helpful by current user
            markReviewAsHelpful(reviewId, currentUser.user_id);
            
            // Update button text with new count
            const newCount = response.data?.helpful_count || 0;
            button.innerHTML = `<i class="fas fa-thumbs-up"></i> Hữu ích (${newCount})`;
            button.classList.add('active');
            button.disabled = true; // Disable button after clicking
            showSuccess('Đã đánh dấu hữu ích');
        } else {
            showError(response.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Error marking review as helpful:', error);
        showError('Có lỗi xảy ra');
    }
}

// Setup reviews pagination
function setupReviewsPagination(productId, currentPage, totalPages, sortBy, totalReviews) {
    const paginationContainer = document.getElementById('reviews-pagination');
    if (!paginationContainer) return;
    
    // Only show pagination if more than 3 reviews total (similar to forum logic)
    if (!totalReviews || totalReviews <= 3 || totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}">←</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>←</button>`;
    }
    
    // Page numbers (similar to forum pagination logic)
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
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" data-page="${currentPage + 1}">→</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>→</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Add event listeners to pagination buttons
    paginationContainer.querySelectorAll('.pagination-btn:not([disabled]):not(.pagination-ellipsis)').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.getAttribute('data-page'));
            if (page && page !== currentPage) {
                loadProductReviews(productId, page, sortBy);
            }
        });
    });
}

// Initialize review system
async function initializeReviewSystem(productId) {
    await checkLoginStatusForReviews();
    setupReviewForm(productId);
    loadProductReviews(productId, 1, 'newest');
}

// Check login status and show appropriate review section
async function checkLoginStatusForReviews() {
    const loginPrompt = document.getElementById('login-prompt');
    const reviewForm = document.getElementById('review-form-container');
    
    try {
        // Use the global checkLoginStatus function from auth.js
        const userData = await (window.checkLoginStatus ? window.checkLoginStatus() : null);
        const isLoggedIn = !!userData;
        
        if (isLoggedIn) {
            // User is logged in - show review form
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (reviewForm) reviewForm.style.display = 'block';
            
            // Setup user info in review form
            setupCurrentUserInfo(userData);
        } else {
            // User is not logged in - show login prompt
            if (loginPrompt) loginPrompt.style.display = 'block';
            if (reviewForm) reviewForm.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking login status for reviews:', error);
        // Default to guest state on error
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (reviewForm) reviewForm.style.display = 'none';
    }
}

// Setup current user info in review form
function setupCurrentUserInfo(userData = null) {
    try {
        // Use userData parameter if provided, otherwise try to get from localStorage/sessionStorage as fallback
        const user = userData || JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        
        const avatarElement = document.getElementById('current-user-avatar');
        const nameElement = document.getElementById('current-user-name');
        
        // Use the display name from auth system
        const displayName = user.full_name || user.username || 'Người dùng';
        
        if (nameElement) {
            nameElement.textContent = displayName;
        }
        
        if (avatarElement) {
            // Use the existing avatar system from main.js
            const avatarHtml = getUserAvatarHtml(user, 'current-user-avatar');
            if (avatarHtml) {
                // Replace the image element with the proper avatar HTML
                avatarElement.outerHTML = avatarHtml;
            } else {
                // Fallback to simple display
                avatarElement.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error setting up user info:', error);
        // Set fallback display
        const nameElement = document.getElementById('current-user-name');
        if (nameElement) {
            nameElement.textContent = 'Người dùng';
        }
    }
}

// Setup review sorting
function setupReviewSorting(productId) {
    const sortSelect = document.getElementById('review-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const sortBy = e.target.value;
            loadProductReviews(productId, 1, sortBy);
        });
    }
}

// Setup review form with star rating
function setupReviewForm(productId) {
    const stars = document.querySelectorAll('#user-rating-stars .star');
    const ratingValue = document.getElementById('user-rating-value');
    const submitBtn = document.getElementById('submit-review-btn');
    const contentTextarea = document.getElementById('review-content');
    
    // Setup star rating interaction
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
    
    // Reset stars on mouse leave
    const starContainer = document.getElementById('user-rating-stars');
    if (starContainer) {
        starContainer.addEventListener('mouseleave', () => {
            updateStarDisplay(stars, parseInt(ratingValue.value || '0'));
        });
    }
    
    // Setup submit button
    if (submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await submitReview(productId);
        });
    }
}

// Update star display
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

// Submit review
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
        // Use the correct endpoint 'create' instead of 'add'
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
            
            // Reload reviews
            loadProductReviews(productId, 1, document.getElementById('review-sort').value);
        } else {
            showError(response.message || 'Có lỗi xảy ra khi gửi đánh giá');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showError('Có lỗi xảy ra khi gửi đánh giá');
    }
}

// Increment view count
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

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetchApi('/src/api/auth.php?action=status');
        return response;
    } catch (error) {
        console.error('Error checking auth status:', error);
        return { authenticated: false };
    }
}

// Helper functions for review display (ensure compatibility if main.js functions aren't available)
if (typeof getDisplayName === 'undefined') {
    function getDisplayName(user) {
        if (!user) return "Ẩn danh";
        if (user.full_name && user.full_name.trim()) return user.full_name;
        if (user.username && user.username.trim()) return user.username;
        return "Ẩn danh";
    }
}

if (typeof getUserAvatarHtml === 'undefined') {
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
    function getInitials(name) {
        if (!name || typeof name !== 'string') return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 0 || parts[0].length === 0) return '?';
        return parts[0].charAt(0).toUpperCase();
    }
}

if (typeof displayFallbackAvatar === 'undefined') {
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

// Helper functions for managing helpful review state (để tránh user ấn helpful nhiều lần)
/**
 * Check if current user has marked a review as helpful
 * @param {number} reviewId - ID của review
 * @param {number} userId - ID của user (optional, will get from checkLoginStatus if not provided)
 * @returns {boolean} - True nếu user đã ấn helpful, false nếu chưa
 */
function hasUserMarkedHelpful(reviewId, userId = null) {
    try {
        if (!userId) {
            // Get current user ID for user-specific storage
            const currentUser = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
            userId = currentUser.user_id || currentUser.id; // Try both for compatibility
        }
        
        if (!userId) {
            return false; // User not logged in
        }
        
        // Create user-specific key
        const storageKey = `helpful_reviews_${userId}`;
        const helpfulReviews = JSON.parse(localStorage.getItem(storageKey) || '[]');
        return helpfulReviews.includes(parseInt(reviewId));
    } catch (error) {
        console.error('Error checking helpful status:', error);
        return false;
    }
}

/**
 * Mark a review as helpful by current user
 * @param {number} reviewId - ID của review
 * @param {number} userId - ID của user (optional, will get from storage if not provided)
 */
function markReviewAsHelpful(reviewId, userId = null) {
    try {
        if (!userId) {
            // Get current user ID for user-specific storage
            const currentUser = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
            userId = currentUser.user_id || currentUser.id; // Try both for compatibility
        }
        
        if (!userId) {
            console.warn('Cannot mark helpful: User not logged in');
            return;
        }
        
        // Create user-specific key
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
 * Initialize helpful buttons state when loading reviews
 * @param {HTMLElement} reviewCard - Review card element
 * @param {Object} review - Review data object
 */
async function initializeHelpfulButtonState(reviewCard, review) {
    try {
        // Get current user to check helpful status
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
