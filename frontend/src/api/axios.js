import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:8000/",
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (!config.url.includes("/register") && !config.url.includes("/login")) {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

let isRefreshing = false;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem("refresh");

      if (refresh) {
        try {
          const res = await axios.post(
            "http://127.0.0.1:8000/api/token/refresh/",
            { refresh },
          );

          const newAccess = res.data.access;

          localStorage.setItem("access", newAccess);

          originalRequest.headers.Authorization = `Bearer ${newAccess}`;

          return axiosInstance(originalRequest); // retry
        } catch (err) {
          // Refresh also failed → logout
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
