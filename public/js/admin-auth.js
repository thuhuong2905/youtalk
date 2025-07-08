// Admin Authentication - Lightweight auth system for admin panel
// Separated from main auth.js to avoid conflicts and unnecessary dependencies

class AdminAuth {
    constructor() {
        this.form = document.getElementById('admin-login-form');
        this.init();
    }

    init() {
        console.log('Admin Auth initialized');
        this.setupLoginForm();
        this.checkExistingAuth();
    }

    setupLoginForm() {
        if (!this.form) {
            console.error('Admin login form not found');
            return;
        }

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Setup enter key submission
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.form.dispatchEvent(new Event('submit'));
                }
            });
        });
    }

    async handleLogin() {
        const formData = new FormData(this.form);
        const username = formData.get('username') || document.getElementById('username')?.value;
        const password = formData.get('password') || document.getElementById('password')?.value;
        const remember = document.getElementById('remember')?.checked || false;        // Validation
        if (!username || !password) {
            showError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        this.setLoading(true);

        try {
            const credentials = {
                username: username.trim(),
                password: password,
                remember: remember
            };

            console.log('Attempting admin login...');
            const response = await this.adminLogin(credentials);            if (response.success) {
                showSuccess('Đăng nhập thành công! Đang chuyển hướng...');
                
                // Store admin session info if needed
                if (response.data?.user) {
                    sessionStorage.setItem('admin_user', JSON.stringify(response.data.user));
                }

                // Redirect to admin panel
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                showError(response.message || 'Đăng nhập thất bại');
            }        } catch (error) {
            console.error('Login error:', error);
            showError('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            this.setLoading(false);
        }
    }

    async adminLogin(credentials) {
        try {
            const response = await fetchApi('auth.php?action=login', {
                method: 'POST',
                body: credentials
            });
            
            if (response.success && response.data && response.data.user) {
                // Check if user has admin role
                if (response.data.user.role === 'admin') {
                    return {
                        success: true,
                        data: response.data,
                        message: 'Đăng nhập admin thành công'
                    };
                } else {
                    // Logout non-admin user
                    await fetchApi('auth.php?action=logout', { method: 'POST' });
                    return {
                        success: false,
                        message: 'Tài khoản không có quyền admin'
                    };
                }
            }
            
            return response;
        } catch (error) {
            console.error('Admin login error:', error);
            return {
                success: false,
                message: 'Lỗi đăng nhập: ' + error.message
            };
        }
    }

    async checkExistingAuth() {
        try {
            const response = await fetchApi('auth.php?action=status');
            
            if (response.success && response.data && response.data.authenticated) {
                if (response.data.user && response.data.user.role === 'admin') {
                    // Already logged in as admin, redirect to admin panel
                    console.log('Already authenticated as admin, redirecting...');
                    window.location.href = 'admin.html';
                    return;
                }
            }
        } catch (error) {
            console.log('No existing admin session');
        }
    }    setLoading(isLoading) {
        const submitButton = this.form?.querySelector('button[type="submit"]');
        const buttonText = submitButton?.querySelector('.button-text');
        const loadingText = submitButton?.querySelector('.loading');

        if (submitButton && buttonText && loadingText) {
            if (isLoading) {
                buttonText.style.display = 'none';
                loadingText.classList.add('show');
                submitButton.disabled = true;
            } else {
                buttonText.style.display = 'inline';
                loadingText.classList.remove('show');
                submitButton.disabled = false;
            }
        }
    }
}

// Admin Authorization Helper
class AdminAuthHelper {
    static async checkAdminAuth() {
        try {
            const response = await fetchApi('auth.php?action=status');
            
            if (response.success && response.data && response.data.authenticated) {
                if (response.data.user && response.data.user.role === 'admin') {
                    return {
                        success: true,
                        data: {
                            authenticated: true,
                            user: response.data.user
                        }
                    };
                } else {
                    return {
                        success: false,
                        message: 'Không có quyền admin'
                    };
                }
            }
            
            return {
                success: false,
                message: 'Chưa đăng nhập'
            };
        } catch (error) {
            console.error('Check admin auth error:', error);
            return {
                success: false,
                message: 'Lỗi kiểm tra xác thực'
            };
        }
    }    static async requireAdminAuth() {
        const authResult = await this.checkAdminAuth();
        
        if (!authResult.success) {
            showError('Bạn cần đăng nhập với quyền admin để truy cập trang này!');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 2000);
            return false;
        }
        
        return authResult.data.user;
    }    static async logout() {
        try {
            await fetchApi('auth.php?action=logout', { method: 'POST' });
            sessionStorage.removeItem('admin_user');
            showSuccess('Đăng xuất thành công!');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            showError('Có lỗi xảy ra khi đăng xuất');
            // Force redirect anyway after a delay
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 2000);
        }
    }
}

// Initialize admin auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the admin login page
    if (document.getElementById('admin-login-form')) {
        new AdminAuth();
    }
});

// Make AdminAuthHelper available globally for admin panel
window.AdminAuthHelper = AdminAuthHelper;
