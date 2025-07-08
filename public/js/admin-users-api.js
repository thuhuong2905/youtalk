// Admin Users Management API
// Handles all user-related operations for admin panel

class AdminUsersAPI {
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
            console.error('AdminUsersAPI Error:', error);
            return {
                success: false,
                message: error.message || 'Network error'
            };
        }
    }

    // Get all users with pagination
    async getAllUsers(limit = 20, page = 1) {
        return await this.makeRequest(`users.php?action=get_all_users&admin=1&limit=${limit}&page=${page}`);
    }

    // Create new user
    async createUser(userData) {
        return await this.makeRequest('users.php?action=create_user&admin=1', {
            method: 'POST',
            body: userData
        });
    }

    // Update user
    async updateUser(userId, userData) {
        return await this.makeRequest(`users.php?action=update_user&admin=1&user_id=${userId}`, {
            method: 'POST',
            body: userData
        });
    }

    // Delete user
    async deleteUser(userId) {
        return await this.makeRequest(`users.php?action=delete_user&admin=1&user_id=${userId}`, {
            method: 'DELETE'
        });
    }

    // Ban/Unban user
    async banUser(userId, reason = '') {
        return await this.makeRequest('users.php?action=ban_user&admin=1', {
            method: 'POST',
            body: { user_id: userId, reason: reason }
        });
    }

    async unbanUser(userId) {
        return await this.makeRequest('users.php?action=unban_user&admin=1', {
            method: 'POST',
            body: { user_id: userId }
        });
    }

    // Search users
    async searchUsers(query, limit = 20, page = 1) {
        return await this.makeRequest(`users.php?action=search&admin=1&query=${encodeURIComponent(query)}&limit=${limit}&page=${page}`);
    }

    // Get user details
    async getUserDetails(userId) {
        return await this.makeRequest(`users.php?action=get_user&admin=1&user_id=${userId}`);
    }

    // Get user statistics
    async getUserStats(userId) {
        return await this.makeRequest(`users.php?action=get_stats&admin=1&user_id=${userId}`);
    }

    // Bulk operations
    async bulkDeleteUsers(userIds) {
        return await this.makeRequest('users.php?action=bulk_delete&admin=1', {
            method: 'POST',
            body: { user_ids: userIds }
        });
    }

    async bulkBanUsers(userIds, reason = '') {
        return await this.makeRequest('users.php?action=bulk_ban&admin=1', {
            method: 'POST',
            body: { user_ids: userIds, reason: reason }
        });
    }

    // Export users data
    async exportUsers(format = 'csv') {
        return await this.makeRequest(`users.php?action=export&admin=1&format=${format}`);
    }
}

