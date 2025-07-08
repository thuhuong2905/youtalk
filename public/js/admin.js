// Admin Panel JavaScript

// Remove AuthHelper - will use AdminAuthHelper from admin-auth.js

// AdminAPI Object - Handles all API calls for admin panel
const AdminAPI = {
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
            
            // Always return the data, let the caller handle success/failure
            if (response.ok) {
                return data; // Will have { success: true, data: {...}, message: "..." }
            } else {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('AdminAPI Error:', error);
            return {
                success: false,
                message: error.message || 'Network error'
            };
        }
    },    // Authentication - Use AdminAuthHelper from admin-auth.js
    async checkAuth() {
        if (!window.AdminAuthHelper) {
            console.error('AdminAuthHelper not loaded');
            return {
                success: false,
                message: 'Admin authentication module not loaded'
            };
        }
        return await window.AdminAuthHelper.checkAdminAuth();
    },// Dashboard Stats - Use existing admin_dashboard.php API
    async getStats() {
        return await this.makeRequest('admin_dashboard.php?action=stats');
    },
    
    async getRecentActivity(limit = 10) {
        return await this.makeRequest(`admin_dashboard.php?action=recent_activity&limit=${limit}`);    },    // User Management - Now handled by AdminUsersAPI    // User Management - Now handled by AdminUsersAPI

    // Reports API
    async getReportsData() {
        return await this.makeRequest('admin_dashboard.php?action=reports');
    },

    async getActivityChartData() {
        return await this.makeRequest('admin_dashboard.php?action=activity_chart');
    },

    async getTopCategories() {
        return await this.makeRequest('admin_dashboard.php?action=top_categories');
    },

    async getUserGrowthData() {
        return await this.makeRequest('admin_dashboard.php?action=user_growth');
    }
};

