'use client';

import Image from 'next/image';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

type Props = { product: IProductsEntity };

function attrsOf(product: IProductsEntity): IAttributeValues {
  return product.attributeValues || {};
}

function getImage(product: IProductsEntity): string {
  const pic = attrsOf(product).pic?.value as { downloadLink?: string } | undefined;
  return pic?.downloadLink ?? '';
}

function getPrice(product: IProductsEntity): { price: number; sale: number | null; currency: string } {
  const attrs = attrsOf(product);
  const price = Number(attrs.price?.value ?? 0);
  const saleRaw = Number(attrs.sale?.value ?? 0);
  const currency = String(attrs.currency?.value ?? '');
  return {
    price,
    sale: saleRaw > 0 && saleRaw < price ? saleRaw : null,
    currency,
  };
}

function getColor(product: IProductsEntity): { name: string; swatch: string } | null {
  const list = attrsOf(product).color?.value as
    | Array<{ title?: string; value?: string; extended?: { value?: string } }>
    | undefined;
  if (!Array.isArray(list) || list.length === 0) return null;
  const first = list[0];
  return {
    name: first.title ?? '',
    swatch: first.extended?.value ?? first.value ?? '',
  };
}

function getUnits(product: IProductsEntity): number {
  return Number(attrsOf(product).units_product?.value ?? 0);
}

export function ProductCard({ product }: Props) {
  const imageUrl = getImage(product);
  const { price, sale, currency } = getPrice(product);
  const color = getColor(product);
  const units = getUnits(product);
  const inStock = product.statusIdentifier === 'in_stock';
  const statusLabel = product.statusLocalizeInfos?.title ?? '';
  const title = product.localizeInfos?.title ?? '';

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md">
      <div className="relative aspect-square bg-gray-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-4"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Нет изображения
          </div>
        )}
        {sale != null && (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            −{Math.round(((price - sale) / price) * 100)}%
          </span>
        )}
        {!inStock && (
          <span className="absolute right-3 top-3 rounded-full bg-gray-800/80 px-2 py-0.5 text-xs font-medium text-white">
            Нет в наличии
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-base font-medium text-gray-900 line-clamp-2">{title}</h3>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          {color && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-full border border-gray-200"
                style={{ backgroundColor: color.swatch }}
                aria-hidden
              />
              {color.name}
            </span>
          )}
          {inStock && statusLabel && <span>· {statusLabel}</span>}
        </div>

        <div className="mt-auto flex items-baseline gap-2">
          {sale != null ? (
            <>
              <span className="text-xl font-semibold text-gray-900">
                {sale} {currency}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {price} {currency}
              </span>
            </>
          ) : (
            <span className="text-xl font-semibold text-gray-900">
              {price} {currency}
            </span>
          )}
        </div>

        <div className="pt-2">
          {inStock ? (
            <AddToCartButton productId={product.id} units={units || 99} />
          ) : (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400"
            >
              Нет в наличии
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
