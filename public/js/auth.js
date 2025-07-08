// Xử lý chức năng trang xác thực
// Quản lý các tương tác form đăng nhập và đăng ký

document.addEventListener("DOMContentLoaded", function() {
    console.log('YouTalk Auth JS Loaded');
    initAuthPage();
});

/**
 * Khởi tạo chức năng trang xác thực
 */
function initAuthPage() {
    setupAuthTabs();              // Thiết lập các tab xác thực (đăng nhập/đăng ký)
    setupFormValidation();        // Thiết lập kiểm tra dữ liệu form
    setupPasswordToggle();        // Thiết lập chức năng hiển thị/ẩn mật khẩu
    setupForgotPasswordModal();   // Thiết lập modal quên mật khẩu
    checkRedirectParam();         // Kiểm tra tham số redirect trong URL
}

/**
 * Thiết lập các tab xác thực (đăng nhập/đăng ký)
 */
function setupAuthTabs() {
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");
    const loginFormContainer = document.getElementById("login-form-container");
    const registerFormContainer = document.getElementById("register-form-container");
    const switchToRegisterLink = document.getElementById("switch-to-register");
    const switchToLoginLink = document.getElementById("switch-to-login");

    // Hiển thị form đăng nhập
    function showLogin() {
        loginTab.classList.add("active");
        registerTab.classList.remove("active");
        loginFormContainer.classList.add("active");
        registerFormContainer.classList.remove("active");
    }

    // Hiển thị form đăng ký
    function showRegister() {
        registerTab.classList.add("active");
        loginTab.classList.remove("active");
        registerFormContainer.classList.add("active");
        loginFormContainer.classList.remove("active");
    }

    if (loginTab && registerTab && loginFormContainer && registerFormContainer) {
        loginTab.addEventListener("click", showLogin);
        registerTab.addEventListener("click", showRegister);

        if (switchToRegisterLink) {
            switchToRegisterLink.addEventListener("click", (e) => {
                e.preventDefault();
                showRegister();
            });
        }
        if (switchToLoginLink) {
            switchToLoginLink.addEventListener("click", (e) => {
                e.preventDefault();
                showLogin();
            });
        }

        // Kiểm tra URL để xác định tab
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get("tab");

        if (tab === "register") {
            showRegister();
        } else {
            showLogin();
        }
    }
}

/**
 * Thiết lập chức năng hiển thị/ẩn mật khẩu
 */
function setupPasswordToggle() {
    const togglePasswordElements = document.querySelectorAll(".toggle-password");
    togglePasswordElements.forEach(toggle => {
        toggle.addEventListener("click", function () {
            const passwordWrapper = this.closest(".password-wrapper");
            const passwordInput = passwordWrapper.querySelector("input[type=\'password\'], input[type=\'text\']");
            const icon = this.querySelector("i");

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    });
}

/**
 * Thiết lập kiểm tra dữ liệu form đăng nhập và đăng ký
 */
function setupFormValidation() {
    // Kiểm tra form đăng nhập
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById("login-email");
            const passwordInput = document.getElementById("login-password");
            const errorContainer = loginForm.querySelector(".form-error-container");
            
            if (errorContainer) {
                errorContainer.textContent = "";
                errorContainer.style.display = "none";
            }
            
            if (!emailInput.value.trim()) {
                showError("Vui lòng nhập tên đăng nhập hoặc email");
                emailInput.focus();
                return;
            }
            // Nếu có ký tự @ thì kiểm tra định dạng email
            const value = emailInput.value.trim();
            if (value.includes("@")) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    showError("Vui lòng nhập email hợp lệ");
                    emailInput.focus();
                    return;
                }
            }
            
            if (!passwordInput.value.trim()) {
                showError("Vui lòng nhập mật khẩu");
                passwordInput.focus();
                return;
            }
            
            handleLogin();
        });
    }
    
    // Kiểm tra form đăng ký
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById("register-username");
            const fullnameInput = document.getElementById("register-fullname");
            const emailInput = document.getElementById("register-email");
            const passwordInput = document.getElementById("register-password");
            const confirmPasswordInput = document.getElementById("register-confirm-password");
            const termsCheckbox = document.getElementById("terms");
            const errorContainer = registerForm.querySelector(".form-error-container");

            if (errorContainer) {
                errorContainer.textContent = "";
                errorContainer.style.display = "none";
            }

            if (!fullnameInput.value.trim()) {
                showError("Vui lòng nhập họ và tên");
                fullnameInput.focus();
                return;
            }

            if (!usernameInput.value.trim()) {
                showError("Vui lòng nhập tên đăng nhập");
                usernameInput.focus();
                return;
            }
            const usernameRegex = /^[a-zA-Z0-9_]+$/;
            if (!usernameRegex.test(usernameInput.value.trim())) {
                showError("Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới");
                usernameInput.focus();
                return;
            }

            if (!emailInput.value.trim()) {
                showError("Vui lòng nhập email");
                emailInput.focus();
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                showError("Vui lòng nhập email hợp lệ");
                emailInput.focus();
                return;
            }

            if (!passwordInput.value.trim()) {
                showError("Vui lòng nhập mật khẩu");
                passwordInput.focus();
                return;
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(passwordInput.value.trim())) {
                showError("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số");
                passwordInput.focus();
                return;
            }

            if (!confirmPasswordInput.value.trim()) {
                showError("Vui lòng xác nhận mật khẩu");
                confirmPasswordInput.focus();
                return;
            }
            if (passwordInput.value.trim() !== confirmPasswordInput.value.trim()) {
                showError("Mật khẩu xác nhận không khớp");
                confirmPasswordInput.focus();
                return;
            }

            if (!termsCheckbox.checked) {
                showError("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư");
                termsCheckbox.focus();
                return;
            }

            handleRegister();
        });
    }
}

