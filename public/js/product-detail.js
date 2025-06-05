// JavaScript for product detail page functionality
// Handles loading product details, reviews, and related products

document.addEventListener('DOMContentLoaded', async () => {
    console.log('YouTalk Product Detail JS Loaded');
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    let productName = '';
    
    if (productId) {
        // Load product details and get product name for related discussions
        const product = await loadProductDetails(productId);
        productName = product && product.name ? product.name : '';
        
        // Load product reviews
        loadProductReviews(productId);
        
        // Load related discussions (by product name)
        loadRelatedDiscussions(productName);
        
        // Set up tab switching
        setupTabs();
        
        // Set up review form
        setupReviewForm(productId);
        
        // Increment view count (use product_id param)
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
            
            // Update brand/supplier
            document.getElementById('product-brand').textContent = product.brand || 'Không có thông tin';
            
            // Update price
            const priceDisplay = product.price 
                ? `${Number(product.price).toLocaleString('vi-VN')} đ` 
                : 'Liên hệ để biết giá';
            document.getElementById('product-price').textContent = priceDisplay;
            
            // Update description
            document.getElementById('product-description-content').innerHTML = product.description || 'Không có mô tả chi tiết.';
            
            // Update specs/details
            updateProductSpecs(product.specs);
            
            // Update images
            updateProductImages(product.images);
            
            // Update tags
            updateProductTags(product.tags);
            
            // Set up action buttons
            setupProductActions(product);
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

// Helper: render stars for both summary and main info
function renderStars(avgRating) {
    const roundedRating = Math.round(avgRating * 2) / 2;
    const fullStars = Math.floor(roundedRating);
    const halfStar = roundedRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    let starsHtml = '★'.repeat(fullStars);
    if (halfStar) starsHtml += '½';
    starsHtml += '☆'.repeat(emptyStars);
    return starsHtml;
}

// Update product rating display (main info)
function updateProductRating(avgRating, reviewCount) {
    const ratingElement = document.getElementById('product-avg-rating');
    const countElement = document.getElementById('product-review-count');
    if (ratingElement) {
        ratingElement.innerHTML = `<span class="stars">${renderStars(avgRating)}</span>` + (avgRating > 0 ? ` <span class="rating-number">${avgRating.toFixed(1)}</span>` : '');
    }
    if (countElement) {
        // Luôn ưu tiên lấy số đánh giá từ API stats (reviewCount truyền vào)
        countElement.textContent = `(${reviewCount} đánh giá)`;
    }
}

// Update product specs/details
function updateProductSpecs(specs) {
    const specsList = document.getElementById('product-specs-list');
    if (!specsList) return;
    
    if (!specs || Object.keys(specs).length === 0) {
        specsList.innerHTML = '<li>Không có thông số kỹ thuật.</li>';
        return;
    }
    
    specsList.innerHTML = '';
    
    // If specs is an array of objects with name/value pairs
    if (Array.isArray(specs)) {
        specs.forEach(spec => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${spec.name}:</strong> ${spec.value}`;
            specsList.appendChild(li);
        });
    } 
    // If specs is an object with key/value pairs
    else {
        for (const [key, value] of Object.entries(specs)) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${key}:</strong> ${value}`;
            specsList.appendChild(li);
        }
    }
}

// Update product images
function updateProductImages(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailList = document.querySelector('.thumbnail-list');
    
    if (!mainImage || !thumbnailList) return;
    
    if (!images || images.length === 0) {
        mainImage.src = 'images/products/default.png';
        mainImage.alt = 'No image available';
        return;
    }
    
    // Set main image to first image
    mainImage.src = images[0];
    mainImage.alt = 'Product Image';
    
    // Create thumbnails
    thumbnailList.innerHTML = '';
    images.forEach((image, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = image;
        thumbnail.alt = `Thumbnail ${index + 1}`;
        thumbnail.className = index === 0 ? 'active' : '';
        
        thumbnail.addEventListener('click', () => {
            // Update main image
            mainImage.src = image;
            
            // Update active thumbnail
            thumbnailList.querySelectorAll('img').forEach(thumb => {
                thumb.classList.remove('active');
            });
            thumbnail.classList.add('active');
        });
        
        thumbnailList.appendChild(thumbnail);
    });
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
async function loadProductReviews(productId, sortBy = 'newest') {
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
            case 'rating_high':
                sortParams = { sort_by: 'rating', sort_order: 'DESC' };
                break;
            case 'rating_low':
                sortParams = { sort_by: 'rating', sort_order: 'ASC' };
                break;
        }
        // Use GET and query params for backend compatibility
        const query = new URLSearchParams({
            product_id: productId,
            limit: 10,
            offset: 0,
            ...sortParams
        }).toString();
        const reviewsResponse = await fetchApi(`/src/api/reviews.php?action=get_by_product&${query}`, {
            method: 'GET'
        });
        const statsResponse = await fetchApi(`/src/api/reviews.php?action=get_stats&product_id=${productId}`, {
            method: 'GET'
        });
        // Sau khi lấy stats, luôn cập nhật số sao và số đánh giá từ API stats
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
        reviewsList.innerHTML = '';
        // Sửa: lấy đúng trường reviews từ response.data.reviews hoặc response.reviews
        let reviews = [];
        if (reviewsResponse && reviewsResponse.data && Array.isArray(reviewsResponse.data.reviews)) {
            reviews = reviewsResponse.data.reviews;
        } else if (reviewsResponse && Array.isArray(reviewsResponse.reviews)) {
            reviews = reviewsResponse.reviews;
        }
        if (reviewsResponse.success && reviews.length > 0) {
            reviews.forEach(review => {
                const reviewItem = document.createElement('div');
                reviewItem.className = 'review-item';
                
                // Format date
                const reviewDate = new Date(review.created_at);
                const formattedDate = reviewDate.toLocaleDateString('vi-VN');
                
                // Create star display
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                
                reviewItem.innerHTML = `
                    <div class="review-header">
                        <div class="author-info">
                            ${getUserAvatarHtml(review, 'user-avatar-review')}
                            <span>${getDisplayName(review)}</span>
                        </div>
                        <div class="rating">${stars}</div>
                        <div class="date">${formattedDate}</div>
                    </div>
                    <div class="review-body">
                        <p>${review.comment}</p>
                    </div>
                `;
                
                // Add media if available
                if (review.media && review.media.length > 0) {
                    const mediaContainer = document.createElement('div');
                    mediaContainer.className = 'review-media';
                    
                    review.media.forEach(mediaUrl => {
                        // Determine if it's an image or video based on extension
                        const isVideo = /\.(mp4|webm|ogg)$/i.test(mediaUrl);
                        
                        if (isVideo) {
                            const video = document.createElement('video');
                            video.controls = true;
                            video.src = mediaUrl;
                            mediaContainer.appendChild(video);
                        } else {
                            const img = document.createElement('img');
                            img.src = mediaUrl;
                            img.alt = 'Review media';
                            mediaContainer.appendChild(img);
                        }
                    });
                    
                    reviewItem.querySelector('.review-body').appendChild(mediaContainer);
                }
                
                // Add helpful button
                const reviewFooter = document.createElement('div');
                reviewFooter.className = 'review-footer';
                reviewFooter.innerHTML = `
                    <div class="helpful-vote">
                        <span>Đánh giá này có hữu ích? </span>
                        <button class="helpful-btn">Có (${review.helpful_count || 0})</button>
                    </div>
                `;
                
                // Add event listener for helpful button
                reviewFooter.querySelector('.helpful-btn').addEventListener('click', async () => {
                    const helpfulBtn = reviewFooter.querySelector('.helpful-btn');
                    // Kiểm tra localStorage để ngăn user bấm nhiều lần
                    const helpfulKey = `helpful_review_${review.id}`;
                    if (localStorage.getItem(helpfulKey)) {
                        alert('Bạn đã đánh giá hữu ích cho nhận xét này!');
                        return;
                    }
                    try {
                        const res = await fetchApi('/src/api/reviews.php?action=mark_helpful', {
                            method: 'POST',
                            body: { review_id: review.id }
                        });
                        if (res.success) {
                            const currentCount = parseInt(helpfulBtn.textContent.match(/\d+/)[0]);
                            helpfulBtn.textContent = `Có (${currentCount + 1})`;
                            localStorage.setItem(helpfulKey, '1');
                        } else {
                            alert('Không thể ghi nhận đánh giá hữu ích.');
                        }
                    } catch (e) {
                        alert('Có lỗi khi ghi nhận đánh giá hữu ích.');
                    }
                });
                
                reviewItem.appendChild(reviewFooter);
                reviewsList.appendChild(reviewItem);
            });
        } else if (reviewsResponse.success && reviews.length === 0) {
            reviewsList.innerHTML = '<p>Chưa có đánh giá nào cho sản phẩm này.</p>';
        } else {
            reviewsList.innerHTML = '<p>Không thể tải đánh giá.</p>';
        
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Load related discussions
async function loadRelatedDiscussions(productName) {
    try {
        if (!productName) return;
        // Use GET and query param for backend compatibility, search by product name
        const query = new URLSearchParams({
            query: productName,
            limit: 5
        }).toString();
        const response = await fetchApi(`/src/api/posts.php?action=search&${query}`, {
            method: 'GET'
        });
        const discussionList = document.getElementById('related-discussion-list');
        if (!discussionList) return;
        discussionList.innerHTML = '';
        // Sửa: lấy đúng trường posts từ response.data.posts hoặc response.posts
        let posts = [];
        if (response && response.data && Array.isArray(response.data.posts)) {
            posts = response.data.posts;
        } else if (response && Array.isArray(response.posts)) {
            posts = response.posts;
        }
        if (response.success && posts.length > 0) {
            posts.forEach(post => {
                const discussionItem = document.createElement('div');
                discussionItem.className = 'discussion-item';
                
                // Format date
                const postDate = new Date(post.created_at);
                const formattedDate = postDate.toLocaleDateString('vi-VN');
                
                discussionItem.innerHTML = `
                    <h3><a href="post-detail.html?id=${post.id}">${post.title}</a></h3>
                    <div class="meta">
                        <span class="author">Bởi: ${getDisplayName(post)}</span>
                        <span class="date">${formattedDate}</span>
                        <span class="comments">${post.comment_count || 0} bình luận</span>
                    </div>
                `;
                discussionList.appendChild(discussionItem);
            });
        } else if (response.success && posts.length === 0) {
            discussionList.innerHTML = '<p>Chưa có thảo luận nào liên quan đến sản phẩm này.</p>';
        } else {
            discussionList.innerHTML = '<p>Không thể tải thảo luận liên quan.</p>';
        }
    } catch (error) {
        console.error('Error loading related discussions:', error);
    }
}

// Set up tab switching
function setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabLinks.forEach(tabLink => {
        tabLink.addEventListener('click', () => {
            tabLinks.forEach(link => link.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            tabLink.classList.add('active');
            const tabId = tabLink.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// Set up review form
// Setup review form (hiển thị avatar, rating, gửi API)
function setupReviewForm(productId) {
    const formContainer = document.getElementById('review-form-container');
    const form = document.getElementById('review-form');
    if (!formContainer || !form) return;

    // Kiểm tra đăng nhập để hiển thị form
    if (typeof window.checkLoginStatus === 'function') {
        window.checkLoginStatus().then(user => {
            if (user) {
                formContainer.style.display = '';
                // Hiển thị avatar và tên
                const avatarDiv = document.getElementById('reviewer-avatar');
                if (avatarDiv) {
                    avatarDiv.innerHTML = getUserAvatarHtml(user, 'reviewer-avatar');
                }
                document.getElementById('reviewer-name').textContent = user.full_name || 'Bạn';
            } else {
                formContainer.style.display = 'none';
            }
        });
    }

    // Modern star rating logic
    const stars = document.querySelectorAll('#review-rating-stars .star');
    const ratingInput = document.getElementById('review-rating');
    let selectedRating = 0;

    stars.forEach(star => {
        star.addEventListener('mouseenter', function() {
            fillStars(this.dataset.value);
        });
        star.addEventListener('mouseleave', function() {
            fillStars(selectedRating);
        });
        star.addEventListener('click', function() {
            selectedRating = this.dataset.value;
            ratingInput.value = selectedRating;
            fillStars(selectedRating);
        });
    });
    function fillStars(val) {
        stars.forEach(star => {
            if (parseInt(star.dataset.value) <= parseInt(val)) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });
    }
    // Khởi tạo trạng thái ban đầu
    fillStars(0);

    // Gửi form đánh giá
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const content = form.querySelector('#review-content').value.trim();
        const rating = form.querySelector('#review-rating').value;
        if (!content || !rating || rating < 1) {
            alert('Vui lòng nhập nội dung và chọn số sao!');
            return;
        }
        const formData = new FormData();
        formData.append('product_id', productId);
        formData.append('content', content);
        formData.append('rating', rating);
        try {
            const res = await fetch('/src/api/reviews.php?action=create', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                alert('Đánh giá của bạn đã được gửi!');
                form.reset();
                selectedRating = 0;
                fillStars(0);
                // Reload reviews
                loadProductReviews(productId);
            } else {
                alert(data.message || 'Gửi đánh giá thất bại!');
            }
        } catch (err) {
            alert('Lỗi gửi đánh giá!');
        }
    });
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
