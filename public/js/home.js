// Khởi tạo trang khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", function() {
    initHomePage();
});

/**
 * Khởi tạo chức năng trang chủ
 * Mục đích: Thiết lập và tải tất cả dữ liệu cần thiết cho trang chủ
 * Chức năng:
 * - Tải danh mục gốc từ API
 * - Tải đánh giá nổi bật
 * - Tải chủ đề nóng bật  
 * - Kiểm tra trạng thái đăng nhập để ẩn/hiện CTA
 */
async function initHomePage() {
    // Tải tất cả dữ liệu song song để tối ưu hiệu suất
    await Promise.all([
        loadCategories(),
        loadFeaturedReviews(), 
        loadHotTopics(),
        checkLoginStatusForCTA() // Kiểm tra trạng thái đăng nhập cho phần CTA
    ]);

    // Ghi chú: Khởi tạo điều hướng danh mục đã được di chuyển vào trong loadCategories()
}

/**
 * Tải danh mục gốc từ API và hiển thị
 * Mục đích: Lấy danh sách các danh mục gốc từ API và hiển thị thành lưới với carousel
 * Chức năng:
 * - Gọi API để lấy danh sách danh mục gốc
 * - Hiển thị danh mục dưới dạng thẻ có màu sắc
 * - Khởi tạo carousel nếu có nhiều hơn 6 danh mục
 * - Xử lý trạng thái loading và lỗi
 */
async function loadCategories() {
    try {
        const categoriesGrid = document.getElementById("categories-grid");
        const categoriesContainer = document.querySelector(".categories-container"); // Lấy container cho logic carousel
        if (!categoriesGrid || !categoriesContainer) return;

        // Hiển thị trạng thái đang tải
        categoriesGrid.innerHTML = 
            '<div class="loading">Đang tải danh mục...</div>';

        // Gọi API để lấy danh mục gốc kèm số lượng bài viết
        // Thêm tham số root=true và count=true
        const response = await fetchApi(
            "/categories.php?action=list&root=true&count=true" // Đường dẫn endpoint đã được chỉnh sửa
        );

        if (!response || !response.success || !response.data || !response.data.categories) {
            console.error("Lỗi API khi tải danh mục:", response?.message || "Phản hồi API không hợp lệ. Sử dụng dữ liệu mẫu?");
            categoriesGrid.innerHTML =
                '<div class="no-data">Không thể tải danh mục.</div>';
            return;
        }
        console.log("Danh mục đã tải từ API/Mock:", response.data.categories); // Ghi log danh mục đã tải

        const categories = response.data.categories;

        if (categories.length === 0) {
            categoriesGrid.innerHTML =
                '<div class="no-data">Không có danh mục nào.</div>';
            return;
        }

        // Xóa trạng thái loading
        categoriesGrid.innerHTML = "";

        // Định nghĩa bảng màu cho danh mục
        const colorPalette = [
            { bg: "#FEF3C7", text: "#92400E" }, // Vàng nhạt
            { bg: "#DBEAFE", text: "#1E40AF" }, // Xanh dương nhạt
            { bg: "#FCE7F3", text: "#9D174D" }, // Hồng nhạt
            { bg: "#D1FAE5", text: "#065F46" }, // Xanh lá nhạt - điều chỉnh màu nền để tương thích với chữ tối
            { bg: "#EDE4D8", text: "#5C4033" }, // Nâu nhạt
            { bg: "#F5ECE1", text: "#8A4A3C" }  // Cam nhạt
        ];

        // Hiển thị các danh mục
        categories.forEach((category, index) => {
            const colorIndex = index % colorPalette.length;
            const colors = colorPalette[colorIndex];

            const categoryCard = document.createElement("a");
            // Liên kết đến trang danh mục với ID cụ thể
            categoryCard.href = `category.html?id=${category.id}`;
            // Thêm class chung và class màu cụ thể
            categoryCard.className = `category-card category-color-${colorIndex}`;
            // Ghi chú: Có thể áp dụng màu trực tiếp qua style nếu cần (phương án dự phòng)
            // categoryCard.style.backgroundColor = colors.bg;
            // categoryCard.style.setProperty("--category-text-color", colors.text);

            categoryCard.innerHTML = `
                <div class="category-icon">
                    <i class="${getCategoryIcon(category.name)}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${formatCount(category.item_count || 0)} bài viết</p> 
            `; // Sử dụng item_count từ API

            categoriesGrid.appendChild(categoryCard);
        });

        // Khởi tạo điều hướng/carousel danh mục *sau khi* đã tải xong danh mục
        initCategoryNavigation(categories.length);

    } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
        const categoriesGrid = document.getElementById("categories-grid");
        if (categoriesGrid) {
            categoriesGrid.innerHTML =
                '<div class="error">Không thể tải danh mục. Vui lòng thử lại sau.</div>';
        }
    }
}

