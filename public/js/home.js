// JavaScript for home page functionality

document.addEventListener("DOMContentLoaded", function() {
    // Initialize home page
    initHomePage();
});

/**
 * Initialize the home page functionality
 */
async function initHomePage() {
    // Load all data in parallel
    await Promise.all([
        loadCategories(),
        loadFeaturedReviews(),
        loadHotTopics(),
        checkLoginStatusForCTA() // Check login status for CTA section
    ]);

    // Initialize category navigation only after categories are loaded
    // initCategoryNavigation(); // Moved inside loadCategories
}

/**
 * Load root categories from API and display them
 */
async function loadCategories() {
    try {
        const categoriesGrid = document.getElementById("categories-grid");
        const categoriesContainer = document.querySelector(".categories-container"); // Get container for carousel logic
        if (!categoriesGrid || !categoriesContainer) return;

        // Show loading state
        categoriesGrid.innerHTML = 
            '<div class="loading">Đang tải danh mục...</div>';

        // Fetch root categories with item counts from API
        // Added root=true and count=true parameters
        const response = await fetchApi(
            "/categories.php?action=list&root=true&count=true" // Corrected endpoint path
        );

        if (!response || !response.success || !response.data || !response.data.categories) {
            console.error("API Error loading categories:", response?.message || "Invalid API response. Using mock data?"); // Added log detail
            categoriesGrid.innerHTML =
                '<div class="no-data">Không thể tải danh mục.</div>';
            return;
        }
        console.log("Categories loaded from API/Mock:", response.data.categories); // Log loaded categories

        const categories = response.data.categories;

        if (categories.length === 0) {
            categoriesGrid.innerHTML =
                '<div class="no-data">Không có danh mục nào.</div>';
            return;
        }

        // Clear loading state
        categoriesGrid.innerHTML = "";

        // Define the color palette
        const colorPalette = [
            { bg: "#FEF3C7", text: "#92400E" },
            { bg: "#DBEAFE", text: "#1E40AF" },
            { bg: "#FCE7F3", text: "#9D174D" },
            { bg: "#D1FAE5", text: "#065F46" }, // Adjusted Green BG for better contrast with dark text
            { bg: "#EDE4D8", text: "#5C4033" },
            { bg: "#F5ECE1", text: "#8A4A3C" }
        ];

        // Render categories
        categories.forEach((category, index) => {
            const colorIndex = index % colorPalette.length;
            const colors = colorPalette[colorIndex];

            const categoryCard = document.createElement("a");
            // Link to the new categories page structure
            categoryCard.href = `category.html?id=${category.id}`;
            // Add a general class and a specific color class
            categoryCard.className = `category-card category-color-${colorIndex}`;
            // Apply colors directly via style (alternative/backup)
            // categoryCard.style.backgroundColor = colors.bg;
            // categoryCard.style.setProperty("--category-text-color", colors.text);

            categoryCard.innerHTML = `
                <div class="category-icon">
                    <i class="${getCategoryIcon(category.name)}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${formatCount(category.item_count || 0)} bài viết</p> 
            `; // Use item_count from API

            categoriesGrid.appendChild(categoryCard);
        });

        // Initialize category navigation/carousel *after* loading categories
        initCategoryNavigation(categories.length);

    } catch (error) {
        console.error("Error loading categories:", error);
        const categoriesGrid = document.getElementById("categories-grid");
        if (categoriesGrid) {
            categoriesGrid.innerHTML =
                '<div class="error">Không thể tải danh mục. Vui lòng thử lại sau.</div>';
        }
    }
}

/**
 * Load featured reviews from API
 */
