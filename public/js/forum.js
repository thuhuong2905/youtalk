/**
 * forum.js - JavaScript cho chức năng trang diễn đàn
 * Xử lý tải các chủ đề thảo luận, lọc, tìm kiếm, sắp xếp và phân trang
 */

// Đảm bảo window.api đã được load
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

document.addEventListener('DOMContentLoaded', async function() {
    await waitForApi();
    initForumPage();
});

/**
 * Khởi tạo chức năng trang diễn đàn
 */
async function initForumPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const postType = urlParams.get('post_type') || 'all';
    const page = parseInt(urlParams.get('page')) || 1;
    const searchQuery = urlParams.get('search') || '';
    const sortBy = urlParams.get('sort') || 'newest';
    
    // Setup initial state
    if (searchQuery) {
        document.getElementById('topic-search').value = searchQuery;
    }
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = sortBy;
    }
    
    highlightActivePostType(postType);
    
    try {
        // Load all data in parallel
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
 * Đánh dấu tab loại bài đăng đang chọn
 * @param {string} postType - Loại bài đăng đang chọn
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
            console.error('Failed to load topics:', response.message);
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
 * @param {Array} topics - Mảng các chủ đề
 * @param {HTMLElement} container - Thẻ chứa
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
 * @param {Object} pagination - Dữ liệu phân trang
 * @param {string} postType
 * @param {string} searchQuery
 * @param {string} sortBy
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

    // Nút trước
    if (current_page > 1) {
        baseQuery.set('page', current_page - 1);
        paginationHTML += `<a href="?${baseQuery.toString()}" class="prev">«</a>`;
    }

    // Trang đầu
    const maxVisiblePages = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(total_pages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    if (startPage > 1) {
        baseQuery.set('page', 1);
        paginationHTML += `<a href="?${baseQuery.toString()}">1</a>`;
        if (startPage > 2) {
            paginationHTML += `<span class="ellipsis">...</span>`;
        }
    }
    for (let i = startPage; i <= endPage; i++) {
        baseQuery.set('page', i);
        if (i === current_page) {
            paginationHTML += `<a href="?${baseQuery.toString()}" class="active">${i}</a>`;
        } else {
            paginationHTML += `<a href="?${baseQuery.toString()}">${i}</a>`;
        }
    }
    if (endPage < total_pages) {
        if (endPage < total_pages - 1) {
            paginationHTML += `<span class="ellipsis">...</span>`;
        }
        baseQuery.set('page', total_pages);
        paginationHTML += `<a href="?${baseQuery.toString()}">${total_pages}</a>`;
    }
    if (current_page < total_pages) {
        baseQuery.set('page', current_page + 1);
        paginationHTML += `<a href="?${baseQuery.toString()}" class="next">»</a>`;
    }
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * Tải chủ đề nổi bật cho sidebar
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
 * ✅ FIXED: Tải thành viên tích cực cho sidebar - Sửa lỗi hiển thị và avatar
 */
async function loadActiveUsers() {
    try {
        const activeUsersList = document.querySelector('.active-users-list');
        if (!activeUsersList) return;
        
        activeUsersList.innerHTML = '<div class="loading-indicator">Đang tải thành viên tích cực...</div>';
        
        const response = await window.api.loadActiveUsers(5);
        console.log('Active users response:', response);
        
        // Extract users from normalized response
        const users = response?.data?.users || [];
        console.log('Extracted users:', users);
        
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
 * ✅ FIXED: Render danh sách thành viên tích cực - Cập nhật avatar logic và loại bỏ rank badge
 */
function renderActiveUsers(users, container) {
    container.innerHTML = '';
    users.forEach((user, index) => {
        const activeUser = document.createElement('li');
        activeUser.className = 'active-user';
        
        // ✅ FIXED: Tạo ID duy nhất và an toàn
        const userId = user.id || user.user_id || Math.random().toString(36).substring(7);
        const avatarId = `user-avatar-${userId}`;
        
        // ✅ FIXED: Đảm bảo các field tồn tại với fallback values
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
 * Hàm helper tối ưu: Thiết lập avatar cho user (tái sử dụng cho nhiều nơi)
 * @param {HTMLElement} container - Container chứa avatar
 * @param {string} profilePicture - URL ảnh avatar (có thể null/empty)
 * @param {string} displayName - Tên hiển thị của user
 * @param {string} size - Kích thước avatar (ví dụ: '40px')
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
            console.warn(`Avatar image failed to load for user: ${displayName}. Using fallback.`);
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
            
            // Về trang 1
            urlParams.delete('page');
            
            // Di chuyển đến URL mới
            window.location.href = `?${urlParams.toString()}`;
        });
    });
    
    // Tìm kiếm
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
            
            // Về trang 1
            urlParams.delete('page');
            
            // Di chuyển đến URL mới
            window.location.href = `?${urlParams.toString()}`;
        }
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
    
    // Sắp xếp
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = sortSelect.value;
            
            // Lấy tham số URL hiện tại
            const urlParams = new URLSearchParams(window.location.search);
            
            // Cập nhật tham số sắp xếp
            urlParams.set('sort', sortBy);
            
            // Về trang 1
            urlParams.delete('page');
            
            // Di chuyển đến URL mới
            window.location.href = `?${urlParams.toString()}`;
        });
    }
}

/**
 * Hàm trợ giúp: Chuyển post_type thành tên tiếng Việt
 * @param {string} postType
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
 * Hàm trợ giúp: CSS class cho từng loại post_type
 * @param {string} postType
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
 * Hàm trợ giúp rút gọn văn bản
 * @param {string} text - Văn bản cần rút gọn
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} - Văn bản đã rút gọn
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
/**
 * Hàm trợ giúp định dạng số lượng
 * @param {number} count - Số lượng
 * @returns {string} - Số đã định dạng
 */
function formatCount(count) {
    if (!count) return '0';
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
}

/**
 * Hàm trợ giúp thời gian trước đó
 * @param {string} dateString - Chuỗi ngày
 * @returns {string} - Thời gian trước đó
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
 */
function getDisplayName(obj) {
    if (obj.full_name) return obj.full_name;
    if (obj.author_name) return obj.author_name;
    return 'Ẩn danh';
}