/**
 * Xử lý gửi form đăng nhập
 */
async function handleLogin() {
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const rememberMeCheckbox = document.getElementById("remember-me");
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
    
    const submitButton = document.querySelector("#login-form .auth-submit-btn");
    const originalButtonText = submitButton ? submitButton.textContent : "Đăng nhập";
    
    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Đang đăng nhập...";
        }
        
        const response = await fetchApi("/auth.php?action=login", {
            method: "POST",
            body: { email, password, remember_me: rememberMe }
        });

        if (response.success) {
            if (submitButton) {
                submitButton.textContent = "Đăng nhập thành công!";
            }
            
            showSuccess('Đăng nhập thành công! Đang chuyển hướng...');
            
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get("redirect") || "index.html";
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            const errorMessage = response.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.";
            showError(errorMessage);
            
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }

    } catch (error) {
        console.error("Login error:", error);
        
        showError("Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.");
        
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
}

/**
 * Xử lý gửi form đăng ký
 */
async function handleRegister() {
    const usernameInput = document.getElementById("register-username");
    const fullnameInput = document.getElementById("register-fullname");
    const emailInput = document.getElementById("register-email");
    const passwordInput = document.getElementById("register-password");
    
    const username = usernameInput.value.trim();
    const fullname = fullnameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    const submitButton = document.querySelector("#register-form .auth-submit-btn");
    
    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Đang đăng ký...";
        }
        
        const response = await fetchApi("/auth.php?action=register", {
            method: "POST",
            body: {
                username: username,
                full_name: fullname,
                email: email,
                password: password
            }
        });

        if (response.success) {
            showSuccess('Đăng ký thành công! Đang chuyển hướng...');
            
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get("redirect") || "index.html";
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            if (response.status === 409 && response.message) {
                if (response.message.includes('Username')) {
                    showError("Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.");
                } else if (response.message.includes('Email')) {
                    showError("Email đã được sử dụng. Vui lòng chọn email khác.");
                } else {
                    showError(response.message);
                }
            } else {
                showError(response.message || "Đăng ký thất bại. Vui lòng thử lại.");
            }

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Đăng ký";
            }
        }
    } catch (error) {
        console.error("Registration error:", error);
        
        showError("Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.");
        
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Đăng ký";
        }
    }
}

/**
 * Thiết lập modal quên mật khẩu
 */
