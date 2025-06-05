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
    if (container) {
        container.textContent = message;
        container.style.display = "block";
    } else {
        alert(message);
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
            // Get redirect URL from query parameter or default to homepage
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get("redirect") || "index.html";
            
            // Redirect to specified page
            window.location.href = redirectUrl;
        } else {
            // Show error message
            showFormError(errorContainer, response.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.");
            // Re-enable form submission
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Đăng nhập";
            }
        }

    } catch (error) {
        console.error("Login error:", error);
        
        // Show error message
        showFormError(errorContainer, "Tên đăng nhập/email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.");
        
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
            // Get redirect URL from query parameter or default to homepage
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get("redirect") || "index.html";
            
            // Redirect to specified page
            window.location.href = redirectUrl;
        } else {
            // Xử lý lỗi 409: tên đăng nhập hoặc email đã tồn tại
            if (response.status === 409 && response.message) {
                if (response.message.includes('Username')) {
                    showFormError(errorContainer, "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.");
                } else if (response.message.includes('Email')) {
                    showFormError(errorContainer, "Email đã được sử dụng. Vui lòng chọn email khác.");
                } else {
                    showFormError(errorContainer, response.message);
                }
            } else {
                // Show error message mặc định
                showFormError(errorContainer, response.message || "Đăng ký thất bại. Vui lòng thử lại.");
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
        showFormError(errorContainer, "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.");
        
        // Re-enable form submission
        const submitButton = document.querySelector("#register-form .auth-submit-btn");
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Đăng ký";
        }
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

