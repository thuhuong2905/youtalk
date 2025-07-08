/**
 * Trang Diễn Đàn - JavaScript cho chức năng trang diễn đàn
 * Xử lý tải các chủ đề thảo luận, lọc, tìm kiếm, sắp xếp và phân trang
 * Bao gồm: hiển thị chủ đề, phân trang, chủ đề nổi bật, thành viên tích cực
 */

/**
 * Mục đích: Chờ đợi API được khởi tạo trước khi sử dụng các chức năng
 */
function waitForApi() {
    return new Promise((resolve) => {
        const checkApi = () => {
            if (window.api) {
                resolve();
            } else {
                setTimeout(checkApi, 50);
            }
        };
        checkApi();
    });
}

// Khởi tạo trang khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', async function() {
    await waitForApi();
    initForumPage();
});

/**
 * Khởi tạo chức năng trang diễn đàn
 * Mục đích: Thiết lập trạng thái ban đầu và tải dữ liệu cho trang
 * - Lấy tham số từ URL (loại bài, trang, tìm kiếm, sắp xếp)
 * - Thiết lập giao diện ban đầu
 * - Tải dữ liệu song song (chủ đề, chủ đề nổi bật, thành viên tích cực)
 * - Thiết lập các event listener
 */
async function initForumPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const postType = urlParams.get('post_type') || 'all';
    const page = parseInt(urlParams.get('page')) || 1;
    const searchQuery = urlParams.get('search') || '';
    const sortBy = urlParams.get('sort') || 'newest';
    
    // Thiết lập trạng thái ban đầu
    if (searchQuery) {
        document.getElementById('topic-search').value = searchQuery;
    }
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = sortBy;
    }
    
    highlightActivePostType(postType);
    
    try {
        // Tải tất cả dữ liệu song song
        await Promise.all([
            loadTopics(postType, page, searchQuery, sortBy),
            loadHotTopics(),
            loadActiveUsers()
        ]);
    } catch (error) {
        console.error('Lỗi khởi tạo trang:', error);
    }

    setupEventListeners();
}

/**
 * Đánh dấu tab loại bài đăng đang được chọn
 * Mục đích: Cập nhật giao diện để hiển thị tab nào đang active
 * - Xóa class active khỏi tất cả tab
 * - Thêm class active cho tab được chọn
 * - Fallback về tab "all" nếu không tìm thấy loại phù hợp
 */