function setupForgotPasswordModal() {
    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const closeModalButtons = document.querySelectorAll('#forgot-password-modal .close-modal, #cancel-forgot-password');
    const forgotPasswordForm = document.getElementById('forgot-password-form');

    console.log('Setting up forgot password modal...', {
        forgotPasswordLink,
        forgotPasswordModal,
        closeModalButtons: closeModalButtons.length
    });

    // Mở modal khi click link quên mật khẩu
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Forgot password link clicked');
            if (forgotPasswordModal) {
                forgotPasswordModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    } else {
        console.warn('Forgot password link not found');
    }

    // Đóng modal khi click nút đóng
    if (closeModalButtons && closeModalButtons.length > 0) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (forgotPasswordModal) {
                    forgotPasswordModal.style.display = 'none';
                    document.body.style.overflow = '';
                    if (forgotPasswordForm) forgotPasswordForm.reset();
                    clearMessages('forgot-password');
                }
            });
        });
    }

    // Đóng modal khi click bên ngoài
    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', (e) => {
            if (e.target === forgotPasswordModal) {
                forgotPasswordModal.style.display = 'none';
                document.body.style.overflow = '';
                if (forgotPasswordForm) forgotPasswordForm.reset();
                clearMessages('forgot-password');
            }
        });
    }

    // Xử lý gửi form
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('forgot-email').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-new-password').value;
            const errorDiv = document.getElementById('forgot-password-error');
            const successDiv = document.getElementById('forgot-password-success');
            
            clearMessages('forgot-password');
            
            if (!email || !newPassword || !confirmPassword) {
                if (window.showError) window.showError('Vui lòng điền đầy đủ thông tin.');
                return;
            }
            
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                if (window.showError) window.showError('Email không hợp lệ.');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                if (window.showError) window.showError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
                return;
            }
            
            if (newPassword.length < 8) {
                if (window.showError) window.showError('Mật khẩu mới phải có ít nhất 8 ký tự.');
                return;
            }
            
            if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
                if (window.showError) window.showError('Mật khẩu mới phải có chữ hoa, chữ thường và số.');
                return;
            }
            
            try {
                const response = await fetch('/src/api/auth.php?action=reset_password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });
                
                const result = await response.json();
                
                if (result && result.success) {
                    if (window.showSuccess) {
                        window.showSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.');
                    }
                    setTimeout(() => {
                        forgotPasswordModal.style.display = 'none';
                        document.body.style.overflow = '';
                        forgotPasswordForm.reset();
                        clearMessages('forgot-password');
                    }, 2000);
                } else {
                    if (window.showError) window.showError(result.message || 'Không thể đặt lại mật khẩu.');
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                if (window.showError) window.showError('Đã xảy ra lỗi khi đặt lại mật khẩu.');
            }
        });
    }
}

/**
 * Kiểm tra tham số redirect trong URL
 */
function checkRedirectParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");
    const message = urlParams.get("message");
    
    // Hiển thị thông báo dựa trên message parameter
    if (message === "login_required") {
        setTimeout(() => {
            showWarning("Bạn phải đăng nhập để truy cập trang tạo bài đăng!");
        }, 500);
    } else if (message === "profile_login_required") {
        setTimeout(() => {
            showWarning("Bạn phải đăng nhập để xem hồ sơ cá nhân!");
        }, 500);
    }
    
    if (redirectUrl) {
        const authContainer = document.querySelector(".auth-container");
        
        if (authContainer) {
            const redirectMessage = document.createElement("div");
            redirectMessage.className = "redirect-message";
            
            let messageText = "Vui lòng đăng nhập hoặc đăng ký để tiếp tục.";
            if (message === "login_required") {
                messageText = "Bạn cần đăng nhập để tạo bài viết mới.";
            } else if (message === "profile_login_required") {
                messageText = "Bạn cần đăng nhập để xem hồ sơ cá nhân.";
            }
            
            redirectMessage.textContent = messageText;
            redirectMessage.style.color = "#e67e22";
            redirectMessage.style.marginBottom = "15px";
            redirectMessage.style.textAlign = "center";
            redirectMessage.style.backgroundColor = "#fff3cd";
            redirectMessage.style.border = "1px solid #ffeaa7";
            redirectMessage.style.borderRadius = "8px";
            redirectMessage.style.padding = "12px 16px";
            
            authContainer.insertBefore(redirectMessage, authContainer.firstChild);
        }
    }
}

/**
 * Kiểm tra trạng thái xác thực - Xác định người dùng đã đăng nhập hay chưa
 */
function checkAuthStatus() {
    const userToken = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    
    return !!(userToken && userData);
}

/**
 * Lấy dữ liệu người dùng hiện tại - Trả về thông tin user đã đăng nhập
 */
function getCurrentUser() {
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }
    return null;
}

/**
 * Kiểm tra trạng thái đăng nhập qua API và trả về dữ liệu người dùng nếu đã đăng nhập
 * @returns {Promise<Object|null>} - Dữ liệu người dùng nếu đã đăng nhập, null nếu chưa
 */
