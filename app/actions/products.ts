'use server';

import { getApi, isError } from '@/lib/oneentry';
import type {
  IFilterParams,
  IProductsEntity,
  IProductsQuery,
} from 'oneentry/dist/products/productsInterfaces';
import type { FilterParams } from '@/lib/filters';

export type { FilterParams } from '@/lib/filters';

const STATUS_IN_STOCK = 'in_stock';

function buildFilterBody(filters?: FilterParams): IFilterParams[] {
  const body: IFilterParams[] = [];
  if (filters?.minPrice != null) {
    body.push({
      attributeMarker: 'price',
      conditionMarker: 'mth',
      conditionValue: filters.minPrice - 0.01,
    });
  }
  if (filters?.maxPrice != null) {
    body.push({
      attributeMarker: 'price',
      conditionMarker: 'lth',
      conditionValue: filters.maxPrice + 0.01,
    });
  }
  return body;
}

function buildQuery(offset: number, limit: number, filters?: FilterParams): IProductsQuery {
  const query: IProductsQuery = { offset, limit, sortOrder: 'ASC', sortKey: 'position' };
  if (filters?.inStockOnly) query.statusMarker = STATUS_IN_STOCK;
  return query;
}

export async function getProducts(
  offset = 0,
  limit = 12,
  filters?: FilterParams,
  locale?: string,
) {
  const result = await getApi().Products.getProducts(
    buildFilterBody(filters),
    locale,
    buildQuery(offset, limit, filters),
  );
  if (isError(result)) {
    return { items: [] as IProductsEntity[], total: 0, error: result.message };
  }
  return {
    items: (result.items || []) as IProductsEntity[],
    total: Number(result.total ?? 0),
  };
}
