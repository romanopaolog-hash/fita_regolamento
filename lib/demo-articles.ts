const demoArticleIds = new Set(['k1', 'k2', 'vr1', 'p1', 'f1']);

export function isDemoArticle(id: string) {
  return demoArticleIds.has(id);
}
