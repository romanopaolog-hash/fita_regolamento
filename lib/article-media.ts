export const ARTICLE_MEDIA_PREFIX = 'fita-regolamento/media/';
export const ARTICLE_MEDIA_MAX_BYTES = 100 * 1024 * 1024;

export const ARTICLE_MEDIA_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
} as const;

export async function uploadArticleMedia(file: File, videoOnly = false) {
  type Extension = keyof typeof ARTICLE_MEDIA_TYPES;
  const extension = file.name.split('.').pop()?.toLowerCase() as Extension;
  const contentType = (Object.values(ARTICLE_MEDIA_TYPES).find(type => type === file.type)
    ?? (Object.hasOwn(ARTICLE_MEDIA_TYPES, extension) ? ARTICLE_MEDIA_TYPES[extension] : undefined));
  if (!contentType || (videoOnly && !contentType.startsWith('video/'))) {
    throw new Error(videoOnly
      ? 'Scegli un video MP4, MOV o WebM.'
      : 'Scegli una foto JPG, PNG, WebP, GIF o AVIF, oppure un video MP4, MOV o WebM.');
  }
  if (!file.size || file.size > ARTICLE_MEDIA_MAX_BYTES) {
    throw new Error('Scegli un file non vuoto fino a 100 MB.');
  }

  const suffix = Object.entries(ARTICLE_MEDIA_TYPES).find(([, type]) => type === contentType)?.[0];
  const { upload } = await import('@vercel/blob/client');
  const blob = await upload(`${ARTICLE_MEDIA_PREFIX}${crypto.randomUUID()}.${suffix}`, file, {
    access: 'private',
    handleUploadUrl: '/api/articles/media',
    contentType,
    multipart: file.size > 8 * 1024 * 1024,
  });
  return {
    url: `/api/articles/media?pathname=${encodeURIComponent(blob.pathname)}`,
    type: contentType.startsWith('video/') ? 'video' as const : 'image' as const,
  };
}
