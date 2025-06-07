<?php
// Session Handler - Secure session management

// Force session save path for Windows XAMPP
ini_set('session.save_path', 'C:/xampp/tmp');

// Set secure session parameters
ini_set('session.cookie_httponly', 1); // Prevent JavaScript access to session cookie
ini_set('session.use_only_cookies', 1); // Force sessions to only use cookies
ini_set('session.cookie_secure', 0);    // Set to 1 if using HTTPS

// Set session name (MUST be called before session_start)
session_name('YOUTALK_SESSION');

// Start or resume the session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
    // Only log session details in debug mode or first time
    if (defined('DEBUG_SESSION') && ('DEBUG_SESSION')) {
        error_log('[Session Handler] Session started. Path: ' . session_save_path() . ', Status: ' . session_status() . ', ID: ' . session_id());
        error_log('[Session Handler] Current Session Data: ' . print_r($_SESSION, true));
        error_log('[Session Handler] Current Cookie Data: ' . print_r($_COOKIE, true));
    }
}


/**
 * Regenerates the session ID to help prevent session fixation attacks.
 * Should be called after login and periodically during user sessions.
 */
function regenerateSessionId() {
    if (session_status() == PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
        if (defined('DEBUG_SESSION') && ('DEBUG_SESSION')) {
            error_log('[Session Handler] Session ID regenerated. New ID: ' . session_id());
        }
    }
}

/**
 * Checks if a user is currently logged in.
 *
 * @return bool True if user is logged in, false otherwise.
 */
function isUserLoggedIn() {
    // Only log login check in debug mode to reduce spam
    $isLoggedIn = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    if (defined('DEBUG_SESSION') && ('DEBUG_SESSION')) {
        error_log('[Session Handler] Checking login status. User ID set: ' . (isset($_SESSION['user_id']) ? 'Yes' : 'No') . ', Not empty: ' . (!empty($_SESSION['user_id']) ? 'Yes' : 'No') . ', Result: ' . ($isLoggedIn ? 'Logged In' : 'Not Logged In'));
    }
    return $isLoggedIn;
}

/**
 * Gets the current user\'s ID from the session.
 *
 * @return int|null The user ID if logged in, null otherwise.
 */
function getCurrentUserId() {
    return isUserLoggedIn() ? $_SESSION['user_id'] : null;
}

/**
 * Destroys the current session and all associated data.
 * Used during logout process.
 */
function destroySession() {
    // If session is active
    if (session_status() == PHP_SESSION_ACTIVE) {
        // DEBUG LOG: Log before destroying session
        $sessionId = session_id();
        $sessionData = print_r($_SESSION, true);
        error_log('[Session Handler] Destroying session. ID: ' . $sessionId . ', Data: ' . $sessionData);

        // Clear all session variables
        $_SESSION = array();

        // If a session cookie exists, destroy it
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
             error_log('[Session Handler] Session cookie cleared.');
        }

        // Finally, destroy the session
        session_destroy();
        error_log('[Session Handler] Session destroyed.');
    } else {
         error_log('[Session Handler] Attempted to destroy session, but no active session found.');
    }
}
?>

