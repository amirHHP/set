'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { claimAdminRoleAction, PublicUser } from '@/app/actions/auth';
import { ShieldAlert, Key, CheckCircle, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface ClaimAdminCardProps {
  currentUser: PublicUser;
}

export default function ClaimAdminCard({ currentUser }: ClaimAdminCardProps) {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await claimAdminRoleAction(adminKey);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setError(res.error || 'کد دسترسی نامعتبر است.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در برقراری ارتباط با سرور.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '540px', margin: '40px auto', padding: '0 16px' }}>
      <div className="glass-card animate-fade-in" style={{ padding: '32px', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255, 107, 82, 0.1)',
            border: '2px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--primary)'
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '10px' }}>
          دسترسی به پنل مدیریت
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.7' }}>
          شما با حساب کاربری <strong style={{ color: 'var(--text-main)' }}>{currentUser.name}</strong> (@{currentUser.username}) وارد شده‌اید، اما این حساب در حال حاضر دسترسی مدیریت ندارد.
        </p>

        {success ? (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <CheckCircle size={20} />
            <span>تبریک! حساب شما به مدیر ارتقا یافت. در حال انتقال به پنل...</span>
          </div>
        ) : (
          <form onSubmit={handleClaim} style={{ textAlign: 'right' }}>
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={16} />
                <span>کد دسترسی مدیریت (Admin Setup Key)</span>
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="کد احراز هویت مدیریت را وارد کنید (مثلا admin123)"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                style={{ direction: 'ltr', textAlign: 'center' }}
                autoFocus
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                اگر برای اولین بار است که وارد می‌شوید و هنوز مدیری در سیستم تعریف نشده، نیازی به وارد کردن کد نیست یا از کد پیش‌فرض <code style={{ color: 'var(--secondary)' }}>admin123</code> استفاده کنید.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginBottom: '16px' }}
              disabled={loading}
            >
              <UserCheck size={18} />
              <span>{loading ? 'در حال بررسی...' : 'فعال‌سازی دسترسی مدیریت'}</span>
            </button>
          </form>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
          <Link
            href="/"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}
          >
            <ArrowRight size={16} />
            <span>بازگشت به صفحه اصلی</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