function highlightActivePostType(postType) {
    // Xóa class active khỏi tất cả các tab loại bài đăng
    const postTypeTabs = document.querySelectorAll('.post-type-tab');
    postTypeTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Thêm class active cho tab loại bài đăng được chọn
    const activeTab = document.querySelector(`.post-type-tab[data-post-type="${postType}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    } else {
        // Nếu không có loại nào được chọn hoặc loại không hợp lệ, đánh dấu "all"
        const allTab = document.querySelector('.post-type-tab[data-post-type="all"]');
        if (allTab) {
            allTab.classList.add('active');
        }
    }
}

/**
 * Tải chủ đề theo bộ lọc
 * Mục đích: Lấy và hiển thị danh sách chủ đề dựa trên các tham số lọc
 * - Hiển thị trạng thái loading
 * - Gọi API với các tham số phù hợp
 * - Xử lý kết quả và hiển thị chủ đề
 * - Render phân trang nếu có
 * - Xử lý các trường hợp lỗi và không có dữ liệu
 */
async function loadTopics(postType, page, searchQuery, sortBy) {
    try {
        const topicsList = document.getElementById('topics-list');
        if (!topicsList) return;
        
        topicsList.innerHTML = '<div class="loading">Đang tải chủ đề...</div>';
        
        const params = {
            page,
            sort: sortBy
        };
        
        if (postType !== 'all') {
            params.post_type = postType;
        }
        
        if (searchQuery) {
            params.search = searchQuery;
        }
        
        const response = await fetchApi(`posts.php?action=get_topics&${new URLSearchParams(params)}`);
        
        if (!response.success) {
            console.error('Không thể tải chủ đề:', response.message);
            topicsList.innerHTML = '<div class="error">Đã xảy ra lỗi. Vui lòng thử lại sau.</div>';
            return;
        }
        
        if (!response.data?.topics?.length) {
            topicsList.innerHTML = '<div class="no-results">Không tìm thấy chủ đề nào phù hợp.</div>';
            return;
        }
        
        renderTopics(response.data.topics, topicsList);
        if (response.data.pagination) {
            renderPagination(response.data.pagination, postType, searchQuery, sortBy);
        }
        
    } catch (error) {
        console.error('Lỗi khi tải chủ đề:', error);
        const topicsList = document.getElementById('topics-list');
        if (topicsList) {
            topicsList.innerHTML = '<div class="error">Đã xảy ra lỗi. Vui lòng thử lại sau.</div>';
        }
    }
}

/**
 * Hiển thị danh sách chủ đề lên trang
 * Mục đích: Render HTML cho từng chủ đề trong danh sách
 * - Tạo card cho mỗi chủ đề với đầy đủ thông tin
 * - Hiển thị meta data (loại bài, lượt xem, bình luận, thời gian)
 * - Thiết lập avatar cho tác giả
 * - Tạo link đến trang chi tiết
 */
function renderTopics(topics, container) {
    container.innerHTML = '';
    
    topics.forEach(topic => {
        const topicCard = document.createElement('div');
        topicCard.className = 'topic-card';
        topicCard.innerHTML = `
                <div class="topic-content">
                    <h3><a href="post-detail.html?id=${topic.id}">${topic.title}</a></h3>
                    <div class="topic-meta">
                        <span class="topic-category">${getPostTypeLabel(topic.post_type)}</span>
                        <span class="topic-views"><i class="fas fa-eye"></i> ${formatCount(topic.view_count)}</span>
                        <span class="topic-comments"><i class="fas fa-comment"></i> ${topic.comment_count}</span>
                        <span class="topic-date"><i class="fas fa-clock"></i> ${formatTimeAgo(topic.created_at)}</span>
                    </div>
                    <p class="topic-excerpt">${truncateText(topic.content, 200)}</p>
                </div>
                <div class="topic-footer">
                    <div class="topic-author">
                        <div class="avatar-container" id="avatar-${topic.id}"></div>
                        <span>${getDisplayName(topic)}</span>
                    </div>
                    <a href="post-detail.html?id=${topic.id}" class="topic-link">Xem chi tiết</a>
                </div>
            `;
            
        // Gán avatar đồng bộ với thành viên tích cực
        const avatarContainer = topicCard.querySelector(`#avatar-${topic.id}`);
        if (avatarContainer) {
            setUserAvatar(avatarContainer, topic.profile_picture, getDisplayName(topic), '40px');
        }
        container.appendChild(topicCard);
    });
}

/**
 * Hiển thị phân trang
 * Mục đích: Tạo và hiển thị các nút phân trang với logic thông minh
 * - Ẩn phân trang nếu chỉ có 1 trang
 * - Hiển thị nút Previous/Next
 * - Hiển thị tối đa 5 trang với logic rút gọn (...)
 * - Bao gồm trang đầu và cuối
 * - Giữ nguyên các tham số lọc trong URL
 */