/**
 * Tải đánh giá nổi bật từ API và hiển thị
 * Mục đích: Lấy và hiển thị các đánh giá được đánh dấu nổi bật từ API
 * Chức năng:
 * - Gọi API để lấy tối đa 3 đánh giá nổi bật
 * - Hiển thị thông tin sản phẩm, đánh giá và người đánh giá
 * - Hỗ trợ hiển thị hình ảnh sản phẩm hoặc fallback
 * - Tạo avatar cho người đánh giá
 * - Xử lý trạng thái loading và lỗi
  */
async function loadFeaturedReviews() {
    try {
        const reviewsGrid = document.getElementById("featured-reviews-grid");
        if (!reviewsGrid) return;

        // Hiển thị trạng thái đang tải
        reviewsGrid.innerHTML =
            '<div class="loading">Đang tải đánh giá nổi bật...</div>';

        // Gọi API để lấy đánh giá nổi bật (điều chỉnh endpoint/params nếu cần)
        // Giả định API reviews có thể lấy đánh giá nổi bật kèm thông tin sản phẩm
        const response = await fetchApi("/reviews.php?action=list_featured&limit=3"); // Đường dẫn endpoint đã được chỉnh sửa

        if (!response || !response.success || !response.data || !response.data.reviews) {
             console.error("Lỗi API khi tải đánh giá nổi bật:", response?.message || "Phản hồi API không hợp lệ cho reviews. Sử dụng dữ liệu mẫu?");
            reviewsGrid.innerHTML =
                '<div class="no-data">Không có đánh giá nổi bật nào.</div>';
            return;
        }
        console.log("Đánh giá nổi bật đã tải từ API/Mock:", response.data.reviews); // Ghi log đánh giá đã tải
        const reviews = response.data.reviews;

        // Đảm bảo chỉ hiển thị số đánh giá đã nhận (tối đa 3 từ API/Mock)
        const reviewsToRender = reviews.slice(0, 3); // Chỉ lấy 3 đánh giá đầu tiên, ngay cả khi nhận nhiều hơn do lỗi

        if (reviewsToRender.length === 0) {
            reviewsGrid.innerHTML =
                '<div class="no-data">Không có đánh giá nổi bật nào.</div>';
            return;
        }

        // Xóa trạng thái loading
        reviewsGrid.innerHTML = "";

        // Hiển thị đánh giá với hỗ trợ hình ảnh sản phẩm
        reviews.forEach((review) => {
            const reviewCard = document.createElement("div");
            reviewCard.className = "review-card";

            // Trích xuất hình ảnh đầu tiên từ hình ảnh sản phẩm
            const productImage = Avatar._getFirstProductImage(review.product_images);
            const hasImage = productImage && productImage.trim();

            // Cấu trúc HTML với hiển thị hình ảnh sản phẩm
            reviewCard.innerHTML = `
                <div class="review-card-top ${hasImage ? 'has-image' : ''}">
                    <div class="product-image-container">
                        ${hasImage ? 
                            `<img src="${productImage}" 
                                 alt="${review.product_name || 'Sản phẩm'}" 
                                 class="review-product-image"
                                 onerror="Avatar.handleProductImageError(this, '${review.product_name || 'Sản phẩm'}', '120px')"
                                 style="display: block">
                             <div class="product-fallback-placeholder" style="display: none;"></div>` 
                            :
                            `<img style="display: none">
                             <div class="product-fallback-placeholder" style="display: flex;">
                                 ${Avatar.createProductFallbackHTML(review.product_name || 'Sản phẩm', '120px')}
                             </div>`
                        }
                    </div>
                </div>
                <div class="review-card-bottom">
                    <div class="review-header">
                        <h4 class="review-product-name-detail">${review.product_name || 'Sản phẩm'}</h4>
                        <div class="rating">
                            <span class="stars">${generateStars(review.rating)}</span>
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${truncateText(review.comment, 120)}</p>
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

            // Thêm avatar bằng cách sử dụng lớp Avatar
            const avatarContainer = reviewCard.querySelector(`#review-avatar-${review.id || Math.random().toString(36).substring(7)}`);
            if (avatarContainer) {
                avatarContainer.innerHTML = Avatar.createFallbackHTML(getDisplayName(review), '40px');
            }
            
            reviewsGrid.appendChild(reviewCard);
        });
    } catch (error) {
        console.error("Lỗi khi tải đánh giá nổi bật:", error);
        const reviewsGrid = document.getElementById("featured-reviews-grid");
        if (reviewsGrid) {
            reviewsGrid.innerHTML =
                '<div class="error">Không thể tải đánh giá nổi bật. Vui lòng thử lại sau.</div>';
        }
    }
}

