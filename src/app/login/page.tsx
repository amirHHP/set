'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, registerAction } from '@/app/actions/auth';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await loginAction(username, password);
        if (res.success) {
          router.refresh();
          router.push('/');
        } else {
          setError(res.error || 'خطایی رخ داد.');
        }
      } else {
        const res = await registerAction(name, username, password);
        if (res.success) {
          router.refresh();
          router.push('/');
        } else {
          setError(res.error || 'خطایی رخ داد.');
        }
      }
    } catch (err) {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 0',
      minHeight: '80vh'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
            {isLogin ? 'ورود به حساب کاربری' : 'ثبت‌نام در سِت'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? 'برای ورود به برنامه ورزشی و اندازه‌گیری‌ها' : 'به خانواده بانوان ورزشکار سِت بپیوندید'}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '12px',
            borderRadius: '10px',
            color: '#ef4444',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">نام و نام خانوادگی</label>
              <input
                type="text"
                className="input-field"
                placeholder="مثال: زهرا مرادی"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">نام کاربری</label>
            <input
              type="text"
              className="input-field"
              placeholder="نام کاربری به انگلیسی (مثال: zahra)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoCapitalize="none"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">رمز عبور</label>
            <input
              type="password"
              className="input-field"
              placeholder="حداقل ۶ کاراکتر"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'در حال ثبت...' : isLogin ? (
              <>
                <LogIn size={18} />
                <span>ورود</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>ثبت‌نام</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isLogin ? (
            <span>
              حساب کاربری ندارید؟{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}
              >
                ثبت‌نام کنید
              </button>
            </span>
          ) : (
            <span>
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}
              >
                وارد شوید
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
