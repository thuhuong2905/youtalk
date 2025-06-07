/**
 * Category Page - Grid Layout
 * Displays categories in a grid format similar to home page
 */

document.addEventListener("DOMContentLoaded", function() {
    initCategoryPage();
});

/**
 * Initialize the category page
 */
async function initCategoryPage() {
    try {
        await loadCategories();
    } catch (error) {
        console.error("Error initializing category page:", error);
        showError("Không thể tải trang danh mục. Vui lòng thử lại.");
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
