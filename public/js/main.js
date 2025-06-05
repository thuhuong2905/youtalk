// JavaScript for main functionality
document.addEventListener("DOMContentLoaded", function () {
    // Initialize common page elements and functionality
    initializeMobileMenu();
    initializeDropdowns();
    initializeActiveNavHighlighting();
    initializeSmoothScroll();
    updateHeaderLoginStatus(); // Add this call to update header based on login status
});

/**
 * Get initials from a name string.
 * @param {string} name - The full name or username.
 * @returns {string} - The uppercase initial.
 */
function getInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '?';
    // Get the first letter of the first name part
    const targetPart = parts[0];
    return targetPart.charAt(0).toUpperCase();
}

/**
 * Replaces a broken image element with a fallback avatar showing the initial.
 * @param {HTMLImageElement} imageElement - The image element that failed to load.
 * @param {string} initial - The initial letter to display.
 * @param {string} bgColor - The background color for the avatar.
 */
function displayFallbackAvatar(imageElement, initial, bgColor) {
    try {
        if (!imageElement || !imageElement.parentNode) {
            console.error("Cannot display fallback avatar: Invalid image element or parent.");
            return;
        }

        const fallbackDiv = document.createElement('div');
        // Use class for styling, similar to home.js if applicable
        fallbackDiv.className = 'user-avatar-fallback user-avatar-header'; // Added user-avatar-header for specific styling
        fallbackDiv.style.backgroundColor = bgColor;
        fallbackDiv.textContent = initial;

        // Replace the broken image element with the fallback div
        imageElement.parentNode.replaceChild(fallbackDiv, imageElement);
        console.log("Replaced broken header avatar with fallback initial.");

    } catch (error) {
        console.error("Error in displayFallbackAvatar:", error);
        // Optional: Add a very basic text fallback if div creation fails
        if (imageElement && imageElement.parentNode) {
             const fallbackText = document.createTextNode(initial || '?');
             imageElement.parentNode.replaceChild(fallbackText, imageElement);
        }
    }
}


/**
 * Initialize mobile menu toggle functionality
 */
function initializeMobileMenu() {
    const hamburger = document.querySelector(".hamburger");
    const mainNav = document.querySelector(".main-nav");

    if (hamburger && mainNav) {
        hamburger.addEventListener("click", function () {
            mainNav.classList.toggle("active");
        });

        // Close mobile menu when clicking outside
        document.addEventListener("click", function (e) {
            if (mainNav.classList.contains("active")) {
                if (!mainNav.contains(e.target) && e.target !== hamburger) {
                    mainNav.classList.remove("active");
                }
            }
        });
    }
}

/**
 * Initialize dropdown menu functionality (hover for desktop, click for mobile)
 */
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll(".dropdown");

    // Ensure dropdown menus are initially hidden
    const allDropdownMenus = document.querySelectorAll(".dropdown-menu");
    allDropdownMenus.forEach((menu) => {
        menu.style.display = "none";
    });

    if (window.innerWidth <= 768) {
        // Mobile: Click to toggle dropdown
        dropdowns.forEach((dropdown) => {
            const link = dropdown.querySelector("a");
            const menu = dropdown.querySelector(".dropdown-menu");

            if (link && menu) {
                link.addEventListener("click", function (e) {
                    // Allow navigation if it's not just a dropdown toggle
                    if (link.getAttribute("href") === "#" || link.getAttribute("href") === "") {
                         e.preventDefault();
                    }
                    // Toggle open state
                    const currentlyOpen = dropdown.classList.contains("open");
                    // Close other open dropdowns
                    dropdowns.forEach(d => d.classList.remove("open"));
                    // Toggle current dropdown
                    if (!currentlyOpen) {
                        dropdown.classList.add("open");
                        menu.style.display = "block"; // Ensure display is block when opening
                    } else {
                         menu.style.display = "none"; // Ensure display is none when closing
                    }
                });
            }
        });
         // Close dropdowns when clicking outside on mobile
        document.addEventListener("click", (e) => {
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove("open");
                     const menu = dropdown.querySelector(".dropdown-menu");
                     if(menu) menu.style.display = "none";
                }
            });
        });

    } else {
        // Desktop: Hover to show/hide dropdown
        dropdowns.forEach((dropdown) => {
            const menu = dropdown.querySelector(".dropdown-menu");
            if (menu) {
                dropdown.addEventListener("mouseenter", () => {
                    menu.style.display = "block";
                });
                dropdown.addEventListener("mouseleave", () => {
                    menu.style.display = "none";
                });
            }
        });
    }
}

/**
 * Highlight the active navigation link based on the current URL
 */
function initializeActiveNavHighlighting() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".main-nav a");

    navLinks.forEach((link) => {
        const linkPath = link.getAttribute("href");
        // Normalize paths for comparison
        const normalizedCurrentPath = currentPath.endsWith("/") ? currentPath + "index.html" : currentPath;
        const normalizedLinkPath = linkPath;

        // Clear existing active class
        link.parentElement.classList.remove("active");

        if (normalizedLinkPath && normalizedCurrentPath.endsWith(normalizedLinkPath) && normalizedLinkPath !== "#") {
             // Handle exact match or ending match for pages like index.html
             if (normalizedLinkPath === "index.html" && !normalizedCurrentPath.endsWith("index.html")) {
                 // Don't highlight index.html if not on the root path
             } else {
                link.parentElement.classList.add("active");
             }
        } 
    });
     // Special case for root path highlighting index.html
     if (currentPath === "/" || currentPath.endsWith("/index.html")) {
         const homeLink = document.querySelector(".main-nav a[href=\"index.html\"]");
         if (homeLink) {
             homeLink.parentElement.classList.add("active");
         }
     }
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScroll() {
    document.querySelectorAll("a[href^=\"#\"]").forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (targetId && targetId !== "#") {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Adjust for header height
                        behavior: "smooth",
                    });
                }
            }
        });
    });
}


