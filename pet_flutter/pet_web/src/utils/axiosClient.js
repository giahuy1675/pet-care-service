import axios from 'axios';

const axiosClient = axios.create({
  // Cấu hình baseURL linh hoạt
  // baseURL mặc định - có thể thay đổi thủ công nếu cần
  baseURL: process.env.REACT_APP_API_URL || 'https://bepetwebapi20260223122715-hsfwcberazegd0hd.southeastasia-01.azurewebsites.net/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Đảm bảo withCredentials được bật để gửi cookies trong CORS requests
  withCredentials: true,
  // Thêm timeout để tránh request treo quá lâu
  timeout: 15000, // 15 giây
});

// Thêm biến để quản lý việc retry
const MAX_RETRIES = 2;
const retryMap = new Map();

// Interceptor cho request
axiosClient.interceptors.request.use(
  (config) => {
    // Dùng ID để theo dõi request khi retry
    config.requestId = config.requestId || Date.now() + Math.random().toString(36).substring(2, 9);

    const token = localStorage.getItem('token');
    if (token) {
      // Đảm bảo Bearer token đúng định dạng (có khoảng trắng sau "Bearer")
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Đảm bảo withCredentials luôn được bật
    config.withCredentials = true;
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor cho response
axiosClient.interceptors.response.use(
  (response) => {
    // Xóa request khỏi retryMap khi thành công
    if (response.config.requestId) {
      retryMap.delete(response.config.requestId);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Kiểm tra lỗi mạng và retry
    if ((error.code === 'ECONNABORTED' || error.message.includes('timeout') || 
         error.message.includes('Network Error')) && originalRequest) {
      
      // Đảm bảo request có ID để theo dõi
      originalRequest.requestId = originalRequest.requestId || 
                               Date.now() + Math.random().toString(36).substring(2, 9);
      
      // Lấy số lần đã retry
      const retryCount = retryMap.get(originalRequest.requestId) || 0;
      
      // Kiểm tra số lần retry
      if (retryCount < MAX_RETRIES) {
        // Tăng retry count
        retryMap.set(originalRequest.requestId, retryCount + 1);
        
        // Chờ một lát trước khi retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        
        // Thử lại request
        return axiosClient(originalRequest);
      }
    }

    if (error.response) {
      console.error('=== AXIOS RESPONSE ERROR ===');
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('URL:', error.config?.url);
      console.error('Method:', error.config?.method);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', error.response.data);
      console.error('=== END RESPONSE ERROR ===');
      
      // Xử lý lỗi 401 Unauthorized
      if (error.response.status === 401) {
        console.warn('Unauthorized access - token may be invalid or expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Chỉ redirect nếu không phải đang ở trang login
        if (!window.location.pathname.includes('/login')) {
          console.log('Redirecting to login page...');
          window.location.href = '/login';
        }
      }
      
      // Xử lý lỗi 405 Method Not Allowed
      if (error.response.status === 405) {
        console.error('Method Not Allowed - Backend may not support this endpoint/method');
        console.error('Requested URL:', error.config?.baseURL + error.config?.url);
        console.error('Requested Method:', error.config?.method?.toUpperCase());
      }
      
      // Xử lý lỗi CORS
      if (error.response.status === 0 || (error.message && error.message.includes('Network Error'))) {
        console.error('CORS Error detected. Make sure your backend has CORS enabled.');
        console.error(`
          To fix CORS issues in your .NET backend, add this to your Program.cs:
          
          builder.Services.AddCors(options =>
          {
              options.AddPolicy("AllowLocalhost", policy =>
              {
                  policy.WithOrigins("http://localhost:3000")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
              });
          });
          
          And then add this before app.UseAuthorization():
          
          app.UseCors("AllowLocalhost");
        `);
        
        // Return a more informative error
        error.corsError = true;
        error.corsMessage = "CORS error detected. API server may be unreachable or not configured for CORS.";
      }
    } else if (error.message && error.message.includes('Network Error')) {
      console.error('Network Error (possibly CORS):', error.message);
      console.error(`
        Kiểm tra xem API server có đang chạy không?
        Địa chỉ API hiện tại: ${axiosClient.defaults.baseURL}
        
        Nếu địa chỉ không đúng, hãy điều chỉnh trong file .env hoặc trực tiếp trong code.
      `);
      
      // Add CORS error information
      error.corsError = true;
      error.corsMessage = "Network error detected. API server may be unreachable or not configured for CORS.";
    } else {
      console.error('Error with no response:', error.message);
    }
    return Promise.reject(error);
  }
);

// Hàm giúp thay đổi baseURL nếu cần
export const updateBaseURL = (newBaseURL) => {
  if (newBaseURL) {
    axiosClient.defaults.baseURL = newBaseURL;
    console.log(`API base URL updated to: ${newBaseURL}`);
  }
};

export default axiosClient;