async function loadFeaturedReviews() {
    try {
        const reviewsGrid = document.getElementById("featured-reviews-grid");
        if (!reviewsGrid) return;

        // Show loading state
        reviewsGrid.innerHTML =
            '<div class="loading">Đang tải đánh giá nổi bật...</div>';

        // Fetch featured reviews from API (adjust API endpoint/params if needed)
        // Assuming reviews API can fetch featured reviews with product details
        const response = await fetchApi("/reviews.php?action=list_featured&limit=3"); // Corrected endpoint path

        if (!response || !response.success || !response.data || !response.data.reviews) {
             console.error("API Error loading featured reviews:", response?.message || "Invalid API response for reviews. Using mock data?"); // Added log detail
            reviewsGrid.innerHTML =
                '<div class="no-data">Không có đánh giá nổi bật nào.</div>';
            return;
        }
        console.log("Featured reviews loaded from API/Mock:", response.data.reviews); // Log loaded reviews
        const reviews = response.data.reviews;

        // Ensure we only render the number of reviews received (should be max 3 from API/Mock)
        const reviewsToRender = reviews.slice(0, 3); // Explicitly take only the first 3, even if more are received due to error

        if (reviewsToRender.length === 0) {
            reviewsGrid.innerHTML =
                '<div class="no-data">Không có đánh giá nổi bật nào.</div>';
            return;
        }

        // Clear loading state
        reviewsGrid.innerHTML = "";

        // Render reviews
        reviews.forEach((review) => {
            const reviewCard = document.createElement("div");
            reviewCard.className = "review-card";

            // Structure based on the provided image
            reviewCard.innerHTML = `
                <div class="review-card-top">
                    <h3 class="review-product-name-prominent">${review.product_name || 'Sản phẩm'}</h3>
                </div>
                <div class="review-card-bottom">
                    <div class="review-header">
                        <h4 class="review-product-name-detail">${review.product_name || 'Sản phẩm'}</h4>
                        <div class="rating">
                            <span class="stars">${generateStars(review.rating)}</span>
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${truncateText(review.comment, 120)}</p> <!-- Slightly shorter truncation -->
                    </div>
                    <div class="review-footer">
                        <div class="reviewer">
                            <div class="avatar-container" id="review-avatar-${review.id || Math.random().toString(36).substring(7)}"></div>
                            <div class="reviewer-name">${getDisplayName(review)}</div>
                        </div>
                        <div class="review-date">${formatDate(review.created_at)}</div>
                    </div>
                    <a href="product-detail.html?id=${review.product_id}" class="review-link">Xem chi tiết</a> 
                </div>
            `;

            // Add avatar using Avatar class
            const avatarContainer = reviewCard.querySelector(`#review-avatar-${review.id || Math.random().toString(36).substring(7)}`);
            if (avatarContainer) {
                avatarContainer.innerHTML = Avatar.createFallbackHTML(getDisplayName(review), '40px');
            }
            
            reviewsGrid.appendChild(reviewCard);
        });
    } catch (error) {
        console.error("Error loading featured reviews:", error);
        const reviewsGrid = document.getElementById("featured-reviews-grid");
        if (reviewsGrid) {
            reviewsGrid.innerHTML =
                '<div class="error">Không thể tải đánh giá nổi bật. Vui lòng thử lại sau.</div>';
        }
    }
}

/**
 * Load hot topics from API
 */
async function loadHotTopics() {
    try {
        const topicsList = document.getElementById("hot-topics-list");
        if (!topicsList) return;

        // Show loading state
        topicsList.innerHTML = '<div class="loading">Đang tải chủ đề nóng...</div>';

        // Fetch hot topics from API (adjust API endpoint/params if needed)
        // Assuming posts API can fetch hot topics based on views/comments
        const response = await fetchApi("/posts.php?action=list_hot&limit=3"); // Corrected endpoint path

         if (!response || !response.success || !response.data || !response.data.posts) { // Reverted key back to posts to match PHP API
             console.error("API Error loading hot topics:", response?.message || "Invalid API response structure. Expected data.posts. Using mock data?"); // Updated log detail
             console.log("Full API/Mock Response for Hot Topics:", response); // Log full response for debugging
            topicsList.innerHTML = 
                '<div class="no-data">Không có chủ đề nóng nào.</div>';
            return;
        }
        console.log("Hot topics loaded from API/Mock:", response.data.posts); // Log loaded posts (using correct key 'posts')
        const topics = response.data.posts; // Reverted key back to posts

        if (topics.length === 0) {
            topicsList.innerHTML = '<div class="no-data">Không có chủ đề nóng nào.</div>';
            return;
        }

        // Clear loading state
        topicsList.innerHTML = "";

        // Render topics
        topics.forEach((topic) => {
            const topicCard = document.createElement("div");
            topicCard.className = "topic-card";

            topicCard.innerHTML = `
                <div class="topic-content">
                    <h3><a href="post-detail.html?id=${topic.id}">${topic.title}</a></h3>
                    <div class="topic-meta">
                        <span class="topic-category">${topic.category_name || 'Chung'}</span>
                        <span class="topic-views"><i class="fas fa-eye"></i> ${formatCount(topic.view_count)}</span>
                        <span class="topic-comments"><i class="fas fa-comment"></i> ${topic.comment_count || 0}</span>
                        <span class="topic-date">${formatTimeAgo(topic.created_at)}</span>
                    </div>
                    <p class="topic-excerpt">${truncateText(topic.content, 150)}</p> 
                </div>
                <div class="topic-footer">
                    <div class="topic-author">
                        <div class="avatar-container" id="topic-avatar-${topic.id || Math.random().toString(36).substring(7)}"></div>
                        <div class="author-name">${getDisplayName(topic)}</div>
                    </div>
                    <a href="post-detail.html?id=${topic.id}" class="topic-link">Xem chi tiết</a>
                </div>
            `;

            // Add avatar using Avatar class
            const avatarContainer = topicCard.querySelector(`#topic-avatar-${topic.id || Math.random().toString(36).substring(7)}`);
            if (avatarContainer) {
                avatarContainer.innerHTML = Avatar.createFallbackHTML(getDisplayName(topic), '40px');
            }
            
            topicsList.appendChild(topicCard);
        });
    } catch (error) {
        console.error("Error loading hot topics:", error);
        const topicsList = document.getElementById("hot-topics-list");
        if (topicsList) {
            topicsList.innerHTML =
                '<div class="error">Không thể tải chủ đề nóng. Vui lòng thử lại sau.</div>';
        }
    }
}

