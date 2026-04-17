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
  const statusMarker = filters?.inStockOnly ? STATUS_IN_STOCK : undefined;

  if (filters?.minPrice != null) {
    body.push({
      attributeMarker: 'price',
      conditionMarker: 'mth',
      conditionValue: filters.minPrice - 0.01,
      ...(statusMarker ? { statusMarker } : {}),
    });
  }
  if (filters?.maxPrice != null) {
    body.push({
      attributeMarker: 'price',
      conditionMarker: 'lth',
      conditionValue: filters.maxPrice + 0.01,
      ...(statusMarker ? { statusMarker } : {}),
    });
  }
  if (statusMarker && body.length === 0) {
    body.push({
      attributeMarker: 'price',
      conditionMarker: 'mth',
      conditionValue: -1,
      statusMarker,
    });
  }

  return body;
}

function buildQuery(offset: number, limit: number): IProductsQuery {
  return { offset, limit, sortOrder: 'ASC', sortKey: 'position' };
}

export async function getProductById(id: number, locale?: string) {
  const result = await getApi().Products.getProductById(id, locale);
  if (isError(result)) {
    return { error: result.message, statusCode: result.statusCode };
  }
  return { item: result as IProductsEntity };
}

export async function getRelatedProducts(id: number, limit = 4, locale?: string) {
  const result = await getApi().Products.getRelatedProductsById(id, locale, {
    offset: 0,
    limit,
    sortOrder: 'ASC',
    sortKey: 'position',
  });
  if (isError(result)) {
    return { items: [] as IProductsEntity[], total: 0 };
  }
  return {
    items: (result.items || []) as IProductsEntity[],
    total: Number(result.total ?? 0),
  };
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
    buildQuery(offset, limit),
  );
  if (isError(result)) {
    return { items: [] as IProductsEntity[], total: 0, error: result.message };
  }
  return {
    items: (result.items || []) as IProductsEntity[],
    total: Number(result.total ?? 0),
  };
}
