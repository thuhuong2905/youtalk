// JavaScript for authentication page functionality
// Handles login and registration form interactions

document.addEventListener("DOMContentLoaded", function() {
    // Initialize auth page
    initAuthPage();
});

/**
 * Initialize the authentication page functionality
 */
function initAuthPage() {
    // Set up tab switching
    setupAuthTabs();

    // Set up form validation
    setupFormValidation();

    // Set up password visibility toggle
    setupPasswordToggle();

    // Set up forgot password modal
    setupForgotPasswordModal();

    // Check for redirect parameter
    checkRedirectParam();
}

/**
 * Set up authentication tabs (login/register)
 */
function setupAuthTabs() {
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");
    const loginFormContainer = document.getElementById("login-form-container");
    const registerFormContainer = document.getElementById("register-form-container");
    const switchToRegisterLink = document.getElementById("switch-to-register");
    const switchToLoginLink = document.getElementById("switch-to-login");

    function showLogin() {
        loginTab.classList.add("active");
        registerTab.classList.remove("active");
        loginFormContainer.classList.add("active");
        registerFormContainer.classList.remove("active");
    }

    function showRegister() {
        registerTab.classList.add("active");
        loginTab.classList.remove("active");
        registerFormContainer.classList.add("active");
        loginFormContainer.classList.remove("active");
    }

    if (loginTab && registerTab && loginFormContainer && registerFormContainer) {
        // Set up login tab click
        loginTab.addEventListener("click", showLogin);

        // Set up register tab click
        registerTab.addEventListener("click", showRegister);

        // Set up switch links
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

        // Check URL for tab parameter
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get("tab");

        if (tab === "register") {
            // Activate register tab
            showRegister();
        } else {
            // Default to login tab
            showLogin();
        }
    }
}

/**
 * Set up password visibility toggle functionality
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
 * Set up form validation for login and register forms
 */
function setupFormValidation() {
    // Login form validation
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Get form inputs
            const emailInput = document.getElementById("login-email");
            const passwordInput = document.getElementById("login-password");
            const errorContainer = loginForm.querySelector(".form-error-container");
            
            // Reset error messages
            if (errorContainer) {
                errorContainer.textContent = "";
                errorContainer.style.display = "none";
            }
            
            // Validate username/email
            if (!emailInput.value.trim()) {
                showFormError(errorContainer, "Vui lòng nhập tên đăng nhập hoặc email");
                emailInput.focus();
                return;
            }
            // Nếu có ký tự @ thì kiểm tra định dạng email, còn lại thì cho phép là username
            const value = emailInput.value.trim();
            if (value.includes("@")) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    showFormError(errorContainer, "Vui lòng nhập email hợp lệ");
                    emailInput.focus();
                    return;
                }
            }
            
            // Validate password
            if (!passwordInput.value.trim()) {
                showFormError(errorContainer, "Vui lòng nhập mật khẩu");
                passwordInput.focus();
                return;
            }
            
            // If validation passes, submit the form
            handleLogin();
        });
    }
    
    // Register form validation
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Lấy các input
            const usernameInput = document.getElementById("register-username");
            const fullnameInput = document.getElementById("register-fullname");
            const emailInput = document.getElementById("register-email");
            const passwordInput = document.getElementById("register-password");
            const confirmPasswordInput = document.getElementById("register-confirm-password");
            const termsCheckbox = document.getElementById("terms");
            const errorContainer = registerForm.querySelector(".form-error-container");

            // Reset lỗi
            if (errorContainer) {
                errorContainer.textContent = "";
                errorContainer.style.display = "none";
            }

            // Kiểm tra họ và tên
            if (!fullnameInput.value.trim()) {
                showFormError(errorContainer, "Vui lòng nhập họ và tên");
                fullnameInput.focus();
                return;
            }

            // Kiểm tra tên đăng nhập
            if (!usernameInput.value.trim()) {
                showFormError(errorContainer, "Vui lòng nhập tên đăng nhập");
                usernameInput.focus();
                return;
            }
            const usernameRegex = /^[a-zA-Z0-9_]+$/;
            if (!usernameRegex.test(usernameInput.value.trim())) {
                showFormError(errorContainer, "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới");
                usernameInput.focus();
                return;
            }

            // Kiểm tra email
            if (!emailInput.value.trim()) {
                showFormError(errorContainer, "Vui lòng nhập email");
                emailInput.focus();
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                showFormError(errorContainer, "Vui lòng nhập email hợp lệ");
                emailInput.focus();
                return;
            }

            // Kiểm tra mật khẩu
            if (!passwordInput.value.trim()) {
                showFormError(errorContainer, "Vui lòng nhập mật khẩu");
                passwordInput.focus();
                return;
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passwordRegex.test(passwordInput.value.trim())) {
                showFormError(errorContainer, "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số");
                passwordInput.focus();
                return;
            }

            // Kiểm tra xác nhận mật khẩu
            if (!confirmPasswordInput.value.trim()) {
                showFormError(errorContainer, "Vui lòng xác nhận mật khẩu");
                confirmPasswordInput.focus();
                return;
            }
            if (passwordInput.value.trim() !== confirmPasswordInput.value.trim()) {
                showFormError(errorContainer, "Mật khẩu xác nhận không khớp");
                confirmPasswordInput.focus();
                return;
            }

            // Kiểm tra đồng ý điều khoản
            if (!termsCheckbox.checked) {
                showFormError(errorContainer, "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư");
                termsCheckbox.focus();
                return;
            }

            // Nếu hợp lệ thì gửi form
            handleRegister();
        });
    }
}