/**
 * Check login status and hide CTA section if logged in
 */
async function checkLoginStatusForCTA() {
    const ctaSection = document.getElementById('cta-section');
    if (!ctaSection) return;

    // Use the existing checkLoginStatus function from main.js (assuming it's available)
    if (typeof window.checkLoginStatus === 'function') {
        const loggedIn = await window.checkLoginStatus(); // Assuming it returns true if logged in
        if (loggedIn) {
            ctaSection.style.display = 'none'; // Hide CTA if logged in
        }
    } else {
        console.warn('checkLoginStatus function not found. Cannot determine login state for CTA.');
        // Optionally, try a direct API call if main.js function isn't reliable
        try {
            const status = await fetchApi('/auth.php?action=status'); // Corrected endpoint path for fallback
            if (status && status.success && status.data && status.data.logged_in) {
                 ctaSection.style.display = 'none';
            }
        } catch (err) {
            console.error('Error checking login status via API:', err);
        }
    }
}


/**
 * Initialize category navigation with arrow buttons if needed
 * @param {number} categoryCount - The number of categories loaded
 */
function initCategoryNavigation(categoryCount) {
    const categoriesWrapper = document.querySelector(".categories-wrapper");
    const categoriesGrid = document.getElementById("categories-grid");
    const prevButton = document.querySelector(".prev-button");
    const nextButton = document.querySelector(".next-button");
    const categoriesContainer = document.querySelector(".categories-container");

    if (
        !categoriesWrapper ||
        !categoriesGrid ||
        !prevButton ||
        !nextButton ||
        !categoriesContainer
    )
        return;

    // Only enable carousel if category count > 6
    if (categoryCount <= 6) {
        categoriesContainer.classList.add("no-carousel"); // Add class to potentially hide arrows via CSS
        prevButton.style.display = "none";
        nextButton.style.display = "none";
        return; // No need for carousel logic
    }
     categoriesContainer.classList.remove("no-carousel");
     prevButton.style.display = ""; // Ensure buttons are visible if needed
     nextButton.style.display = "";

    // Check if navigation is needed (if content overflows)
    const checkOverflow = () => {
        // Recalculate based on actual rendered elements
        const isOverflowing = categoriesGrid.scrollWidth > categoriesWrapper.clientWidth;

        // Show/hide navigation buttons based on overflow
        if (isOverflowing) {
            prevButton.classList.add("visible");
            nextButton.classList.add("visible");
        } else {
            prevButton.classList.remove("visible");
            nextButton.classList.remove("visible");
        }

        // Update button states
        updateCarouselArrows();
    };

    // Update arrow button states
    const updateCarouselArrows = () => {
        const scrollLeft = categoriesWrapper.scrollLeft;
        const scrollWidth = categoriesGrid.scrollWidth;
        const clientWidth = categoriesWrapper.clientWidth;

        // Disable/enable buttons based on scroll position
        // Add a small tolerance for floating point issues
        prevButton.classList.toggle("disabled", scrollLeft <= 1);
        nextButton.classList.toggle("disabled", scrollLeft >= scrollWidth - clientWidth - 1);
    };

    // Scroll left when clicking prev button
    prevButton.addEventListener("click", () => {
        categoriesWrapper.scrollBy({
            left: -categoriesWrapper.clientWidth / 2, // Scroll half viewport width
            behavior: "smooth",
        });
    });

    // Scroll right when clicking next button
    nextButton.addEventListener("click", () => {
        categoriesWrapper.scrollBy({
            left: categoriesWrapper.clientWidth / 2, // Scroll half viewport width
            behavior: "smooth",
        });
    });

    // Update arrow states when scrolling
    categoriesWrapper.addEventListener("scroll", updateCarouselArrows);

    // Use ResizeObserver for more reliable overflow checks
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(categoriesWrapper);
    resizeObserver.observe(categoriesGrid);

    // Initial check
    // Use setTimeout to ensure layout is stable after rendering
    setTimeout(checkOverflow, 100);
}

