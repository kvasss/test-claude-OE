import { getApi, isError } from '@/lib/oneentry';
import { notFound } from 'next/navigation';
import type { IPositionBlock } from 'oneentry/dist/pages/pagesInterfaces';
import { HomeBlock, blockSpan } from '@/components/home/HomeBlock';

const HOME_PAGE_URL = 'home';

export default async function HomePage() {
  const [page, blocks] = await Promise.all([
    getApi().Pages.getPageByUrl(HOME_PAGE_URL),
    getApi().Pages.getBlocksByPageUrl(HOME_PAGE_URL),
  ]);

  if (isError(page)) notFound();

  const sortedBlocks = isError(blocks) || !Array.isArray(blocks)
    ? []
    : [...(blocks as IPositionBlock[])].sort((a, b) => a.position - b.position);

  const showTitleRaw = page.attributeValues?.show_title?.value as { value?: string } | undefined;
  const showTitle = String(showTitleRaw?.value ?? 'false') === 'true';

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {showTitle && (
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">{page.localizeInfos?.title}</h1>
          {page.localizeInfos?.htmlContent && (
            <div
              className="prose mt-4 text-gray-600"
              dangerouslySetInnerHTML={{ __html: page.localizeInfos.htmlContent }}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sortedBlocks.map((block) => (
          <div key={block.id} className={blockSpan(block.templateIdentifier)}>
            <HomeBlock block={block} />
          </div>
        ))}
      </div>
    </main>
  );
}
