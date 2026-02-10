import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Scam Shield',
    short_name: 'ScamShield',
    description: 'Privacy-first scam risk assessment for suspicious messages and links.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#1d75f4',
  };
}
