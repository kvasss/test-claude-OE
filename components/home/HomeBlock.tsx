import Image from 'next/image';
import Link from 'next/link';
import type { IPositionBlock } from 'oneentry/dist/pages/pagesInterfaces';
import type { IAttributeValues } from 'oneentry/dist/base/utils';

type Props = { block: IPositionBlock };

type ImageItem = { downloadLink?: string };
type ListItem = { title?: string; value?: string; extended?: { value?: string } };

function attrsOf(b: IPositionBlock): IAttributeValues {
  return b.attributeValues || {};
}

function imageUrl(attrs: IAttributeValues, marker: string): string {
  const arr = attrs[marker]?.value as ImageItem[] | undefined;
  return arr?.[0]?.downloadLink ?? '';
}

function strAttr(attrs: IAttributeValues, marker: string): string {
  return String(attrs[marker]?.value ?? '');
}

function listAttr(attrs: IAttributeValues, marker: string): ListItem[] {
  const v = attrs[marker]?.value;
  return Array.isArray(v) ? (v as ListItem[]) : [];
}

function HomeBanner({ block }: Props) {
  const attrs = attrsOf(block);
  const title = strAttr(attrs, 'title');
  const quote = strAttr(attrs, 'quote');
  const bg = imageUrl(attrs, 'bg_web') || imageUrl(attrs, 'banner');
  const logo = imageUrl(attrs, 'logo');
  const link = strAttr(attrs, 'link');

  const inner = (
    <div className="relative h-72 overflow-hidden rounded-2xl bg-gray-900 sm:h-96">
      {bg && (
        <Image
          src={bg}
          alt={title}
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-80"
        />
      )}
      <div className="relative flex h-full flex-col justify-end p-8 text-white">
        {logo && (
          <Image
            src={logo}
            alt=""
            width={120}
            height={40}
            className="mb-auto h-8 w-auto object-contain"
          />
        )}
        <h2 className="text-3xl font-bold sm:text-5xl">{title}</h2>
        {quote && <p className="mt-2 max-w-xl text-lg text-white/80">{quote}</p>}
      </div>
    </div>
  );

  return link ? <Link href={`/products${link ? `?tag=${encodeURIComponent(link)}` : ''}`}>{inner}</Link> : inner;
}

function HomeBadges({ block }: Props) {
  const badges = listAttr(attrsOf(block), 'badges');
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <Link
          key={b.value ?? b.title}
          href={`/products?tag=${encodeURIComponent(b.value ?? '')}`}
          className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {b.title}
        </Link>
      ))}
    </div>
  );
}

function OfferCard({ block, tall = false }: Props & { tall?: boolean }) {
  const attrs = attrsOf(block);
  const title = strAttr(attrs, 'title');
  const bg = imageUrl(attrs, 'bg_web') || imageUrl(attrs, 'bg');
  const itemImg = imageUrl(attrs, 'item_img');
  const link = strAttr(attrs, 'link');
  const stickers = listAttr(attrs, 'stickers');
  const sticker = stickers[0];

  const card = (
    <div
      className={[
        'group relative overflow-hidden rounded-2xl bg-gray-100',
        tall ? 'h-96' : 'h-56',
      ].join(' ')}
    >
      {bg && (
        <Image
          src={bg}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition group-hover:scale-105"
        />
      )}
      <div className="relative flex h-full flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-white drop-shadow-md sm:text-2xl">{title}</h3>
          {sticker?.title && (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900">
              {sticker.title}
            </span>
          )}
        </div>
        {itemImg && (
          <div className="relative ml-auto h-24 w-24 sm:h-32 sm:w-32">
            <Image src={itemImg} alt="" fill sizes="128px" className="object-contain" />
          </div>
        )}
      </div>
    </div>
  );

  return link ? (
    <Link href={`/products?tag=${encodeURIComponent(link)}`}>{card}</Link>
  ) : (
    card
  );
}

function YoutubeBlock({ block }: Props) {
  const attrs = attrsOf(block);
  const title = strAttr(attrs, 'title');
  const bg = imageUrl(attrs, 'bg_web') || imageUrl(attrs, 'bg');
  const link = strAttr(attrs, 'link');

  const card = (
    <div className="group relative h-56 overflow-hidden rounded-2xl bg-red-600">
      {bg && (
        <Image
          src={bg}
          alt={title}
          fill
          sizes="100vw"
          className="object-cover transition group-hover:scale-105"
        />
      )}
      <div className="relative flex h-full items-center justify-center p-6">
        <h3 className="text-center text-2xl font-bold text-white drop-shadow-md sm:text-3xl">
          {title}
        </h3>
      </div>
    </div>
  );

  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer">
      {card}
    </a>
  ) : (
    card
  );
}

export function HomeBlock({ block }: Props) {
  switch (block.templateIdentifier) {
    case 'home_banner':
      return <HomeBanner block={block} />;
    case 'home_badges':
      return <HomeBadges block={block} />;
    case 'vertical_block':
      return <OfferCard block={block} tall />;
    case 'item_card':
      return <OfferCard block={block} />;
    case 'youtube_home_block':
      return <YoutubeBlock block={block} />;
    default:
      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
          Неизвестный шаблон блока: <code>{block.templateIdentifier}</code>
        </div>
      );
  }
}

export function blockSpan(templateIdentifier: string | null): string {
  switch (templateIdentifier) {
    case 'home_banner':
    case 'home_badges':
    case 'youtube_home_block':
      return 'md:col-span-2';
    case 'vertical_block':
      return 'md:row-span-2';
    default:
      return '';
  }
}
