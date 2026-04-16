export interface FilterParams {
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

export function parseFilterParams(
  sp: Record<string, string | string[] | undefined>,
): FilterParams {
  return {
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    inStockOnly: sp.inStockOnly === 'true' ? true : undefined,
  };
}
