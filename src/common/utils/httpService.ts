import type { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

// Create an Axios instance with default config
const instance = axios.create({
  baseURL: "https://api.escuelajs.co/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Generic request handler with typed request and response
const request = async <TRequest = unknown, TResponse = unknown>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  data?: TRequest,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<TResponse>> => {
  try {
    const response = await instance.request<TResponse>({
      method,
      url,
      data,
      ...config,
    });
    return response;
  } catch (error) {
    throw (error as { response?: { data: unknown } }).response?.data || error;
  }
};

// Exported HTTP methods
const httpService = {
  get: <TResponse = unknown>(url: string, config?: AxiosRequestConfig) =>
    request<undefined, TResponse>("get", url, undefined, config),

  post: <TRequest = unknown, TResponse = unknown>(
    url: string,
    data: TRequest,
    config?: AxiosRequestConfig
  ) => request<TRequest, TResponse>("post", url, data, config),

  put: <TRequest = unknown, TResponse = unknown>(
    url: string,
    data: TRequest,
    config?: AxiosRequestConfig
  ) => request<TRequest, TResponse>("put", url, data, config),

  patch: <TRequest = unknown, TResponse = unknown>(
    url: string,
    data: TRequest,
    config?: AxiosRequestConfig
  ) => request<TRequest, TResponse>("patch", url, data, config),

  delete: <TResponse = unknown>(url: string, config?: AxiosRequestConfig) =>
    request<undefined, TResponse>("delete", url, undefined, config),
};

export default httpService;