// --- Helper Functions (Keep existing ones, ensure they are robust) ---

/**
 * Helper function to get CSS class for category
 * @param {string} categoryName - The category name
 * @returns {string} - The CSS class
 */
function getCategoryClass(categoryName) {
    if (!categoryName) return "default-cat"; // Provide a default class

    const name = categoryName.toLowerCase().trim();
    // Use more robust matching if needed, or map IDs to classes
    if (name.includes("công nghệ")) return "tech";
    if (name.includes("thời trang")) return "fashion";
    if (name.includes("du lịch")) return "travel";
    if (name.includes("ẩm thực")) return "food";
    if (name.includes("giáo dục")) return "education";
    if (name.includes("sức khỏe")) return "health";
    if (name.includes("giải trí")) return "entertainment"; // Added missing ones
    if (name.includes("nội thất")) return "furniture";
    if (name.includes("làm đẹp")) return "beauty";
    // Add more specific classes or a default
    const simpleName = name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `cat-${simpleName || 'default'}`;
}

/**
 * Helper function to get icon for category
 * @param {string} categoryName - The category name
 * @returns {string} - The Font Awesome icon class
 */
function getCategoryIcon(categoryName) {
    if (!categoryName) return "fas fa-folder"; // Default icon

    const name = categoryName.toLowerCase().trim();
    if (name.includes("công nghệ")) return "fas fa-laptop-code"; // More specific tech icon
    if (name.includes("thời trang")) return "fas fa-tshirt";
    if (name.includes("du lịch")) return "fas fa-map-marked-alt"; // More specific travel icon
    if (name.includes("ẩm thực")) return "fas fa-utensils";
    if (name.includes("giáo dục")) return "fas fa-graduation-cap";
    if (name.includes("sức khỏe")) return "fas fa-heartbeat";
    if (name.includes("giải trí")) return "fas fa-film"; // Example entertainment icon
    if (name.includes("nội thất")) return "fas fa-couch"; // Example furniture icon
    if (name.includes("làm đẹp")) return "fas fa-spa"; // Example beauty icon
    return "fas fa-tag"; // Default fallback icon
}

/**
 * Helper function to format count (e.g., 1.2k)
 * @param {number | string | null} count - The count
 * @returns {string} - Formatted count
 */
function formatCount(count) {
    const num = parseInt(count, 10);
    if (isNaN(num) || num === 0) return "0";
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(".0", "") + "k"; // Avoid .0 for whole thousands
    }
    return num.toString();
}

/**
 * Helper function to truncate text
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    // Find the last space within the maxLength to avoid cutting words
    let truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength / 2) { // Only cut at space if it's reasonably far in
        truncated = truncated.substring(0, lastSpace);
    }
    return truncated + "...";
}

/**
 * Helper function to get initials from name
 * @param {string} name - The name
 * @returns {string} - Initials
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return "?";
    const parts = name.trim().split(" ").filter(part => part.length > 0);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}

/**
 * Helper function to generate star rating HTML
 * @param {number | string | null} rating - The rating (1-5)
 * @returns {string} - Star rating HTML
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
    for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>'; // Use far for empty stars

    return starsHTML;
}

/**
 * Helper function to format date (e.g., DD/MM/YYYY)
 * @param {string | Date | null} dateString - The date string or Date object
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return "Ngày không hợp lệ";
        }
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Ngày không hợp lệ";
    }
}

/**
 * Helper function to format time ago
 * @param {string | Date | null} dateString - The date string or Date object
 * @returns {string} - Time ago text
 */
function formatTimeAgo(dateString) {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return "Thời gian không hợp lệ";
        }
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 5) return "vừa xong";
        if (seconds < 60) return `${seconds} giây trước`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} phút trước`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} giờ trước`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} ngày trước`;

        const weeks = Math.floor(days / 7);
        if (weeks < 4.345) return `${weeks} tuần trước`; // Use average weeks per month

        const months = Math.floor(days / 30.4375); // Use average days per month
        if (months < 12) return `${months} tháng trước`;

        const years = Math.floor(days / 365.25); // Account for leap years
        return `${years} năm trước`;
    } catch (e) {
        console.error("Error formatting time ago:", dateString, e);
        return "Thời gian không hợp lệ";
    }
}

// Ensure fetchApi is defined (assuming it's in api.js or similar)
if (typeof fetchApi === 'undefined') {
    console.error("fetchApi function is not defined. Ensure api.js is loaded before home.js");
    // Define a dummy function to avoid breaking the script, but log errors
    window.fetchApi = async (url, options) => {
        console.error(`fetchApi called but not defined. URL: ${url}, Options:`, options);
        throw new Error("fetchApi is not defined");
    };
}

