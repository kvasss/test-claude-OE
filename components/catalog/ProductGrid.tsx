'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { getProducts } from '@/app/actions/products';
import type { FilterParams } from '@/lib/filters';
import { addProductsToCart } from '@/app/store/reducers/CartSlice';
import type { AppDispatch } from '@/app/store/store';
import { ProductCard } from '@/components/product/ProductCard';

type Props = {
  initialProducts: IProductsEntity[];
  totalProducts: number;
  filters: FilterParams;
};

const PAGE_SIZE = 12;

export function ProductGrid({ initialProducts, totalProducts, filters }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [products, setProducts] = useState<IProductsEntity[]>(initialProducts);
  const [offset, setOffset] = useState(initialProducts.length);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProducts);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    dispatch(addProductsToCart(products));
  }, [dispatch, products]);

  const loadMore = async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await getProducts(offset, PAGE_SIZE, filters);
      if (result.items.length > 0) {
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const fresh = result.items.filter((p) => !seen.has(p.id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
        const newOffset = offset + result.items.length;
        setOffset(newOffset);
        setHasMore(newOffset < totalProducts);
      } else {
        setHasMore(false);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
        Товары не найдены. Попробуйте изменить фильтры.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Загрузка…' : `Показать ещё (${totalProducts - products.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
