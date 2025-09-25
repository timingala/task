// lib/store.ts
import { create } from 'zustand';
import type { Collection, Product, FilterOptions } from '@/types';

interface CollectionStore {
  // Collections
  collections: Collection[];
  selectedCollection: Collection | null;
  setCollections: (collections: Collection[]) => void;
  setSelectedCollection: (collection: Collection | null) => void;
  
  // Products
  products: Product[];
  filteredProducts: Product[];
  setProducts: (products: Product[]) => void;
  updateProductOrder: (products: Product[]) => void;
  
  // Filters
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  // Collections
  collections: [],
  selectedCollection: null,
  setCollections: (collections) => set({ collections }),
  setSelectedCollection: (collection) => set({ selectedCollection: collection }),
  
  // Products
  products: [],
  filteredProducts: [],
  setProducts: (products) => set({ 
    products, 
    filteredProducts: products 
  }),
  updateProductOrder: (products) => {
    set({ products, filteredProducts: products });
  },
  
  // Filters
  filters: {},
  setFilters: (filters) => {
    set({ filters });
    get().applyFilters();
  },
  applyFilters: () => {
    const { products, filters } = get();
    let filtered = [...products];
    
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }
    
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }
    
    if (filters.inStock !== undefined) {
      filtered = filtered.filter(p => filters.inStock ? p.stock > 0 : p.stock === 0);
    }
    
    set({ filteredProducts: filtered });
  },
  clearFilters: () => {
    set({ filters: {}, filteredProducts: get().products });
  },
  
  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading })
}));

// Mock data generator (gerçek API'niz hazır olana kadar kullanabilirsiniz)
export const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Yaz Koleksiyonu',
    description: '2024 Yaz sezonuna özel ürünler',
    productCount: 45,
    updatedAt: '2024-03-15',
    createdAt: '2024-01-10'
  },
  {
    id: '2',
    name: 'Kış Koleksiyonu',
    description: 'Kış sezonuna özel sıcak tutan ürünler',
    productCount: 32,
    updatedAt: '2024-03-14',
    createdAt: '2024-01-08'
  },
  {
    id: '3',
    name: 'Spor Koleksiyonu',
    description: 'Aktif yaşam tarzı için spor ürünleri',
    productCount: 28,
    updatedAt: '2024-03-13',
    createdAt: '2024-01-05'
  }
];

export const generateMockProducts = (collectionId: string): Product[] => {
  const categories = ['Giyim', 'Ayakkabı', 'Aksesuar', 'Çanta'];
  const products: Product[] = [];
  
  for (let i = 1; i <= 20; i++) {
    products.push({
      id: `prod-${collectionId}-${i}`,
      collectionId,
      name: `Ürün ${i}`,
      price: Math.floor(Math.random() * 500) + 50,
      category: categories[Math.floor(Math.random() * categories.length)],
      stock: Math.floor(Math.random() * 100),
      order: i,
      image: `https://via.placeholder.com/300x300?text=Product${i}`,
      description: `Bu ürün koleksiyon ${collectionId} içindeki ${i}. üründür.`
    });
  }
  
  return products;
};