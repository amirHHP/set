'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import AdminPanelClient from '@/components/AdminPanelClient';
import { getAiConfig } from '@/app/actions/settings';
import { getProducts } from '@/app/actions/shop';

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  // Guard: Redirect to login or home if not authorized
  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'admin') {
    redirect('/');
  }

  // Fetch initial data on the server side
  const aiConfig = await getAiConfig();
  const prodRes = await getProducts();
  const initialProducts = prodRes.success && prodRes.products ? prodRes.products : [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 0 50px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
          پنل مدیریت سیستم
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          تنظیمات کلیدهای هوش مصنوعی، مدیریت کالاهای فروشگاه و کنترل کاربران سیستم
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
