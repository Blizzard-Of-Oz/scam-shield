import type { Metadata } from 'next';
import { TopNav } from '@/components/TopNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scam Shield',
  description: 'Privacy-first scam risk assessment for messages and links.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <TopNav />
          {children}
        </div>
      </body>
    </html>
  );
}