// User Management Helper Functions
class AdminUsersHelper {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.api = new AdminUsersAPI();
        this.itemsPerPage = 20;
        this.currentPage = 1;
        this.currentSearchQuery = '';
    }

    // Load users with pagination
    async loadUsers(page = 1) {
        try {
            let result;
            if (this.currentSearchQuery) {
                result = await this.api.searchUsers(this.currentSearchQuery, this.itemsPerPage, page);
            } else {
                result = await this.api.getAllUsers(this.itemsPerPage, page);
            }

            if (result.success) {
                // Handle different response structures
                let users = [];
                let paginationData = {};
                
                if (result.data && Array.isArray(result.data)) {
                    users = result.data;
                } else if (result.data && result.data.users) {
                    users = result.data.users;
                    paginationData = {
                        total: result.data.total || 0,
                        page: result.data.page || page,
                        totalPages: result.data.total_pages || 1,
                        limit: result.data.limit || this.itemsPerPage
                    };
                } else if (result.message && Array.isArray(result.message)) {
                    users = result.message;
                }
                
                // Update pagination state
                this.currentPage = page;
                
                if (Array.isArray(users)) {
                    this.renderUsersTable(users, paginationData);
                    // Setup add user modal after rendering with delay to ensure DOM is ready
                    setTimeout(() => {
                        this.setupAddUserModal();
                    }, 100);                } else {
                    console.error('Users data is not an array:', users);
                    showNotification('Dữ liệu người dùng không hợp lệ!', 'error');
                }
            } else {
                showNotification('Lỗi tải danh sách người dùng!', 'error');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showNotification('Lỗi tải danh sách người dùng!', 'error');
        }
    }

    // Render users table
    renderUsersTable(users, paginationData = null) {
        const usersSection = document.getElementById('users-section');
        if (!usersSection) return;

        // Ensure users is an array
        if (!Array.isArray(users)) {
            console.error('renderUsersTable: users is not an array:', users);
            usersSection.innerHTML = '<p class="text-danger">Lỗi: Dữ liệu người dùng không hợp lệ</p>';
            return;
        }

        const tableHtml = `
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên người dùng</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>                        ${users.map(user => `
                            <tr>
                                <td>${user.user_id || user.id}</td>
                                <td>
                                    <div class="user-info">
                                        ${this.getUserAvatarHtml(user, 'user-avatar-sm')}
                                        <div class="user-details">
                                            <div class="user-name">${this.escapeHtml(user.username || 'N/A')}</div>
                                            <div class="user-full-name">${this.escapeHtml(user.full_name || 'Chưa cập nhật')}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>${this.escapeHtml(user.email || 'N/A')}</td>
                                <td>
                                    <span class="role-badge role-${user.role || 'user'}">
                                        ${this.getRoleText(user.role)}
                                    </span>
                                </td>
                                <td>
                                    <span class="status-badge ${this.getUserStatusClass(user.status)}">
                                        ${this.getStatusText(user.status)}
                                    </span>
                                </td>
                                <td>${this.formatDate(user.created_at)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-primary" onclick="adminUsersHelper.editUser(${user.user_id || user.id})" title="Chỉnh sửa">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="adminUsersHelper.deleteUser(${user.user_id || user.id})" title="Xóa">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        ${user.status === 'banned' ? 
                                            `<button class="btn btn-sm btn-success" onclick="adminUsersHelper.unbanUser(${user.user_id || user.id})" title="Bỏ cấm">
                                                <i class="fas fa-unlock"></i>
                                            </button>` :
                                            `<button class="btn btn-sm btn-warning" onclick="adminUsersHelper.banUser(${user.user_id || user.id})" title="Cấm">
                                                <i class="fas fa-ban"></i>
                                            </button>`
                                        }
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="table-pagination" id="users-pagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;

        usersSection.innerHTML = `
            <div class="section-header">
                <h1>Quản lý người dùng</h1>
                <div class="section-actions">
                    <button class="btn btn-success" id="addUser">
                        <i class="fas fa-plus"></i> Thêm mới
                    </button>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="userSearch" placeholder="Tìm kiếm người dùng..." value="${this.currentSearchQuery}">
                    </div>
                </div>
            </div>
            ${tableHtml}
        `;
        
        // Setup search
        this.setupUserSearch();
        
        // Render pagination if available
        if (paginationData && window.PaginationUtils) {
            window.PaginationUtils.renderAdminPagination(
                'users-pagination',
                paginationData.page || this.currentPage,
                paginationData.totalPages || 1,
                paginationData.total || users.length,
                this.itemsPerPage,
                (page) => this.loadUsers(page)
            );
        }
    }

    // Setup user search functionality
    setupUserSearch() {
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.currentSearchQuery = e.target.value.trim();
                    this.loadUsers(1);
                }, 300);
            });
        }
    }

    // Setup add user modal
    setupAddUserModal() {
        console.log('setupAddUserModal called, checking for button...');
        
        // Add User button
        const addUserBtn = document.getElementById('addUser');
        console.log('addUser button element:', addUserBtn);
        
        if (addUserBtn) {
            console.log('Button found! Setting up event listener...');
            // Create bound function once to use for both add and remove
            if (!this._boundShowAddUserModal) {
                this._boundShowAddUserModal = this.showAddUserModal.bind(this);
            }
            // Remove existing listener to avoid duplicates  
            addUserBtn.removeEventListener('click', this._boundShowAddUserModal);
            // Add new listener
            addUserBtn.addEventListener('click', this._boundShowAddUserModal);
            
            console.log('Add User button event listener setup complete');
        } else {
            console.warn('Add User button not found');
            // Try to find it in the entire document
            const allButtons = document.querySelectorAll('button');
            console.log('All buttons in document:', allButtons);
            const userSectionButtons = document.querySelectorAll('#users-section button');
            console.log('Buttons in users section:', userSectionButtons);
        }

        // Save New User button
        const saveNewUserBtn = document.getElementById('saveNewUser');
        if (saveNewUserBtn) {
            if (!this._boundSaveNewUser) {
                this._boundSaveNewUser = this.saveNewUser.bind(this);
            }
            saveNewUserBtn.removeEventListener('click', this._boundSaveNewUser);
            saveNewUserBtn.addEventListener('click', this._boundSaveNewUser);
        }

        // Modal close buttons
        const addUserModal = document.getElementById('addUserModal');
        if (addUserModal) {
            const closeBtn = addUserModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideAddUserModal();
                });
            }

            const cancelBtn = addUserModal.querySelector('[data-dismiss="modal"]');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.hideAddUserModal();
                });
            }

            // Close modal when clicking outside
            addUserModal.addEventListener('click', (e) => {
                if (e.target === addUserModal) {
                    this.hideAddUserModal();
                }
            });
        }

        // Form submission
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNewUser();
            });
        }
    }

    // Show add user modal
    showAddUserModal() {
        console.log('showAddUserModal called');
        const modal = document.getElementById('addUserModal');
        console.log('Modal element:', modal);
        
        if (modal) {
            // Reset form
            const form = document.getElementById('addUserForm');
            if (form) {
                form.reset();
            }
            
            modal.classList.add('show');
            console.log('Modal show class added, classes:', modal.classList.toString());
            
            // Focus on first input
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        } else {
            console.error('Modal not found!');
        }
    }

    // Hide add user modal
    hideAddUserModal() {
        const modal = document.getElementById('addUserModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // Save new user
    async saveNewUser() {
        const form = document.getElementById('addUserForm');
        if (!form) return;

        // Collect form data
        const formData = new FormData(form);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        
        const userData = {
            username: formData.get('username')?.trim(),
            email: formData.get('email')?.trim(),
            full_name: formData.get('username')?.trim(), // Tái sử dụng username làm full_name nếu không có trường riêng
            password: password,
            role: formData.get('role') || 'user',
            status: formData.get('status') || 'active'
        };        // Validate required fields (tương tự logic đăng ký)
        if (!userData.username || !userData.email || !userData.password) {
            showNotification('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            return;
        }

        // Validate email format (tương tự logic đăng ký)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            showNotification('Định dạng email không hợp lệ!', 'error');
            return;
        }

        // Validate password length (tương tự logic đăng ký)
        if (userData.password.length < 6) {
            showNotification('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
            return;
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
            showNotification('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }

        try {
            this.adminPanel.showLoading();
            
            const result = await this.api.createUser(userData);

            this.adminPanel.hideLoading();            if (result.success) {
                showNotification('Tạo người dùng mới thành công!', 'success');
                this.hideAddUserModal();
                
                // Reset form (tương tự logic đăng ký)
                form.reset();
                
                // Reload users list
                await this.loadUsers(this.currentPage);
            } else {
                showNotification(result.message || 'Có lỗi xảy ra khi tạo người dùng!', 'error');
            }
        } catch (error) {
            this.adminPanel.hideLoading();
            console.error('Error creating user:', error);
            showNotification('Lỗi hệ thống: ' + error.message, 'error');
        }
    }    // Edit user
    async editUser(userId) {
        // TODO: Implement edit user functionality
        console.log('Edit user:', userId);
        showNotification('Chức năng chỉnh sửa đang phát triển!', 'info');
    }

    // Delete user
    async deleteUser(userId) {
        if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            return;
        }

        try {
            this.adminPanel.showLoading();
            
            const result = await this.api.deleteUser(userId);

            this.adminPanel.hideLoading();            if (result.success) {
                showNotification('Xóa người dùng thành công!', 'success');
                await this.loadUsers(this.currentPage);
            } else {
                showNotification(result.message || 'Có lỗi xảy ra khi xóa người dùng!', 'error');
            }
        } catch (error) {
            this.adminPanel.hideLoading();
            console.error('Error deleting user:', error);
            showNotification('Lỗi hệ thống: ' + error.message, 'error');
        }
    }

    // Ban user
    async banUser(userId) {
        const reason = prompt('Lý do cấm người dùng:');
        if (reason === null) return; // User cancelled

        try {
            this.adminPanel.showLoading();
            
            const result = await this.api.banUser(userId, reason);

            this.adminPanel.hideLoading();            if (result.success) {
                showNotification('Cấm người dùng thành công!', 'success');
                await this.loadUsers(this.currentPage);
            } else {
                showNotification(result.message || 'Có lỗi xảy ra khi cấm người dùng!', 'error');
            }
        } catch (error) {
            this.adminPanel.hideLoading();
            console.error('Error banning user:', error);
            showNotification('Lỗi hệ thống: ' + error.message, 'error');
        }
    }

    // Unban user
    async unbanUser(userId) {
        if (!confirm('Bạn có chắc chắn muốn bỏ cấm người dùng này?')) {
            return;
        }

        try {
            this.adminPanel.showLoading();
            
            const result = await this.api.unbanUser(userId);

            this.adminPanel.hideLoading();            if (result.success) {
                showNotification('Bỏ cấm người dùng thành công!', 'success');
                await this.loadUsers(this.currentPage);
            } else {
                showNotification(result.message || 'Có lỗi xảy ra khi bỏ cấm người dùng!', 'error');
            }
        } catch (error) {
            this.adminPanel.hideLoading();
            console.error('Error unbanning user:', error);
            showNotification('Lỗi hệ thống: ' + error.message, 'error');
        }
    }

    // Helper functions
    getUserAvatarHtml(user, sizeClass = '', altText = '') {
        const fullName = (user && user.full_name && user.full_name.trim()) ? user.full_name : 'Ẩn danh';
        const firstInitial = this.getInitials(fullName);
        const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#03417F", "#7f8c8d"];
        const colorIndex = firstInitial.charCodeAt(0) % colors.length;
        const bgColor = colors[colorIndex];
        
        if (user && user.profile_picture && user.profile_picture.trim() !== '') {
            const escapedAlt = altText || fullName.replace(/"/g, '&quot;');
            return `<img src="${encodeURI(user.profile_picture)}" alt="${escapedAlt}" class="user-avatar ${sizeClass}" onerror="displayFallbackAvatar(this, '${firstInitial}', '${bgColor}')">`;
        } else {
            return `<div class="user-avatar-fallback user-avatar ${sizeClass}" style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));">${firstInitial}</div>`;
        }
    }

    getInitials(name) {
        if (!name || typeof name !== 'string') return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 0) return '?';
        const targetPart = parts[0];
        return targetPart.charAt(0).toUpperCase();
    }

    getUserStatusClass(status) {
        const statusClasses = {
            'active': 'status-active',
            'inactive': 'status-inactive',
            'banned': 'status-banned',
            'pending': 'status-pending'
        };
        return statusClasses[status] || 'status-unknown';
    }

    getRoleText(role) {
        const roleTexts = {
            'admin': 'Quản trị viên',
            'moderator': 'Điều hành viên',
            'user': 'Người dùng'
        };
        return roleTexts[role] || 'Không xác định';
    }

    getStatusText(status) {
        const statusTexts = {
            'active': 'Hoạt động',
            'inactive': 'Không hoạt động',
            'banned': 'Bị cấm',
            'pending': 'Chờ duyệt'
        };
        return statusTexts[status] || 'Không xác định';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return 'N/A';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global variable for users helper
let adminUsersHelper;

// Initialize when needed
function initializeAdminUsersHelper(adminPanel) {
    if (!adminUsersHelper) {
        adminUsersHelper = new AdminUsersHelper(adminPanel);
    }
    return adminUsersHelper;
}