/**
 * Show error message in form error container
 * 
 * @param {HTMLElement} container - The error container element
 * @param {string} message - The error message to display
 */
function showFormError(container, message) {
    // Use toast notification instead of form container
    showError(message);
    
    // Still update container for fallback
    if (container) {
        container.textContent = message;
        container.style.display = "block";
    }
}

/**
 * Handle login form submission
 */
async function handleLogin() {
    // Get form inputs
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const rememberMeCheckbox = document.getElementById("remember-me");
    const errorContainer = document.querySelector("#login-form .form-error-container");
    
    // Get input values
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
    
    try {
        // Disable form submission
        const submitButton = document.querySelector("#login-form .auth-submit-btn");
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Đăng nhập thành công!";
        }
        
        // Make API request - Corrected endpoint path (removed /src/api prefix)
        const response = await fetchApi("/auth.php?action=login", {
            method: "POST",
            body: { email, password, remember_me: rememberMe }
        });

        // Handle response
        if (response.success) {
            showSuccess('Đăng nhập thành công! Đang chuyển hướng...');
            
            // Get redirect URL from query parameter or default to homepage
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get("redirect") || "index.html";
            
            // Redirect to specified page after short delay
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            // Show error message
            showError(response.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.");
            // Re-enable form submission
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Đăng nhập";
            }
        }

    } catch (error) {
        console.error("Login error:", error);
        
        // Show error message
        showError("Tên đăng nhập/email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.");
        
        // Re-enable form submission
        const submitButton = document.querySelector("#login-form .auth-submit-btn");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Đăng nhập";
        }
    }
}

/**
 * Handle register form submission
 */
