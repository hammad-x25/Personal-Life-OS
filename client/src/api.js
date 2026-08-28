import axios from "axios";

function notifyConnection(detail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lifeos:connection", { detail }));
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
let refreshing = null;
api.interceptors.response.use(
  (response) => {
    notifyConnection({ online: true });
    return response;
  },
  async (error) => {
    if (!error.response) {
      error.code = "ERR_NETWORK";
      notifyConnection({ online: false, message: "API unavailable. Check that the server is running." });
    } else if (error.response.status >= 500) {
      notifyConnection({ online: false, message: "Database or API unavailable. Please try again shortly." });
    }
    const request = error.config;
    if (
      error.response?.status === 401 &&
      !request?._retry &&
      !request?.url?.includes("/auth/refresh")
    ) {
      request._retry = true;
      try {
        refreshing ||= api.post("/auth/refresh");
        await refreshing;
        refreshing = null;
        return api(request);
      } catch (refreshError) {
        refreshing = null;
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
