import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size } = await context.params;
  if (!['180', '192', '512'].includes(size)) return new Response(null, { status: 404 });
  const width = Number(size);
  const bookSize = Math.round(width * 0.25);

  return new ImageResponse(
    h('div', { style: {
      display: 'flex', width, height: width, alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', backgroundColor: '#101c32', color: '#fff',
    } },
    h('div', { style: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#A60F2D', width: bookSize, height: bookSize,
      borderRadius: Math.round(bookSize * 0.24),
    } },
    h('svg', { viewBox: '0 0 48 48', width: Math.round(bookSize * 0.68), height: Math.round(bookSize * 0.68), fill: 'none' },
      h('path', { d: 'M24 14c-4-4-10-5-17-4v23c7-1 13 0 17 4 4-4 10-5 17-4V10c-7-1-13 0-17 4zm0 0v23', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    )),
    h('div', { style: { marginTop: Math.round(width * 0.025), fontSize: Math.round(width * 0.19), fontWeight: 800, letterSpacing: Math.round(width * 0.009) } }, 'FITA')),
    { width, height: width, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
