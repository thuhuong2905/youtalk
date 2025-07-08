// Admin Posts Management API
// Handles all post-related operations for admin panel

class AdminPostsAPI {
    constructor() {
        this.baseUrl = '/src/api/';
    }

    // Helper method to make API calls
    async makeRequest(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        if (requestOptions.body && typeof requestOptions.body === 'object') {
            requestOptions.body = JSON.stringify(requestOptions.body);
        }
        
        try {
            const response = await fetch(this.baseUrl + endpoint, requestOptions);
            const data = await response.json();
            
            if (response.ok) {
                return data;
            } else {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('AdminPostsAPI Error:', error);
            return {
                success: false,
                message: error.message || 'Network error'
            };
        }
    }    // Get all posts with pagination
    async getAllPosts(limit = 20, page = 1) {
        return await this.makeRequest(`posts_admin.php?action=get_all&limit=${limit}&page=${page}`);
    }    // Create new post (still use regular posts.php for creation)
    async createPost(postData) {
        return await this.makeRequest('posts.php?action=create', {
            method: 'POST',
            body: postData
        });
    }

    // Update post
    async updatePost(postId, postData) {
        return await this.makeRequest(`posts.php?action=update&id=${postId}`, {
            method: 'POST',
            body: postData
        });
    }

    // Delete post (admin hard delete)
    async deletePost(postId, reason = '') {
        return await this.makeRequest(`posts_admin.php?action=delete_post&id=${postId}&reason=${encodeURIComponent(reason)}`, {
            method: 'DELETE'
        });
    }

    // Update post status (replaces approve/reject/hide/show)
    async updatePostStatus(postId, status, reason = '') {
        return await this.makeRequest('posts_admin.php?action=update_status', {
            method: 'POST',
            body: { 
                post_id: postId, 
                status: status, 
                reason: reason 
            }
        });
    }

    // Legacy methods - mapped to updatePostStatus
    async approvePost(postId) {
        return await this.updatePostStatus(postId, 'active');
    }

    async rejectPost(postId, reason = '') {
        return await this.updatePostStatus(postId, 'inactive', reason);
    }    async hidePost(postId) {
        return await this.updatePostStatus(postId, 'inactive');
    }

    async showPost(postId) {
        return await this.updatePostStatus(postId, 'active');
    }// Search posts
    async searchPosts(query, limit = 20, page = 1) {
        const params = new URLSearchParams({
            action: 'get_all',
            search: query,
            limit: limit.toString(),
            page: page.toString()
        });
        return await this.makeRequest(`posts_admin.php?${params.toString()}`);
    }    // Filter posts
    async filterPosts(filters = {}, limit = 20, page = 1) {
        const params = new URLSearchParams({
            action: 'get_all',
            limit: limit.toString(),
            page: page.toString(),
            ...filters
        });
        return await this.makeRequest(`posts_admin.php?${params.toString()}`);
    }

    // Get post details (use regular posts API)
    async getPostDetails(postId) {
        return await this.makeRequest(`posts.php?action=get&id=${postId}`);
    }

    // Get post with comments for admin viewing
    async getPostWithComments(postId) {
        const postDetails = await this.getPostDetails(postId);
        if (postDetails.success) {
            // Use post_id to match database/API
            const comments = await this.makeRequest(`posts.php?action=get_comments&post_id=${postId}`);
            return {
                success: true,
                data: {
                    post: postDetails.data,
                    comments: comments.success ? comments.data : []
                }
            };
        }
        return postDetails;
    }

    // Get post statistics (admin only)
    async getPostStats() {
        return await this.makeRequest('posts_admin.php?action=get_stats');
    }

    // Bulk operations
    async bulkDeletePosts(postIds) {
        return await this.makeRequest('posts_admin.php?action=bulk_update', {
            method: 'POST',
            body: { 
                post_ids: postIds,
                action: 'delete'
            }
        });
    }

    async bulkUpdateStatus(postIds, status) {
        return await this.makeRequest('posts_admin.php?action=bulk_update', {
            method: 'POST',
            body: { 
                post_ids: postIds,
                action: 'update_status',
                value: status
            }
        });
    }

    async bulkUpdateCategory(postIds, categoryId) {
        return await this.makeRequest('posts_admin.php?action=bulk_update', {
            method: 'POST',
            body: { 
                post_ids: postIds,
                action: 'update_category',
                value: categoryId
            }
        });
    }

    // Legacy bulk methods - mapped to new bulk operations
    async bulkApprovePosts(postIds) {
        return await this.bulkUpdateStatus(postIds, 'active');
    }    async bulkHidePosts(postIds) {
        return await this.bulkUpdateStatus(postIds, 'inactive');
    }// Export posts data (not implemented in admin API yet)
    async exportPosts(format = 'csv') {
        // This would need to be implemented in posts_admin.php
        console.warn('Export functionality not yet implemented in admin API');
        return { success: false, message: 'Export functionality not available' };
    }
}

// Post Management Helper Functions
class AdminPostsHelper {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.api = new AdminPostsAPI();
        this.itemsPerPage = 20;
        this.currentPage = 1;
        this.currentSearchQuery = '';
        this.currentFilters = {};
    }