async function handleRegister() {
    // Get form inputs
    const usernameInput = document.getElementById("register-username");
    const fullnameInput = document.getElementById("register-fullname");
    const emailInput = document.getElementById("register-email");
    const passwordInput = document.getElementById("register-password");
    const errorContainer = document.querySelector("#register-form .form-error-container");
    
    // Get input values
    const username = usernameInput.value.trim();
    const fullname = fullnameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    try {
        // Disable form submission
        const submitButton = document.querySelector("#register-form .auth-submit-btn");
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Đang đăng ký...";
        }
        
        // Make API request - Corrected endpoint path (removed /src/api prefix)
        const response = await fetchApi("/auth.php?action=register", {
            method: "POST",
            body: {
                username: username,
                full_name: fullname,
                email: email,
                password: password
            }
        });

        // Handle response
        if (response.success) {
            showSuccess('Đăng ký thành công! Đang chuyển hướng...');
            
            // Get redirect URL from query parameter or default to homepage
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get("redirect") || "index.html";
            
            // Redirect to specified page after short delay
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            // Xử lý lỗi 409: tên đăng nhập hoặc email đã tồn tại
            if (response.status === 409 && response.message) {
                if (response.message.includes('Username')) {
                    showError("Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.");
                } else if (response.message.includes('Email')) {
                    showError("Email đã được sử dụng. Vui lòng chọn email khác.");
                } else {
                    showError(response.message);
                }
            } else {
                // Show error message mặc định
                showError(response.message || "Đăng ký thất bại. Vui lòng thử lại.");
            }

            // Re-enable form submission
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Đăng ký";
            }
        }
    } catch (error) {
        console.error("Registration error:", error);
        
        // Show error message
        showError("Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.");
        
        // Re-enable form submission
        const submitButton = document.querySelector("#register-form .auth-submit-btn");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Đăng ký";
        }
    }
}

/**
 * Set up forgot password modal functionality
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

    // Open modal when forgot password link is clicked
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Forgot password link clicked');
            if (forgotPasswordModal) {
                forgotPasswordModal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
            }
        });
    } else {
        console.warn('Forgot password link not found');
    }

    // Close modal when close buttons are clicked
    if (closeModalButtons && closeModalButtons.length > 0) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (forgotPasswordModal) {
                    forgotPasswordModal.style.display = 'none';
                    document.body.style.overflow = ''; // Restore scrolling
                    // Clear form
                    if (forgotPasswordForm) forgotPasswordForm.reset();
                    clearMessages('forgot-password');
                }
            });
        });
    }

    // Close modal when clicking outside
    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', (e) => {
            if (e.target === forgotPasswordModal) {
                forgotPasswordModal.style.display = 'none';
                document.body.style.overflow = ''; // Restore scrolling
                if (forgotPasswordForm) forgotPasswordForm.reset();
                clearMessages('forgot-password');
            }
        });
    }

    // Handle form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('forgot-email').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-new-password').value;
            const errorDiv = document.getElementById('forgot-password-error');
            const successDiv = document.getElementById('forgot-password-success');
            
            // Clear previous messages
            clearMessages('forgot-password');
            
            // Basic validation
            if (!email || !newPassword || !confirmPassword) {
                showError('Vui lòng điền đầy đủ thông tin.');
                return;
            }
            
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                showError('Email không hợp lệ.');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
                return;
            }
            
            if (newPassword.length < 8) {
                showError('Mật khẩu mới phải có ít nhất 8 ký tự.');
                return;
            }
            
            // Enhanced password validation
            if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
                showError('Mật khẩu mới phải có chữ hoa, chữ thường và số.');
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
                    showSuccess('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.');
                    setTimeout(() => {
                        forgotPasswordModal.style.display = 'none';
                        document.body.style.overflow = ''; // Restore scrolling
                        forgotPasswordForm.reset();
                        clearMessages('forgot-password');
                    }, 2000);
                } else {
                    showError(result.message || 'Không thể đặt lại mật khẩu.');
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                showError('Đã xảy ra lỗi khi đặt lại mật khẩu.');
            }
        });
    }
}

/**
 * Check for redirect parameter in URL
 */
function checkRedirectParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");
    
    if (redirectUrl) {
        // Add message about redirect
        const authContainer = document.querySelector(".auth-container");
        
        if (authContainer) {
            const redirectMessage = document.createElement("div");
            redirectMessage.className = "redirect-message";
            redirectMessage.textContent = "Vui lòng đăng nhập hoặc đăng ký để tiếp tục.";
            redirectMessage.style.color = "#e67e22";
            redirectMessage.style.marginBottom = "15px";
            redirectMessage.style.textAlign = "center";
            
            authContainer.insertBefore(redirectMessage, authContainer.firstChild);
        }
    }
}

// Check authentication status
function checkAuthStatus() {
    // Check if there's a user session/token
    const userToken = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    
    // Return true if user is logged in
    return !!(userToken && userData);
}

