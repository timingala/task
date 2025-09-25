
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';
import { api, type ProductItem, type FilterCategory, type CollectionItem, type FilterRequest } from '@/lib/api';

// Icons
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

// Sidebar
function Sidebar({ isOpen }: { isOpen: boolean }) {
  const router = useRouter();
  
  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-50 border-r transition-all duration-300 z-30 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <nav className="p-4">
        <button 
          onClick={() => router.push('/collections')}
          className="w-full flex items-center space-x-3 p-2 rounded hover:bg-gray-200 text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {isOpen && <span>Koleksiyonlar</span>}
        </button>
      </nav>
    </aside>
  );
}

// Optimized Product Card Component
function SortableProductItem({ 
  product, 
  globalIndex,
  isDragging: parentIsDragging 
}: { 
  product: ProductItem; 
  globalIndex: number;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `${product.productCode}-${globalIndex}`,
    data: {
      product,
      index: globalIndex
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : 'none',
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg relative group touch-none ${
        isDragging || parentIsDragging 
          ? 'shadow-2xl scale-105 opacity-90 cursor-grabbing' 
          : 'shadow-sm hover:shadow-md cursor-grab'
      } transition-all duration-150`}
      {...attributes}
      {...listeners}
    >
      {/* Product Image */}
      <div className="aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-gray-50">
        <img
          src={product.imageUrl}
          alt={product.productCode}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=No+Image';
          }}
        />
      </div>
      
      {/* Product Info */}
      <div className="p-2 text-center">
        <p className="text-xs text-gray-900 font-medium truncate">
          {product.name || 'Ürün'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {product.productCode}
        </p>
      </div>

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded px-2 py-1 text-xs font-medium">
          #{globalIndex + 1}
        </div>
      )}
    </div>
  );
}

// Filter Modal Component
// Filter Modal Component
function FilterModal({ 
  isOpen,
  onClose,
  filters, 
  selectedFilters, 
  onFilterChange, 
  onClearFilters,
  onApplyFilters
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterCategory[];
  selectedFilters: FilterRequest[];
  onFilterChange: (filterId: string, value: string) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom Sheet Panel */}
      <div className="relative bg-white rounded-t-2xl shadow-xl w-full max-h-[80vh] overflow-hidden animate-slide-up">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium text-gray-800">Filtreler</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[55vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filters.slice(0, 6).map((filter) => (
              <div key={filter.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filter.title}
                </label>
                <select
                  value={selectedFilters.find(f => f.id === filter.id)?.value || ''}
                  onChange={(e) => onFilterChange(filter.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seçiniz</option>
                  {filter.values.slice(0, 10).map((value) => (
                    <option key={value.value} value={value.value}>
                      {value.valueName || value.value}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          
          {/* Active Filters */}
          {selectedFilters.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Aktif Filtreler</h4>
              <div className="flex flex-wrap gap-2">
                {selectedFilters.map((filter) => {
                  const filterDef = filters.find(f => f.id === filter.id);
                  const valueDef = filterDef?.values.find(v => v.value === filter.value);
                  return (
                    <span
                      key={`${filter.id}-${filter.value}`}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {filterDef?.title}: {valueDef?.valueName || filter.value}
                      <button
                        onClick={() => onFilterChange(filter.id, '')}
                        className="ml-2 hover:text-blue-900 font-semibold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Tümünü Temizle
          </button>
          
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={onApplyFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = parseInt(params.id as string);
  
  // States
  const [collection, setCollection] = useState<CollectionItem | null>(null);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [filters, setFilters] = useState<FilterCategory[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<FilterRequest[]>([]);
  const [tempSelectedFilters, setTempSelectedFilters] = useState<FilterRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  
  const pageSize = 36;

  // Optimized sensors with better touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme === 'dark');
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    loadCollectionData();
  }, [collectionId]);

  useEffect(() => {
    if (collection) {
      loadProducts();
    }
  }, [collection]);

  // Client-side filtering with better performance
  const filteredProducts = useMemo(() => {
    if (selectedFilters.length === 0) return allProducts;
    
    return allProducts.filter(product => {
      return selectedFilters.every(filter => {
        if (!filter.value) return true;
        
        switch (filter.id) {
          case 'color':
            return product.colorCode === filter.value;
          case 'size':
            return product.sizeCode === filter.value;
          case 'category':
            return product.categoryCode === filter.value;
          default:
            return true;
        }
      });
    });
  }, [allProducts, selectedFilters]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const loadCollectionData = async () => {
    try {
      const collectionsResponse = await api.getCollections(1, 100);
      const foundCollection = collectionsResponse.data.find(c => c.id === collectionId);
      
      if (!foundCollection) {
        toast.error('Koleksiyon bulunamadı');
        router.push('/collections');
        return;
      }
      
      setCollection(foundCollection);

      const filtersResponse = await api.getCollectionFilters(collectionId);
      setFilters(filtersResponse.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Veri yüklenirken hata oluştu');
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.getCollectionProducts(collectionId, {
        additionalFilters: [],
        page: 1,
        pageSize: 1000
      });
      
      setAllProducts(response.data.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Improved drag end handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    
    if (!activeData || !overData) return;

    const oldIndex = activeData.index;
    const newIndex = overData.index;
    
    setAllProducts(currentProducts => {
      const newProducts = arrayMove(currentProducts, oldIndex, newIndex);
      return newProducts;
    });

    // Update current page if needed
    const newPageForItem = Math.floor(newIndex / pageSize) + 1;
    if (newPageForItem !== currentPage) {
      setCurrentPage(newPageForItem);
    }
  }, [currentPage, pageSize]);

  const handleDragStart = useCallback((event: any) => {
    setDraggedItem(event.active.id);
  }, []);

  const handleFilterChange = useCallback((filterId: string, value: string) => {
    setTempSelectedFilters((prev) => {
      const existing = prev.filter(f => f.id !== filterId);
      if (value) {
        return [...existing, { id: filterId, value, comparisonType: 0 }];
      }
      return existing;
    });
  }, []);

  const applyFilters = useCallback(() => {
    setSelectedFilters(tempSelectedFilters);
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  }, [tempSelectedFilters]);

  const clearFilters = useCallback(() => {
    setTempSelectedFilters([]);
    setSelectedFilters([]);
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  }, []);

  const openFilterModal = useCallback(() => {
    setTempSelectedFilters(selectedFilters);
    setIsFilterModalOpen(true);
  }, [selectedFilters]);

  const handleSave = async () => {
    try {
      const orderedProducts = allProducts.map((product, index) => ({
        productCode: product.productCode,
        order: index + 1
      }));
      
      await api.saveProductOrder(collectionId, orderedProducts);
      toast.success('Sıralama kaydedildi');
      router.push('/collections');
    } catch (error) {
      toast.error('Kaydetme sırasında hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">LOGO</h1>
            <span className="text-sm text-gray-600">Sabitleri Düzenleme</span>
            <span className="text-sm text-gray-500">frontendtask@secilstore.com</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 font-medium">
              Koleksiyon - 1 / {filteredProducts.length} Ürün
            </span>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-gray-100"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        selectedFilters={tempSelectedFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        onApplyFilters={applyFilters}
      />

      {/* Main Content */}
      <div className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {/* Filter Button */}
              <button
                onClick={openFilterModal}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FilterIcon />
                <span className="text-sm">Filtreler</span>
                {selectedFilters.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {selectedFilters.length}
                  </span>
                )}
              </button>

              {/* Active Filters Preview */}
              {selectedFilters.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Aktif:</span>
                  {selectedFilters.slice(0, 3).map((filter) => {
                    const filterDef = filters.find(f => f.id === filter.id);
                    const valueDef = filterDef?.values.find(v => v.value === filter.value);
                    return (
                      <span
                        key={`${filter.id}-${filter.value}`}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {filterDef?.title}: {valueDef?.valueName || filter.value}
                      </span>
                    );
                  })}
                  {selectedFilters.length > 3 && (
                    <span className="text-xs text-gray-500">+{selectedFilters.length - 3} daha</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/collections')}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Kaydet
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredProducts.map((p, idx) => `${p.productCode}-${idx}`)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {paginatedProducts.map((product, index) => {
                    const globalIndex = (currentPage - 1) * pageSize + index;
                    const itemId = `${product.productCode}-${globalIndex}`;
                    return (
                      <SortableProductItem 
                        key={itemId}
                        product={product}
                        globalIndex={globalIndex}
                        isDragging={draggedItem === itemId}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ‹
                </button>
                
                {[...Array(Math.min(10, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}