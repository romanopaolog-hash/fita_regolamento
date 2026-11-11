export const ARTICLE_REPORT_MAX_LENGTH = 2000;

export type ArticleReport = {
  id: string;
  articleId: string;
  articleTitle: string;
  sectionTitle: string;
  authorName: string;
  kind: 'errore' | 'suggerimento';
  message: string;
  createdAt: number;
};
