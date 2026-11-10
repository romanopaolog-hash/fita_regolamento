import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'FITA Regolamento',
    short_name: 'FITA',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F4F6F9',
    theme_color: '#0B1B3D',
    icons: [
      { src: '/app-icon/192?v=3', sizes: '192x192', type: 'image/png' },
      { src: '/app-icon/512?v=3', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/app-icon/512?v=3', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
