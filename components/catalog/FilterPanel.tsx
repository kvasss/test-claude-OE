'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { FilterParams } from '@/lib/filters';

type Props = { filters: FilterParams };

export function FilterPanel({ filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? '');
  const [inStockOnly, setInStockOnly] = useState(filters.inStockOnly === true);

  const apply = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice.trim()) params.set('minPrice', minPrice.trim());
    else params.delete('minPrice');
    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim());
    else params.delete('maxPrice');
    if (inStockOnly) params.set('inStockOnly', 'true');
    else params.delete('inStockOnly');
    router.push(`/products?${params.toString()}`);
  };

  const reset = () => {
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    router.push('/products');
  };

  const input =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

  return (
    <form onSubmit={apply} className="space-y-5 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Фильтры</h2>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Цена</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="от"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className={input}
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="до"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={input}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
        />
        Только в наличии
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Применить
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Сброс
        </button>
      </div>
    </form>
  );
}
