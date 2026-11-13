'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import AdminPanelClient from '@/components/AdminPanelClient';
import ClaimAdminCard from '@/components/ClaimAdminCard';
import { getAiConfig } from '@/app/actions/settings';
import { getProducts } from '@/app/actions/shop';

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  // Guard: If not logged in, redirect to login
  if (!currentUser) {
    redirect('/login?callbackUrl=/admin');
  }

  // If logged in but not admin, show claim card
  if (currentUser.role !== 'admin') {
    return <ClaimAdminCard currentUser={currentUser} />;
  }

  // Fetch initial data on the server side
  const aiConfig = await getAiConfig();
  const prodRes = await getProducts();
  const initialProducts = prodRes.success && prodRes.products ? prodRes.products : [];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '10px 0 50px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
          پنل مدیریت سیستم
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          مدیریت کاربران رجیستر شده و وضعیت ورود، تنظیم کلیدهای ارائه‌دهندگان هوش مصنوعی و محصولات فروشگاه
        </p>
      </div>

      <AdminPanelClient 
        initialAiConfig={aiConfig} 
        initialProducts={initialProducts} 
        currentAdminId={currentUser.id} 
      />
    </div>
  );
}
