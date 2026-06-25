import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import { getCurrentUser } from '@/app/actions/auth';

export const metadata: Metadata = {
  title: 'سِت | ورزش و تندرستی بانوان',
  description: 'پلتفرم تخصصی ثبت اندازه، دریافت برنامه تمرینی از هوش مصنوعی و خرید مکمل برای بانوان ورزشکار',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="fa" dir="rtl">
      <body>
        <Header currentUser={currentUser} />
        <main style={{ minHeight: 'calc(100vh - 70px)', padding: '20px 16px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