/**
 * Tải chủ đề nóng từ API và hiển thị
 * Mục đích: Lấy và hiển thị các bài viết/chủ đề được quan tâm nhiều nhất
 * Chức năng:
 * - Gọi API để lấy 5 chủ đề nóng nhất
 * - Hiển thị thông tin tác giả, lượt xem, bình luận
 * - Tạo avatar cho tác giả bài viết
 * - Định dạng thời gian và nội dung bài viết
 * - Xử lý trạng thái loading và lỗi
 */
async function loadHotTopics() {
    try {
        const topicsList = document.getElementById("hot-topics-list");
        if (!topicsList) return;

        // Hiển thị trạng thái đang tải
        topicsList.innerHTML = '<div class="loading">Đang tải chủ đề nóng...</div>';

        const response = await window.api.loadHotTopics(5); // Yêu cầu 5 chủ đề một cách nhất quán
        
        if (!response || !response.success || !response.data || !response.data.posts) {
            console.error("Lỗi API khi tải chủ đề nóng:", response?.message || "Cấu trúc phản hồi API không hợp lệ");
            topicsList.innerHTML = '<div class="no-data">Không có chủ đề nóng nào.</div>';
            return;
        }

        const topics = response.data.posts;

        if (topics.length === 0) {
            topicsList.innerHTML = '<div class="no-data">Không có chủ đề nóng nào.</div>';
            return;
        }

        // Xóa trạng thái loading
        topicsList.innerHTML = "";

        // Hiển thị các chủ đề
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
            
            // Thêm avatar bằng cách sử dụng lớp Avatar
            const avatarContainer = topicCard.querySelector(`#topic-avatar-${topic.id || Math.random().toString(36).substring(7)}`);
            if (avatarContainer) {
                avatarContainer.innerHTML = Avatar.createFallbackHTML(getDisplayName(topic), '40px');
            }
            
            topicsList.appendChild(topicCard);
        });
    } catch (error) {
        console.error("Lỗi khi tải chủ đề nóng:", error);
        const topicsList = document.getElementById("hot-topics-list");
        if (topicsList) {
            topicsList.innerHTML =
                '<div class="error">Không thể tải chủ đề nóng. Vui lòng thử lại sau.</div>';
        }
    }
}

/**
 * Kiểm tra trạng thái đăng nhập và ẩn phần CTA nếu đã đăng nhập
 * Mục đích: Ẩn khu vực call-to-action (kêu gọi hành động) nếu người dùng đã đăng nhập
 * Chức năng:
 * - Kiểm tra trạng thái đăng nhập từ hàm global hoặc API
 * - Ẩn phần CTA nếu người dùng đã đăng nhập
 * - Fallback sang gọi API trực tiếp nếu hàm global không có
 * - Xử lý lỗi một cách an toàn
 */
