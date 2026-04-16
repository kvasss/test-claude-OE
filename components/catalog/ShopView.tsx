'use client';

import { useSearchParams } from 'next/navigation';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { parseFilterParams } from '@/lib/filters';
import { FilterPanel } from './FilterPanel';
import { ProductGrid } from './ProductGrid';

type Props = {
  initialProducts: IProductsEntity[];
  totalProducts: number;
};

export function ShopView({ initialProducts, totalProducts }: Props) {
  const searchParams = useSearchParams();
  const activeFilters = parseFilterParams(
    Object.fromEntries(searchParams.entries()),
  );
  const gridKey = searchParams.toString();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <FilterPanel filters={activeFilters} />
      </aside>
      <section>
        <ProductGrid
          key={gridKey}
          initialProducts={initialProducts}
          totalProducts={totalProducts}
          filters={activeFilters}
        />
      </section>
    </div>
  );
}
