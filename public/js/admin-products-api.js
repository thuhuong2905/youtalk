// Admin Products API and Management
// Handles all product-related operations in the admin panel

const AdminProductsAPI = {
    // Base API URL
    baseUrl: '/src/api/',
    
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
            console.error('AdminProductsAPI Error:', error);
            return {
                success: false,
                message: error.message || 'Network error'
            };
        }
    },
    
    // Get all products with pagination
    async getAllProducts(limit = 20, page = 1) {
        return await this.makeRequest(`products_admin.php?action=get_all&limit=${limit}&page=${page}`);
    },      // Get product by ID
    async getProduct(id) {
        return await this.makeRequest(`products_admin.php?action=get&id=${id}`);
    },
      // Create new product
    async createProduct(productData) {
        return await this.makeRequest('products_admin.php?action=create', {
            method: 'POST',
            body: productData
        });
    },
    
    // Update product
    async updateProduct(id, productData) {
        return await this.makeRequest(`products_admin.php?action=update&id=${id}`, {
            method: 'PUT',
            body: productData
        });
    },
    
    // Delete product
    async deleteProduct(id) {
        return await this.makeRequest(`products_admin.php?action=delete&id=${id}`, {
            method: 'DELETE'
        });
    },
    
    // Toggle product status
    async toggleProductStatus(id, status) {
        return await this.makeRequest(`products_admin.php?action=toggle_status&id=${id}`, {
            method: 'POST',
            body: { status }
        });
    },
    
    // Search products
    async searchProducts(query, category = '', limit = 20, page = 1) {
        const params = new URLSearchParams({
            action: 'search',
            query,
            limit,
            page
        });
        
        if (category) {
            params.append('category', category);
        }
        
        return await this.makeRequest(`products_admin.php?${params}`);
    }
};