async function checkLoginStatusForCTA() {
    const ctaSection = document.getElementById('cta-section');
    if (!ctaSection) return;

    // Sử dụng hàm checkLoginStatus hiện có từ main.js (giả định rằng nó có sẵn)
    if (typeof window.checkLoginStatus === 'function') {
        const loggedIn = await window.checkLoginStatus(); // Giả định rằng nó trả về true nếu đã đăng nhập
        if (loggedIn) {
            ctaSection.style.display = 'none'; // Ẩn CTA nếu đã đăng nhập
        }
    } else {
        console.warn('Không tìm thấy hàm checkLoginStatus. Không thể xác định trạng thái đăng nhập cho CTA.');
        // Tùy chọn, thử gọi API trực tiếp nếu hàm main.js không đáng tin cậy
        try {
            const status = await fetchApi('/auth.php?action=status'); // Đường dẫn endpoint đã chỉnh sửa cho fallback
            if (status && status.success && status.data && status.data.logged_in) {
                 ctaSection.style.display = 'none';
            }
        } catch (err) {
            console.error('Lỗi khi kiểm tra trạng thái đăng nhập qua API:', err);
        }
    }
}


/**
 * Khởi tạo điều hướng danh mục với các nút mũi tên nếu cần
 * Mục đích: Thiết lập carousel cho danh mục khi có nhiều hơn 6 danh mục
 * Chức năng:
 * - Kiểm tra số lượng danh mục để quyết định có cần carousel không
 * - Thiết lập các nút prev/next cho việc cuộn ngang
 * - Theo dõi trạng thái cuộn và cập nhật trạng thái nút
 * - Sử dụng ResizeObserver để phát hiện thay đổi kích thước
 * - Cuộn mượt mà khi nhấn nút
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

    // Chỉ kích hoạt carousel nếu số danh mục > 6
    if (categoryCount <= 6) {
        categoriesContainer.classList.add("no-carousel"); // Thêm class để có thể ẩn mũi tên qua CSS
        prevButton.style.display = "none";
        nextButton.style.display = "none";
        return; // Không cần logic carousel
    }
     categoriesContainer.classList.remove("no-carousel");
     prevButton.style.display = ""; // Đảm bảo các nút hiển thị nếu cần
     nextButton.style.display = "";

    // Kiểm tra xem có cần điều hướng không (nếu nội dung bị tràn)
    const checkOverflow = () => {
        // Tính toán lại dựa trên các phần tử đã render thực tế
        const isOverflowing = categoriesGrid.scrollWidth > categoriesWrapper.clientWidth;

        // Hiện/ẩn các nút điều hướng dựa trên việc tràn
        if (isOverflowing) {
            prevButton.classList.add("visible");
            nextButton.classList.add("visible");
        } else {
            prevButton.classList.remove("visible");
            nextButton.classList.remove("visible");
        }

        // Cập nhật trạng thái nút
        updateCarouselArrows();
    };

    // Cập nhật trạng thái nút mũi tên
    const updateCarouselArrows = () => {
        const scrollLeft = categoriesWrapper.scrollLeft;
        const scrollWidth = categoriesGrid.scrollWidth;
        const clientWidth = categoriesWrapper.clientWidth;

        // Vô hiệu hóa/kích hoạt nút dựa trên vị trí cuộn
        // Thêm tolerance nhỏ cho các vấn đề floating point
        prevButton.classList.toggle("disabled", scrollLeft <= 1);
        nextButton.classList.toggle("disabled", scrollLeft >= scrollWidth - clientWidth - 1);
    };

    // Cuộn trái khi nhấn nút prev
    prevButton.addEventListener("click", () => {
        categoriesWrapper.scrollBy({
            left: -categoriesWrapper.clientWidth / 2, // Cuộn nửa chiều rộng viewport
            behavior: "smooth",
        });
    });

    // Cuộn phải khi nhấn nút next
    nextButton.addEventListener("click", () => {
        categoriesWrapper.scrollBy({
            left: categoriesWrapper.clientWidth / 2, // Cuộn nửa chiều rộng viewport
            behavior: "smooth",
        });
    });

    // Cập nhật trạng thái mũi tên khi cuộn
    categoriesWrapper.addEventListener("scroll", updateCarouselArrows);

    // Sử dụng ResizeObserver để kiểm tra overflow đáng tin cậy hơn
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(categoriesWrapper);
    resizeObserver.observe(categoriesGrid);

    // Kiểm tra ban đầu
    // Sử dụng setTimeout để đảm bảo layout ổn định sau khi render
    setTimeout(checkOverflow, 100);
}

// === CÁC HÀM TRỢ GIÚP (HELPER FUNCTIONS) ===

/**
 * Hàm trợ giúp: Lấy CSS class cho danh mục
 * Mục đích: Trả về CSS class phù hợp dựa trên tên danh mục
 * Chức năng:
 * - Chuyển đổi tên danh mục thành CSS class tương ứng
 * - Hỗ trợ các danh mục phổ biến bằng tiếng Việt
 * - Tạo class động cho các danh mục mới
 * - Trả về class mặc định nếu không khớp
 */
