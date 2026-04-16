import { getProducts } from '@/app/actions/products';
import { parseFilterParams } from '@/lib/filters';
import { ShopView } from '@/components/catalog/ShopView';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilterParams(sp);
  const data = await getProducts(0, 12, filters);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Каталог</h1>
        <p className="mt-1 text-sm text-gray-500">
          {data.total > 0 ? `${data.total} товаров` : 'Нет товаров'}
        </p>
      </div>

      <ShopView initialProducts={data.items} totalProducts={data.total} />
    </main>
  );
}
