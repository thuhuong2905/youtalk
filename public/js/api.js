// Thư viện JavaScript cho các tương tác API
// Tiện ích tập trung để thực hiện các cuộc gọi API đến backend

/**
 * URL cơ sở cho API - Thay đổi để phù hợp với endpoint API backend
 */
const API_BASE_URL = '/src/api/';

/**
 * Thực hiện yêu cầu API đến backend
 */
async function fetchApi(endpoint, options = {}) {
    // Xử lý endpoint
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    if (cleanEndpoint.startsWith('src/api/')) {
        cleanEndpoint = cleanEndpoint.replace('src/api/', '');
    }
    
    // Tạo URL đầy đủ
    const fullUrl = API_BASE_URL + cleanEndpoint;
    
    console.log(`fetchApi called. URL: ${fullUrl}, Options:`, options);
    
    try {
        // Tùy chọn mặc định
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include' // Bao gồm cookies cho quản lý session
        };
        
        // Kết hợp với tùy chọn được cung cấp
        const requestOptions = { ...defaultOptions, ...options };

        // Đảm bảo headers được kết hợp đúng cách
        if (options.headers) {
            requestOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }
        
        // Chuyển đổi body thành JSON string nếu là object
        if (requestOptions.body && typeof requestOptions.body === 'object') {
            requestOptions.body = JSON.stringify(requestOptions.body);
        }
        
        // Thực hiện yêu cầu
        const response = await fetch(fullUrl, requestOptions);
        
        // Kiểm tra trạng thái phản hồi
        if (!response.ok) {
            // Cố gắng đọc chi tiết lỗi từ phản hồi
            let errorData = null;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    errorData = await response.json();
                    console.error(`Yêu cầu API thất bại với trạng thái ${response.status}. Lỗi:`, errorData);
                    // Trả về dữ liệu lỗi với thông tin trạng thái
                    return {
                        success: false,
                        status: response.status,
                        message: errorData.message || `${response.status} ${response.statusText}`,
                        ...errorData
                    };
                } else {
                    const errorBody = await response.text();
                    console.error(`Yêu cầu API thất bại với trạng thái ${response.status}. Nội dung:`, errorBody);
                }
            } catch (e) {
                console.error(`Yêu cầu API thất bại với trạng thái ${response.status}. Không thể đọc phản hồi:`, e);
            }
            
            // Trả về object lỗi thay vì ném lỗi
            return {
                success: false,
                status: response.status,
                message: `Yêu cầu API thất bại: ${response.status} ${response.statusText}`,
                data: null
            };
        }

        // Kiểm tra phản hồi có phải JSON không
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
             const responseText = await response.text();
             console.error('API không trả về JSON. Content-Type:', contentType, 'Nội dung:', responseText);
             throw new Error(`Phản hồi API không phải JSON. Endpoint: ${fullUrl}. Nhận được: ${contentType}`);
        }
        
        // Phân tích phản hồi JSON
        const data = await response.json();
        console.log(`Phản hồi API cho ${cleanEndpoint}:`, data);
        
        // Trả về dữ liệu
        return data;

    } catch (error) {
        // Ghi lỗi và ném lại để các hàm gọi có thể xử lý
        console.error(`Lỗi yêu cầu API cho endpoint ${fullUrl}:`, error);
        // Thêm thông báo lỗi cụ thể nếu fetch thất bại
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             throw new Error(`Lỗi mạng hoặc CORS khi truy cập ${fullUrl}. Kiểm tra kết nối và cấu hình server.`);
        }
        // Ném lại lỗi gốc
        throw error;
    }
}

// Giao diện API
const api = {
    // API liên quan đến diễn đàn
    loadTopics: async function(params) {
        return await fetchApi(`posts.php?action=get_topics`, {
            method: 'GET',
            body: params
        });
    },
    
    loadHotTopics: async function(limit = 5) {
        return await fetchApi(`posts.php?action=list_hot&limit=${limit}`);
    },
    
    loadActiveUsers: async function(limit = 5) {
        const response = await fetchApi(`users.php?action=get_active_users&limit=${limit}`);
        // Chuẩn hóa cấu trúc phản hồi
        if (response.success) {
            const normalizedData = {
                success: true,
                data: {}
            };
            
            // Trường hợp 1: Dữ liệu trong response.data.users
            if (response.data?.users) {
                normalizedData.data.users = response.data.users;
            }
            // Trường hợp 2: Dữ liệu trong response.message.users
            else if (response.message?.users) {
                normalizedData.data.users = response.message.users;
            }
            // Trường hợp 3: Dữ liệu trực tiếp trong response.users
            else if (response.users) {
                normalizedData.data.users = response.users;
            }
            // Trường hợp 4: Dữ liệu trong response.message array
            else if (Array.isArray(response.message)) {
                normalizedData.data.users = response.message;
            }
            
            return normalizedData;
        }
        return response;
    },
    
    // API liên quan đến danh mục
    loadCategories: async function() {
        return await fetchApi('categories.php?action=get_all');
    },
    
    // API liên quan đến bài viết
    createPost: async function(postData) {
        return await fetchApi('posts.php?action=create', {
            method: 'POST',
            body: postData
        });
    },
    
    // API bài viết của người dùng
    loadUserPosts: async function(userId) {
        const response = await fetchApi(`posts.php?action=list_by_user&user_id=${userId}`);
        console.log('Phản hồi thô loadUserPosts:', response);
        
        // Chuẩn hóa cấu trúc phản hồi
        if (response.success) {
            const normalizedData = {
                success: true,
                data: {}
            };
            
            // Trường hợp 1: Dữ liệu trong response.data.posts
            if (response.data?.posts) {
                normalizedData.data.posts = response.data.posts;
            }
            // Trường hợp 2: Dữ liệu trong response.message.data.posts
            else if (response.message?.data?.posts) {
                normalizedData.data.posts = response.message.data.posts;
            }
            // Trường hợp 3: Dữ liệu trong response.message.posts
            else if (response.message?.posts) {
                normalizedData.data.posts = response.message.posts;
            }
            // Trường hợp 4: Dữ liệu array trực tiếp trong response.message
            else if (Array.isArray(response.message)) {
                normalizedData.data.posts = response.message;
            }
            // Trường hợp 5: Dữ liệu trực tiếp trong response.posts
            else if (response.posts) {
                normalizedData.data.posts = response.posts;
            }
            // Trường hợp 6: Array rỗng làm fallback
            else {
                normalizedData.data.posts = [];
            }
            
            console.log('Phản hồi loadUserPosts đã chuẩn hóa:', normalizedData);
            return normalizedData;
        }
        return response;
    },
};

// Xuất giao diện API ra phạm vi toàn cục
if (typeof window !== 'undefined') {
    window.api = api;
}

// Xuất fetchApi để sử dụng trực tiếp nếu cần
if (typeof window !== 'undefined') {
    window.fetchApi = fetchApi;
}