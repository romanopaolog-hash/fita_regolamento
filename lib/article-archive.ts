import { get, head } from '@vercel/blob';

import type { SectionTab } from './section-tabs';

export const ARTICLES_PATH = 'fita-regolamento/articles.json';

export type ArticleSection = {
  id: string;
  hidden?: boolean;
  sectionTabs?: SectionTab[];
  subsections: Array<{ id: string; title: string; content: string; hidden?: boolean; tabId?: string }>;
  documents?: Array<{ tabId?: string }>;
  showcaseVideos?: Array<{ tabId?: string }>;
  [key: string]: unknown;
};

export async function readArticles() {
  const blob = await get(ARTICLES_PATH, { access: 'private', useCache: false });
  if (!blob) return { sections: null, etag: null, url: null };

  const text = await new Response(blob.stream).text();
  const data = JSON.parse(text) as { sections?: ArticleSection[] };
  if (!Array.isArray(data.sections)) throw new Error('Invalid shared article data');

  const metadata = await head(blob.blob.url);
  return { sections: data.sections, etag: metadata.etag, url: blob.blob.url };
}

