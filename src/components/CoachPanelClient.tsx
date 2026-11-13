/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import {
  CoachDashboardData,
  TraineeSummary,
  TraineeDetailData,
  getTraineeDetailsAction,
  addCoachNoteAction,
  deleteCoachNoteAction,
  updateCoachProfileAction,
  assignCustomWorkoutToTraineeAction,
  getCoachDashboardData,
} from '@/app/actions/coach';
import {
  Users,
  Award,
  Copy,
  Check,
  Settings,
  Search,
  Scale,
  Dumbbell,
  MessageSquare,
  Calendar,
  ChevronLeft,
  X,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  Share2,
  Phone,
  Info,
  Clock,
  ExternalLink,
  RefreshCw,
  Send,
} from 'lucide-react';

interface CoachPanelClientProps {
  initialData: CoachDashboardData | null;
  currentUserId: string;
}

export default function CoachPanelClient({ initialData, currentUserId }: CoachPanelClientProps) {
  const [data, setData] = useState<CoachDashboardData | null>(initialData);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Trainee Modal State
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null);
  const [traineeDetail, setTraineeDetail] = useState<TraineeDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalTab, setModalTab] = useState<'sizes' | 'workouts' | 'notes'>('sizes');

  // New Note State
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  // Coach Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(data?.coach.name || '');
  const [editCode, setEditCode] = useState(data?.coach.coachCode || '');
  const [editBio, setEditBio] = useState(data?.coach.coachBio || '');
  const [editPhone, setEditPhone] = useState(data?.coach.coachPhone || '');
  const [editWelcome, setEditWelcome] = useState(data?.coach.coachWelcomeMessage || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Custom Workout Creator Modal
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [workoutGoal, setWorkoutGoal] = useState('عضله‌سازی و فرم‌دهی اختصاصی');
  const [workoutName, setWorkoutName] = useState('برنامه اختصاصی مربی');
  const [workoutDays, setWorkoutDays] = useState([
    {
      dayName: 'روز ۱: بالاتنه و شکم',
      exercises: [
        { id: '1', name: 'پرس سینه دمبل', setsCount: 4, reps: '10-12', rest: '60 ثانیه' },
        { id: '2', name: 'زیربغل قایقی سیم‌کش', setsCount: 4, reps: '12', rest: '60 ثانیه' },
        { id: '3', name: 'سرشانه نشر از جانب', setsCount: 3, reps: '15', rest: '45 ثانیه' },
        { id: '4', name: 'پلانک', setsCount: 3, reps: '45 ثانیه', rest: '45 ثانیه' },
      ]
    },
    {
      dayName: 'روز ۲: پایین‌تنه و باسن',
      exercises: [
        { id: '5', name: 'اسکوات با هالتر یا دمبل', setsCount: 4, reps: '10-12', rest: '90 ثانیه' },
        { id: '6', name: 'هیپ تراست با هالتر', setsCount: 4, reps: '12', rest: '90 ثانیه' },
        { id: '7', name: 'لانجز راه رفتنی', setsCount: 3, reps: '12 هر پا', rest: '60 ثانیه' },
      ]
    }
  ]);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [workoutError, setWorkoutError] = useState('');

  // Reload dashboard data
  const reloadDashboard = async () => {
    const res = await getCoachDashboardData();
    if (res.success && res.data) {
      setData(res.data);
    }
  };

  // Copy helpers
  const handleCopyCode = () => {
    if (!data?.coach.coachCode) return;
    navigator.clipboard.writeText(data.coach.coachCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    if (!data?.coach.coachCode) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${origin}/login?coach=${encodeURIComponent(data.coach.coachCode)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Open Trainee Dossier
  const handleOpenTrainee = async (traineeId: string) => {
    setSelectedTraineeId(traineeId);
    setTraineeDetail(null);
    setLoadingDetail(true);
    setModalTab('sizes');
    setNoteError('');

    try {
      const res = await getTraineeDetailsAction(traineeId);
      if (res.success && res.data) {
        setTraineeDetail(res.data);
      }
    } catch (err) {
      console.error('Error loading trainee details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraineeId || !noteText.trim()) return;

    setSubmittingNote(true);
    setNoteError('');

    try {
      const res = await addCoachNoteAction(selectedTraineeId, noteText);
      if (res.success && res.note) {
        setNoteText('');
        if (traineeDetail) {
          setTraineeDetail({
            ...traineeDetail,
            notes: [res.note, ...traineeDetail.notes]
          });
        }
        reloadDashboard();
      } else {
        setNoteError(res.error || 'خطا در ثبت یادداشت.');
      }
    } catch (err) {
      console.error(err);
      setNoteError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('آیا از حذف این یادداشت اطمینان دارید؟')) return;

    try {
      const res = await deleteCoachNoteAction(noteId);
      if (res.success && traineeDetail) {
        setTraineeDetail({
          ...traineeDetail,
          notes: traineeDetail.notes.filter(n => n.id !== noteId)
        });
        reloadDashboard();
      }
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  // Save Coach Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setSavingProfile(true);

    try {
      const res = await updateCoachProfileAction({
        name: editName,
        coachCode: editCode,
        coachBio: editBio,
        coachPhone: editPhone,
        coachWelcomeMessage: editWelcome,
      });

      if (res.success) {
        setProfileSuccess(true);
        await reloadDashboard();
        setTimeout(() => {
          setProfileSuccess(false);
          setProfileModalOpen(false);
        }, 1500);
      } else {
        setProfileError(res.error || 'خطا در ذخیره مشخصات.');
      }
    } catch (err) {
      console.error(err);
      setProfileError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Custom Workout Program
  const handleSaveWorkout = async () => {
    if (!selectedTraineeId) return;
    setSavingWorkout(true);
    setWorkoutError('');

    try {
      const res = await assignCustomWorkoutToTraineeAction(selectedTraineeId, {
        goal: workoutGoal,
        programName: workoutName,
        days: workoutDays,
      });

      if (res.success) {
        setWorkoutModalOpen(false);
        // Refresh trainee detail
        handleOpenTrainee(selectedTraineeId);
        reloadDashboard();
      } else {
        setWorkoutError(res.error || 'خطا در ثبت برنامه.');
      }
    } catch (err) {
      console.error(err);
      setWorkoutError('خطا در برقراری ارتباط.');
    } finally {
      setSavingWorkout(false);
    }
  };

  const filteredTrainees = (data?.trainees || []).filter(t => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || t.username.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* ---------------- COACH HEADER HERO ---------------- */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 107, 82, 0.12) 0%, rgba(212, 163, 115, 0.08) 100%)',
        border: '1px solid rgba(255, 107, 82, 0.2)',
        borderRadius: '24px',
        padding: '32px 28px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-primary" style={{ padding: '4px 12px', fontSize: '0.8rem', gap: '6px' }}>
                <Award size={14} />
                <span>پنل مربیگری و مدیریت ورزشکاران</span>
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '8px', color: 'var(--text-main)' }}>
              سلام، مربی {data?.coach.name} عزیز 🏋️
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', lineHeight: '1.7' }}>
              {data?.coach.coachBio || 'کد دعوت اختصاصی خود را در اختیار اعضا و شاگردانتان قرار دهید تا تمام اندازه‌گیری‌ها و تمرینات آن‌ها در این پنل زیر نظر شما باشد.'}
            </p>
          </div>

          {/* Coach Invite Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px 20px',
            minWidth: '280px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>کد ورود / دعوت شاگردان:</span>
              <button
                onClick={() => {
                  setEditName(data?.coach.name || '');
                  setEditCode(data?.coach.coachCode || '');
                  setEditBio(data?.coach.coachBio || '');
                  setEditPhone(data?.coach.coachPhone || '');
                  setEditWelcome(data?.coach.coachWelcomeMessage || '');
                  setProfileModalOpen(true);
                }}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                title="تنظیمات پروفایل و کد"
              >
                <Settings size={13} />
                <span>ویرایش</span>
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '8px 12px',
              borderRadius: '10px',
              marginBottom: '10px'
            }}>
              <strong style={{
                fontSize: '1.3rem',
                letterSpacing: '2px',
                color: 'var(--primary)',
                fontFamily: 'monospace',
                direction: 'ltr'
              }}>
                {data?.coach.coachCode || '---'}
              </strong>
              <button
                onClick={handleCopyCode}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCode ? 'کپی شد!' : 'کپی کد'}</span>
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '8px', fontSize: '0.82rem', gap: '6px' }}
            >
              {copiedLink ? <Check size={14} color="#22c55e" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'لینک دعوت کپی شد!' : 'کپی لینک مستقیم عضویت شاگرد'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- STATS OVERVIEW ---------------- */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255, 107, 82, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>تعداد شاگردان فعال</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>
              {(data?.stats.totalTrainees || 0).toLocaleString('fa-IR')}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa'
          }}>
            <Dumbbell size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ورزشکاران با تمرین در این هفته</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>
              {(data?.stats.activeWorkoutsThisWeek || 0).toLocaleString('fa-IR')}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#22c55e'
          }}>
            <Scale size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ثبت اندازه‌گیری در این ماه</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>
              {(data?.stats.sizesLoggedThisMonth || 0).toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- TRAINEES LIST SECTION ---------------- */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '4px' }}>لیست شاگردان و اعضا</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              اعضایی که با کد ورود شما ثبت‌نام کرده یا به تیم شما ملحق شده‌اند
            </p>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="جستجو با نام یا نام کاربری..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: '36px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {filteredTrainees.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '50px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px dashed var(--border)'
          }}>
            <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px' }}>
              {searchQuery ? 'هیچ شاگردی با این مشخصات یافت نشد.' : 'هنوز شاگردی به تیم شما متصل نشده است.'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 20px' }}>
              کد <code>{data?.coach.coachCode}</code> را به شاگردانتان بدهید یا لینک مستقیم را برای آن‌ها بفرستید تا پس از ثبت‌نام به این پنل اضافه شوند.
            </p>
            <button onClick={handleCopyLink} className="btn btn-primary" style={{ fontSize: '0.85rem', margin: '0 auto' }}>
              <Copy size={16} />
              <span>کپی لینک دعوت شاگرد</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {filteredTrainees.map((trainee) => (
              <div
                key={trainee.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'border-color 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '1.1rem'
                      }}>
                        {trainee.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ fontSize: '1rem', display: 'block' }}>{trainee.name}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', direction: 'ltr', display: 'inline-block' }}>
                          @{trainee.username}
                        </span>
                      </div>
                    </div>

                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {trainee.gender === 'male' ? 'آقا' : 'خانم'}
                    </span>
                  </div>

                  {/* Trainee Quick Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>آخرین وزن:</span>
                      {trainee.latestSize ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <strong>{trainee.latestSize.weight} کیلو</strong>
                          {typeof trainee.weightChange === 'number' && trainee.weightChange !== 0 && (
                            <span style={{
                              fontSize: '0.7rem',
                              color: trainee.weightChange < 0 ? '#22c55e' : '#f59e0b',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              ({trainee.weightChange > 0 ? '+' : ''}{trainee.weightChange})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>ثبت نشده</span>
                      )}
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>برنامه ورزشی:</span>
                      <strong style={{ display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trainee.activeProgramName || 'بدون برنامه'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>تاریخ ثبت اندازه‌ها: {trainee.totalSizesCount > 0 ? `${trainee.totalSizesCount} بار` : 'هنوز ندارد'}</span>
                    <span>جلسات تمرین: {trainee.totalLogsCount} جلسه</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenTrainee(trainee.id)}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.88rem', justifyContent: 'center' }}
                >
                  <span>مشاهده پرونده و رهگیری</span>
                  <ChevronLeft size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- TRAINEE DOSSIER MODAL ---------------- */}
      {selectedTraineeId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#12151d',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px' }}>
                  پرونده ورزشی {traineeDetail?.trainee.name || 'شاگرد'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  نام کاربری: <code>{traineeDetail?.trainee.username}</code>
                  {traineeDetail?.trainee.email && <> | ایمیل: <code style={{ direction: 'ltr' }}>{traineeDetail.trainee.email}</code></>}
                  {traineeDetail?.trainee.height && <> | قد: <strong>{traineeDetail.trainee.height} سانتی‌متر</strong></>}
                </span>
              </div>

              <button
                onClick={() => setSelectedTraineeId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '0 24px'
            }}>
              <button
                onClick={() => setModalTab('sizes')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '14px 18px',
                  fontSize: '0.9rem',
                  fontWeight: modalTab === 'sizes' ? '700' : '500',
                  color: modalTab === 'sizes' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: modalTab === 'sizes' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Scale size={16} />
                <span>وضعیت بدنی و سایزها ({traineeDetail?.sizes.length || 0})</span>
              </button>

              <button
                onClick={() => setModalTab('workouts')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '14px 18px',
                  fontSize: '0.9rem',
                  fontWeight: modalTab === 'workouts' ? '700' : '500',
                  color: modalTab === 'workouts' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: modalTab === 'workouts' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Dumbbell size={16} />
                <span>برنامه و لاگ‌های تمرین ({traineeDetail?.logs.length || 0})</span>
              </button>

              <button
                onClick={() => setModalTab('notes')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '14px 18px',
                  fontSize: '0.9rem',
                  fontWeight: modalTab === 'notes' ? '700' : '500',
                  color: modalTab === 'notes' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: modalTab === 'notes' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MessageSquare size={16} />
                <span>یادداشت‌ها و توصیه‌های مربی ({traineeDetail?.notes.length || 0})</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', gap: '10px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>در حال دریافت پرونده شاگرد...</span>
                </div>
              ) : !traineeDetail ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  خطا در دریافت اطلاعات شاگرد.
                </div>
              ) : (
                <>
                  {/* TAB 1: SIZES & MEASUREMENTS */}
                  {modalTab === 'sizes' && (
                    <div>
                      {traineeDetail.sizes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          این شاگرد هنوز هیچ اندازه‌گیری فیزیکی ثبت نکرده است.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Latest Size Highlight Card */}
                          {traineeDetail.sizes[0] && (
                            <div style={{
                              background: 'rgba(255, 107, 82, 0.08)',
                              border: '1px solid rgba(255, 107, 82, 0.2)',
                              borderRadius: '16px',
                              padding: '18px',
                              marginBottom: '8px'
                            }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '10px' }}>
                                آخرین وضعیت بدنی ثبت شده ({new Date(traineeDetail.sizes[0].createdAt).toLocaleDateString('fa-IR')}):
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>وزن</span>
                                  <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{traineeDetail.sizes[0].weight} kg</strong>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>دور کمر/شکم</span>
                                  <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{traineeDetail.sizes[0].waist} cm</strong>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>دور باسن</span>
                                  <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{traineeDetail.sizes[0].hips} cm</strong>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>دور بازو</span>
                                  <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{traineeDetail.sizes[0].arms} cm</strong>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>دور سینه</span>
                                  <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{traineeDetail.sizes[0].chest} cm</strong>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Sizes Timeline List */}
                          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginTop: '10px' }}>تاریخچه تمام اندازه‌گیری‌ها:</h4>
                          {traineeDetail.sizes.map((s, idx) => (
                            <div
                              key={s.id}
                              style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '14px'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <Calendar size={14} color="var(--primary)" />
                                  <strong style={{ fontSize: '0.9rem' }}>
                                    {new Date(s.createdAt).toLocaleDateString('fa-IR')}
                                  </strong>
                                  {idx === 0 && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>جدیدترین</span>}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                  <span>وزن: <strong style={{ color: 'var(--text-main)' }}>{s.weight} kg</strong></span>
                                  <span>شکم: <strong style={{ color: 'var(--text-main)' }}>{s.waist} cm</strong></span>
                                  <span>باسن: <strong style={{ color: 'var(--text-main)' }}>{s.hips} cm</strong></span>
                                  <span>بازو: <strong style={{ color: 'var(--text-main)' }}>{s.arms} cm</strong></span>
                                  <span>سینه: <strong style={{ color: 'var(--text-main)' }}>{s.chest} cm</strong></span>
                                </div>

                                {s.aiFeedback && (
                                  <p style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '8px',
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    lineHeight: '1.6'
                                  }}>
                                    💡 <strong>تحلیل پیشرفت:</strong> {s.aiFeedback}
                                  </p>
                                )}
                              </div>

                              {s.photoUrl && (
                                <a
                                  href={s.photoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'block',
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border)',
                                    flexShrink: 0
                                  }}
                                  title="مشاهده عکس ارسال شده"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={s.photoUrl}
                                    alt="عکس پیشرفت شاگرد"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: WORKOUTS & LOGS */}
                  {modalTab === 'workouts' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>برنامه تمرینی فعال شاگرد:</h4>
                        <button
                          onClick={() => setWorkoutModalOpen(true)}
                          className="btn btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }}
                        >
                          <Plus size={14} />
                          <span>تنظیم برنامه اختصاصی توسط مربی</span>
                        </button>
                      </div>

                      {traineeDetail.program ? (
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          padding: '18px',
                          marginBottom: '24px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                                {traineeDetail.program.programName}
                              </strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                                هدف برنامه: {traineeDetail.program.goal}
                              </span>
                            </div>
                            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>برنامه فعال</span>
                          </div>

                          {/* Program Days */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                            {(traineeDetail.program.days || []).map((day: any, dIdx: number) => (
                              <div key={dIdx} style={{
                                background: 'rgba(0,0,0,0.25)',
                                borderRadius: '12px',
                                padding: '12px 16px'
                              }}>
                                <strong style={{ fontSize: '0.92rem', color: 'var(--secondary)', display: 'block', marginBottom: '8px' }}>
                                  {day.dayName}
                                </strong>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {(day.exercises || []).map((ex: any, eIdx: number) => (
                                    <div key={eIdx} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      fontSize: '0.82rem',
                                      borderBottom: eIdx < day.exercises.length - 1 ? '1px dashed rgba(255,255,255,0.06)' : 'none',
                                      paddingBottom: '4px'
                                    }}>
                                      <span>{eIdx + 1}. {ex.name}</span>
                                      <span style={{ color: 'var(--text-muted)' }}>
                                        {ex.setsCount} ست × {ex.reps} (استراحت: {ex.rest})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '24px' }}>
                          این شاگرد در حال حاضر برنامه تمرینی فعالی ندارد.
                        </div>
                      )}

                      {/* Workout Session Logs */}
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>
                        تاریخچه جلسات تمرینی انجام شده:
                      </h4>

                      {traineeDetail.logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          هنوز لاگ تمرینی توسط این شاگرد ثبت نشده است.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {traineeDetail.logs.map((log) => (
                            <div key={log.id} style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid var(--border)',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.85rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={14} color="var(--primary)" />
                                <span>تاریخ تمرین: <strong>{log.date}</strong></span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  {log.completedSetsCount} ست تکمیل شده
                                </span>
                                {log.isCompleted ? (
                                  <span className="badge badge-primary" style={{ fontSize: '0.7rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                                    جلسه کامل
                                  </span>
                                ) : (
                                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                    بخشی از تمرین
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: COACH NOTES */}
                  {modalTab === 'notes' && (
                    <div>
                      {/* Add Note Form */}
                      <form onSubmit={handleAddNote} style={{ marginBottom: '24px' }}>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label className="form-label" style={{ fontWeight: '700' }}>
                            ارسال توصیه، رژیم یا نکته تمرینی به {traineeDetail.trainee.name}:
                          </label>
                          <textarea
                            className="input-field"
                            rows={3}
                            placeholder="مثال: این هفته تمرکزت رو بذار روی افزایش وزنه در اسکوات. مصرف آب رو هم به ۳ لیتر در روز برسون..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            style={{ resize: 'none' }}
                            required
                          />
                        </div>

                        {noteError && (
                          <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={14} />
                            <span>{noteError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn btn-primary"
                          style={{ padding: '8px 18px', fontSize: '0.85rem', gap: '6px' }}
                          disabled={submittingNote}
                        >
                          <Send size={14} />
                          <span>{submittingNote ? 'در حال ارسال...' : 'ارسال به شاگرد'}</span>
                        </button>
                      </form>

                      {/* Notes List */}
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>یادداشت‌های ارسالی قبلی:</h4>

                      {traineeDetail.notes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          هنوز یادداشتی برای این شاگرد ثبت نکرده‌اید.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {traineeDetail.notes.map((n) => (
                            <div key={n.id} style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              padding: '14px 16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '12px'
                            }}>
                              <div>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0, color: 'var(--text-main)' }}>
                                  {n.note}
                                </p>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                                  ارسال شده در: {new Date(n.createdAt).toLocaleDateString('fa-IR')} - {new Date(n.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <button
                                onClick={() => handleDeleteNote(n.id)}
                                className="btn btn-danger"
                                style={{ padding: '6px', fontSize: '0.75rem' }}
                                title="حذف یادداشت"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- COACH SETTINGS MODAL ---------------- */}
      {profileModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#12151d',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="var(--primary)" />
                <span>تنظیمات پروفایل و کد مربیگری</span>
              </h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {profileSuccess && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                padding: '10px 14px',
                borderRadius: '10px',
                color: '#22c55e',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Check size={16} />
                <span>مشخصات با موفقیت ذخیره شد.</span>
              </div>
            )}

            {profileError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '10px 14px',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">نام نمایشی مربی</label>
                <input
                  type="text"
                  className="input-field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>کد اختصاصی ورود شاگردان</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>حروف انگلیسی و اعداد</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  dir="ltr"
                  style={{ letterSpacing: '2px', fontWeight: '700' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">عنوان باشگاه یا بیوگرافی کوتاه</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="مثال: مربی ارشد فیتنس و پرورش اندام - باشگاه الماس"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">شماره تماس یا آیدی تلگرام مربی (برای ارتباط شاگرد)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="مثال: 09123456789 یا @Coach_Channel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  dir="ltr"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">پیام خوش‌آمدگویی مربی به شاگردان (نمایش در پنل شاگرد)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="مثال: به تیم من خوش آمدی! با پشتکار و دقت تمام برنامه‌ها رو دنبال کن تا با هم به هدفت برسیم."
                  value={editWelcome}
                  onChange={(e) => setEditWelcome(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 20px' }}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- WORKOUT ASSIGNMENT MODAL ---------------- */}
      {workoutModalOpen && selectedTraineeId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '16px'
        }}>
          <div style={{
            background: '#12151d',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell size={20} color="var(--primary)" />
                <span>تنظیم برنامه تمرینی اختصاصی برای شاگرد</span>
              </h3>
              <button
                onClick={() => setWorkoutModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {workoutError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '10px 14px',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}>
                {workoutError}
              </div>
            )}

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">نام برنامه</label>
                <input
                  type="text"
                  className="input-field"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="مثال: برنامه هایپرتروفی فاز ۱"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label">هدف برنامه</label>
                <input
                  type="text"
                  className="input-field"
                  value={workoutGoal}
                  onChange={(e) => setWorkoutGoal(e.target.value)}
                  placeholder="مثال: عضله‌سازی و چربی‌سوزی همزمان"
                  required
                />
              </div>

              {/* Day Editor */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: '700' }}>روزهای تمرینی و حرکات:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkoutDays([
                        ...workoutDays,
                        {
                          dayName: `روز ${workoutDays.length + 1}`,
                          exercises: [{ id: String(Date.now()), name: 'حرکت جدید', setsCount: 3, reps: '12', rest: '60 ثانیه' }]
                        }
                      ]);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.78rem', gap: '4px' }}
                  >
                    <Plus size={13} />
                    <span>افزودن روز جدید</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {workoutDays.map((day, dIdx) => (
                    <div key={dIdx} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <input
                          type="text"
                          className="input-field"
                          value={day.dayName}
                          onChange={(e) => {
                            const newDays = [...workoutDays];
                            newDays[dIdx].dayName = e.target.value;
                            setWorkoutDays(newDays);
                          }}
                          style={{ maxWidth: '240px', padding: '6px 10px', fontSize: '0.85rem' }}
                        />

                        {workoutDays.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setWorkoutDays(workoutDays.filter((_, i) => i !== dIdx));
                            }}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            حذف این روز
                          </button>
                        )}
                      </div>

                      {/* Exercises in day */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {day.exercises.map((ex, eIdx) => (
                          <div key={eIdx} style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="نام حرکت (مثلاً پرس سینه)"
                              value={ex.name}
                              onChange={(e) => {
                                const newDays = [...workoutDays];
                                newDays[dIdx].exercises[eIdx].name = e.target.value;
                                setWorkoutDays(newDays);
                              }}
                              style={{ flex: '2 1 140px', padding: '6px 10px', fontSize: '0.82rem' }}
                            />
                            <input
                              type="number"
                              className="input-field"
                              placeholder="ست"
                              value={ex.setsCount}
                              onChange={(e) => {
                                const newDays = [...workoutDays];
                                newDays[dIdx].exercises[eIdx].setsCount = parseInt(e.target.value) || 1;
                                setWorkoutDays(newDays);
                              }}
                              style={{ flex: '1 1 50px', padding: '6px 10px', fontSize: '0.82rem' }}
                            />
                            <input
                              type="text"
                              className="input-field"
                              placeholder="تکرار (مثلا 12)"
                              value={ex.reps}
                              onChange={(e) => {
                                const newDays = [...workoutDays];
                                newDays[dIdx].exercises[eIdx].reps = e.target.value;
                                setWorkoutDays(newDays);
                              }}
                              style={{ flex: '1 1 70px', padding: '6px 10px', fontSize: '0.82rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newDays = [...workoutDays];
                                newDays[dIdx].exercises = newDays[dIdx].exercises.filter((_, i) => i !== eIdx);
                                setWorkoutDays(newDays);
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const newDays = [...workoutDays];
                            newDays[dIdx].exercises.push({
                              id: String(Date.now()),
                              name: '',
                              setsCount: 3,
                              reps: '10-12',
                              rest: '60 ثانیه'
                            });
                            setWorkoutDays(newDays);
                          }}
                          className="btn"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '6px',
                            fontSize: '0.78rem',
                            border: '1px dashed var(--border)',
                            justifyContent: 'center',
                            marginTop: '4px'
                          }}
                        >
                          <Plus size={13} />
                          <span>افزودن حرکت به این روز</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setWorkoutModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleSaveWorkout}
                className="btn btn-primary"
                style={{ padding: '8px 20px' }}
                disabled={savingWorkout}
              >
                {savingWorkout ? 'در حال ثبت...' : 'اختصاص این برنامه به شاگرد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
