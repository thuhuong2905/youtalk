/**
 * forum.js - JavaScript for the forum page functionality
 * Handles loading discussions, filtering, searching, sorting, and pagination
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize forum page
    initForumPage();
});

/**
 * Initialize the forum page functionality
 */
async function initForumPage() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category') || 'all';
    const page = parseInt(urlParams.get('page')) || 1;
    const searchQuery = urlParams.get('search') || '';
    const sortBy = urlParams.get('sort') || 'newest';
    
    // Set initial filter states
    if (searchQuery) {
        document.getElementById('topic-search').value = searchQuery;
    }
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = sortBy;
    }
    
    // Highlight active category
    highlightActiveCategory(categoryId);
    
    // Load topics from API
    await loadTopics(categoryId, page, searchQuery, sortBy);
    
    // Load hot topics for sidebar
    await loadHotTopics();
    
    // Load active users for sidebar
    await loadActiveUsers();
    
    // Set up event listeners
    setupEventListeners();
}

/**
 * Highlight the active category tab
 * @param {string} categoryId - The active category ID
 */
function highlightActiveCategory(categoryId) {
    // Remove active class from all category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to the selected category tab
    const activeTab = document.querySelector(`.category-tab[data-category="${categoryId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    } else {
        // If no category is selected or invalid category, highlight "All"
        const allTab = document.querySelector('.category-tab[data-category="all"]');
        if (allTab) {
            allTab.classList.add('active');
        }
    }
}

/**
 * Load topics based on filters
 * @param {string} categoryId - The category ID to filter by
 * @param {number} page - The page number
 * @param {string} searchQuery - The search query
 * @param {string} sortBy - The sort option
 */
async function loadTopics(categoryId, page, searchQuery, sortBy) {
    try {
        // Show loading state
        const topicsList = document.getElementById('topics-list');
        if (!topicsList) return;
        
        topicsList.innerHTML = '<div class="loading">Đang tải chủ đề...</div>';
        
        // Prepare query parameters
        const params = {
            page: page,
            sort: sortBy
        };
        
        if (categoryId && categoryId !== 'all') {
            params.category = categoryId;
        }
        
        if (searchQuery) {
            params.search = searchQuery;
        }
        
        // Fetch topics from API
        const data = await window.api.loadTopics(params);
        
        if (!data.topics || data.topics.length === 0) {
            topicsList.innerHTML = '<div class="no-results">Không tìm thấy chủ đề nào phù hợp với tiêu chí tìm kiếm.</div>';
            return;
        }
        
        // Render topics
        renderTopics(data.topics, topicsList);
        
        // Render pagination
        renderPagination(data.pagination);
        
    } catch (error) {
        console.error('Error loading topics:', error);
        const topicsList = document.getElementById('topics-list');
        if (topicsList) {
            topicsList.innerHTML = '<div class="error">Đã xảy ra lỗi khi tải chủ đề. Vui lòng thử lại sau.</div>';
        }
    }
}

/**
 * Render topics to the page
 * @param {Array} topics - Array of topic objects
 * @param {HTMLElement} container - Container element
 */
function renderTopics(topics, container) {
    container.innerHTML = '';
    
    topics.forEach(topic => {
        const topicCard = document.createElement('div');
        topicCard.className = 'topic-card';
        topicCard.innerHTML = `
                <div class="topic-content">
                    <h3><a href="topic.html?id=${topic.id}">${topic.title}</a></h3>
                    <div class="topic-meta">
                        <span class="topic-category">${topic.category_name}</span>
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
                    <a href="topic.html?id=${topic.id}" class="topic-link">Xem chi tiết</a>
                </div>
            `;
            
            // Add avatar using Avatar class
            const avatarContainer = topicCard.querySelector(`#avatar-${topic.id}`);
            if (avatarContainer) {
                avatarContainer.innerHTML = Avatar.createFallbackHTML(getDisplayName(topic), '40px');
            }});
}

/**
 * Render pagination controls
 * @param {Object} pagination - Pagination data
 */
function renderPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    if (!pagination || pagination.total_pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    const { current_page, total_pages } = pagination;
    
    // Get current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Create pagination HTML
    let paginationHTML = '';
    
    // Previous button
    if (current_page > 1) {
        urlParams.set('page', current_page - 1);
        paginationHTML += `<a href="?${urlParams.toString()}" class="prev">«</a>`;
    }
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(total_pages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        urlParams.set('page', 1);
        paginationHTML += `<a href="?${urlParams.toString()}">1</a>`;
        if (startPage > 2) {
            paginationHTML += `<span class="ellipsis">...</span>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        urlParams.set('page', i);
        if (i === current_page) {
            paginationHTML += `<a href="?${urlParams.toString()}" class="active">${i}</a>`;
        } else {
            paginationHTML += `<a href="?${urlParams.toString()}">${i}</a>`;
        }
    }
    
    // Last page
    if (endPage < total_pages) {
        if (endPage < total_pages - 1) {
            paginationHTML += `<span class="ellipsis">...</span>`;
        }
        urlParams.set('page', total_pages);
        paginationHTML += `<a href="?${urlParams.toString()}">${total_pages}</a>`;
    }
    
    // Next button
    if (current_page < total_pages) {
        urlParams.set('page', current_page + 1);
        paginationHTML += `<a href="?${urlParams.toString()}" class="next">»</a>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * Load hot topics for sidebar
 */
async function loadHotTopics() {
    try {
        const hotTopicsList = document.querySelector('.hot-topics-list');
        if (!hotTopicsList) return;
        
        const data = await window.api.loadTopics({ sort: 'popular', limit: 5 });
        
        if (!data.topics || data.topics.length === 0) {
            hotTopicsList.innerHTML = '<p class="no-data">Chưa có chủ đề nóng nào.</p>';
            return;
        }
        
        hotTopicsList.innerHTML = '';
        
        data.topics.forEach((topic, index) => {
            const categoryClass = getCategoryClass(topic.category_name);
            const hotTopic = document.createElement('div');
            hotTopic.className = `hot-topic ${categoryClass}`;
            
            hotTopic.innerHTML = `
                <a href="topic.html?id=${topic.id}">#${index + 1} ${truncateText(topic.title, 40)}</a>
            `;
            
            hotTopicsList.appendChild(hotTopic);
        });
        
    } catch (error) {
        console.error('Error loading hot topics:', error);
        const hotTopicsList = document.querySelector('.hot-topics-list');
        if (hotTopicsList) {
            hotTopicsList.innerHTML = '<p class="error">Không thể tải chủ đề nóng. Vui lòng thử lại sau.</p>';
        }
    }
}

/**
 * Load active users for sidebar
 */
async function loadActiveUsers() {
    try {
        const activeUsersList = document.querySelector('.active-users-list');
        if (!activeUsersList) return;
        
        const users = await window.api.loadActiveUsers();
        
        if (!users || users.length === 0) {
            activeUsersList.innerHTML = '<p class="no-data">Chưa có thành viên tích cực nào.</p>';
            return;
        }
        
        activeUsersList.innerHTML = '';
        
        users.forEach(user => {
            const activeUser = document.createElement('div');
            activeUser.className = 'active-user';
            activeUser.innerHTML = `
                <div class="avatar-container" id="user-avatar-${user.id || Math.random().toString(36).substring(7)}"></div>
                <div class="user-info">
                    <div class="user-name">${getDisplayName(user)}</div>
                    <div class="user-stats">${user.post_count} bài viết</div>
                </div>
            `;

            // Add avatar using Avatar class
            const avatarContainer = activeUser.querySelector(`.avatar-container`);
            if (avatarContainer) {
                avatarContainer.innerHTML = Avatar.createFallbackHTML(getDisplayName(user), '40px');
            }
            activeUsersList.appendChild(activeUser);
        });

    } catch (error) {
        console.error('Error loading active users:', error);
        const activeUsersList = document.querySelector('.active-users-list');
        if (activeUsersList) {
            activeUsersList.innerHTML = '<p class="error">Không thể tải thành viên tích cực. Vui lòng thử lại sau.</p>';
        }
    }
}

/**
 * Set up event listeners for forum page interactions
 */
function setupEventListeners() {
    // Category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryId = this.getAttribute('data-category');
            
            // Update URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            
            if (categoryId === 'all') {
                urlParams.delete('category');
            } else {
                urlParams.set('category', categoryId);
            }
            
            // Reset to page 1
            urlParams.delete('page');
            
            // Navigate to new URL
            window.location.href = `?${urlParams.toString()}`;
        });
    });
    
    // Search form
    const searchInput = document.getElementById('topic-search');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
        function performSearch() {
            const searchQuery = searchInput.value.trim();
            
            // Get current URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            
            // Update search parameter
            if (searchQuery) {
                urlParams.set('search', searchQuery);
            } else {
                urlParams.delete('search');
            }
            
            // Reset to page 1
            urlParams.delete('page');
            
            // Navigate to new URL
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
    
    // Sort options
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = sortSelect.value;
            
            // Get current URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            
            // Update sort parameter
            urlParams.set('sort', sortBy);
            
            // Reset to page 1
            urlParams.delete('page');
            
            // Navigate to new URL
            window.location.href = `?${urlParams.toString()}`;
        });
    }
}

/**
 * Helper function to get CSS class for category
 * @param {string} categoryName - The category name
 * @returns {string} - The CSS class
 */
function getCategoryClass(categoryName) {
    if (!categoryName) return '';
    
    const name = categoryName.toLowerCase();
    if (name.includes('công nghệ')) return 'tech';
    if (name.includes('thời trang')) return 'fashion';
    if (name.includes('du lịch')) return 'travel';
    if (name.includes('ẩm thực')) return 'food';
    if (name.includes('giáo dục')) return 'education';
    if (name.includes('sức khỏe')) return 'health';
    return '';
}

/**
 * Helper function to truncate text
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Removed getInitials function - now using Avatar class from avatar.js

/**
 * Helper function to format count
 * @param {number} count - The count
 * @returns {string} - Formatted count
 */
function formatCount(count) {
    if (!count) return '0';
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
}

/**
 * Helper function to format time ago
 * @param {string} dateString - The date string
 * @returns {string} - Time ago text
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