// Get current user data
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
 * Check user login status via API and return user data if logged in.
 * @returns {Promise<Object|null>} - User data object if logged in, null otherwise.
 */
async function checkLoginStatus() {
    try {
        // Use fetchApi which is already defined and handles base URL
        // Corrected endpoint path (removed /src/api prefix)
        const response = await fetchApi("/auth.php?action=status"); 
        if (response && response.success && response.data && response.data.authenticated) {
            console.log("User is logged in:", response.data.user);
            return response.data.user; // Return user data object if logged in
        } else {
            console.log("User is not logged in.");
            return null; // Return null if not logged in or error
        }
    } catch (error) {
        console.error("Error checking login status:", error);
        return null; // Return null on error
    }
}

// Expose the function globally so other scripts like main.js can call it
window.checkLoginStatus = checkLoginStatus;
window.checkAuthStatus = checkAuthStatus;
window.getCurrentUser = getCurrentUser;
window.logout = logout;
window.updateAuthUI = updateAuthUI;
window.requireAuth = requireAuth;

/**
 * Logout user and clear session data
 */
async function logout() {
    try {
        // Call backend logout API
        await fetchApi("/auth.php?action=logout", {
            method: "POST"
        });
    } catch (error) {
        console.error('Logout API error:', error);
    } finally {
        // Always clear local authentication data
        clearAuthData();
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('login-register.html')) {
            window.location.href = 'login-register.html';
        }
    }
}

/**
 * Clear authentication data from storage
 */
function clearAuthData() {
    // Clear all possible authentication keys
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');
    
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userSession');
}

/**
 * Update authentication-dependent UI elements
 */
function updateAuthUI() {
    const isLoggedIn = checkAuthStatus();
    const user = getCurrentUser();
    
    // Update authentication-dependent elements
    const authRequiredElements = document.querySelectorAll('.auth-required');
    const guestOnlyElements = document.querySelectorAll('.guest-only');
    const userDisplayElements = document.querySelectorAll('.user-display');

    if (isLoggedIn && user) {
        // Show authenticated elements
        authRequiredElements.forEach(el => {
            el.style.display = 'block';
        });
        
        // Hide guest-only elements
        guestOnlyElements.forEach(el => {
            el.style.display = 'none';
        });
        
        // Update user display elements
        userDisplayElements.forEach(el => {
            updateUserDisplayElement(el, user);
        });
        
    } else {
        // Hide authenticated elements
        authRequiredElements.forEach(el => {
            el.style.display = 'none';
        });
        
        // Show guest-only elements
        guestOnlyElements.forEach(el => {
            el.style.display = 'block';
        });
    }
}

/**
 * Update user display element with user data
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
 * Update user avatar element
 */
function updateUserAvatar(avatarElement, user) {
    if (!user) return;

    const { profile_picture, username, full_name } = user;
    const displayName = full_name || username || 'User';

    if (profile_picture) {
        // If profile picture exists, show image with error handling
        avatarElement.innerHTML = `<img src="images/profiles/${profile_picture}" alt="${displayName}" class="avatar-img" 
                                   onerror="this.parentNode.innerHTML = Avatar.createFallbackHTML('${displayName}', '40px')">`;
    } else {
        // If no profile picture, use Avatar fallback directly
        avatarElement.innerHTML = Avatar.createFallbackHTML(displayName, '40px');
    }
}

/**
 * Require authentication (redirect if not authenticated)
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
 * Helper function to clear error/success messages
 */
function clearMessages(prefix) {
    const errorDiv = document.getElementById(`${prefix}-error`);
    const successDiv = document.getElementById(`${prefix}-success`);
    if (errorDiv) errorDiv.textContent = '';
    if (successDiv) successDiv.textContent = '';
}

/**
 * Helper function to show error message
 */
function showError(prefix, message) {
    const errorDiv = document.getElementById(`${prefix}-error`);
    if (errorDiv) errorDiv.textContent = message;
}

/**
 * Helper function to show success message
 */
function showSuccess(prefix, message) {
    const successDiv = document.getElementById(`${prefix}-success`);
    if (successDiv) successDiv.textContent = message;
}

