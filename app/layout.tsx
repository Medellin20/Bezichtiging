import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bezichtiging aanvragen | RealEstate',
  description: "Vraag een bezichtiging aan voor een woning in Nederland bij RealEstate.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
