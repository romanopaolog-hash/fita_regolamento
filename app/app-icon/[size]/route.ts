import { createElement } from 'react';
import { ImageResponse } from 'next/og';

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size } = await context.params;
  if (!['180', '192', '512'].includes(size)) return new Response(null, { status: 404 });
  const width = Number(size);
  return new ImageResponse(
    createElement('div', {
      style: {
        display: 'flex', width, height: width, alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', backgroundColor: '#0B1B3D', color: '#fff',
      },
    },
    createElement('div', { style: { fontSize: Math.round(width * 0.27), fontWeight: 800 } }, 'FITA'),
    createElement('div', { style: { width: '48%', height: Math.round(width * 0.03), backgroundColor: '#A60F2D', borderRadius: 12 } })),
    { width, height: width, headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