async function checkLoginStatus() {
    try {
        const response = await fetchApi("/auth.php?action=status"); 
        if (response && response.success && response.data && response.data.authenticated) {
            console.log("User is logged in:", response.data.user);
            return response.data.user;
        } else {
            console.log("User is not logged in.");
            return null;
        }
    } catch (error) {
        console.error("Error checking login status:", error);
        return null;
    }
}

// Xuất các hàm ra phạm vi toàn cục để các file khác sử dụng
window.checkLoginStatus = checkLoginStatus;
window.checkAuthStatus = checkAuthStatus;
window.getCurrentUser = getCurrentUser;
window.logout = logout;
window.updateAuthUI = updateAuthUI;
window.requireAuth = requireAuth;

/**
 * Đăng xuất người dùng và xóa dữ liệu session
 */
async function logout() {
    try {
        await fetchApi("/auth.php?action=logout", {
            method: "POST"
        });
    } catch (error) {
        console.error('Logout API error:', error);
    } finally {
        clearAuthData();
        
        if (!window.location.pathname.includes('login-register.html')) {
            window.location.href = 'login-register.html';
        }
    }
}

/**
 * Xóa dữ liệu xác thực khỏi storage - Dọn dẹp khi đăng xuất
 */
function clearAuthData() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');
    
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userSession');
    
    // Xóa dữ liệu specific của user
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('helpful_reviews_')) {
            localStorage.removeItem(key);
        }
    });
}

/**
 * Cập nhật các thành phần UI phụ thuộc vào xác thực - Hiển thị/ẩn element theo trạng thái đăng nhập
 */
function updateAuthUI() {
    const isLoggedIn = checkAuthStatus();
    const user = getCurrentUser();
    
    const authRequiredElements = document.querySelectorAll('.auth-required');
    const guestOnlyElements = document.querySelectorAll('.guest-only');
    const userDisplayElements = document.querySelectorAll('.user-display');

    if (isLoggedIn && user) {
        authRequiredElements.forEach(el => {
            el.style.display = 'block';
        });
        
        guestOnlyElements.forEach(el => {
            el.style.display = 'none';
        });
        
        userDisplayElements.forEach(el => {
            updateUserDisplayElement(el, user);
        });
        
    } else {
        authRequiredElements.forEach(el => {
            el.style.display = 'none';
        });
        
        guestOnlyElements.forEach(el => {
            el.style.display = 'block';
        });
    }
}

/**
 * Cập nhật thành phần hiển thị người dùng với dữ liệu user - Điền thông tin user vào UI
 */
function updateUserDisplayElement(element, user) {
    if (!user) return;

    const userNameElement = element.querySelector('.user-name');
    const userAvatarElement = element.querySelector('.user-avatar');
    const userEmailElement = element.querySelector('.user-email');

    if (userNameElement) {
        userNameElement.textContent = user.full_name || user.username || 'User';
    }

    if (userEmailElement) {
        userEmailElement.textContent = user.email || '';
    }

    if (userAvatarElement) {
        updateUserAvatar(userAvatarElement, user);
    }
}

/**
 * Cập nhật avatar người dùng - Hiển thị ảnh đại diện hoặc tạo avatar fallback
 */
function updateUserAvatar(avatarElement, user) {
    if (!user) return;

    const { profile_picture, username, full_name } = user;
    const displayName = full_name || username || 'User';

    if (profile_picture) {
        avatarElement.innerHTML = `<img src="images/profiles/${profile_picture}" alt="${displayName}" class="avatar-img" 
                                   onerror="this.parentNode.innerHTML = Avatar.createFallbackHTML('${displayName}', '40px')">`;
    } else {
        avatarElement.innerHTML = Avatar.createFallbackHTML(displayName, '40px');
    }
}

/**
 * Yêu cầu xác thực (chuyển hướng nếu chưa xác thực) - Bảo vệ trang cần đăng nhập
 */
function requireAuth(redirectUrl = null) {
    if (!checkAuthStatus()) {
        const currentUrl = encodeURIComponent(window.location.href);
        const loginUrl = redirectUrl || `login-register.html?redirect=${currentUrl}`;
        window.location.href = loginUrl;
        return false;
    }
    return true;
}

/**
 * Hàm hỗ trợ xóa thông báo lỗi/thành công - Dọn dẹp message hiển thị trong modal
 */
function clearMessages(prefix) {
    const errorDiv = document.getElementById(`${prefix}-error`);
    const successDiv = document.getElementById(`${prefix}-success`);
    if (errorDiv) errorDiv.textContent = '';
    if (successDiv) successDiv.textContent = '';
}