    // Load posts with pagination
    async loadPosts(page = 1) {
        try {
            let result;
            if (this.currentSearchQuery) {
                result = await this.api.searchPosts(this.currentSearchQuery, this.itemsPerPage, page);
            } else if (Object.keys(this.currentFilters).length > 0) {
                result = await this.api.filterPosts(this.currentFilters, this.itemsPerPage, page);
            } else {
                result = await this.api.getAllPosts(this.itemsPerPage, page);
            }

            if (result.success) {
                // Handle different response structures
                let posts = [];
                let paginationData = {};
                
                if (result.data && Array.isArray(result.data)) {
                    posts = result.data;
                } else if (result.data && result.data.posts) {
                    posts = result.data.posts;
                    paginationData = {
                        total: result.data.total || 0,
                        page: result.data.page || page,
                        totalPages: result.data.total_pages || 1,
                        limit: result.data.limit || this.itemsPerPage
                    };
                } else if (result.message && Array.isArray(result.message)) {
                    posts = result.message;
                }
                
                // Update pagination state
                this.currentPage = page;
                
                if (Array.isArray(posts)) {
                    this.renderPostsTable(posts, paginationData);
                    // Setup event listeners after rendering
                    setTimeout(() => {
                        this.setupPostsEventListeners();
                    }, 100);
                } else {
                    console.error('Posts data is not an array:', posts);
                    showError('Dữ liệu bài viết không hợp lệ!');
                }
            } else {
                showError('Lỗi tải danh sách bài viết!');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            showError('Lỗi tải danh sách bài viết!');
        }
    }

    // Render posts table
    renderPostsTable(posts, paginationData = null) {
        const postsSection = document.getElementById('posts-section');
        if (!postsSection) return;

        // Ensure posts is an array
        if (!Array.isArray(posts)) {
            console.error('renderPostsTable: posts is not an array:', posts);
            postsSection.innerHTML = '<p class="text-danger">Lỗi: Dữ liệu bài viết không hợp lệ</p>';
            return;
        }

        const tableHtml = `
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Thông tin bài viết</th>
                            <th>Tác giả</th>
                            <th>Danh mục</th>
                            <th>Trạng thái</th>
                            <th>Lượt xem</th>
                            <th>Bình luận</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${posts.map(post => `
                            <tr>
                                <td>${post.id}</td>                                <td>
                                    <div class="post-info">
                                        <div class="post-title" title="${this.escapeHtml(post.title)}">${this.truncateText(this.escapeHtml(post.title), 40)}</div>
                                        <div class="post-meta">
                                            ${post.excerpt ? `<span class="post-excerpt">${this.truncateText(post.excerpt, 60)}</span>` : ''}
                                        </div>
                                    </div>
                                </td>                                <td>
                                    <span class="author-name">${this.escapeHtml(post.username || 'N/A')}</span>
                                </td>                                <td>
                                    <span class="category-badge" title="${this.escapeHtml(post.category_name || 'Chưa phân loại')}">${this.escapeHtml(post.category_name || 'Chưa phân loại')}</span>
                                </td>
                                <td>
                                    <span class="status-badge ${this.getPostStatusClass(post.status)}">
                                        ${this.getPostStatusText(post.status)}
                                    </span>
                                </td>
                                <td>${post.view_count || 0}</td>
                                <td>${post.comment_count || 0}</td>
                                <td>${this.formatDate(post.created_at)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-primary" onclick="adminPostsHelper.editPost(${post.id})" title="Chỉnh sửa">
                                            <i class="fas fa-edit"></i>
                                        </button>                                        <button class="btn btn-sm btn-info" onclick="adminPostsHelper.viewPostDetails(${post.id})" title="Xem chi tiết">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${post.status === 'pending' ? 
                                            `<button class="btn btn-sm btn-success" onclick="adminPostsHelper.approvePost(${post.id})" title="Duyệt">
                                                <i class="fas fa-check"></i>
                                            </button>` : ''
                                        }
                                        ${post.status === 'active' ? 
                                            `<button class="btn btn-sm btn-warning" onclick="adminPostsHelper.hidePost(${post.id})" title="Ẩn">
                                                <i class="fas fa-eye-slash"></i>
                                            </button>` :
                                            `<button class="btn btn-sm btn-success" onclick="adminPostsHelper.showPost(${post.id})" title="Hiện">
                                                <i class="fas fa-eye"></i>
                                            </button>`
                                        }
                                        <button class="btn btn-sm btn-danger" onclick="adminPostsHelper.deletePost(${post.id})" title="Xóa">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="table-pagination" id="posts-pagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;

        postsSection.innerHTML = `
            <div class="section-header">
                <h1>Quản lý bài viết</h1>
                <div class="section-actions">                    <select id="postsFilter" class="form-select">
                        <option value="">Tất cả bài viết</option>
                        <option value="active">Đã duyệt</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="inactive">Đã ẩn</option>
                    </select>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="postSearch" placeholder="Tìm kiếm bài viết..." value="${this.currentSearchQuery}">
                    </div>
                    <button class="btn btn-primary" id="refreshPosts">
                        <i class="fas fa-sync-alt"></i> Tải lại
                    </button>
                </div>
            </div>
            ${tableHtml}
        `;
        
        // Setup search and filters
        this.setupPostsEventListeners();
        
        // Render pagination if available
        if (paginationData && window.PaginationUtils) {
            window.PaginationUtils.renderAdminPagination(
                'posts-pagination',
                paginationData.page || this.currentPage,
                paginationData.totalPages || 1,
                paginationData.total || posts.length,
                this.itemsPerPage,
                (page) => this.loadPosts(page)
            );
        }
    }

    // Setup event listeners for posts management
    setupPostsEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('postSearch');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.currentSearchQuery = e.target.value.trim();
                    this.loadPosts(1);
                }, 300);
            });
        }

        // Filter functionality
        const filterSelect = document.getElementById('postsFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                const status = e.target.value;
                if (status) {
                    this.currentFilters = { status: status };
                } else {
                    this.currentFilters = {};
                }
                this.currentSearchQuery = ''; // Clear search when filtering
                const searchInput = document.getElementById('postSearch');
                if (searchInput) searchInput.value = '';
                this.loadPosts(1);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshPosts');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.currentSearchQuery = '';
                this.currentFilters = {};
                const searchInput = document.getElementById('postSearch');
                const filterSelect = document.getElementById('postsFilter');
                if (searchInput) searchInput.value = '';
                if (filterSelect) filterSelect.value = '';
                this.loadPosts(1);
            });
        }
    }

    // Post action methods
    async editPost(postId) {
        // TODO: Implement edit post functionality
        console.log('Edit post:', postId);
        showNotification('Chức năng chỉnh sửa đang phát triển!', 'info');
    }

    async viewPost(postId) {
        try {
            const result = await this.api.getPostDetails(postId);
            if (result.success) {
                // TODO: Show post details modal
                console.log('Post details:', result.data);
                showNotification('Xem chi tiết bài viết #' + postId, 'info');
            } else {
                showError('Không thể tải chi tiết bài viết!');
            }        } catch (error) {
            console.error('Error viewing post:', error);
            showError('Lỗi hệ thống: ' + error.message);
        }
    }

    async deletePost(postId) {
        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

        try {
            const result = await this.api.deletePost(postId);
            if (result.success) {
                showSuccess('Xóa bài viết thành công!');
                this.loadPosts(this.currentPage); // Reload current page
            } else {
                showError('Lỗi xóa bài viết: ' + result.message);
            }        } catch (error) {
            console.error('Error deleting post:', error);
            showError('Lỗi hệ thống: ' + error.message);
        }
    }

    async approvePost(postId) {
        if (!confirm('Duyệt bài viết này?')) return;

        try {
            const result = await this.api.approvePost(postId);
            if (result.success) {
                showSuccess('Duyệt bài viết thành công!');
                this.loadPosts(this.currentPage); // Reload current page
            } else {
                showError('Lỗi duyệt bài viết: ' + result.message);
            }        } catch (error) {
            console.error('Error approving post:', error);
            showError('Lỗi hệ thống: ' + error.message);
        }
    }

    async hidePost(postId) {
        if (!confirm('Ẩn bài viết này?')) return;        try {
            const result = await this.api.hidePost(postId);
            if (result.success) {
                showSuccess('Ẩn bài viết thành công!');
                this.loadPosts(this.currentPage); // Reload current page
            } else {
                showError('Lỗi ẩn bài viết: ' + result.message);
            }
        } catch (error) {
            console.error('Error hiding post:', error);
            showError('Lỗi hệ thống: ' + error.message);
        }
    }

    async showPost(postId) {
        if (!confirm('Hiển thị bài viết này?')) return;

        try {
            const result = await this.api.showPost(postId);            if (result.success) {
                showSuccess('Hiển thị bài viết thành công!');
                this.loadPosts(this.currentPage); // Reload current page
            } else {
                showError('Lỗi hiển thị bài viết: ' + result.message);
            }
        } catch (error) {
            console.error('Error showing post:', error);
            showError('Lỗi hệ thống: ' + error.message);
        }
    }    // View post details in modal
    async viewPostDetails(postId) {
        try {
            showNotification('Đang tải chi tiết bài viết...', 'info');
            
            const result = await this.api.getPostWithComments(postId);            if (result.success) {
                this.showPostDetailsModal(result.data.post, result.data.comments);
            } else {
                showError('Lỗi tải chi tiết bài viết: ' + result.message);
            }
        } catch (error) {
            console.error('Error loading post details:', error);
            showError('Lỗi hệ thống: ' + error.message);
        }
    }

    // Show post details in modal
    showPostDetailsModal(post, comments = []) {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="postDetailsModal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-file-alt"></i> Chi tiết bài viết
                            </h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${this.renderPostDetails(post, comments)}
                        </div>                        <div class="modal-footer">
                            <div class="btn-group">
                                ${post.status === 'pending' ? 
                                    `<button type="button" class="btn btn-success" onclick="adminPostsHelper.approvePost(${post.id}); $('#postDetailsModal').modal('hide');">
                                        <i class="fas fa-check"></i> Duyệt
                                    </button>` : ''
                                }
                                ${post.status === 'active' ? 
                                    `<button type="button" class="btn btn-warning" onclick="adminPostsHelper.hidePost(${post.id}); $('#postDetailsModal').modal('hide');">
                                        <i class="fas fa-eye-slash"></i> Ẩn
                                    </button>` :
                                    `<button type="button" class="btn btn-success" onclick="adminPostsHelper.showPost(${post.id}); $('#postDetailsModal').modal('hide');">
                                        <i class="fas fa-eye"></i> Hiện
                                    </button>`
                                }
                                <button type="button" class="btn btn-danger" onclick="adminPostsHelper.deletePost(${post.id}); $('#postDetailsModal').modal('hide');">
                                    <i class="fas fa-trash"></i> Xóa
                                </button>
                            </div>
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('postDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        $('#postDetailsModal').modal('show');

        // Remove modal from DOM when hidden
        $('#postDetailsModal').on('hidden.bs.modal', function () {
            $(this).remove();
        });
    }

    // Render post details content
    renderPostDetails(post, comments = []) {
        const postDate = new Date(post.created_at).toLocaleString('vi-VN');
        const statusBadge = this.getStatusBadge(post.status);
        
        // Process media if exists
        let mediaHtml = '';
        if (post.media && Array.isArray(post.media) && post.media.length > 0) {
            mediaHtml = `
                <div class="post-media mb-3">
                    <h6><i class="fas fa-images"></i> Media</h6>
                    <div class="media-grid">
                        ${post.media.map(media => {
                            if (media.type === 'image') {
                                return `<img src="${media.url}" alt="${media.filename}" class="img-thumbnail" style="max-width: 200px; margin: 5px;">`;
                            } else {
                                return `<a href="${media.url}" target="_blank" class="btn btn-sm btn-outline-primary">${media.filename}</a>`;
                            }
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // Process tags if exists
        let tagsHtml = '';
        if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
            tagsHtml = `
                <div class="post-tags mb-3">
                    <h6><i class="fas fa-tags"></i> Tags</h6>
                    ${post.tags.map(tag => `<span class="badge badge-secondary mr-1">${tag}</span>`).join('')}
                </div>
            `;
        }

        // Comments section
        let commentsHtml = '';
        if (comments && comments.length > 0) {
            commentsHtml = `
                <div class="post-comments mt-4">
                    <h6><i class="fas fa-comments"></i> Bình luận (${comments.length})</h6>
                    <div class="comments-list" style="max-height: 300px; overflow-y: auto;">
                        ${comments.map(comment => `
                            <div class="comment-item border-bottom pb-2 mb-2">
                                <div class="comment-header d-flex justify-content-between">
                                    <strong>${comment.user_name || 'Ẩn danh'}</strong>
                                    <small class="text-muted">${new Date(comment.created_at).toLocaleString('vi-VN')}</small>
                                </div>
                                <div class="comment-content">${comment.content}</div>
                                <span class="badge badge-${comment.status === 'active' ? 'success' : 'warning'}">${comment.status}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return `
            <div class="post-details">
                <div class="post-header mb-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h4>${post.title}</h4>
                            <p class="text-muted mb-1">
                                <i class="fas fa-user"></i> ${post.full_name || post.username || 'Ẩn danh'} | 
                                <i class="fas fa-calendar"></i> ${postDate} |
                                <i class="fas fa-folder"></i> ${post.category_name || 'Không có danh mục'}
                            </p>
                            <p class="text-muted">
                                <i class="fas fa-eye"></i> ${post.view_count || 0} lượt xem |
                                <i class="fas fa-comments"></i> ${post.comment_count || 0} bình luận
                            </p>
                        </div>
                        <div>
                            ${statusBadge}
                            <span class="badge badge-info">${post.post_type || 'discussion'}</span>
                        </div>
                    </div>
                </div>

                <div class="post-content mb-3">
                    <h6><i class="fas fa-file-text"></i> Nội dung</h6>
                    <div class="content-box p-3 border rounded" style="background-color: #f8f9fa;">
                        ${post.content || 'Không có nội dung'}
                    </div>
                </div>

                ${mediaHtml}
                ${tagsHtml}
                ${commentsHtml}
            </div>
        `;
    }

    // Get status badge HTML
    getStatusBadge(status) {
        const statusConfig = {
            'active': { class: 'success', text: 'Đã duyệt', icon: 'check' },
            'pending': { class: 'warning', text: 'Chờ duyệt', icon: 'clock' },
            'inactive': { class: 'secondary', text: 'Không hoạt động', icon: 'pause' },
            'hidden': { class: 'dark', text: 'Ẩn', icon: 'eye-slash' },
            'deleted': { class: 'danger', text: 'Đã xóa', icon: 'trash' }
        };
        
        const config = statusConfig[status] || statusConfig['pending'];
        return `<span class="badge badge-${config.class}"><i class="fas fa-${config.icon}"></i> ${config.text}</span>`;
    }

    // Helper methods for rendering
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, length = 50) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;    }

    getPostStatusClass(status) {
        const statusClasses = {
            'active': 'status-active',
            'pending': 'status-pending', 
            'inactive': 'status-inactive',
            'hidden': 'status-hidden',
            'deleted': 'status-deleted'
        };
        return statusClasses[status] || 'status-pending';
    }    getPostStatusText(status) {
        const statusTexts = {
            'active': 'Đã duyệt',
            'pending': 'Chờ duyệt',
            'inactive': 'Đã ẩn',
            'hidden': 'Ẩn',
            'deleted': 'Đã xóa'
        };
        return statusTexts[status] || 'Chờ duyệt';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ...existing code...
}

// Global variable for posts helper
let adminPostsHelper;

// Initialize when needed
function initializeAdminPostsHelper(adminPanel) {
    if (!adminPostsHelper) {
        adminPostsHelper = new AdminPostsHelper(adminPanel);
        window.adminPostsHelper = adminPostsHelper; // Make it globally accessible
        console.log('AdminPostsHelper initialized');
    }
    return adminPostsHelper;
}

// Make classes globally available
window.AdminPostsAPI = AdminPostsAPI;
window.AdminPostsHelper = AdminPostsHelper;
window.initializeAdminPostsHelper = initializeAdminPostsHelper;
