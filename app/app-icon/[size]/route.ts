import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size } = await context.params;
  if (!['180', '192', '512'].includes(size)) return new Response(null, { status: 404 });
  const width = Number(size);
  const stripe = Math.max(2, Math.round(width * 0.08));

  return new ImageResponse(
    h('div', { style: {
      position: 'relative', display: 'flex', width, height: width,
      alignItems: 'center', justifyContent: 'center', paddingBottom: stripe,
      backgroundColor: '#0B1B3D', color: '#fff',
    } },
    h('div', { style: { fontSize: Math.round(width * 0.4), fontWeight: 900, lineHeight: 1 } }, 'FITA'),
    h('div', { style: {
      position: 'absolute', left: 0, right: 0, bottom: 0, height: stripe,
      backgroundColor: '#A60F2D',
    } })),
    { width, height: width, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