function renderPagination(pagination, postType, searchQuery, sortBy) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    if (!pagination || pagination.total_pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    const { current_page, total_pages } = pagination;
    let baseQuery = new URLSearchParams();
    if (postType && postType !== 'all') baseQuery.set('post_type', postType);
    if (searchQuery) baseQuery.set('search', searchQuery);
    if (sortBy) baseQuery.set('sort', sortBy);

    let paginationHTML = '';

    // Nút trang trước
    if (current_page > 1) {
        baseQuery.set('page', current_page - 1);
        paginationHTML += `<a href="?${baseQuery.toString()}" class="prev">«</a>`;
    }

    // Logic hiển thị các trang với rút gọn
    const maxVisiblePages = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(total_pages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Hiển thị trang đầu và dấu ... nếu cần
    if (startPage > 1) {
        baseQuery.set('page', 1);
        paginationHTML += `<a href="?${baseQuery.toString()}">1</a>`;
        if (startPage > 2) {
            paginationHTML += `<span class="ellipsis">...</span>`;
        }
    }
    
    // Hiển thị các trang trong khoảng
    for (let i = startPage; i <= endPage; i++) {
        baseQuery.set('page', i);
        if (i === current_page) {
            paginationHTML += `<a href="?${baseQuery.toString()}" class="active">${i}</a>`;
        } else {
            paginationHTML += `<a href="?${baseQuery.toString()}">${i}</a>`;
        }
    }
    
    // Hiển thị dấu ... và trang cuối nếu cần
    if (endPage < total_pages) {
        if (endPage < total_pages - 1) {
            paginationHTML += `<span class="ellipsis">...</span>`;
        }
        baseQuery.set('page', total_pages);
        paginationHTML += `<a href="?${baseQuery.toString()}">${total_pages}</a>`;
    }
    
    // Nút trang sau
    if (current_page < total_pages) {
        baseQuery.set('page', current_page + 1);
        paginationHTML += `<a href="?${baseQuery.toString()}" class="next">»</a>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * Tải chủ đề nổi bật cho sidebar
 * Mục đích: Hiển thị danh sách chủ đề có nhiều tương tác nhất
 * - Gọi API để lấy top 5 chủ đề nổi bật
 * - Hiển thị với title rút gọn và link đến chi tiết
 * - Xử lý trường hợp không có dữ liệu hoặc lỗi
 * - Thêm class CSS dựa trên loại bài đăng
 */
async function loadHotTopics() {
    try {
        const hotTopicsList = document.querySelector('.hot-topics-list');
        if (!hotTopicsList) return;
        
        hotTopicsList.innerHTML = '<div class="loading">Đang tải chủ đề nổi bật...</div>';
        
        const response = await window.api.loadHotTopics(5);
        
        if (!response?.success || !response.data?.posts?.length) {
            hotTopicsList.innerHTML = '<p class="no-data">Chưa có chủ đề nóng nào.</p>';
            return;
        }
        
        hotTopicsList.innerHTML = '';
        
        response.data.posts.forEach((topic, index) => {
            const postTypeClass = getPostTypeClass(topic.post_type);
            const hotTopic = document.createElement('li');
            hotTopic.className = `hot-topic ${postTypeClass}`;
            
            hotTopic.innerHTML = `
                <a href="post-detail.html?id=${topic.id}">${truncateText(topic.title, 40)}</a>
            `;
            
            hotTopicsList.appendChild(hotTopic);
        });
    } catch (error) {
        console.error('Lỗi khi tải chủ đề nổi bật:', error);
        const hotTopicsList = document.querySelector('.hot-topics-list');
        if (hotTopicsList) {
            hotTopicsList.innerHTML = '<p class="error">Không thể tải chủ đề nóng. Vui lòng thử lại sau.</p>';
        }
    }
}

/**
 * Tải thành viên tích cực cho sidebar
 * Mục đích: Hiển thị top 5 thành viên có hoạt động nhiều nhất
 * - Gọi API để lấy danh sách thành viên tích cực
 * - Xử lý và chuẩn hóa dữ liệu phản hồi
 * - Render danh sách với avatar và thông tin cơ bản
 * - Xử lý trường hợp không có dữ liệu hoặc lỗi
 */
async function loadActiveUsers() {
    try {
        const activeUsersList = document.querySelector('.active-users-list');
        if (!activeUsersList) return;
        
        activeUsersList.innerHTML = '<div class="loading-indicator">Đang tải thành viên tích cực...</div>';
        
        const response = await window.api.loadActiveUsers(5);
        console.log('Phản hồi thành viên tích cực:', response);
        
        // Trích xuất users từ phản hồi đã chuẩn hóa
        const users = response?.data?.users || [];
        console.log('Danh sách users đã trích xuất:', users);
        
        if (users.length === 0) {
            activeUsersList.innerHTML = '<div class="no-data">Chưa có thành viên tích cực.</div>';
            return;
        }
        
        renderActiveUsers(users, activeUsersList);
        
    } catch (error) {
        console.error('Lỗi khi tải thành viên tích cực:', error);
        const activeUsersList = document.querySelector('.active-users-list');
        if (activeUsersList) {
            activeUsersList.innerHTML = '<div class="error">Không thể tải danh sách thành viên.</div>';
        }
    }
}

/**
 * Render danh sách thành viên tích cực
 * Mục đích: Hiển thị thông tin thành viên với avatar và thống kê
 * - Tạo element cho mỗi thành viên với thông tin đầy đủ
 * - Thiết lập avatar (ảnh thật hoặc fallback)
 * - Hiển thị tooltip với chi tiết hoạt động
 * - Tạo link đến trang profile của thành viên
 * - Xử lý an toàn các field có thể null/undefined
 */
function renderActiveUsers(users, container) {
    container.innerHTML = '';
    users.forEach((user, index) => {
        const activeUser = document.createElement('li');
        activeUser.className = 'active-user';
        
        // Tạo ID duy nhất và an toàn
        const userId = user.id || user.user_id || Math.random().toString(36).substring(7);
        const avatarId = `user-avatar-${userId}`;
        
        // Đảm bảo các field tồn tại với fallback values
        const fullName = user.full_name || user.name || 'Ẩn danh';
        const activityScore = user.activity_score || 0;
        const postCount = user.post_count || 0;
        const commentCount = user.comment_count || 0;
        const reviewCount = user.review_count || 0;
        const followerCount = user.follower_count || 0;
        
        // Thêm tooltip hiển thị thông tin chi tiết về hoạt động
        const activityDetails = `${postCount} bài viết, ${commentCount} bình luận, ${reviewCount} đánh giá, ${followerCount} người theo dõi, Điểm hoạt động: ${activityScore}`;
        
        activeUser.innerHTML = `
            <a href="profile.html?user_id=${userId}" class="active-user-link" title="${activityDetails}">
                <div class="user-info">
                    <div class="avatar-container" id="${avatarId}"></div>
                    <div class="user-name">${fullName}</div>
                </div>
                <div class="user-stats">${postCount} bài viết</div>
            </a>
        `;

        container.appendChild(activeUser);
        
        // Thiết lập avatar sử dụng hàm helper tối ưu
        setTimeout(() => {
            const avatarContainer = activeUser.querySelector(`#${avatarId}`);
            if (avatarContainer) {
                setUserAvatar(avatarContainer, user.profile_picture, fullName, '32px');
            }
        }, 0);
    });
}

