// types/index.ts
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface Product {
  id: string;
  collectionId: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  stock: number;
  order: number;
  description?: string;
}

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}