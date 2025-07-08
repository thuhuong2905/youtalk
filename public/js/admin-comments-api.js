// Admin Comments API - Handles all comment-related API calls and UI management

class AdminCommentsAPI {
    constructor() {
        console.log('AdminCommentsAPI constructor called');
        this.baseUrl = '/src/api/';
        this.itemsPerPage = 20;
        this.currentPage = 1;
        this.currentFilters = {
            search: '',
            status: '',
            post_id: null
        };
        console.log('AdminCommentsAPI initialized with config:', {
            baseUrl: this.baseUrl,
            itemsPerPage: this.itemsPerPage
        });
    }

    // API Methods
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
            console.error('AdminCommentsAPI Error:', error);
            return {
                success: false,
                message: error.message || 'Network error'
            };
        }
    }

    async getAllComments(page = 1, limit = null, filters = {}) {
        const params = new URLSearchParams({
            action: 'list',
            page: page,
            limit: limit || this.itemsPerPage
        });

        // Add filters
        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);
        if (filters.post_id) params.append('post_id', filters.post_id);

        return await this.makeRequest(`comments_admin.php?${params.toString()}`);
    }

    async updateCommentStatus(commentId, status, reason = '') {
        return await this.makeRequest('comments_admin.php?action=update_status', {
            method: 'POST',
            body: {
                comment_id: commentId,
                status: status,
                reason: reason
            }
        });
    }

    async deleteComment(commentId) {
        return await this.makeRequest(`comments_admin.php?action=delete&id=${commentId}`, {
            method: 'DELETE'
        });
    }    async getCommentsByPost(postId) {
        return await this.makeRequest(`comments_admin.php?action=get_by_post&post_id=${postId}`);
    }// UI Management Methods
    async loadComments(page = 1) {
        this.currentPage = page;
        console.log('Loading comments...');
        
        const loadingId = this.showLoadingNotification('Đang tải danh sách bình luận...');
          try {
            const result = await this.getAllComments(page, this.itemsPerPage, this.currentFilters);
            console.log('Comments API Response:', result); // Debug log
            if (result.success) {
                // Handle different response structures
                let comments = [];
                let paginationData = {};
                
                if (result.data && result.data.comments) {
                    comments = result.data.comments;
                    paginationData = {
                        total: result.data.total || 0,
                        page: result.data.page || page,
                        totalPages: result.data.total_pages || 1,
                        limit: result.data.limit || this.itemsPerPage
                    };
                } else if (result.comments) {
                    comments = result.comments;
                }
                
                console.log('Processed comments:', comments); // Debug log
                  if (Array.isArray(comments)) {
                    this.renderCommentsTable(comments, paginationData);
                    this.hideLoadingNotification(loadingId);
                } else {
                    console.error('Comments data is not an array:', comments);
                    this.hideLoadingNotification(loadingId);
                    window.showError && window.showError('Dữ liệu bình luận không hợp lệ!');
                }
            } else {
                throw new Error(result.message || 'Lỗi không xác định');
            }        } catch (error) {
            console.error('Error loading comments:', error);
            this.hideLoadingNotification(loadingId);
            // Use global showNotification function like admin-users-api.js
            if (window.showError) {
                window.showError('Lỗi tải danh sách bình luận: ' + error.message);
            } else {
                console.error('Notification system not available');
            }
        }
    }    renderCommentsTable(comments, paginationData = null) {
        const commentsSection = document.getElementById('comments-section');
        if (!commentsSection) return;

        if (!Array.isArray(comments)) {
            console.error('renderCommentsTable: comments is not an array:', comments);
            commentsSection.innerHTML = '<p class="text-danger">Lỗi: Dữ liệu bình luận không hợp lệ</p>';
            return;
        }

        // Không render info tổng số bản ghi nữa
        // let infoHtml = '';
        // if (paginationData && comments.length > 0) {
        //     const start = (paginationData.page - 1) * paginationData.limit + 1;
        //     const end = start + comments.length - 1;
        //     infoHtml = `<div class=\"table-info\">Hiển thị ${start}-${end} trong ${paginationData.total} mục</div>`;
        // }

        const tableHtml = `
            <div class="admin-table-container">
                <div class="table-responsive">
                    <table class="admin-table" id="commentsTable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nội dung</th>
                                <th>Tác giả</th>
                                <th>Bài viết</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${comments.length > 0 ? comments.map(comment => `
                                <tr>
                                    <td>${comment.id}</td>
                                    <td class="text-truncate" style="max-width: 300px;" title="${this.escapeHtml(comment.content)}">
                                        ${this.truncateText(comment.content, 100)}
                                    </td>
                                    <td>
                                        <div class="user-info">
                                            <div class="user-details">
                                                <div class="user-name">${this.escapeHtml(comment.username || comment.full_name || 'N/A')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-truncate" style="max-width: 200px;" title="${this.escapeHtml(comment.post_title || 'N/A')}">
                                        ${comment.post_title ? `<a href="#" onclick="adminCommentsAPI.viewPost(${comment.post_id})">${this.truncateText(comment.post_title, 50)}</a>` : 'N/A'}
                                    </td>
                                    <td>
                                        <span class="status-badge ${this.getCommentStatusClass(comment.status)}">
                                            ${this.getCommentStatusText(comment.status)}
                                        </span>
                                    </td>
                                    <td>${this.formatDate(comment.created_at)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-sm btn-info" onclick="adminCommentsAPI.viewComment(${comment.id})" title="Xem chi tiết">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-warning" onclick="adminCommentsAPI.editCommentStatus(${comment.id}, '${comment.status}')" title="Chỉnh sửa trạng thái">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="adminCommentsAPI.deleteCommentConfirm(${comment.id})" title="Xóa">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" class="text-center py-4">
                                        <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                                        <p class="text-muted">Không có bình luận nào</p>
                                        ${this.currentFilters.search || this.currentFilters.status ? 
                                            '<p class="text-muted"><small>Thử thay đổi bộ lọc để xem thêm kết quả</small></p>' : ''
                                        }
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <div class="table-pagination" id="comments-pagination"></div>
            </div>
        `;
        
        commentsSection.innerHTML = `
            <div class="section-header">
                <h1>Quản lý bình luận</h1>
                <div class="section-actions">
                    <select id="commentsFilter" class="form-select">
                        <option value="">Tất cả bình luận</option>
                        <option value="active" ${this.currentFilters.status === 'active' ? 'selected' : ''}>Hoạt động</option>
                        <option value="inactive" ${this.currentFilters.status === 'inactive' ? 'selected' : ''}>Không hoạt động</option>
                        <option value="deleted" ${this.currentFilters.status === 'deleted' ? 'selected' : ''}>Đã xóa</option>
                    </select>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="commentSearch" placeholder="Tìm kiếm bình luận..." value="${this.currentFilters.search}">
                    </div>
                    <button class="btn btn-primary" id="refreshComments">
                        <i class="fas fa-sync-alt"></i> Tải lại
                    </button>
                </div>
            </div>
            ${tableHtml}
        `;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Render pagination nếu có
        if (paginationData && window.PaginationUtils) {
            window.PaginationUtils.renderAdminPagination(
                'comments-pagination',
                paginationData.page || this.currentPage,
                paginationData.totalPages || 1,
                paginationData.total || comments.length,
                this.itemsPerPage,
                (page) => this.loadComments(page)
            );
        }
    }    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('commentSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.loadComments(1);
                }, 500);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('commentsFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.loadComments(1);
            });
        }

        // Refresh button
        const refreshButton = document.getElementById('refreshComments');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadComments(this.currentPage);
            });
        }
    }

    toggleBulkActions() {
        const checkedBoxes = document.querySelectorAll('.comment-checkbox:checked');
        const bulkActions = document.getElementById('comment-bulk-actions');
        
        if (bulkActions) {
            bulkActions.style.display = checkedBoxes.length > 0 ? 'flex' : 'none';
        }
    }    // Comment Management Methods
    async editCommentStatus(commentId, currentStatus) {
        const statuses = [
            { value: 'active', label: 'Hoạt động' },
            { value: 'inactive', label: 'Không hoạt động' },
            { value: 'deleted', label: 'Đã xóa' }
        ];

        const statusOptions = statuses.map(status => 
            `<option value="${status.value}" ${status.value === currentStatus ? 'selected' : ''}>${status.label}</option>`
        ).join('');

        const modalHtml = `
            <div class="modal fade" id="editCommentStatusModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Chỉnh sửa trạng thái bình luận</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editCommentStatusForm">
                                <div class="mb-3">
                                    <label for="commentStatus" class="form-label">Trạng thái:</label>
                                    <select class="form-control" id="commentStatus" required>
                                        ${statusOptions}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="statusReason" class="form-label">Lý do (tùy chọn):</label>
                                    <textarea class="form-control" id="statusReason" rows="3" placeholder="Nhập lý do thay đổi trạng thái..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                            <button type="button" class="btn btn-primary" onclick="adminCommentsAPI.updateStatus(${commentId})">Cập nhật</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal and add new one
        const existingModal = document.getElementById('editCommentStatusModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editCommentStatusModal'));
        modal.show();
    }    async updateStatus(commentId) {
        const status = document.getElementById('commentStatus').value;
        const reason = document.getElementById('statusReason').value;

        const loadingId = this.showLoadingNotification('Đang cập nhật trạng thái...');

        try {
            const result = await this.updateCommentStatus(commentId, status, reason);            if (result.success) {
                this.hideLoadingNotification(loadingId);
                window.showSuccess && window.showSuccess('Cập nhật trạng thái thành công!');
                this.loadComments(this.currentPage);
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editCommentStatusModal'));
                modal.hide();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error updating comment status:', error);
            this.hideLoadingNotification(loadingId);
            window.showError && window.showError('Lỗi cập nhật trạng thái: ' + error.message);
        }
    }async deleteCommentConfirm(commentId) {
        this.showConfirm(
            'Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.',
            'Xác nhận xóa bình luận',
            async () => {
                try {
                    const result = await this.deleteComment(commentId);                    if (result.success) {
                        window.showSuccess && window.showSuccess('Xóa bình luận thành công!');
                        this.loadComments(this.currentPage);
                    } else {
                        throw new Error(result.message);
                    }
                } catch (error) {
                    console.error('Error deleting comment:', error);
                    window.showError && window.showError('Lỗi xóa bình luận: ' + error.message);
                }
            }
        );
    }    async executeBulkAction() {
        const selectedIds = Array.from(document.querySelectorAll('.comment-checkbox:checked')).map(cb => cb.value);
        const action = document.getElementById('comment-bulk-action').value;

        if (selectedIds.length === 0) {
            window.showWarning && window.showWarning('Vui lòng chọn ít nhất một bình luận!');
            return;
        }

        if (!action) {
            window.showWarning && window.showWarning('Vui lòng chọn hành động!');
            return;
        }

        this.showConfirm(
            `Bạn có chắc chắn muốn thực hiện hành động này cho ${selectedIds.length} bình luận?`,
            'Xác nhận thao tác hàng loạt',
            async () => {
                try {
                    const result = await this.bulkAction(selectedIds, action);
                    if (result.success) {
                        window.showSuccess && window.showSuccess('Thực hiện thành công!');
                        this.loadComments(this.currentPage);
                        this.clearSelection();
                    } else {
                        throw new Error(result.message);
                    }
                } catch (error) {
                    console.error('Error executing bulk action:', error);
                    window.showError && window.showError('Lỗi thực hiện hành động: ' + error.message);
                }
            }
        );
    }

    clearSelection() {
        const checkboxes = document.querySelectorAll('.comment-checkbox');    }

    viewComment(commentId) {
        // Implementation for viewing comment details
        console.log('View comment:', commentId);
        // You can implement a detailed view modal here
    }

    viewPost(postId) {
        // Implementation for viewing the post
        console.log('View post:', postId);
        // You can redirect to post detail or show in modal
    }    // Utility Methods
    getCommentStatusClass(status) {
        switch(status) {
            case 'active': return 'status-success';
            case 'inactive': return 'status-warning';
            case 'deleted': return 'status-danger';
            default: return 'status-secondary';
        }
    }

    getCommentStatusText(status) {
        switch(status) {
            case 'active': return 'Hoạt động';
            case 'inactive': return 'Không hoạt động';
            case 'deleted': return 'Đã xóa';
            default: return 'Không xác định';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('vi-VN');
        } catch (error) {
            return dateString;
        }
    }

    truncateText(text, maxLength = 100) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }    showNotification(message, type = 'info') {
        // Use the global notification system from notifications.js
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback to console if notifications.js is not available
            console.log(`Notification (${type}): ${message}`);
        }
    }

    // Notification Methods
    showLoadingNotification(message = 'Đang xử lý...') {
        // Use the global notification system from notifications.js
        if (window.showInfo) {
            window.showInfo(message, 0); // 0 duration = persistent
            return message; // Return message as ID for consistency
        }
        console.log(`Loading: ${message}`);
        return null;
    }

    hideLoadingNotification(notificationId) {
        // Since notifications.js doesn't support hiding specific notifications,
        // we'll hide the current notification and show a completion message briefly
        if (window.showSuccess && notificationId) {
            // Remove current notification by creating a new one that auto-hides
            setTimeout(() => {
                const existingNotification = document.getElementById('app-notification');
                if (existingNotification && existingNotification.textContent.includes('Đang')) {
                    existingNotification.remove();
                }
            }, 100);
        }
    }
}

// Initialize the AdminCommentsAPI instance
console.log('Creating AdminCommentsAPI instance...');
const adminCommentsAPI = new AdminCommentsAPI();

// Export to global scope for access from other scripts
console.log('Exporting adminCommentsAPI to window object...');
window.adminCommentsAPI = adminCommentsAPI;

// Dispatch event to notify that AdminCommentsAPI is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, dispatching adminCommentsAPIReady event...');
    const event = new CustomEvent('adminCommentsAPIReady', {
        detail: { api: adminCommentsAPI }
    });
    document.dispatchEvent(event);
    console.log('AdminCommentsAPI initialized and ready');
});

// Also make it available immediately (in case DOM is already loaded)
if (document.readyState === 'loading') {
    console.log('Document still loading, will wait for DOMContentLoaded');
} else {
    console.log('Document already loaded, dispatching adminCommentsAPIReady immediately');
    setTimeout(() => {
        const event = new CustomEvent('adminCommentsAPIReady', {
            detail: { api: adminCommentsAPI }
        });
        document.dispatchEvent(event);
        console.log('AdminCommentsAPI ready event dispatched (immediate)');
    }, 0);
}