/**
 * Check login status and update the header UI accordingly.
 */
async function updateHeaderLoginStatus() {
    const userActionsDiv = document.getElementById("user-actions");
    if (!userActionsDiv) return;

    try {
        // Check login status using the function from auth.js (returns user data or null)
        // Ensure checkLoginStatus is globally available or imported
        const userData = await window.checkLoginStatus(); 

        if (userData) {
            // User is logged in
            const fullName = userData.full_name || userData.username || 'Người dùng'; // Use full_name, fallback to username, then generic
            const profilePicture = userData.profile_picture;
            const firstInitial = getInitials(fullName); // Use getInitials function
            
            // Generate a simple color based on the initial for consistency
            const colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#03417F", "#7f8c8d"];
            const colorIndex = firstInitial.charCodeAt(0) % colors.length;
            const bgColor = colors[colorIndex];
            
            // Prepare fallback div HTML (used when no profile picture)
            const fallbackAvatarHtml = `<div class="user-avatar-fallback user-avatar-header" style="background-color: ${bgColor};">${firstInitial}</div>`;

            let avatarContainerContent; // Content for the <a> tag

            if (profilePicture && profilePicture.trim() !== '') {
                // User has a profile picture - Add onerror handler calling displayFallbackAvatar
                const escapedFullNameForAlt = fullName.replace(/"/g, '&quot;'); // Escape double quotes for alt attribute
                // MODIFIED onerror: Call displayFallbackAvatar with initial and color
                avatarContainerContent = `<img src="${encodeURI(profilePicture)}" alt="${escapedFullNameForAlt}" class="user-avatar-header" onerror="displayFallbackAvatar(this, '${firstInitial}', '${bgColor}')">`;
            } else {
                // User does not have a profile picture, use fallback div directly
                avatarContainerContent = fallbackAvatarHtml;
            }

            // Construct the final HTML for userActionsDiv
            userActionsDiv.innerHTML = `
                <div class="user-profile-header">
                    <a href="profile.html" class="user-avatar-link">
                        ${avatarContainerContent}
                    </a>
                    <div class="user-info-header">
                         <a href="profile.html" class="username-header">${fullName}</a>
                         <button id="logout-button" class="logout-button">Đăng xuất</button>
                    </div>
                </div>
                <a href="post-create.html" class="cta-button-header">Đăng bài ngay</a>
            `;

            // Add event listener for the logout button
            const logoutButton = document.getElementById("logout-button");
            if (logoutButton) {
                logoutButton.addEventListener("click", handleLogout);
            }
        } else {
            // User is not logged in - Ensure default links are shown
            userActionsDiv.innerHTML = `
                <a href="login-register.html" class="auth-link">Đăng nhập</a>
                <a href="post-create.html" class="cta-button-header">Đăng bài ngay</a>
            `;
        }
    } catch (error) {
        console.error("Error updating header login status:", error);
        // Optionally show default state or an error message in the header
        userActionsDiv.innerHTML = `
            <a href="login-register.html" class="auth-link">Đăng nhập</a>
            <a href="post-create.html" class="cta-button-header">Đăng bài ngay</a>
        `;
    }
}

/**
 * Handle user logout.
 */
async function handleLogout() {
    try {
        // Ensure fetchApi is globally available or imported
        const response = await fetchApi("auth.php?action=logout", { method: "POST" }); 
        if (response.success) {
            // Redirect to homepage or reload after successful logout
            window.location.href = "index.html"; 
        } else {
            console.error("Logout failed:", response.message);
            alert("Đăng xuất thất bại. Vui lòng thử lại.");
        }
    } catch (error) {
        console.error("Error during logout:", error);
        alert("Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại sau.");
    }
}

/**
 * Lấy tên hiển thị ưu tiên fullname, fallback sang username
 * @param {object} user
 * @returns {string}
 */
function getDisplayName(user) {
    if (!user) return "";
    return user.full_name && user.full_name.trim() ? user.full_name : user.username || "";
}

// Make sure helper functions like checkLoginStatus and fetchApi are defined globally or imported
// Example placeholder for checkLoginStatus if not defined elsewhere
if (typeof window.checkLoginStatus === 'undefined') {
    window.checkLoginStatus = async () => {
        try {
            const response = await fetchApi('/src/api/auth.php?action=status');
            return response.success && response.data.authenticated ? response.data.user : null;
        } catch (error) {
            console.error('Fallback checkLoginStatus failed:', error);
            return null;
        }
    };
}

// Example placeholder for fetchApi if not defined elsewhere
if (typeof window.fetchApi === 'undefined') {
    window.fetchApi = async (url, options = {}) => {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add other default headers if needed
            },
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        if (mergedOptions.body && typeof mergedOptions.body !== 'string') {
            mergedOptions.body = JSON.stringify(mergedOptions.body);
        }

        try {
            const response = await fetch(url, mergedOptions);
            if (!response.ok) {
                // Try to parse error message from response body
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Ignore if response body is not JSON
                }
                throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API call failed:', url, error);
            // Return a consistent error structure
            return { success: false, message: error.message || 'Network error or invalid response' };
        }
    };
}

