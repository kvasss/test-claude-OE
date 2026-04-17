import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import { getProductById, getRelatedProducts } from '@/app/actions/products';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { ProductGallery } from '@/components/product/ProductGallery';

export const dynamic = 'force-dynamic';

type ImageItem = { downloadLink?: string };
type ColorItem = { title?: string; value?: string; extended?: { value?: string } };
type StickerItem = {
  title?: string;
  value?: string;
  extended?: { type?: string; value?: { downloadLink?: string } | string };
};

function attrsOf(p: IProductsEntity): IAttributeValues {
  return p.attributeValues || {};
}

function getImages(p: IProductsEntity): string[] {
  const attrs = attrsOf(p);
  const main = (attrs.pic?.value as ImageItem | undefined)?.downloadLink;
  const extra = (attrs.more_pic?.value as ImageItem[] | undefined) ?? [];
  const urls = [main, ...extra.map((i) => i?.downloadLink)].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );
  return Array.from(new Set(urls));
}

function getPrice(p: IProductsEntity): { price: number; sale: number | null; currency: string } {
  const attrs = attrsOf(p);
  const price = Number(attrs.price?.value ?? 0);
  const saleRaw = Number(attrs.sale?.value ?? 0);
  const currency = String(attrs.currency?.value ?? '');
  return {
    price,
    sale: saleRaw > 0 && saleRaw < price ? saleRaw : null,
    currency,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [productResult, relatedResult] = await Promise.all([
    getProductById(productId),
    getRelatedProducts(productId, 4),
  ]);

  if ('error' in productResult) notFound();

  const product = productResult.item;
  const attrs = attrsOf(product);
  const title = product.localizeInfos?.title ?? '';
  const images = getImages(product);
  const { price, sale, currency } = getPrice(product);

  const descriptionHtml =
    (attrs.description?.value as { htmlValue?: string; plainValue?: string } | undefined)?.htmlValue ?? '';

  const colors = (attrs.color?.value as ColorItem[] | undefined) ?? [];
  const stickers = (attrs.stickers?.value as StickerItem[] | undefined) ?? [];
  const sku = String(attrs.sku?.value ?? '');
  const units = Number(attrs.units_product?.value ?? 0);
  const inStock = product.statusIdentifier === 'in_stock';
  const statusLabel = product.statusLocalizeInfos?.title ?? '';
  const related = relatedResult.items;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/products" className="hover:text-indigo-600">
          ← К каталогу
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <ProductGallery title={title} images={images} />
        </div>

        <div className="space-y-6">
          <div>
            {stickers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {stickers.map((s) => {
                  const iconUrl =
                    typeof s.extended?.value === 'object' ? s.extended.value?.downloadLink : undefined;
                  return (
                    <span
                      key={s.value ?? s.title}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                    >
                      {iconUrl && (
                        <Image src={iconUrl} alt="" width={14} height={14} className="h-3.5 w-3.5" />
                      )}
                      {s.title}
                    </span>
                  );
                })}
              </div>
            )}
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">{title}</h1>
            {sku && <p className="mt-1 text-sm text-gray-400">Арт. {sku}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            {sale != null ? (
              <>
                <span className="text-3xl font-bold text-gray-900">
                  {sale} {currency}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  {price} {currency}
                </span>
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  −{Math.round(((price - sale) / price) * 100)}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                {price} {currency}
              </span>
            )}
          </div>

          {colors.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Цвет:</span>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <span
                    key={c.value ?? c.title}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700"
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-gray-200"
                      style={{ backgroundColor: c.extended?.value ?? c.value ?? '' }}
                      aria-hidden
                    />
                    {c.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <span
              className={[
                'inline-flex items-center rounded-full px-2.5 py-1 font-medium',
                inStock
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-500',
              ].join(' ')}
            >
              {statusLabel || (inStock ? 'В наличии' : 'Нет в наличии')}
            </span>
            {inStock && units > 0 && (
              <span className="text-gray-500">Осталось: {units} шт.</span>
            )}
          </div>

          <div className="max-w-sm">
            {inStock ? (
              <AddToCartButton productId={product.id} units={units || 99} />
            ) : (
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-400"
              >
                Нет в наличии
              </button>
            )}
          </div>

          {descriptionHtml && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Описание</h2>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Похожие товары</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => {
              const a = attrsOf(p);
              const img = (a.pic?.value as ImageItem | undefined)?.downloadLink ?? '';
              const pr = Number(a.price?.value ?? 0);
              const cur = String(a.currency?.value ?? '');
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md"
                >
                  <div className="relative aspect-square bg-gray-50">
                    {img && (
                      <Image
                        src={img}
                        alt={p.localizeInfos?.title ?? ''}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-contain p-4 transition group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-sm font-medium text-gray-900">
                      {p.localizeInfos?.title}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      {pr} {cur}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
