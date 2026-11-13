'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  loginAction,
  registerAction,
  sendEmailOtpAction,
  registerWithOtpAction,
  sendLoginOtpAction,
  loginWithOtpAction,
} from '@/app/actions/auth';
import {
  LogIn,
  UserPlus,
  AlertCircle,
  Mail,
  Key,
  RefreshCw,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

type AuthMode = 'login' | 'register';
type RegisterMethod = 'otp' | 'password';
type LoginMethod = 'password' | 'otp';

export default function LoginPage() {
  const router = useRouter();

  // Mode & Method states
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>('otp');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // OTP Step states (1: Enter email, 2: Enter code)
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [countdown, setCountdown] = useState(0);

  // Status states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devCodeBanner, setDevCodeBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const resetFeedback = () => {
    setError('');
    setSuccessMsg('');
    setDevCodeBanner(null);
  };

  // Switch between Login and Register
  const handleSwitchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setOtpStep(1);
    resetFeedback();
  };

  // 1. Send OTP for Registration
  const handleSendRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (!name.trim()) {
      setError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }
    if (!email.trim()) {
      setError('لطفاً آدرس ایمیل خود را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendEmailOtpAction(email);
      if (res.success) {
        setSuccessMsg(res.message || 'کد تایید به ایمیل شما ارسال شد.');
        if (res.devCode) {
          setDevCodeBanner(res.devCode);
          setOtpCode(res.devCode); // Auto-fill in dev mode for convenience
        }
        setOtpStep(2);
        setCountdown(60);
      } else {
        setError(res.error || 'خطا در ارسال کد تایید.');
      }
    } catch (err: any) {
      console.error(err);
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Complete Registration with OTP
  const handleCompleteRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('لطفاً کد تایید ۶ رقمی را به درستی وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithOtpAction(name, email, otpCode, password);
      if (res.success) {
        router.refresh();
        router.push('/');
      } else {
        setError(res.error || 'خطایی در ثبت‌نام رخ داد.');
      }
    } catch (err: any) {
      console.error(err);
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Standard Registration with Username + Password
  const handleStandardRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    setLoading(true);
    try {
      const res = await registerAction(name, username, password, email || undefined);
      if (res.success) {
        router.refresh();
        router.push('/');
      } else {
        setError(res.error || 'خطایی در ثبت‌نام رخ داد.');
      }
    } catch (err: any) {
      console.error(err);
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Standard Login (Username/Email + Password)
  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    setLoading(true);
    try {
      const res = await loginAction(username, password);
      if (res.success) {
        router.refresh();
        router.push('/');
      } else {
        setError(res.error || 'خطایی رخ داد.');
      }
    } catch (err: any) {
      console.error(err);
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Send OTP for Login
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (!email.trim()) {
      setError('لطفاً آدرس ایمیل خود را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendLoginOtpAction(email);
      if (res.success) {
        setSuccessMsg(res.message || 'کد تایید به ایمیل شما ارسال شد.');
        if (res.devCode) {
          setDevCodeBanner(res.devCode);
          setOtpCode(res.devCode);
        }
        setOtpStep(2);
        setCountdown(60);
      } else {
        setError(res.error || 'خطا در ارسال کد تایید.');
      }
    } catch (err: any) {
      console.error(err);
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Complete Login with OTP
  const handleCompleteLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('لطفاً کد ۶ رقمی را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithOtpAction(email, otpCode);
      if (res.success) {
        router.refresh();
        router.push('/');
      } else {
        setError(res.error || 'خطا در ورود.');
      }
    } catch (err: any) {
      console.error(err);
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
      padding: '40px 16px',
      minHeight: '80vh'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)' }}>
            {authMode === 'login' ? 'ورود به سِت' : 'ثبت‌نام در سِت'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {authMode === 'login'
              ? 'برای دسترسی به برنامه تمرینی، تغذیه و ابعاد بدنی'
              : 'به خانواده بانوان ورزشکار سِت بپیوندید'}
          </p>
        </div>

        {/* Mode Toggle Pills (Login / Register) */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '20px',
          border: '1px solid var(--border)'
        }}>
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '9px',
              background: authMode === 'register' ? 'var(--primary)' : 'transparent',
              color: authMode === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: authMode === 'register' ? '700' : '500',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              fontFamily: 'inherit'
            }}
          >
            ثبت‌نام جدید
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '9px',
              background: authMode === 'login' ? 'var(--primary)' : 'transparent',
              color: authMode === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: authMode === 'login' ? '700' : '500',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              fontFamily: 'inherit'
            }}
          >
            ورود به حساب
          </button>
        </div>

        {/* Error message */}
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
            marginBottom: '16px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            padding: '12px',
            borderRadius: '10px',
            color: '#22c55e',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dev Mode Banner (shown when SMTP is not configured) */}
        {devCodeBanner && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px dashed #f43f5e',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              کد آزمایشی ارسال شده (توسعه/تست):
            </span>
            <strong style={{ fontSize: '1.4rem', letterSpacing: '6px', color: '#ff6b52', fontFamily: 'monospace' }}>
              {devCodeBanner}
            </strong>
          </div>
        )}

        {/* ---------------- REGISTER MODE ---------------- */}
        {authMode === 'register' && (
          <div>
            {/* Registration Method Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => { setRegisterMethod('otp'); setOtpStep(1); resetFeedback(); }}
                className="btn"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: '0.82rem',
                  borderRadius: '10px',
                  background: registerMethod === 'otp' ? 'rgba(255, 107, 82, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: registerMethod === 'otp' ? 'var(--primary)' : 'var(--text-muted)',
                  border: registerMethod === 'otp' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  gap: '6px'
                }}
              >
                <Mail size={15} />
                <span>کد تایید ایمیلی (OTP)</span>
              </button>

              <button
                type="button"
                onClick={() => { setRegisterMethod('password'); resetFeedback(); }}
                className="btn"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: '0.82rem',
                  borderRadius: '10px',
                  background: registerMethod === 'password' ? 'rgba(255, 107, 82, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: registerMethod === 'password' ? 'var(--primary)' : 'var(--text-muted)',
                  border: registerMethod === 'password' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  gap: '6px'
                }}
              >
                <Key size={15} />
                <span>نام کاربری و رمز</span>
              </button>
            </div>

            {/* OTP Registration */}
            {registerMethod === 'otp' && (
              <>
                {otpStep === 1 ? (
                  <form onSubmit={handleSendRegisterOtp}>
                    <div className="form-group">
                      <label className="form-label">نام و نام خانوادگی</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="مثال: زهرا مرادی"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label className="form-label">آدرس ایمیل</label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        dir="ltr"
                        autoCapitalize="none"
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        کد تایید ۶ رقمی به این آدرس ارسال خواهد شد.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                          <span>در حال ارسال کد...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={18} />
                          <span>دریافت کد تایید ایمیل</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCompleteRegisterOtp}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>ایمیل: </span>
                        <strong style={{ color: 'var(--text-main)', direction: 'ltr', display: 'inline-block' }}>{email}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setOtpStep(1); resetFeedback(); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        تغییر ایمیل
                      </button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">کد تایید ۶ رقمی</label>
                      <input
                        type="text"
                        maxLength={6}
                        className="input-field"
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        required
                        dir="ltr"
                        style={{
                          textAlign: 'center',
                          fontSize: '1.4rem',
                          letterSpacing: '8px',
                          fontFamily: 'monospace'
                        }}
                        autoFocus
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label className="form-label">
                        رمز عبور <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(اختیاری - برای ورودهای بعدی)</span>
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="حداقل ۶ کاراکتر (اختیاری)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginBottom: '12px' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                          <span>در حال تایید و ثبت‌نام...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} />
                          <span>تکمیل ثبت‌نام و ورود</span>
                        </>
                      )}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                      {countdown > 0 ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          امکان ارسال مجدد کد تا {countdown} ثانیه دیگر
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendRegisterOtp}
                          disabled={loading}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          ارسال مجدد کد تایید
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Standard Username + Password Registration */}
            {registerMethod === 'password' && (
              <form onSubmit={handleStandardRegister}>
                <div className="form-group">
                  <label className="form-label">نام و نام خانوادگی</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: زهرا مرادی"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

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
                    dir="ltr"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    ایمیل <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(اختیاری)</span>
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoCapitalize="none"
                    dir="ltr"
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
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>ثبت‌نام</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ---------------- LOGIN MODE ---------------- */}
        {authMode === 'login' && (
          <div>
            {/* Login Method Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => { setLoginMethod('password'); resetFeedback(); }}
                className="btn"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: '0.82rem',
                  borderRadius: '10px',
                  background: loginMethod === 'password' ? 'rgba(255, 107, 82, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: loginMethod === 'password' ? 'var(--primary)' : 'var(--text-muted)',
                  border: loginMethod === 'password' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  gap: '6px'
                }}
              >
                <Key size={15} />
                <span>ورود با رمز عبور</span>
              </button>

              <button
                type="button"
                onClick={() => { setLoginMethod('otp'); setOtpStep(1); resetFeedback(); }}
                className="btn"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: '0.82rem',
                  borderRadius: '10px',
                  background: loginMethod === 'otp' ? 'rgba(255, 107, 82, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: loginMethod === 'otp' ? 'var(--primary)' : 'var(--text-muted)',
                  border: loginMethod === 'otp' ? '1px solid var(--primary)' : '1px solid var(--border)',
                  gap: '6px'
                }}
              >
                <Mail size={15} />
                <span>کد یکبار مصرف (OTP)</span>
              </button>
            </div>

            {/* Standard Password Login */}
            {loginMethod === 'password' && (
              <form onSubmit={handleStandardLogin}>
                <div className="form-group">
                  <label className="form-label">نام کاربری یا ایمیل</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="نام کاربری یا آدرس ایمیل"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoCapitalize="none"
                    dir="ltr"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">رمز عبور</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="رمز عبور حساب"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>در حال ورود...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>ورود</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OTP Login */}
            {loginMethod === 'otp' && (
              <>
                {otpStep === 1 ? (
                  <form onSubmit={handleSendLoginOtp}>
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label className="form-label">آدرس ایمیل حساب کاربری</label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        dir="ltr"
                        autoCapitalize="none"
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        کد تایید ورود برای شما ایمیل خواهد شد.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                          <span>در حال ارسال کد...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={18} />
                          <span>دریافت کد تایید ورود</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCompleteLoginOtp}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>ایمیل: </span>
                        <strong style={{ color: 'var(--text-main)', direction: 'ltr', display: 'inline-block' }}>{email}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setOtpStep(1); resetFeedback(); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        تغییر ایمیل
                      </button>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label className="form-label">کد ورود ۶ رقمی</label>
                      <input
                        type="text"
                        maxLength={6}
                        className="input-field"
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        required
                        dir="ltr"
                        style={{
                          textAlign: 'center',
                          fontSize: '1.4rem',
                          letterSpacing: '8px',
                          fontFamily: 'monospace'
                        }}
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginBottom: '12px' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                          <span>در حال تایید و ورود...</span>
                        </>
                      ) : (
                        <>
                          <LogIn size={18} />
                          <span>ورود به حساب</span>
                        </>
                      )}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                      {countdown > 0 ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          امکان ارسال مجدد کد تا {countdown} ثانیه دیگر
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendLoginOtp}
                          disabled={loading}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          ارسال مجدد کد ورود
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer Toggle */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {authMode === 'login' ? (
            <span>
              هنوز حساب کاربری ندارید؟{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}
              >
                ثبت‌نام کنید
              </button>
            </span>
          ) : (
            <span>
              قبلاً در سِت عضو شده‌اید؟{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
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