// Admin Products Management Class
class AdminProductsManager {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentSearchQuery = '';
        this.currentStatusFilter = '';
        this.currentCategoryFilter = '';
        this.paginationState = {
            page: 1,
            total: 0,
            totalPages: 0
        };
    }
    
    // Load products with pagination
    async loadProducts(page = 1) {
        console.log('Loading products...');
        
        try {
            const result = await AdminProductsAPI.getAllProducts(this.itemsPerPage, page);
            if (result.success) {
                // Handle different response structures for backward compatibility
                let products = [];
                let paginationData = {};
                
                if (result.data && result.data.products) {
                    products = result.data.products;
                    paginationData = {
                        total: result.data.total || 0,
                        page: result.data.page || page,
                        totalPages: result.data.total_pages || 1,
                        limit: result.data.limit || this.itemsPerPage
                    };
                } else if (result.products) {
                    products = result.products;
                } else if (result.data && Array.isArray(result.data)) {
                    products = result.data;
                } else if (result.message && Array.isArray(result.message)) {
                    products = result.message;
                }
                
                // Update pagination state
                this.paginationState = {
                    page: paginationData.page || page,
                    total: paginationData.total || products.length,
                    totalPages: paginationData.totalPages || 1
                };
                
                if (Array.isArray(products)) {
                    this.renderProductsTable(products, this.paginationState);
                } else {
                    console.error('Products data is not an array:', products);
                    this.adminPanel.notify('Dữ liệu sản phẩm không hợp lệ!', 'error');
                }
            } else {
                throw new Error(result.message || 'Lỗi không xác định');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.adminPanel.notify('Lỗi tải danh sách sản phẩm!', 'error');
            this.renderErrorState();
        }
    }
      // Render products table
    renderProductsTable(products, paginationData = null) {
        const productsSection = document.getElementById('products-section');
        if (!productsSection) return;

        // Ensure products is an array
        if (!Array.isArray(products)) {
            console.error('renderProductsTable: products is not an array:', products);
            productsSection.innerHTML = '<p class="text-danger">Lỗi: Dữ liệu sản phẩm không hợp lệ</p>';
            return;
        }

        const tableHtml = `
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Thông tin sản phẩm</th>
                            <th>Người tạo</th>
                            <th>Danh mục</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                            <th>Lượt xem</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr>
                                <td>${product.id}</td>                                <td>
                                    <div class="product-info">
                                        <div class="product-image">
                                            ${product.images && product.images.length > 0 ? 
                                                `<img src="${product.images[0]}" alt="${this.escapeHtml(product.title)}" class="product-thumb">` :
                                                `<div class="product-thumb-placeholder"><i class="fas fa-image"></i></div>`
                                            }
                                        </div>                                        <div class="product-details">
                                            <div class="product-title clickable" title="Click để xem chi tiết" onclick="window.adminProductsManager && window.adminProductsManager.viewProduct(${product.id})">${this.escapeHtml(product.title)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="creator-name">${this.escapeHtml(product.creator_name || 'N/A')}</span>
                                </td>
                                <td>
                                    <span class="category-badge" title="${this.escapeHtml(product.category_name || 'Chưa phân loại')}">${this.escapeHtml(product.category_name || 'Chưa phân loại')}</span>
                                </td>
                                <td>
                                    <span class="product-price">${product.price ? this.formatPrice(product.price) : 'Chưa có giá'}</span>
                                </td>
                                <td>
                                    <span class="status-badge ${this.getProductStatusClass(product.status)}">
                                        ${this.getProductStatusText(product.status)}
                                    </span>
                                </td>
                                <td>${product.view_count || 0}</td>
                                <td>${this.formatDate(product.created_at)}</td>                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-primary" onclick="window.adminProductsManager && window.adminProductsManager.editProduct(${product.id})" title="Chỉnh sửa">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        ${product.status === 'active' ? 
                                            `<button class="btn btn-sm btn-warning" onclick="window.adminProductsManager && window.adminProductsManager.toggleProductStatus(${product.id}, 'inactive')" title="Ẩn sản phẩm">
                                                <i class="fas fa-eye-slash"></i>
                                            </button>` :
                                            `<button class="btn btn-sm btn-success" onclick="window.adminProductsManager && window.adminProductsManager.toggleProductStatus(${product.id}, 'active')" title="Hiện sản phẩm">
                                                <i class="fas fa-eye"></i>
                                            </button>`
                                        }
                                        <button class="btn btn-sm btn-danger" onclick="window.adminProductsManager && window.adminProductsManager.deleteProduct(${product.id})" title="Xóa">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="table-pagination" id="products-pagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;

        productsSection.innerHTML = `
            <div class="section-header">
                <h1>Quản lý sản phẩm</h1>
                <div class="section-actions">
                    <select id="productsFilter" class="form-select">
                        <option value="">Tất cả sản phẩm</option>
                        <option value="active">Đang bán</option>
                        <option value="inactive">Đã ẩn</option>
                        <option value="draft">Bản nháp</option>
                    </select>
                    <select id="productsCategoryFilter" class="form-select">
                        <option value="">Tất cả danh mục</option>
                    </select>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="productSearch" placeholder="Tìm kiếm sản phẩm..." value="${this.currentSearchQuery || ''}">
                    </div>
                    <button class="btn btn-primary" id="refreshProducts">
                        <i class="fas fa-sync-alt"></i> Tải lại
                    </button>
                    <button class="btn btn-success" id="addProduct">
                        <i class="fas fa-plus"></i> Thêm mới
                    </button>
                </div>
            </div>
            ${tableHtml}
        `;
        
        // Setup search and filters
        this.setupProductSearch();
        this.setupProductFilters();
        
        // Render pagination if available
        if (paginationData && window.PaginationUtils) {
            window.PaginationUtils.renderAdminPagination(
                'products-pagination',
                paginationData.page,
                paginationData.totalPages,
                paginationData.total,
                this.itemsPerPage,
                (page) => this.loadProducts(page)
            );
        }
    }
      // Setup search functionality
    setupProductSearch() {
        const searchInput = document.getElementById('productSearch');
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentSearchQuery = e.target.value;
                    this.performSearch();
                }, 500);
            });
        }
          // Setup refresh button
        const refreshBtn = document.getElementById('refreshProducts');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (window.adminProductsManager) {
                    window.adminProductsManager.loadProducts(1);
                }
            });
        }
          // Setup add product button
        const addBtn = document.getElementById('addProduct');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (window.adminProductsManager) {
                    window.adminProductsManager.showCreateProductModal();
                }
            });
        }
    }
    
    // Setup filters
    setupProductFilters() {
        const statusFilter = document.getElementById('productsFilter');
        const categoryFilter = document.getElementById('productsCategoryFilter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentStatusFilter = e.target.value;
                this.performSearch();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategoryFilter = e.target.value;
                this.performSearch();
            });
        }
        
        // Load categories for filter
        this.loadCategoriesForFilter();
    }
    
    // Load categories for filter dropdown
    async loadCategoriesForFilter() {
        try {
            // This would need a categories API call
            const categoryFilter = document.getElementById('productsCategoryFilter');
            if (categoryFilter) {
                // For now, add some static options
                categoryFilter.innerHTML = `
                    <option value="">Tất cả danh mục</option>
                    <option value="technology">Công nghệ</option>
                    <option value="education">Giáo dục</option>
                    <option value="fashion">Thời trang</option>
                    <option value="health">Sức khỏe</option>
                    <option value="beauty">Làm đẹp</option>
                `;
            }
        } catch (error) {
            console.error('Error loading categories for filter:', error);
        }
    }
    
    // Perform search with current filters
    async performSearch() {
        const query = this.currentSearchQuery || '';
        const statusFilter = this.currentStatusFilter || '';
        const categoryFilter = this.currentCategoryFilter || '';
        
        if (!query.trim() && !statusFilter && !categoryFilter) {
            // If no search query and no filters, load all products
            return this.loadProducts(1);
        }
        
        try {
            let result;
            if (query.trim()) {
                result = await AdminProductsAPI.searchProducts(query, categoryFilter, this.itemsPerPage, 1);
            } else {
                // Filter only by status/category
                result = await AdminProductsAPI.getAllProducts(this.itemsPerPage, 1);
            }
            
            if (result.success) {
                let products = result.data?.products || result.products || result.data || [];
                
                // Apply status filter if needed
                if (statusFilter && Array.isArray(products)) {
                    products = products.filter(product => product.status === statusFilter);
                }
                
                this.renderProductsTable(products, { page: 1, totalPages: 1, total: products.length });
            } else {
                throw new Error(result.message || 'Lỗi tìm kiếm');
            }
        } catch (error) {
            console.error('Error searching products:', error);
            this.adminPanel.notify('Lỗi tìm kiếm sản phẩm!', 'error');
        }
    }    
    // Search products
    async searchProducts(query, category = '') {
        // This method is now handled by performSearch()
        return this.performSearch();
    }
    
    // View product details
    async viewProduct(id) {
        try {
            const result = await AdminProductsAPI.getProduct(id);
            if (result.success) {
                const product = result.data || result.product;
                this.showProductModal(product, 'view');
            } else {
                throw new Error(result.message || 'Không thể tải thông tin sản phẩm');
            }
        } catch (error) {
            console.error('Error viewing product:', error);
            this.adminPanel.notify('Lỗi tải thông tin sản phẩm!', 'error');
        }
    }
    
    // Edit product
    async editProduct(id) {
        try {
            const result = await AdminProductsAPI.getProduct(id);
            if (result.success) {
                const product = result.data || result.product;
                this.showProductModal(product, 'edit');
            } else {
                throw new Error(result.message || 'Không thể tải thông tin sản phẩm');
            }
        } catch (error) {
            console.error('Error loading product for edit:', error);
            this.adminPanel.notify('Lỗi tải thông tin sản phẩm!', 'error');
        }
    }
    
    // Delete product
    async deleteProduct(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            return;
        }
        
        try {
            const result = await AdminProductsAPI.deleteProduct(id);
            if (result.success) {
                this.adminPanel.notify('Xóa sản phẩm thành công!', 'success');
                this.loadProducts(this.paginationState.page);
            } else {
                throw new Error(result.message || 'Không thể xóa sản phẩm');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.adminPanel.notify('Lỗi xóa sản phẩm!', 'error');
        }
    }
    
    // Toggle product status
    async toggleProductStatus(id, newStatus) {
        try {
            const result = await AdminProductsAPI.toggleProductStatus(id, newStatus);
            if (result.success) {
                this.adminPanel.notify(`${newStatus === 'active' ? 'Hiển thị' : 'Ẩn'} sản phẩm thành công!`, 'success');
                this.loadProducts(this.paginationState.page);
            } else {
                throw new Error(result.message || 'Không thể cập nhật trạng thái sản phẩm');
            }
        } catch (error) {
            console.error('Error toggling product status:', error);
            this.adminPanel.notify('Lỗi cập nhật trạng thái sản phẩm!', 'error');
        }
    }
    
    // Show create product modal
    showCreateProductModal() {
        this.showProductModal(null, 'create');
    }
      // Show product modal (view/edit/create)
    showProductModal(product, mode) {
        if (mode === 'view' && product) {
            // Show view modal with product details
            this.showProductViewModal(product);
        } else if (mode === 'edit' && product) {
            // Show edit modal
            this.showProductEditModal(product);
        } else if (mode === 'create') {
            // Show create modal
            this.showProductCreateModal();
        } else {
            console.log(`Show product modal in ${mode} mode:`, product);
            this.adminPanel.notify('Chức năng modal sản phẩm đang được phát triển!', 'info');
        }
    }
      // Show product view modal
    showProductViewModal(product) {
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-dialog modal-xl product-detail-modal" style="max-width: 90vw; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <!-- Modal Header -->
                <div class="modal-header-custom" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #dee2e6; margin: -20px -20px 20px -20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px 12px 0 0;">
                    <h5 class="modal-title-custom" style="margin: 0; font-size: 1.5rem; font-weight: 600;">
                        <i class="fas fa-eye" style="margin-right: 10px;"></i>Chi tiết sản phẩm
                    </h5>
                    <button type="button" class="close-custom" onclick="this.closest('.modal').remove()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; line-height: 1;">
                        <span>&times;</span>
                    </button>
                </div>
                
                <!-- Modal Body -->
                <div class="modal-body-custom" style="padding: 0;">
                    <div class="row" style="margin: 0;">
                        <!-- Product Image -->
                        <div class="col-md-4" style="padding: 0 15px;">
                            ${product.images && product.images.length > 0 ? 
                                `<img src="${product.images[0]}" alt="${this.escapeHtml(product.title || product.name)}" class="img-fluid rounded" style="max-height: 400px; width: 100%; object-fit: cover; border: 1px solid #dee2e6;">` :
                                `<div class="product-placeholder text-center p-4 border rounded" style="min-height: 300px; background: #f8f9fa;">
                                    <i class="fas fa-image fa-3x text-muted"></i>
                                    <p class="mt-2 text-muted">Không có hình ảnh</p>
                                </div>`
                            }
                        </div>
                        
                        <!-- Product Details -->
                        <div class="col-md-8" style="padding: 0 15px;">
                            <div class="product-info" style="background: #f8f9fa; border-radius: 8px; padding: 20px;">
                                <div class="info-grid" style="display: grid; grid-template-columns: 150px 1fr; gap: 15px; align-items: center;">
                                    <div style="font-weight: 600; color: #495057;"><i class="fas fa-hashtag" style="margin-right: 5px; color: #6c757d;"></i>ID:</div>
                                    <div style="font-family: 'Courier New', monospace; color: #6c757d;">${product.id}</div>
                                    
                                    <div style="font-weight: 600; color: #495057;"><i class="fas fa-tag" style="margin-right: 5px; color: #6c757d;"></i>Tên sản phẩm:</div>
                                    <div style="font-weight: 600; color: #212529; font-size: 1.1rem;">${this.escapeHtml(product.title || product.name)}</div>
                                    
                                    <div style="font-weight: 600; color: #495057;"><i class="fas fa-list" style="margin-right: 5px; color: #6c757d;"></i>Danh mục:</div>
                                    <div><span class="badge badge-info" style="font-size: 0.9rem; padding: 6px 12px;">${this.escapeHtml(product.category_name || 'Chưa phân loại')}</span></div>
                                    
                                    <div style="font-weight: 600; color: #495057;"><i class="fas fa-dollar-sign" style="margin-right: 5px; color: #6c757d;"></i>Giá:</div>
                                    <div><span class="text-success font-weight-bold" style="font-size: 1.2rem;">${product.price ? this.formatPrice(product.price) : 'Chưa có giá'}</span></div>
                                    
                                    <div style="font-weight: 600; color: #495057;"><i class="fas fa-user" style="margin-right: 5px; color: #6c757d;"></i>Người tạo:</div>
                                    <div style="color: #495057;">${this.escapeHtml(product.creator_name || 'N/A')}</div>
                                    
                                    <div style="font-weight: 600; color: #495057;"><i class="fas fa-toggle-on" style="margin-right: 5px; color: #6c757d;"></i>Trạng thái:</div>
                                    <div><span class="status-badge ${this.getProductStatusClass(product.status)}" style="padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${this.getProductStatusText(product.status)}</span></div>
                                    
                                    <div style="font-weight: 600; color: #495057;"><i class="fas fa-eye" style="margin-right: 5px; color: #6c757d;"></i>Lượt xem:</div>
                                    <div style="color: #495057;"><strong>${product.view_count || 0}</strong></div>
                                    
                                    <div style="font-weight: 600; color: #495057;"><i class="fas fa-star" style="margin-right: 5px; color: #6c757d;"></i>Đánh giá:</div>
                                    <div style="color: #495057;">
                                        <strong>${product.review_count || 0}</strong> đánh giá
                                        ${product.avg_rating ? `<span style="margin-left: 10px;">⭐ <strong>${parseFloat(product.avg_rating).toFixed(1)}/5</strong></span>` : ''}
                                    </div>
                                    
                                    <div style="font-weight: 600; color: #495057;"><i class="fas fa-calendar" style="margin-right: 5px; color: #6c757d;"></i>Ngày tạo:</div>
                                    <div style="color: #6c757d; font-size: 0.9rem;">${this.formatDate(product.created_at)}</div>
                                </div>
                                
                                ${product.description ? `
                                    <div style="margin-top: 20px; border-top: 1px solid #dee2e6; padding-top: 20px;">
                                        <div style="font-weight: 600; color: #495057; margin-bottom: 10px;">
                                            <i class="fas fa-align-left" style="margin-right: 5px; color: #6c757d;"></i>Mô tả:
                                        </div>
                                        <div style="background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; max-height: 200px; overflow-y: auto; line-height: 1.6; color: #495057;">
                                            ${this.escapeHtml(product.description)}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Modal Footer -->
                <div class="modal-footer-custom" style="display: flex; justify-content: flex-end; gap: 10px; padding: 20px; border-top: 1px solid #dee2e6; margin: 20px -20px -20px -20px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="padding: 8px 20px; border-radius: 6px;">
                        <i class="fas fa-times" style="margin-right: 5px;"></i>Đóng
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.adminProductsManager && window.adminProductsManager.editProduct(${product.id}); this.closest('.modal').remove();" style="padding: 8px 20px; border-radius: 6px;">
                        <i class="fas fa-edit" style="margin-right: 5px;"></i>Chỉnh sửa
                    </button>
                </div>
            </div>
        `;// Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        
        // Add to DOM
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        // Handle backdrop click
        backdrop.addEventListener('click', () => {
            modal.remove();
            backdrop.remove();
        });
        
        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                backdrop.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    // Show product edit modal (placeholder for now)
    showProductEditModal(product) {
        this.adminPanel.notify('Chức năng chỉnh sửa sản phẩm đang được phát triển!', 'info');
        console.log('Edit product:', product);
    }
    
    // Show product create modal (placeholder for now)
    showProductCreateModal() {
        this.adminPanel.notify('Chức năng tạo sản phẩm mới đang được phát triển!', 'info');
    }
      // Render error state
    renderErrorState() {
        const productsSection = document.getElementById('products-section');
        if (productsSection) {
            productsSection.innerHTML = `                <div class="section-header">
                    <h1>Quản lý sản phẩm</h1>
                    <div class="section-actions">
                        <button class="btn btn-primary" onclick="window.adminProductsManager && window.adminProductsManager.loadProducts(1)">
                            <i class="fas fa-sync"></i> Thử lại
                        </button>
                    </div>
                </div>
                <div class="admin-table-container">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.
                    </div>
                </div>
            `;
        }
    }
      // Utility methods
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    getProductStatusClass(status) {
        switch(status) {
            case 'active': return 'status-active';
            case 'inactive': return 'status-inactive';
            case 'draft': return 'status-pending';
            default: return 'status-inactive';
        }
    }
    
    getProductStatusText(status) {
        switch(status) {
            case 'active': return 'Đang bán';
            case 'inactive': return 'Đã ẩn';
            case 'draft': return 'Bản nháp';
            default: return 'Không xác định';
        }
    }
    
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global instance for use in HTML onclick attributes
let adminProductsManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Make API available globally
    window.AdminProductsAPI = AdminProductsAPI;
    window.AdminProductsManager = AdminProductsManager;
    
    // Initialize a default instance if adminPanel is available
    if (window.adminPanel) {
        window.adminProductsManager = new AdminProductsManager(window.adminPanel);
        adminProductsManager = window.adminProductsManager;
        console.log('AdminProductsManager initialized with existing adminPanel');
    } else {
        // Wait for adminPanel to be available
        const checkAdminPanel = setInterval(() => {
            if (window.adminPanel) {
                window.adminProductsManager = new AdminProductsManager(window.adminPanel);
                adminProductsManager = window.adminProductsManager;
                console.log('AdminProductsManager initialized after adminPanel became available');
                clearInterval(checkAdminPanel);
            }
        }, 100);
        
        // Clear interval after 10 seconds to avoid infinite checking
        setTimeout(() => {
            clearInterval(checkAdminPanel);
        }, 10000);
    }
});