class AdminPanel {
    constructor() {
        this.currentSection = null; // Changed from 'dashboard' to null
        this.currentPage = 1;
        this.itemsPerPage = 20;        this.paginationState = {
            users: { page: 1, total: 0, totalPages: 0 },
            posts: { page: 1, total: 0, totalPages: 0 }
        };
        this.activityChart = null; // For Chart.js instance
        this.init();
    }init() {
        console.log('Initializing Admin Panel...');
        
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.initializeAdminPanel();
            });
        } else {
            this.setupEventListeners();
            this.initializeAdminPanel();
        }
    }    async initializeAdminPanel() {
        try {
            // Check authentication first
            const authResult = await this.checkAdminAuth();
            
            // Only proceed if authentication is successful
            if (authResult) {
                console.log('Authentication successful, loading dashboard...');
                this.showSection('dashboard');
            }
            // If auth fails, checkAdminAuth already handles redirect
        } catch (error) {
            console.error('Error initializing admin panel:', error);
            this.notify('Lỗi khởi tạo admin panel', 'error');
        }
    }

    setupEventListeners() {
        // Sidebar navigation - Improved event delegation
        const sidebar = document.getElementById('adminSidebar');
        if (sidebar) {
            sidebar.addEventListener('click', (e) => {
                // Find the closest nav-link element (handles clicks on icons and text)
                const navLink = e.target.closest('.nav-link');
                if (navLink && navLink.dataset.section) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const section = navLink.dataset.section;
                    console.log('Switching to section:', section); // Debug log
                    this.showSection(section);
                }
            });
        }        // Admin logout button
        const adminLogout = document.getElementById('adminLogout');
        if (adminLogout) {
            adminLogout.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Show confirmation with notification
                showWarning('Nhấn vào đây để xác nhận đăng xuất', 3000);
                
                // Add temporary confirmation handler
                const confirmLogout = () => {
                    showInfo('Đang đăng xuất...');
                    setTimeout(async () => {
                        try {
                            await window.AdminAuthHelper.logout();
                        } catch (error) {
                            console.error('Logout error:', error);
                            showError('Có lỗi xảy ra khi đăng xuất');
                            // Force redirect anyway
                            setTimeout(() => {
                                window.location.href = 'admin-login.html';
                            }, 2000);
                        }
                    }, 500);
                };
                
                // Auto confirm after 2 seconds if user doesn't click again
                const timeoutId = setTimeout(confirmLogout, 3000);
                
                // If user clicks again within 3 seconds, confirm immediately
                const confirmHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearTimeout(timeoutId);
                    adminLogout.removeEventListener('click', confirmHandler);
                    confirmLogout();
                };
                
                adminLogout.addEventListener('click', confirmHandler);
                
                // Remove the handler after timeout
                setTimeout(() => {
                    adminLogout.removeEventListener('click', confirmHandler);
                }, 3000);
            });
        }

        // Sidebar toggle for mobile
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('open');
            });
        }        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && sidebar) {
                const sidebarToggle = document.getElementById('sidebarToggle');
                
                if (!sidebar.contains(e.target) && (!sidebarToggle || !sidebarToggle.contains(e.target))) {
                    sidebar.classList.remove('open');
                }
            }        });

        // Add User Modal Event Listeners moved to AdminUsersHelper
    }

    async checkAdminAuth() {
        try {
            const result = await AdminAPI.checkAuth();            // Check if user is authenticated and has admin role
            if (!result.success || !result.data || !result.data.authenticated || 
                !result.data.user || result.data.user.role !== 'admin') {
                this.notify('Bạn không có quyền truy cập trang này!', 'error');
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 2000);
                return false;
            }

            // Update admin info in sidebar
            this.updateAdminInfo(result.data.user);
            return true;        } catch (error) {
            console.error('Error checking admin auth:', error);
            this.notify('Lỗi kiểm tra quyền truy cập!', 'error');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 2000);
            return false;
        }
    }

    updateAdminInfo(userData) {
        const adminInfo = document.getElementById('adminInfo');
        if (adminInfo && userData) {
            const adminName = adminInfo.querySelector('.admin-name');
            if (adminName) {
                adminName.textContent = userData.username || 'Admin';
            }
        }
    }    showSection(sectionName) {
        // Validate section name
        if (!sectionName || typeof sectionName !== 'string') {
            console.error('Invalid section name:', sectionName);
            return;
        }

        // For initial load, always proceed even if currentSection matches
        const isInitialLoad = this.currentSection === null;
        
        // Prevent switching to the same section (except for initial load)
        if (!isInitialLoad && this.currentSection === sectionName) {
            console.log('Already in section:', sectionName);
            return;
        }

        console.log('Switching from', this.currentSection, 'to', sectionName, isInitialLoad ? '(initial load)' : '');

        // Hide all sections
        const allSections = document.querySelectorAll('.admin-section');
        allSections.forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav links
        const allNavLinks = document.querySelectorAll('.nav-link');
        allNavLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('Section activated:', `${sectionName}-section`);
        } else {
            console.error('Section not found:', `${sectionName}-section`);
            return;
        }

        // Add active class to current nav link
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log('Nav link activated:', sectionName);
        } else {
            console.error('Nav link not found for section:', sectionName);
        }

        // Update current section
        this.currentSection = sectionName;

        // Load section content
        this.loadSectionContent(sectionName);
    }async loadSectionContent(sectionName) {
        console.log('Loading section:', sectionName);
        this.showLoading();

        // Reset pagination for the new section
        if (this.paginationState[sectionName]) {
            this.paginationState[sectionName].page = 1;
        }

        try {
            switch (sectionName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'users':
                    // Initialize and use AdminUsersHelper
                    const usersHelper = initializeAdminUsersHelper(this);
                    await usersHelper.loadUsers(1);
                    break;
                case 'posts':
                    // Initialize and use AdminPostsHelper
                    const postsHelper = initializeAdminPostsHelper(this);
                    await postsHelper.loadPosts(1);
                    break;
                case 'comments':
                    await this.loadCommentsSection();
                    break;
                case 'products':
                    // Initialize products manager if not exists
                    if (!window.adminProductsManager) {
                        window.adminProductsManager = new window.AdminProductsManager(this);
                    }
                    await window.adminProductsManager.loadProducts(1);
                    break;
                case 'categories':
                    await adminCategoriesApi.loadCategories();
                    break;
                case 'reports':
                    await this.loadReports();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
                default:
                    console.warn('Unknown section:', sectionName);
            }        } catch (error) {
            console.error('Error loading section:', error);
            this.notify('Lỗi tải dữ liệu: ' + error.message, 'error');
        } finally {
            this.hideLoading();
            console.log('Loading completed for section:', sectionName);
        }
    }async loadDashboard() {
        console.log('Loading dashboard...');
        try {
            // Load system stats
            console.log('Fetching stats...');
            const statsResult = await AdminAPI.getStats();
            console.log('Stats result:', statsResult);

            if (statsResult && statsResult.success) {
                // Backend trả về data trực tiếp, không có wrapper
                this.updateDashboardStats(statsResult.data || statsResult);
                console.log('Stats updated successfully');
            } else {
                console.warn('Stats API returned failure:', statsResult);
            }

            // Load recent activity
            console.log('Fetching recent activity...');
            const activityResult = await AdminAPI.getRecentActivity(10);
            console.log('Activity result:', activityResult);

            if (activityResult && activityResult.success) {
                // Backend trả về array trực tiếp
                this.updateRecentActivity(activityResult.data || activityResult);
                console.log('Activity updated successfully');
            } else {
                console.warn('Activity API returned failure:', activityResult);
            }

            console.log('Dashboard loading completed');        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.notify('Lỗi tải dashboard: ' + error.message, 'error');
            throw error; // Re-throw to trigger finally block
        }
    }

    updateDashboardStats(stats) {
        // Update stat cards
        const elements = {
            'totalUsers': stats.total_users || 0,
            'totalPosts': stats.total_posts || 0,
            'totalComments': stats.total_comments || 0,
            'totalProducts': stats.total_products || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, parseInt(value));
            }
        });
    }    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        // Handle both array and object with data property
        const activityList = Array.isArray(activities) ? activities : (activities.data || activities.activities || []);

        if (!activityList || activityList.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">Không có hoạt động gần đây</p>';
            return;
        }

        const activityHtml = activityList.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-description">${activity.description || activity.title || 'Hoạt động mới'}</p>
                    <p class="activity-time">${this.formatDateTime(activity.timestamp || activity.created_at)}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = activityHtml;
    }

    getActivityIcon(type) {
        const icons = {
            'user': 'fa-user-plus',
            'post': 'fa-file-alt',
            'product': 'fa-box',
            'comment': 'fa-comment',
            'review': 'fa-star'
        };
        return icons[type] || 'fa-info-circle';    }    // Users management moved to AdminUsersAPI
    // loadUsers and renderUsersTable methods removed

    // Posts management moved to AdminPostsAPI 
    // loadPosts and renderPostsTable methods removed    // Comments management moved to AdminCommentsAPI 
    // loadComments, renderCommentsTable, getCommentStatus methods removed

    async loadCommentsSection() {
        console.log('Loading comments section...');
        
        // Function to attempt loading comments
        const attemptLoadComments = async () => {
            if (window.adminCommentsAPI) {
                console.log('AdminCommentsAPI found, loading comments...');
                try {
                    await window.adminCommentsAPI.loadComments(1);
                    return true;                } catch (error) {
                    console.error('Error loading comments:', error);
                    this.notify('Lỗi tải bình luận: ' + error.message, 'error');
                    return false;
                }
            }
            return false;
        };

        // Try to load immediately
        const loaded = await attemptLoadComments();
        
        if (!loaded) {
            console.log('AdminCommentsAPI not ready yet, waiting for it...');
            
            // Show loading state
            const commentsSection = document.getElementById('comments-section');
            if (commentsSection) {
                commentsSection.innerHTML = `
                    <div class="section-header">
                        <h1>Quản lý Bình luận</h1>
                        <p>Quản lý tất cả bình luận trong hệ thống</p>
                    </div>
                    <div class="admin-table-container">
                        <div class="d-flex justify-content-center align-items-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Đang tải...</span>
                            </div>
                            <span class="ms-2">Đang khởi tạo module quản lý bình luận...</span>
                        </div>
                    </div>
                `;
            }

            // Set up listener for when AdminCommentsAPI becomes ready
            const onCommentsAPIReady = async (event) => {
                console.log('AdminCommentsAPI ready event received');
                document.removeEventListener('adminCommentsAPIReady', onCommentsAPIReady);
                await attemptLoadComments();
            };

            document.addEventListener('adminCommentsAPIReady', onCommentsAPIReady);

            // Fallback: Keep checking every 100ms for up to 5 seconds
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds
            const checkInterval = setInterval(async () => {
                attempts++;
                const success = await attemptLoadComments();
                
                if (success) {
                    clearInterval(checkInterval);
                    document.removeEventListener('adminCommentsAPIReady', onCommentsAPIReady);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    document.removeEventListener('adminCommentsAPIReady', onCommentsAPIReady);                    console.error('AdminCommentsAPI failed to load after timeout');
                    this.notify('Module quản lý bình luận không thể tải. Vui lòng tải lại trang.', 'error');
                    
                    // Show error state
                    if (commentsSection) {
                        commentsSection.innerHTML = `
                            <div class="section-header">
                                <h1>Quản lý Bình luận</h1>
                                <p>Quản lý tất cả bình luận trong hệ thống</p>
                            </div>
                            <div class="admin-table-container">
                                <div class="alert alert-danger">
                                    <h5><i class="fas fa-exclamation-triangle"></i> Lỗi tải module</h5>
                                    <p>Module quản lý bình luận không thể khởi tạo. Vui lòng:</p>
                                    <ul>
                                        <li>Kiểm tra kết nối internet</li>
                                        <li>Tải lại trang (F5)</li>
                                        <li>Xóa cache trình duyệt</li>
                                    </ul>
                                    <button class="btn btn-primary" onclick="location.reload()">
                                        <i class="fas fa-refresh"></i> Tải lại trang
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                }
            }, 100);
        }
    }    // Product Management - Now handled by AdminProductsAPI
    // Removed: loadProducts, renderProductsTable, getProductStatusClass, getProductStatusText, formatPrice methods

    async loadReports() {
        console.log('Loading reports...');
        this.showLoading();
        
        const reportsSection = document.getElementById('reports-section');
        if (reportsSection) {
            reportsSection.innerHTML = `
                <div class="section-header">
                    <h1>Báo cáo & Thống kê</h1>
                    <div class="section-actions">
                        <select id="reportPeriod" class="form-select">
                            <option value="7">7 ngày qua</option>
                            <option value="30">30 ngày qua</option>
                            <option value="90">3 tháng qua</option>
                        </select>
                        <button class="btn btn-primary" id="refreshReports">
                            <i class="fas fa-sync-alt"></i> Làm mới
                        </button>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="report-card">
                            <div class="report-icon">
                                <i class="fas fa-eye"></i>
                            </div>
                            <div class="report-content">
                                <h3>Lượt truy cập</h3>
                                <p class="report-number" id="visitCount">
                                    <i class="fas fa-spinner fa-spin"></i>
                                </p>
                                <small class="text-muted">Hôm nay</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="report-card">
                            <div class="report-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="report-content">
                                <h3>Người dùng mới</h3>
                                <p class="report-number" id="newUsersCount">
                                    <i class="fas fa-spinner fa-spin"></i>
                                </p>
                                <small class="text-muted">Tuần này</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="report-card">
                            <div class="report-icon">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="report-content">
                                <h3>Bài viết mới</h3>
                                <p class="report-number" id="newPostsCount">
                                    <i class="fas fa-spinner fa-spin"></i>
                                </p>
                                <small class="text-muted">Tuần này</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="report-card">
                            <div class="report-icon">
                                <i class="fas fa-comments"></i>
                            </div>
                            <div class="report-content">
                                <h3>Bình luận mới</h3>
                                <p class="report-number" id="newCommentsCount">
                                    <i class="fas fa-spinner fa-spin"></i>
                                </p>
                                <small class="text-muted">Tuần này</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-8">
                        <div class="admin-table-container">
                            <div class="table-header">
                                <h3 class="table-title">Biểu đồ hoạt động (7 ngày qua)</h3>
                            </div>
                            <div class="chart-container" style="position: relative; height: 400px;">
                                <canvas id="activityChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="admin-table-container">
                            <div class="table-header">
                                <h3 class="table-title">Top danh mục</h3>
                            </div>
                            <div class="top-categories" id="topCategories">
                                <div class="text-center p-4">
                                    <i class="fas fa-spinner fa-spin"></i> Đang tải...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Set up event listeners
            this.setupReportsEventListeners();
              // Load dynamic data from API
            await this.loadReportsData();
        }
        
        this.hideLoading();
    }

    setupReportsEventListeners() {
        // Refresh reports button
        const refreshBtn = document.getElementById('refreshReports');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.loadReportsData();
            });
        }

        // Period selector
        const periodSelect = document.getElementById('reportPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', async () => {
                await this.loadReportsData();
            });
        }
    }

    async loadReportsData() {
        try {
            // Load main reports data
            const reportsResult = await AdminAPI.getReportsData();
            if (reportsResult.success) {
                const data = reportsResult.data;
                
                // Update numbers with animation
                const visitElement = document.getElementById('visitCount');
                const newUsersElement = document.getElementById('newUsersCount');
                const newPostsElement = document.getElementById('newPostsCount');
                const newCommentsElement = document.getElementById('newCommentsCount');

                if (visitElement) this.animateNumber(visitElement, data.visits_today);
                if (newUsersElement) this.animateNumber(newUsersElement, data.new_users_week);
                if (newPostsElement) this.animateNumber(newPostsElement, data.new_posts_week);
                if (newCommentsElement) this.animateNumber(newCommentsElement, data.new_comments_week);
            }

            // Load top categories
            await this.loadTopCategoriesData();
            
            // Load activity chart
            await this.loadActivityChart();        } catch (error) {
            console.error('Error loading reports data:', error);
            this.notify('Lỗi tải dữ liệu báo cáo', 'error');
        }
    }

    async loadTopCategoriesData() {
        try {
            const result = await AdminAPI.getTopCategories();
            if (result.success) {
                const topCategoriesContainer = document.getElementById('topCategories');
                if (topCategoriesContainer) {
                    if (result.data.length === 0) {
                        topCategoriesContainer.innerHTML = '<p class="text-center p-4">Chưa có dữ liệu</p>';
                        return;
                    }

                    const html = result.data.map(category => `
                        <div class="category-stat">
                            <div class="category-info">
                                <span class="category-name">${category.name}</span>
                                <span class="category-count">${category.post_count}</span>
                            </div>
                            <div class="category-progress">
                                <div class="progress-bar" style="width: ${category.percentage}%"></div>
                            </div>
                        </div>
                    `).join('');

                    topCategoriesContainer.innerHTML = html;
                }
            }
        } catch (error) {
            console.error('Error loading top categories:', error);
            const topCategoriesContainer = document.getElementById('topCategories');
            if (topCategoriesContainer) {
                topCategoriesContainer.innerHTML = '<p class="text-center p-4 text-danger">Lỗi tải dữ liệu</p>';
            }
        }
    }

    async loadActivityChart() {
        try {
            const result = await AdminAPI.getActivityChartData();
            if (result.success) {
                const canvas = document.getElementById('activityChart');
                if (canvas) {
                    // Destroy existing chart if exists
                    if (this.activityChart) {
                        this.activityChart.destroy();
                    }

                    const ctx = canvas.getContext('2d');                    this.activityChart = new Chart(ctx, {
                        type: 'line',
                        data: result.data,
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                title: {
                                    display: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1
                                    }
                                }
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading activity chart:', error);
            const canvas = document.getElementById('activityChart');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.font = '16px Arial';
                ctx.fillStyle = '#dc3545';
                ctx.textAlign = 'center';
                ctx.fillText('Lỗi tải biểu đồ', canvas.width / 2, canvas.height / 2);
            }
        }
    }

    async loadSettings() {
        console.log('Loading settings...');
        
        const settingsSection = document.getElementById('settings-section');
        if (settingsSection) {
            settingsSection.innerHTML = `
                <div class="section-header">
                    <h1>Cài đặt</h1>
                    <p>Cấu hình hệ thống</p>
                </div>
                
                <div class="row">
                    <div class="col-md-8">
                        <div class="admin-table-container">
                            <div class="table-header">
                                <h3 class="table-title">Cài đặt chung</h3>
                            </div>
                            <div class="settings-form">
                                <form id="generalSettings">
                                    <div class="form-group mb-3">
                                        <label for="siteName" class="form-label">Tên website</label>
                                        <input type="text" class="form-control" id="siteName" name="siteName" required>
                                    </div>
                                    
                                    <div class="form-group mb-3">
                                        <label class="form-check-label" for="enableNotifications">
                                            Bật thông báo
                                        </label>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save"></i> Lưu cài đặt
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="admin-table-container mb-4">
                            <div class="table-header">
                                <h3 class="table-title">Thông tin hệ thống</h3>
                            </div>
                            <div class="system-info">
                                <div class="info-item">
                                    <span class="info-label">Phiên bản:</span>
                                    <span class="info-value">v1.0.0</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Database:</span>
                                    <span class="info-value">MySQL 8.0</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">PHP Version:</span>
                                    <span class="info-value">8.0+</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Server:</span>
                                    <span class="info-value">Apache/Nginx</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Uptime:</span>
                                    <span class="info-value">24 ngày</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="admin-table-container">
                            <div class="table-header">
                                <h3 class="table-title">Thao tác nhanh</h3>
                            </div>
                            <div class="quick-actions">
                                <button class="btn btn-outline-primary btn-sm w-100 mb-2">
                                    <i class="fas fa-broom"></i> Xóa cache
                                </button>
                                <button class="btn btn-outline-warning btn-sm w-100 mb-2">
                                    <i class="fas fa-database"></i> Sao lưu database
                                </button>
                                <button class="btn btn-outline-info btn-sm w-100 mb-2">
                                    <i class="fas fa-sync"></i> Cập nhật hệ thống
                                </button>
                                <button class="btn btn-outline-danger btn-sm w-100">
                                    <i class="fas fa-sign-out-alt"></i> Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Setup form handler
            this.setupSettingsForm();
        }
    }

    setupSettingsForm() {
        const form = document.getElementById('generalSettings');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    }    async saveSettings() {
        // Simulate saving settings
        this.notify('Lưu cài đặt thành công!', 'success');
    }

    // Debug method to check current state
    debugCurrentState() {
        console.log('=== Admin Panel Debug Info ===');
        console.log('Current section:', this.currentSection);
        console.log('Active nav links:', document.querySelectorAll('.nav-link.active').length);
        console.log('Active sections:', document.querySelectorAll('.admin-section.active').length);
        console.log('All nav links:', document.querySelectorAll('.nav-link').length);
        console.log('All sections:', document.querySelectorAll('.admin-section').length);
        console.log('==============================');
    }

    // Utility Methods
    animateNumber(element, targetValue) {
        const duration = 1000; // 1 second
        const start = 0;
        const startTime = performance.now();

        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(start + (targetValue - start) * progress);
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };

        requestAnimationFrame(updateNumber);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    // Fallback alert method - notifications.js showNotification() is preferred
    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;

        const alertId = 'alert-' + Date.now();
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type}">
                ${message}
            </div>
        `;

        alertContainer.insertAdjacentHTML('beforeend', alertHtml);

        // Auto remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);    }

    // Centralized notification method - prefers showNotification from notifications.js
    notify(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            this.showAlert(message, type);
        }
    }

    // User modal methods moved to AdminUsersHelper
}

// Initialize admin panel when script loads
let adminPanel;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminPanel);
} else {
    initializeAdminPanel();
}

