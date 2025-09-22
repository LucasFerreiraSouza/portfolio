import axios from "axios";
import { server } from "../config";
import { UserLocalStorage } from "../AppConstants";

function API(serverURL: string) {
  const api = axios.create({
    baseURL: serverURL,
    timeout: 30000,
    // não seta o header Authorization aqui para não usar token "antigo"
  });

  api.defaults.headers.post['Content-Type'] = 'application/json';

  // Interceptor para adicionar token dinamicamente em cada requisição
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(UserLocalStorage.token);
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
  );

  return api;
}

export const api = API(server);