function getCategoryClass(categoryName) {
    if (!categoryName) return "default-cat"; // Cung cấp class mặc định

    const name = categoryName.toLowerCase().trim();
    // Sử dụng khớp mẫu mạnh mẽ hơn, hoặc ánh xạ ID thành class
    if (name.includes("công nghệ")) return "tech";
    if (name.includes("thời trang")) return "fashion";
    if (name.includes("du lịch")) return "travel";
    if (name.includes("ẩm thực")) return "food";
    if (name.includes("giáo dục")) return "education";
    if (name.includes("sức khỏe")) return "health";
    if (name.includes("giải trí")) return "entertainment"; // Thêm các danh mục còn thiếu
    if (name.includes("nội thất")) return "furniture";
    if (name.includes("làm đẹp")) return "beauty";
    // Thêm các class cụ thể hoặc mặc định
    const simpleName = name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `cat-${simpleName || 'default'}`;
}

/**
 * Hàm trợ giúp: Lấy icon cho danh mục
 * Mục đích: Trả về CSS class icon Font Awesome phù hợp cho danh mục
 * Chức năng:
 * - Ánh xạ tên danh mục thành icon tương ứng
 * - Hỗ trợ cả tiếng Việt và tiếng Anh
 * - Bao gồm các danh mục phổ biến (công nghệ, thời trang, du lịch, v.v.)
 * - Trả về icon mặc định nếu không tìm thấy
 */
function getCategoryIcon(categoryName) {
    if (!categoryName) return "fas fa-folder"; // Icon mặc định

    const name = categoryName.toLowerCase().trim();
    
    // Công nghệ
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
 * Hàm trợ giúp: Định dạng số lượng (ví dụ: 1.2k)
 * Mục đích: Chuyển đổi số lượng thành định dạng ngắn gọn và dễ đọc
 * Chức năng:
 * - Chuyển số từ 1000 trở lên thành định dạng "k" (nghìn)
 * - Xử lý các giá trị null/undefined một cách an toàn
 * - Trả về "0" cho các giá trị không hợp lệ
 */
function formatCount(count) {
    const num = parseInt(count, 10);
    if (isNaN(num) || num === 0) return "0";
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(".0", "") + "k"; // Tránh .0 cho số nghìn tròn
    }
    return num.toString();
}

/**
 * Hàm trợ giúp: Cắt ngắn văn bản
 * Mục đích: Cắt ngắn văn bản dài thành độ dài giới hạn với dấu ba chấm
 * Chức năng:
 * - Cắt văn bản tại vị trí khoảng trắng gần nhất để tránh cắt giữa từ
 * - Thêm dấu "..." ở cuối văn bản đã cắt
 * - Xử lý an toàn với giá trị null/undefined
 * - Tối ưu hóa trải nghiệm đọc bằng cách tránh cắt giữa từ
 */
function truncateText(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    // Tìm khoảng trắng cuối cùng trong giới hạn maxLength để tránh cắt giữa từ
    let truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength / 2) { // Chỉ cắt tại khoảng trắng nếu nó ở vị trí hợp lý
        truncated = truncated.substring(0, lastSpace);
    }
    return truncated + "...";
}

