import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Tcharts',
    template: '%s · Tcharts',
  },
  description: 'Accrual-first, multi-company SaaS accounting platform.',
  applicationName: 'Tcharts',
  robots: { index: false, follow: false }, // private app
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3DBF62',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