function initializeAdminPanel() {
    try {
        adminPanel = new AdminPanel();
        window.adminPanel = adminPanel; // Make it available globally for debugging
        
        // Initialize products manager if AdminProductsManager is available
        if (window.AdminProductsManager) {
            window.adminProductsManager = new window.AdminProductsManager(adminPanel);
            console.log('Admin Products Manager initialized successfully');
        }
        
        console.log('Admin Panel initialized successfully');
    } catch (error) {
        console.error('Error initializing Admin Panel:', error);
    }
}

// Helper functions for avatar display (reused from main.js)
function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    // Lấy chữ cái đầu tiên của phần tên đầu tiên
    const targetPart = parts[0];
    return targetPart.charAt(0).toUpperCase();
}

function displayFallbackAvatar(imageElement, initial, bgColor) {
    try {
        if (!imageElement || !imageElement.parentNode) {
            console.error("Không thể hiển thị avatar dự phòng: Phần tử ảnh hoặc parent không hợp lệ.");
            return;
        }

        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'user-avatar-fallback user-avatar';
        fallbackDiv.style.backgroundColor = bgColor;
        fallbackDiv.textContent = initial;

        // Thay thế phần tử ảnh bị lỗi bằng fallback div
        imageElement.parentNode.replaceChild(fallbackDiv, imageElement);
        console.log("Đã thay thế avatar bị lỗi bằng chữ cái đầu dự phòng.");

    } catch (error) {
        console.error("Lỗi trong displayFallbackAvatar:", error);
        // Fallback text rất cơ bản nếu việc tạo div thất bại
        if (imageElement && imageElement.parentNode) {
             const fallbackText = document.createTextNode(initial || '?');
             imageElement.parentNode.replaceChild(fallbackText, imageElement);
        }
    }
}

function getDisplayName(user) {
    if (!user) return "";
    if (user.full_name && user.full_name.trim()) return user.full_name;
    return "Ẩn danh";
}

function getUserAvatarHtml(user, sizeClass = '', altText = '') {
    const fullName = (user && user.full_name && user.full_name.trim()) ? user.full_name : 'Ẩn danh';
    const firstInitial = getInitials(fullName);
    const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#03417F", "#7f8c8d"];
    const colorIndex = firstInitial.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    
    if (user && user.profile_picture && user.profile_picture.trim() !== '') {
        const escapedAlt = altText || fullName.replace(/"/g, '&quot;');
        return `<img src="${encodeURI(user.profile_picture)}" alt="${escapedAlt}" class="user-avatar ${sizeClass}" onerror="displayFallbackAvatar(this, '${firstInitial}', '${bgColor}')">`;
    } else {
        return `<div class="user-avatar-fallback user-avatar ${sizeClass}" style="background-color: ${bgColor};">${firstInitial}</div>`;
    }
}
