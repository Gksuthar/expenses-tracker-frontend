import { CustomError } from "@/types/custom-error.type";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const options = {
  baseURL,
  withCredentials: false, // No cookies needed with JWT
  timeout: 10000,
};

const API = axios.create(options);

// Add JWT token to all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Guard: error.response might be undefined for network errors/timeouts
      // network errors may not have error.response (e.g., CORS, network down)
      const resp = error.response || {};
      const { data, status } = resp;

    if (status === 401) {
      // Token expired or invalid - clear and redirect to login
      localStorage.removeItem("token");
      window.location.href = "/";
    }

    const customError: CustomError = {
      ...error,
      // If response or data is missing, provide a sensible fallback
        errorCode: data?.errorCode || "UNKNOWN_ERROR",
    };

    return Promise.reject(customError);
  }
);

export default API;
