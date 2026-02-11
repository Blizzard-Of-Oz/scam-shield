export default function GoogleProvider(config: { clientId: string; clientSecret: string }) {
  return { id: 'google', name: 'Google', type: 'oauth', ...config };
}
