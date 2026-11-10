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
    icons: [{ src: '/fita-app.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
