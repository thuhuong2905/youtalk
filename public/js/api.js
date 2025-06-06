// JavaScript for API interactions
// Centralized utility for making API calls to the backend

/**
 * Base API URL - Change this to match your backend API endpoint
 */
const API_BASE_URL = '/src/api/';

/**
 * Make an API request to the backend
 * 
 * @param {string} endpoint - The API endpoint to call (e.g., auth.php?action=login). Should NOT include the base path.
 * @param {Object} options - Request options (method, body, headers, etc.)
 * @returns {Promise<Object>} - The API response data or throws an error on failure.
 */
async function fetchApi(endpoint, options = {}) {
    // ✅ FIXED: Logic xử lý endpoint đơn giản hơn và an toàn hơn
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    if (cleanEndpoint.startsWith('src/api/')) {
        cleanEndpoint = cleanEndpoint.replace('src/api/', '');
    }
    
    // Construct the full URL
    const fullUrl = API_BASE_URL + cleanEndpoint;
    
    console.log(`fetchApi called. URL: ${fullUrl}, Options:`, options); // Log the constructed URL
    
    try {
        // Set default options
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' // Explicitly accept JSON
            },
            credentials: 'include' // Include cookies for session management
        };
        
        // Merge with provided options
        const requestOptions = { ...defaultOptions, ...options };

        // Ensure headers are merged correctly if provided in options
        if (options.headers) {
            requestOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }
        
        // Convert body to JSON string if it exists and is an object
        if (requestOptions.body && typeof requestOptions.body === 'object') {
            requestOptions.body = JSON.stringify(requestOptions.body);
        }
        
        // Make the request
        const response = await fetch(fullUrl, requestOptions);
        
        // Check if the response status indicates success (e.g., 2xx)
        if (!response.ok) {
            // Attempt to read error details from the response body if possible
            let errorBody = '';
            try {
                errorBody = await response.text(); // Read as text first
                console.error(`API request failed with status ${response.status}. Response body:`, errorBody);
            } catch (e) {
                console.error(`API request failed with status ${response.status}. Could not read response body.`);
            }
            // Use fullUrl in the error message for clarity
            throw new Error(`API request failed: ${response.status} ${response.statusText}. Endpoint: ${fullUrl}`);
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
             const responseText = await response.text(); // Get text for debugging
             console.error('API did not return JSON. Content-Type:', contentType, 'Response Text:', responseText); // Log non-JSON response
             // Use fullUrl in the error message
             throw new Error(`API response was not JSON. Endpoint: ${fullUrl}. Received: ${contentType}`);
        }
        
        // Parse JSON response
        const data = await response.json();
        console.log(`API Response for ${cleanEndpoint}:`, data); // Log successful response data
        
        // Return the data
        return data;

    } catch (error) {
        // Log the error and re-throw it so calling functions can handle it
        // Use fullUrl in the error message
        console.error(`API request error for endpoint ${fullUrl}:`, error);
        // Add a specific error message if fetch itself failed (e.g., network error)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             throw new Error(`Network error or CORS issue when fetching ${fullUrl}. Check network connection and server configuration.`);
        }
        // Re-throw the original error or a new one wrapping it
        throw error; // Re-throwing allows individual loaders to handle errors
    }
}

// API Interface
const api = {
    // Forum related APIs
    loadTopics: async function(params) {
        return await fetchApi(`posts.php?action=get_topics`, {
            method: 'GET',
            body: params
        });
    },
    
    loadHotTopics: async function(limit = 5) {
        return await fetchApi(`posts.php?action=list_hot&limit=${limit}`);
    },
    
    loadActiveUsers: async function() {
        return await fetchApi('users.php?action=get_active_users');
    },
    
    // Category related APIs
    loadCategories: async function() {
        return await fetchApi('categories.php?action=get_all');
    },
    
    // Post related APIs
    createPost: async function(postData) {
        return await fetchApi('posts.php?action=create', {
            method: 'POST',
            body: postData
        });
    }
};

// Export API interface to global scope
if (typeof window !== 'undefined') {
    window.api = api;
}

// Export fetchApi as well for direct use if needed
if (typeof window !== 'undefined') {
    window.fetchApi = fetchApi;
}