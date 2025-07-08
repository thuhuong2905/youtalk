// Admin Categories Management API
// Handles all category-related operations for admin panel

class AdminCategoriesAPI {
    constructor() {
        this.baseUrl = '/src/api/';
        this.itemsPerPage = 20;
        this.currentPage = 1;
        this.currentSearchQuery = '';
        this.currentFilters = {
            status: ''
        };
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
            console.error('AdminCategoriesAPI Error:', error);
            return {
                success: false,
                message: error.message || 'Network error'
            };
        }
    }

    // CRUD Operations
    async getCategories(limit = 20, page = 1, filters = {}) {
        const params = new URLSearchParams({
            action: 'list',
            limit: limit.toString(),
            page: page.toString()
        });

        // Add filters
        if (filters.search) params.append('search', filters.search);
        if (filters.status) params.append('status', filters.status);

        return await this.makeRequest(`categories_admin.php?${params.toString()}`);
    }

    async getCategoryDetails(id) {
        return await this.makeRequest(`categories_admin.php?action=get&id=${id}`);
    }

    async addCategory(data) {
        return await this.makeRequest('categories_admin.php?action=add', {
            method: 'POST',
            body: data
        });
    }

    async updateCategory(data) {
        return await this.makeRequest('categories_admin.php?action=update', {
            method: 'PUT',
            body: data
        });
    }

    async deleteCategory(id) {
        return await this.makeRequest('categories_admin.php?action=delete', {
            method: 'DELETE',
            body: { id }
        });
    }

    async updateCategoryStatus(categoryId, status) {
        return await this.makeRequest('categories_admin.php?action=update_status', {
            method: 'POST',
            body: { 
                category_id: categoryId, 
                status: status 
            }
        });
    }

    // Search and filter operations
    async searchCategories(query, limit = 20, page = 1) {
        const params = new URLSearchParams({
            action: 'search',
            query: query,
            limit: limit.toString(),
            page: page.toString()
        });
        return await this.makeRequest(`categories_admin.php?${params.toString()}`);
    }

    // UI Management Methods
    async loadCategories(page = 1) {
        console.log('Loading categories...');
        try {
            let result;
            if (this.currentSearchQuery) {
                result = await this.searchCategories(this.currentSearchQuery, this.itemsPerPage, page);
            } else {
                result = await this.getCategories(this.itemsPerPage, page, this.currentFilters);
            }

            if (result.success) {
                let categories = [];
                let paginationData = {};
                
                if (result.data && result.data.categories) {
                    categories = result.data.categories;
                    paginationData = {
                        total: result.data.total || 0,
                        page: result.data.page || page,
                        totalPages: result.data.total_pages || 1,
                        limit: result.data.limit || this.itemsPerPage
                    };
                } else if (Array.isArray(result.data)) {
                    categories = result.data;
                }
                
                this.renderCategoriesTable(categories, paginationData);
            } else {
                throw new Error(result.message || 'Lỗi không xác định');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.renderErrorState();
        }
    }

    renderCategoriesTable(categories, paginationData = null) {
        const categoriesSection = document.getElementById('categories-section');
        if (!categoriesSection) return;
        if (!Array.isArray(categories)) categories = [];

        // Không render info tổng số bản ghi nữa
        // let infoHtml = '';
        // if (paginationData && categories.length > 0) {
        //     const start = (paginationData.page - 1) * paginationData.limit + 1;
        //     const end = start + categories.length - 1;
        //     infoHtml = `<div class="table-info">Hiển thị ${start}-${end} trong ${paginationData.total} mục</div>`;
        // }

        const tableHtml = `
            <div class="section-header">
                <h1>Quản lý Danh mục</h1>
                <div class="section-actions" style="display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="search-box" style="position: relative;">
                            <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #aaa;"></i>
                            <input type="text" id="categorySearch" placeholder="Tìm kiếm danh mục..." class="form-control" style="padding-left: 30px; min-width: 200px;">
                        </div>
                        <select id="categoryStatusFilter" class="form-control" style="min-width: 150px;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                        </select>
                        <button class="btn btn-success" onclick="adminCategoriesApi.showAddCategoryModal()">
                            <i class="fas fa-plus"></i> Thêm danh mục
                        </button>
                    </div>
                </div>
            </div>
            <div class="admin-table-container">
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên danh mục</th>
                                <th>Mô tả</th>
                                <th>Số bài viết</th>
                                <th>Số sản phẩm</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categories.map(category => `
                                <tr>
                                    <td>${category.id}</td>
                                    <td>
                                        <div class="category-info">
                                            <span class="category-name">${this.escapeHtml(category.name)}</span>
                                            <small class="category-slug">${this.escapeHtml(category.slug || '')}</small>
                                        </div>
                                    </td>
                                    <td class="text-truncate" style="max-width: 200px;">
                                        ${this.escapeHtml(this.truncateText(category.description || '', 100))}
                                    </td>
                                    <td>${category.post_count || 0}</td>
                                    <td>${category.product_count || 0}</td>
                                    <td>
                                        <span class="status-badge ${this.getCategoryStatusClass(category.status)}">
                                            ${this.getCategoryStatusText(category.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-sm btn-info" onclick="adminCategoriesApi.viewCategory(${category.id})" title="Xem chi tiết">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-primary" onclick="adminCategoriesApi.editCategory(${category.id})" title="Chỉnh sửa">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="adminCategoriesApi.deleteCategory(${category.id})" title="Xóa">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="table-pagination" id="categories-pagination"></div>
            </div>
        `;

        categoriesSection.innerHTML = tableHtml;

        // Setup search and filters
        this.setupEventListeners();

        // Render pagination nếu có
        if (paginationData && window.PaginationUtils) {
            window.PaginationUtils.renderAdminPagination(
                'categories-pagination',
                paginationData.page,
                paginationData.totalPages,
                paginationData.total,
                this.itemsPerPage,
                (page) => this.loadCategories(page)
            );
        }
    }

    renderErrorState() {
        const categoriesSection = document.getElementById('categories-section');
        if (categoriesSection) {
            categoriesSection.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Lỗi tải dữ liệu</h3>
                    <p>Không thể tải danh sách danh mục. Vui lòng thử lại sau.</p>
                    <button class="btn btn-primary" onclick="adminCategoriesApi.loadCategories()">
                        <i class="fas fa-sync"></i> Tải lại
                    </button>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Setup search
        const searchInput = document.getElementById('categorySearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentSearchQuery = e.target.value;
                    this.loadCategories(1);
                }, 500);
            });
        }

        // Setup status filter
        const statusFilter = document.getElementById('categoryStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.loadCategories(1);
            });
        }
    }

    // Helper Methods
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, length = 100) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    getCategoryStatusClass(status) {
        const statusClasses = {
            'active': 'status-active',
            'inactive': 'status-inactive',
            'pending': 'status-pending',
            'deleted': 'status-deleted'
        };
        return statusClasses[status] || 'status-pending';
    }

    getCategoryStatusText(status) {
        const statusTexts = {
            'active': 'Hoạt động',
            'inactive': 'Không hoạt động',
            'pending': 'Chờ duyệt',
            'deleted': 'Đã xóa'
        };
        return statusTexts[status] || 'Chờ duyệt';
    }

    // Modal Management Methods
    showAddCategoryModal() {
        // Implementation for showing add category modal
        console.log('Show add category modal');
    }

    showEditCategoryModal(category) {
        // Implementation for showing edit category modal
        console.log('Show edit category modal', category);
    }

    async viewCategory(id) {
        try {
            const result = await this.getCategoryDetails(id);
            if (result.success) {
                // Implementation for showing category details
                console.log('View category details', result.data);
            }
        } catch (error) {
            console.error('Error viewing category:', error);
        }
    }

    async editCategory(id) {
        try {
            const result = await this.getCategoryDetails(id);
            if (result.success) {
                this.showEditCategoryModal(result.data);
            }
        } catch (error) {
            console.error('Error loading category for edit:', error);
        }
    }
}

// Initialize and export the API instance
console.log('Initializing AdminCategoriesAPI...');
window.adminCategoriesApi = new AdminCategoriesAPI();
