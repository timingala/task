// lib/api.ts
import axios, { AxiosInstance } from 'axios';
import { getSession, signOut } from 'next-auth/react';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://maestro-api-dev.secil.biz';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout
      await signOut({ redirect: true, callbackUrl: '/login' });
    }
    return Promise.reject(error);
  }
);

// API Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: number;
  message: string | null;
  data: {
    accessToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
    refreshToken: string;
    tokenType: string;
  };
}

export interface CollectionResponse {
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  data: CollectionItem[];
}

export interface CollectionItem {
  id: number;
  type: number;
  info: {
    id: number;
    name: string;
    description: string;
    url: string;
    langCode: string;
  };
  salesChannelId: number;
  filters: {
    useOrLogic: boolean;
    filters: FilterItem[] | null;
  };
  products: ProductItem[] | null;
}

export interface ProductItem {
  productCode: string;
  colorCode: string | null;
  sizeCode: string | null;
  categoryCode: string | null;
  name: string | null;
  imageUrl: string;
  outOfStock?: boolean;
  isSaleB2B?: boolean;
}

export interface FilterItem {
  id: string;
  title: string;
  value: string;
  valueName: string;
  currency: string | null;
  comparisonType: number;
}

export interface GetProductsRequest {
  additionalFilters: FilterRequest[];
  page: number;
  pageSize: number;
}

export interface FilterRequest {
  id: string;
  value: string;
  comparisonType: number;
}

export interface GetProductsResponse {
  status: number;
  message: string;
  data: {
    meta: {
      page: number;
      pageSize: number;
      totalProduct: number;
    };
    data: ProductItem[];
  };
}

export interface GetFiltersResponse {
  status: number;
  message: string;
  data: FilterCategory[];
}

export interface FilterCategory {
  id: string;
  title: string;
  values: FilterValue[];
  currency: string | null;
  comparisonType: number;
}

export interface FilterValue {
  value: string;
  valueName: string | null;
}

// API Methods
export const api = {
  // Auth
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post(`${API_BASE_URL}/Auth/Login`, credentials);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await axios.post(`${API_BASE_URL}/Auth/RefreshTokenLogin`, {
      refreshToken,
    });
    return response.data;
  },

  // Collections
  async getCollections(page = 1, pageSize = 10): Promise<CollectionResponse> {
    const response = await apiClient.get('/Collection/GetAll', {
      params: { page, pageSize },
    });
    return response.data;
  },

  // Products for Collection
  async getCollectionProducts(
    collectionId: number,
    request: GetProductsRequest
  ): Promise<GetProductsResponse> {
    const response = await apiClient.post(
      `/Collection/${collectionId}/GetProductsForConstants`,
      request
    );
    return response.data;
  },

  // Filters for Collection
  async getCollectionFilters(collectionId: number): Promise<GetFiltersResponse> {
    const response = await apiClient.get(
      `/Collection/${collectionId}/GetFiltersForConstants`
    );
    return response.data;
  },

  // Save product order (şu an mock)
  async saveProductOrder(collectionId: number, products: { productCode: string; order: number }[]) {
    // TODO: Gerçek API endpoint'i bekleniyor
    console.log('Saving product order:', { collectionId, products });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  },
};