/**
 * Hàm helper tối ưu: Thiết lập avatar cho user
 * Mục đích: Tái sử dụng logic thiết lập avatar cho nhiều nơi khác nhau
 * - Kiểm tra và hiển thị ảnh avatar thật nếu có
 * - Sử dụng fallback avatar nếu không có ảnh hoặc lỗi tải
 * - Xử lý lỗi load ảnh một cách graceful
 * - Thiết lập style phù hợp cho từng kích thước
 */
function setUserAvatar(container, profilePicture, displayName, size = '40px') {
    if (!container) return;
    
    // Kiểm tra nếu user có profile_picture
    if (profilePicture && profilePicture.trim() !== '') {
        // Tạo img element cho ảnh thật
        const img = document.createElement('img');
        img.src = profilePicture;
        img.alt = `Avatar của ${displayName}`;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        `;
        
        // Xử lý lỗi load ảnh
        img.onerror = () => {
            console.warn(`Ảnh avatar không tải được cho user: ${displayName}. Sử dụng fallback.`);
            container.innerHTML = Avatar.createFallbackHTML(displayName, size);
        };
        
        container.appendChild(img);
    } else {
        // Không có ảnh, sử dụng fallback
        container.innerHTML = Avatar.createFallbackHTML(displayName, size);
    }
}

/**
 * Thiết lập các sự kiện cho các thao tác trên trang diễn đàn
 * Mục đích: Khởi tạo tất cả event listener cho tương tác người dùng
 * - Tab loại bài đăng: chuyển đổi giữa các loại bài
 * - Tìm kiếm: xử lý tìm kiếm theo từ khóa
 * - Sắp xếp: thay đổi thứ tự hiển thị bài viết
 * - Cập nhật URL và reload trang khi có thay đổi filter
 */
function setupEventListeners() {
    // Tab loại bài đăng
    const postTypeTabs = document.querySelectorAll('.post-type-tab');
    postTypeTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const postType = this.getAttribute('data-post-type');
            
            // Cập nhật tham số URL
            const urlParams = new URLSearchParams(window.location.search);
            
            if (postType === 'all') {
                urlParams.delete('post_type');
            } else {
                urlParams.set('post_type', postType);
            }
            
            // Về trang 1 khi thay đổi filter
            urlParams.delete('page');
            
            // Di chuyển đến URL mới
            window.location.href = `?${urlParams.toString()}`;
        });
    });
    
    // Chức năng tìm kiếm
    const searchInput = document.getElementById('topic-search');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
        function performSearch() {
            const searchQuery = searchInput.value.trim();
            
            // Lấy tham số URL hiện tại
            const urlParams = new URLSearchParams(window.location.search);
            
            // Cập nhật tham số tìm kiếm
            if (searchQuery) {
                urlParams.set('search', searchQuery);
            } else {
                urlParams.delete('search');
            }
            
            // Về trang 1 khi tìm kiếm
            urlParams.delete('page');
            
            // Di chuyển đến URL mới
            window.location.href = `?${urlParams.toString()}`;
        }
        
        // Tìm kiếm khi nhấn Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        
        // Tìm kiếm khi click nút
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
    
    // Chức năng sắp xếp
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = sortSelect.value;
            
            // Lấy tham số URL hiện tại
            const urlParams = new URLSearchParams(window.location.search);
            
            // Cập nhật tham số sắp xếp
            urlParams.set('sort', sortBy);
            
            // Về trang 1 khi thay đổi sắp xếp
            urlParams.delete('page');
            
            // Di chuyển đến URL mới
            window.location.href = `?${urlParams.toString()}`;
        });
    }
}

/**
 * Hàm trợ giúp: Chuyển post_type thành tên tiếng Việt
 * Mục đích: Dịch các loại bài đăng từ tiếng Anh sang tiếng Việt
 * - Chuyển đổi các code post_type thành label hiển thị
 * - Hỗ trợ các loại: thảo luận, câu hỏi, đánh giá, tin tức
 * - Trả về "Khác" cho các loại không xác định
 */
function getPostTypeLabel(postType) {
    switch (postType) {
        case 'discussion': return 'Thảo luận';
        case 'question': return 'Câu hỏi';
        case 'review': return 'Đánh giá';
        case 'news': return 'Tin tức';
        default: return 'Khác';
    }
}

/**
 * Hàm trợ giúp: Lấy CSS class cho từng loại post_type
 * Mục đích: Áp dụng style phù hợp cho từng loại bài đăng
 * - Gán class màu sắc cho từng loại bài
 * - Hỗ trợ styling khác biệt cho các loại post
 * - Dễ dàng thay đổi giao diện từng loại
 */
function getPostTypeClass(postType) {
    switch (postType) {
        case 'discussion': return 'tech';
        case 'question': return 'education';
        case 'review': return 'food';
        case 'news': return 'news';
        default: return '';
    }
}

/**
 * Hàm trợ giúp: Rút gọn văn bản
 * Mục đích: Cắt ngắn văn bản dài để hiển thị trong preview
 * - Kiểm tra độ dài và cắt nếu cần thiết
 * - Thêm dấu "..." khi văn bản bị cắt
 * - Xử lý an toàn với văn bản null/undefined
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Hàm trợ giúp: Định dạng số lượng
 * Mục đích: Chuyển đổi số lớn thành dạng viết tắt dễ đọc
 * - Hiển thị số nhỏ hơn 1000 nguyên vẹn
 * - Chuyển số >= 1000 thành dạng "k" (ví dụ: 1.2k)
 * - Xử lý trường hợp null/undefined trả về "0"
 */
function formatCount(count) {
    if (!count) return '0';
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
}

/**
 * Hàm trợ giúp: Tính toán thời gian đã trôi qua
 * Mục đích: Chuyển đổi timestamp thành dạng "x phút trước", "x giờ trước"
 * - Tính toán khoảng cách thời gian từ hiện tại
 * - Hiển thị theo đơn vị phù hợp (giây, phút, giờ, ngày, tuần, tháng, năm)
 * - Xử lý an toàn với chuỗi ngày null/undefined
 * - Hỗ trợ ngôn ngữ tiếng Việt
 */
function formatTimeAgo(dateString) {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'vừa xong';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} tuần trước`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    
    const years = Math.floor(days / 365);
    return `${years} năm trước`;
}

/**
 * Hàm trợ giúp: Lấy tên hiển thị cho user/topic
 * Mục đích: Trả về tên hiển thị phù hợp từ các field có thể có
 * - Ưu tiên full_name nếu có
 * - Fallback về author_name nếu không có full_name
 * - Trả về "Ẩn danh" nếu không có tên nào
 */
function getDisplayName(obj) {
    if (obj.full_name) return obj.full_name;
    if (obj.author_name) return obj.author_name;
    return 'Ẩn danh';
}