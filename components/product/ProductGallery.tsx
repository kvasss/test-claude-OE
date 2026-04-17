'use client';

import { useState } from 'react';
import Image from 'next/image';

type Props = {
  title: string;
  images: string[];
};

export function ProductGallery({ title, images }: Props) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
        Нет изображения
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
        <Image
          src={images[active]}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-contain p-6"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={[
                'relative aspect-square overflow-hidden rounded-lg border bg-gray-50 transition',
                i === active ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-400',
              ].join(' ')}
              aria-label={`Изображение ${i + 1}`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="120px"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