/**
 * Hàm trợ giúp: Lấy chữ cái đầu từ tên
 * Mục đích: Trích xuất chữ cái đầu tiên của tên để tạo avatar fallback
 * Chức năng:
 * - Lấy chữ cái đầu tiên của từ đầu tiên trong tên
 * - Chuyển thành chữ hoa
 * - Xử lý an toàn với giá trị null/undefined
 * - Trả về "?" nếu không có tên hợp lệ
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return "?";
    const parts = name.trim().split(" ").filter(part => part.length > 0);
    if (parts.length === 0) return "?";
    // Lấy chữ cái đầu tiên của phần tên đầu tiên
    return parts[0].charAt(0).toUpperCase();
}

/**
 * Hàm trợ giúp: Tạo HTML hiển thị đánh giá sao
 * Mục đích: Chuyển đổi số điểm đánh giá thành HTML hiển thị sao
 * Chức năng:
 * - Hiển thị sao đầy, sao nửa và sao rỗng dựa trên điểm số
 * - Xử lý an toàn với giá trị null/undefined/không hợp lệ
 * - Giới hạn điểm từ 0-5 sao
 * - Sử dụng Font Awesome icons cho sao
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
    for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>'; // Sử dụng far cho sao rỗng

    return starsHTML;
}

/**
 * Hàm trợ giúp: Định dạng ngày tháng (ví dụ: DD/MM/YYYY)
 * Mục đích: Chuyển đổi chuỗi ngày thành định dạng hiển thị theo tiếng Việt
 * Chức năng:
 * - Chuyển đổi Date object hoặc chuỗi ngày thành định dạng DD/MM/YYYY
 * - Xử lý an toàn với ngày không hợp lệ
 * - Hiển thị thông báo lỗi thân thiện khi ngày không hợp lệ
 * - Sử dụng định dạng ngày Việt Nam
 */
function formatDate(dateString) {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        // Kiểm tra xem ngày có hợp lệ không
        if (isNaN(date.getTime())) {
            return "Ngày không hợp lệ";
        }
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch (e) {
        console.error("Lỗi khi định dạng ngày:", dateString, e);
        return "Ngày không hợp lệ";
    }
}

/**
 * Hàm trợ giúp: Định dạng thời gian trôi qua (ví dụ: 2 giờ trước)
 * Mục đích: Chuyển đổi chuỗi ngày thành cách hiển thị thời gian tương đối
 * Chức năng:
 * - Tính toán và hiển thị khoảng thời gian từ thời điểm hiện tại
 * - Hiển thị theo đơn vị phù hợp (giây, phút, giờ, ngày, tuần, tháng, năm)
 * - Xử lý an toàn với chuỗi ngày null/undefined
 * - Hỗ trợ ngôn ngữ tiếng Việt
 */
function formatTimeAgo(dateString) {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        // Kiểm tra xem ngày có hợp lệ không
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
        if (weeks < 4.345) return `${weeks} tuần trước`; // Sử dụng số tuần trung bình trong tháng

        const months = Math.floor(days / 30.4375); // Sử dụng số ngày trung bình trong tháng
        if (months < 12) return `${months} tháng trước`;

        const years = Math.floor(days / 365.25); // Tính năm nhuận
        return `${years} năm trước`;
    } catch (e) {
        console.error("Lỗi khi định dạng thời gian trôi qua:", dateString, e);
        return "Thời gian không hợp lệ";
    }
}

/**
 * Hàm trợ giúp: Lấy tên hiển thị cho user
 * Mục đích: Trả về tên hiển thị phù hợp từ các field có thể có của user
 * Chức năng:
 * - Ưu tiên full_name nếu có
 * - Fallback về username nếu không có full_name
 * - Trả về "Ẩn danh" nếu không có tên nào
 * - Xử lý an toàn với object null/undefined
 */
function getDisplayName(user) {
    if (!user) return "Ẩn danh";
    if (user.full_name && user.full_name.trim()) return user.full_name;
    if (user.username && user.username.trim()) return user.username;
    return "Ẩn danh";
}

// Đảm bảo fetchApi được định nghĩa (giả định nó ở trong api.js hoặc file tương tự)
if (typeof fetchApi === 'undefined') {
    console.error("Hàm fetchApi chưa được định nghĩa. Hãy đảm bảo api.js được tải trước home.js");
    // Định nghĩa một hàm dummy để tránh script bị lỗi, nhưng ghi log lỗi
    window.fetchApi = async (url, options) => {
        console.error(`fetchApi được gọi nhưng chưa được định nghĩa. URL: ${url}, Options:`, options);
        throw new Error("fetchApi is not defined");
    };
}

