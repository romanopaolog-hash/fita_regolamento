import { del, get, list } from '@vercel/blob';

export const PUSH_DEVICE_PREFIX = 'fita-regolamento/push/devices/';
export const ARTICLE_REPORT_PREFIX = 'fita-regolamento/article-reports/';

async function removeLinkedBlobs(prefix: string, field: string, userId: string) {
  let cursor: string | undefined;
  const urls: string[] = [];
  do {
    const page = await list({ prefix, cursor, limit: 50 });
    for (let offset = 0; offset < page.blobs.length; offset += 10) {
      await Promise.all(page.blobs.slice(offset, offset + 10).map(async file => {
        const blob = await get(file.pathname, { access: 'private', useCache: false });
        if (blob?.statusCode !== 200) return;
        const data = await new Response(blob.stream).json();
        if (data?.[field] === userId) urls.push(file.url);
      }));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  for (let offset = 0; offset < urls.length; offset += 50) {
    await del(urls.slice(offset, offset + 50));
  }
}

export async function purgeAccountData(userId: string) {
  await Promise.all([
    removeLinkedBlobs(PUSH_DEVICE_PREFIX, 'userId', userId),
    removeLinkedBlobs(ARTICLE_REPORT_PREFIX, 'authorUserId', userId),
  ]);
}
