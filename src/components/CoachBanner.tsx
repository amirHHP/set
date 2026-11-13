/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PublicUser } from '@/app/actions/auth';
import { linkCoachByCodeAction, unlinkCoachAction, getTraineeCoachNotesAction } from '@/app/actions/coach';
import {
  Award,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';

interface CoachBannerProps {
  currentUser: PublicUser | null;
  compact?: boolean;
}

export default function CoachBanner({ currentUser, compact = false }: CoachBannerProps) {
  const router = useRouter();
  const [coachInput, setCoachInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notes, setNotes] = useState<Array<{ id: string; note: string; createdAt: string; coachName: string }>>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // If user has coach, load coach notes
  useEffect(() => {
    if (currentUser?.coachId) {
      setLoadingNotes(true);
      getTraineeCoachNotesAction().then((res) => {
        if (res.success && res.notes) {
          setNotes(res.notes);
        }
      }).catch(console.error).finally(() => setLoadingNotes(false));
    }
  }, [currentUser?.coachId]);

  if (!currentUser) return null;

  const handleConnectCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachInput.trim()) return;

    setConnecting(true);
    setError('');
    setSuccess('');

    try {
      const res = await linkCoachByCodeAction(coachInput);
      if (res.success && res.coach) {
        setSuccess(`با موفقیت به تیم مربی ${res.coach.name} پیوستید!`);
        setCoachInput('');
        router.refresh();
      } else {
        setError(res.error || 'خطا در اتصال به مربی.');
      }
    } catch (err: any) {
      console.error(err);
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('آیا از قطع ارتباط با مربی اطمینان دارید؟ مربی دیگر به روند اندازه‌گیری و تمرینات شما دسترسی نخواهد داشت.')) return;

    try {
      const res = await unlinkCoachAction();
      if (res.success) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Case 1: Trainee HAS a coach
  if (currentUser.coach) {
    const coach = currentUser.coach;

    if (compact) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 82, 0.1) 0%, rgba(212, 163, 115, 0.08) 100%)',
          border: '1px solid rgba(255, 107, 82, 0.25)',
          borderRadius: '14px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.9rem'
            }}>
              {coach.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                فضای تمرینی تحت نظارت مربی {coach.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {coach.coachBio || 'اندازه‌ها و تمرین‌های شما مستقیماً توسط مربی بررسی می‌شود.'}
              </div>
            </div>
          </div>

          {notes.length > 0 && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '4px' }}
            >
              <MessageSquare size={13} color="var(--primary)" />
              <span>{notes.length} پیام از مربی</span>
              {showNotes ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      );
    }

    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 107, 82, 0.12) 0%, rgba(212, 163, 115, 0.08) 100%)',
        border: '1px solid rgba(255, 107, 82, 0.25)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '1.4rem',
              boxShadow: '0 8px 20px rgba(255, 107, 82, 0.25)',
              flexShrink: 0
            }}>
              {coach.name.charAt(0)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-primary" style={{ padding: '2px 10px', fontSize: '0.72rem', gap: '4px' }}>
                  <Award size={12} />
                  <span>ورزشکار تیم اختصاصی</span>
                </span>
                {coach.coachPhone && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} />
                    <span style={{ direction: 'ltr' }}>{coach.coachPhone}</span>
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '4px', color: 'var(--text-main)' }}>
                مربی اختصاصی شما: {coach.name}
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '600px', lineHeight: '1.6', margin: 0 }}>
                {coach.coachBio || 'برنامه‌های تمرینی و تغییرات اندازه‌گیری‌های شما مستقیماً در پنل مربی پایش می‌شود.'}
              </p>

              {coach.coachWelcomeMessage && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRight: '3px solid var(--primary)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginTop: '12px',
                  fontSize: '0.82rem',
                  color: 'var(--text-main)',
                  lineHeight: '1.6'
                }}>
                  💬 <strong>پیام مربی:</strong> «{coach.coachWelcomeMessage}»
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {notes.length > 0 && (
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }}
              >
                <MessageSquare size={14} color="var(--primary)" />
                <span>{notes.length} توصیه ثبت‌شده</span>
                {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            <button
              onClick={handleDisconnect}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                padding: '8px 12px',
                fontSize: '0.78rem',
                gap: '4px'
              }}
              title="تغییر یا قطع ارتباط با مربی"
            >
              <LogOut size={13} />
              <span>تغییر مربی</span>
            </button>
          </div>
        </div>

        {/* Coach Notes Drawer */}
        {showNotes && notes.length > 0 && (
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
              توصیه‌ها و نکات ارسالی از طرف مربی {coach.name}:
            </strong>
            {notes.map((n) => (
              <div key={n.id} style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.85rem'
              }}>
                <p style={{ margin: 0, lineHeight: '1.6' }}>{n.note}</p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  {new Date(n.createdAt).toLocaleDateString('fa-IR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Case 2: Trainee DOES NOT HAVE a coach yet
  // If role is coach or admin, don't show the invitation to link a coach
  if (currentUser.role === 'coach' || currentUser.role === 'admin') {
    return null;
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px dashed var(--border)',
      borderRadius: '18px',
      padding: '20px 24px',
      marginBottom: '32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(255, 107, 82, 0.1)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <UserCheck size={22} />
        </div>
        <div>
          <strong style={{ fontSize: '0.98rem', display: 'block', marginBottom: '2px' }}>
            مربی باشگاهی دارید؟
          </strong>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            کد ورود مربی خود را وارد کنید تا برنامه‌ها و روند تغییرات فیزیکی شما در اختیار مربی قرار گیرد.
          </span>
        </div>
      </div>

      <form onSubmit={handleConnectCoach} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input-field"
          placeholder="کد مربی (مثال: COACH-1234)"
          value={coachInput}
          onChange={(e) => setCoachInput(e.target.value.toUpperCase())}
          dir="ltr"
          style={{ width: '190px', padding: '8px 12px', fontSize: '0.85rem', fontWeight: '600' }}
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '6px' }}
          disabled={connecting}
        >
          {connecting ? <RefreshCw size={14} className="animate-spin" /> : <Award size={14} />}
          <span>{connecting ? 'در حال اتصال...' : 'اتصال به مربی'}</span>
        </button>
      </form>

      {error && (
        <div style={{ width: '100%', color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ width: '100%', color: '#22c55e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle size={14} />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
