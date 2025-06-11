import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export enum HttpMethod {
  Post = "POST",
  Get = "GET",
  Put = "PUT",
  Delete = "DELETE",
}
const baseUrl = process.env.REACT_APP_API_BASE_URL;
const API_URL = `${baseUrl}/auth`;

export const register = async (formData: {
  firstName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  return axios.post(`${API_URL}/register`, formData);
};

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  if (response.data.access_token) {
    localStorage.setItem("token", response.data.access_token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

export const getProfile = async () => {
  const token = localStorage.getItem("token");
  return axios.post(
    `${API_URL}/profile`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  // Optional: Redirect to login page or refresh the page
  window.location.href = "/auth/login";
};

export const sendRequest = async <T>(
  url: string,
  method: HttpMethod,
  body: any = {}
): Promise<AxiosResponse<T>> => {
  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  switch (method) {
    case HttpMethod.Get:
      return axios.get<T>(`${baseUrl}/${url}`, config);
    case HttpMethod.Post:
      return axios.post<T>(`${baseUrl}/${url}`, body, config);
    case HttpMethod.Put:
      return axios.put<T>(`${baseUrl}/${url}`, body, config);
    case HttpMethod.Delete:
      return axios.delete<T>(`${baseUrl}/${url}`, config);
    default:
      throw new Error("Invalid HTTP method");
  }
};
