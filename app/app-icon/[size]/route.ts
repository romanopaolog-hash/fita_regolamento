import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createElement } from 'react';
import { ImageResponse } from 'next/og';

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size } = await context.params;
  if (!['180', '192', '512'].includes(size)) return new Response(null, { status: 404 });
  const width = Number(size);
  const png = await readFile(join(process.cwd(), 'public/fita-home-icon.png'));

  return new ImageResponse(
    createElement('img', { src: 'data:image/png;base64,' + png.toString('base64'), width, height: width }),
    { width, height: width, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
