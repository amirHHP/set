'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, updateUserProfileAction, PublicUser } from '@/app/actions/auth';
import { logBodySizesAction, getBodySizes, deleteBodySizeAction, BodySizeData } from '@/app/actions/sizes';
import MuscleMap from '@/components/MuscleMap';
import CoachBanner from '@/components/CoachBanner';
import { formatMusclesToPersian } from '@/lib/muscles';
import {
  User as UserIcon,
  Scale,
  Sparkles,
  Calendar,
  Trash2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Image as ImageIcon,
  Save,
  CheckCircle,
  Ruler,
  Layers,
  Dumbbell
} from 'lucide-react';
import Link from 'next/link';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'sizes' ? 'sizes' : 'anatomy';

  const [activeTab, setActiveTab] = useState<'anatomy' | 'sizes'>(initialTab);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [sizes, setSizes] = useState<BodySizeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [height, setHeight] = useState('');
  const [targetMuscles, setTargetMuscles] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Sizes Form State
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [arms, setArms] = useState('');
  const [chest, setChest] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submittingSize, setSubmittingSize] = useState(false);
  const [sizeError, setSizeError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setName(currentUser.name || '');
          setGender((currentUser.gender as 'female' | 'male') || 'female');
          setHeight(currentUser.height ? String(currentUser.height) : '');
          setTargetMuscles(currentUser.targetMuscles || []);

          const res = await getBodySizes();
          if (res.success && res.sizes) {
            setSizes(res.sizes);
          }
        }
      } catch (err) {
        console.error('Error loading profile page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save Physical & Muscle Profile
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    try {
      const heightNum = height ? parseFloat(height) : null;
      const res = await updateUserProfileAction({
        name,
        gender,
        height: heightNum,
        targetMuscles,
      });

      if (res.success && res.user) {
        setUser(res.user);
        setProfileSuccessMsg('مشخصات بدنی و عضلات هدف با موفقیت در پروفایل ذخیره شدند.');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      } else {
        setProfileErrorMsg(res.error || 'خطا در ذخیره پروفایل.');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setProfileErrorMsg('خطا در برقراری ارتباط با سرور.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Body Measurements
  const handleSubmitSizes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSizeError('');

    const weightNum = parseFloat(weight);
    const waistNum = parseFloat(waist);
    const hipsNum = parseFloat(hips);
    const armsNum = parseFloat(arms);
    const chestNum = parseFloat(chest);

    if (isNaN(weightNum) || isNaN(waistNum) || isNaN(hipsNum) || isNaN(armsNum) || isNaN(chestNum)) {
      setSizeError('لطفاً تمام فیلدها را با مقادیر عددی معتبر پر کنید.');
      return;
    }

    setSubmittingSize(true);

    try {
      const res = await logBodySizesAction({
        weight: weightNum,
        waist: waistNum,
        hips: hipsNum,
        arms: armsNum,
        chest: chestNum,
        photoUrl: photo,
      });

      if (res.success && res.size) {
        setSizes([res.size, ...sizes]);
        // Reset form
        setWeight('');
        setWaist('');
        setHips('');
        setArms('');
        setChest('');
        setPhoto(null);
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setSizeError(res.error || 'خطا در ثبت اندازه‌ها.');
      }
    } catch (err) {
      console.error('Error logging body sizes:', err);
      setSizeError('خطا در ارتباط با سرور.');
    } finally {
      setSubmittingSize(false);
    }
  };

  // Delete Body Size Entry
  const handleDeleteSize = async (id: string) => {
    if (!confirm('آیا از حذف این رکورد اندازه‌گیری اطمینان دارید؟')) return;

    try {
      const res = await deleteBodySizeAction(id);
      if (res.success) {
        setSizes(sizes.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Error deleting body size:', err);
      alert('خطا در حذف رکورد.');
    }
  };

  // Calculate Progress Stats
  const getProgressStats = () => {
    if (sizes.length < 2) return null;
    const latest = sizes[0];
    const previous = sizes[1];

    return {
      weightDiff: latest.weight - previous.weight,
      waistDiff: latest.waist - previous.waist,
      hipsDiff: latest.hips - previous.hips,
    };
  };

  const progressStats = getProgressStats();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>در حال بارگذاری پروفایل...</div>;
  }

  // Guard: Not Logged In
  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
        <div className="glass-card animate-fade-in" style={{ padding: '40px 30px' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '20px' }}>
            <UserIcon size={64} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>پروفایل کاربری و مشخصات بدنی</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '30px' }}>
            برای ثبت مشخصات فیزیکی، انتخاب عضلات نیازمند تقویت روی نقشه بدن، ثبت اندازه‌ها و ارسال دقیق به هوش مصنوعی جهت طراحی برنامه ورزشی، ابتدا وارد حساب خود شوید.
          </p>
          <button onClick={() => router.push('/login')} className="btn btn-primary" style={{ padding: '12px 30px' }}>
            ورود به حساب کاربری
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 0 60px' }}>
      
      {/* Coach Affiliation / Invite Banner */}
      <CoachBanner currentUser={user} />

      {/* Header Profile Banner */}
      <div className="glass-card animate-fade-in" style={{
        marginBottom: '28px',
        padding: '24px 30px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        background: 'linear-gradient(135deg, rgba(255, 107, 82, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '900',
            fontSize: '1.5rem',
            boxShadow: '0 4px 16px rgba(255,107,82,0.3)'
          }}>
            {user.name ? user.name[0] : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{user.name}</h1>
              <span className="badge badge-primary">
                {user.role === 'admin' ? 'مدیر سیستم' : 'ورزشکار سِت'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span>نام کاربری: @{user.username}</span>
              {user.email && <span>ایمیل: {user.email}</span>}
              <span>جنسیت: {gender === 'male' ? 'آقا' : 'خانم'}</span>
              {height && <span>قد: {height} سانتی‌متر</span>}
            </div>
          </div>
        </div>

        {/* Quick link to workout generator */}
        <Link
          href="/workout"
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem', gap: '8px', padding: '10px 18px' }}
        >
          <Dumbbell size={16} style={{ color: 'var(--primary)' }} />
          <span>تولید برنامه ورزشی با AI</span>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '28px',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveTab('anatomy')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'anatomy' ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'anatomy' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition)'
          }}
        >
          <Layers size={18} />
          <span>آناتومی و انتخاب عضلات هدف</span>
          {targetMuscles.length > 0 && (
            <span style={{
              background: activeTab === 'anatomy' ? 'rgba(0,0,0,0.25)' : 'var(--primary)',
              color: 'white',
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: '900'
            }}>
              {targetMuscles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sizes')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'sizes' ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'sizes' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition)'
          }}
        >
          <Scale size={18} />
          <span>ثبت اندازه‌ها و تحلیل هوش مصنوعی</span>
          {sizes.length > 0 && (
            <span style={{
              background: activeTab === 'sizes' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {sizes.length}
            </span>
          )}
        </button>
      </div>

      {/* ================= TAB 1: ANATOMY & TARGET MUSCLES ================= */}
      {activeTab === 'anatomy' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Header Info */}
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={24} />
              <span>مشخصات بدنی و نقشه عضلات نیازمند تقویت</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7' }}>
              مدل آناتومی (زن یا مرد) را انتخاب کرده و روی عضلاتی که مایلید برنامه ورزشی روی آن‌ها متمرکز شود کلیک کنید. هوش مصنوعی هنگام نگارش برنامه تمرینی، تمرکز و حجم حرکات را برای تقویت این عضلات ویژه اختصاص خواهد داد.
            </p>
          </div>

          {/* Feedback alerts */}
          {profileSuccessMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              padding: '14px 18px',
              borderRadius: '12px',
              color: '#22c55e',
              fontSize: '0.9rem'
            }}>
              <CheckCircle size={18} />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '14px 18px',
              borderRadius: '12px',
              color: '#ef4444',
              fontSize: '0.9rem'
            }}>
              <AlertCircle size={18} />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {/* Physical Basics Form */}
          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px', color: 'var(--secondary)' }}>
              مشخصات فردی ورزشکار
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">نام و نام خانوادگی</label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سارا محمدی"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">جنسیت ورزشی</label>
                <select
                  className="input-field"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'female' | 'male')}
                  style={{ background: '#181b24', color: 'white' }}
                >
                  <option value="female">👩 خانم (زن)</option>
                  <option value="male">👨 آقا (مرد)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">قد (سانتی‌متر)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    className="input-field"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="مثال: 168"
                  />
                  <Ruler size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Muscle Anatomy Map Component */}
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                <span>نقشه تعاملی عضلات بدن (برای تقویت انتخاب کنید)</span>
              </h3>
            </div>

            <MuscleMap
              selectedMuscles={targetMuscles}
              onChange={setTargetMuscles}
              initialGender={gender}
              onGenderChange={(g) => setGender(g)}
            />
          </div>

          {/* Save Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handleSaveProfile()}
              className="btn btn-primary"
              style={{ padding: '14px 32px', fontSize: '1rem', gap: '10px' }}
              disabled={savingProfile}
            >
              <Save size={18} />
              <span>{savingProfile ? 'در حال ذخیره‌سازی...' : 'ذخیره عضلات هدف و اطلاعات پروفایل'}</span>
            </button>
          </div>

        </div>
      )}

      {/* ================= TAB 2: BODY MEASUREMENTS & AI ================= */}
      {activeTab === 'sizes' && (
        <div className="animate-fade-in">
          
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Scale size={24} />
              <span>ثبت اندازه‌ها و تحلیل هوشمند مربی سِت</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              سایزهای دور شکم، باسن، بازو و وزن خود را ثبت کنید تا هوش مصنوعی مربی روند فیزیکی شما را بررسی کرده و راهکارهای مناسب ارائه دهد.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px',
            alignItems: 'start'
          }}>
            {/* Left Column: Form & Statistics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Progress quick stats */}
              {progressStats && (
                <div className="glass-card animate-fade-in" style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(255, 107, 82, 0.05) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} className="logoIcon" />
                    <span>روند تغییرات اخیر بدنی شما</span>
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                    
                    {/* Weight Diff */}
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>تغییر وزن</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: '800', fontSize: '1.1rem' }}>
                        {progressStats.weightDiff > 0 ? (
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                            <ArrowUpRight size={16} />
                            +{progressStats.weightDiff.toFixed(1)}
                          </span>
                        ) : progressStats.weightDiff < 0 ? (
                          <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center' }}>
                            <ArrowDownRight size={16} />
                            {progressStats.weightDiff.toFixed(1)}
                          </span>
                        ) : (
                          <span>۰.۰</span>
                        )}
                        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>kg</span>
                      </div>
                    </div>

                    {/* Waist Diff */}
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>دور شکم</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: '800', fontSize: '1.1rem' }}>
                        {progressStats.waistDiff > 0 ? (
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                            <ArrowUpRight size={16} />
                            +{progressStats.waistDiff.toFixed(1)}
                          </span>
                        ) : progressStats.waistDiff < 0 ? (
                          <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center' }}>
                            <ArrowDownRight size={16} />
                            {progressStats.waistDiff.toFixed(1)}
                          </span>
                        ) : (
                          <span>۰.۰</span>
                        )}
                        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>cm</span>
                      </div>
                    </div>

                    {/* Hips Diff */}
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>دور باسن</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: '800', fontSize: '1.1rem' }}>
                        {progressStats.hipsDiff > 0 ? (
                          <span style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center' }}>
                            <ArrowUpRight size={16} />
                            +{progressStats.hipsDiff.toFixed(1)}
                          </span>
                        ) : progressStats.hipsDiff < 0 ? (
                          <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center' }}>
                            <ArrowDownRight size={16} />
                            {progressStats.hipsDiff.toFixed(1)}
                          </span>
                        ) : (
                          <span>۰.۰</span>
                        )}
                        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>cm</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Input Form */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--primary)' }}>ثبت آنالیز جدید بدنی</h3>
                
                {sizeError && (
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
                    <span>{sizeError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitSizes}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">وزن (کیلوگرم)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-field"
                        placeholder="مثال: 62.5"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">دور شکم (سانتی‌متر)</label>
                      <input
                        type="number"
                        step="0.5"
                        className="input-field"
                        placeholder="مثال: 74"
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">دور باسن (cm)</label>
                      <input
                        type="number"
                        step="0.5"
                        className="input-field"
                        placeholder="مثال: 96"
                        value={hips}
                        onChange={(e) => setHips(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">دور بازو (cm)</label>
                      <input
                        type="number"
                        step="0.5"
                        className="input-field"
                        placeholder="مثال: 28"
                        value={arms}
                        onChange={(e) => setArms(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">دور سینه (cm)</label>
                      <input
                        type="number"
                        step="0.5"
                        className="input-field"
                        placeholder="مثال: 88"
                        value={chest}
                        onChange={(e) => setChest(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label">آپلود عکس فیزیک بدنی (اختیاری جهت بررسی هوش مصنوعی)</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        className="btn btn-secondary"
                        style={{ gap: '8px', fontSize: '0.85rem' }}
                      >
                        <ImageIcon size={18} />
                        <span>انتخاب تصویر</span>
                      </button>
                      {photo ? (
                        <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: '600' }}>✓ تصویر بارگذاری شد</span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>عکسی انتخاب نشده است</span>
                      )}
                    </div>

                    {photo && (
                      <div style={{ marginTop: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', width: '120px', height: '120px', position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={photo} 
                          alt="پیش‌نمایش بدنی" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <button
                          type="button"
                          onClick={() => setPhoto(null)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(239, 68, 68, 0.8)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem', gap: '10px' }}
                    disabled={submittingSize}
                  >
                    <Sparkles size={18} />
                    <span>{submittingSize ? 'در حال تحلیل با هوش مصنوعی...' : 'ثبت مشخصات و تحلیل بدنی'}</span>
                  </button>
                </form>
              </div>

            </div>

            {/* Right Column: History & AI Feedback */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={22} className="logoIcon" />
                <span>تاریخچه اندازه‌گیری‌ها و پاسخ مربی هوشمند</span>
              </h2>

              {sizes.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  border: '1px dashed var(--border)',
                  borderRadius: '16px',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card)'
                }}>
                  هنوز هیچ اندازه‌گیری برای ثبت پیشرفت شما ثبت نشده است. مشخصات فیزیکی خود را وارد کنید تا تحلیل مربی هوشمند را ببینید.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {sizes.map((item, idx) => (
                    <div key={item.id} className="glass-card animate-fade-in" style={{
                      borderLeft: idx === 0 ? '4px solid var(--primary)' : '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <Calendar size={16} />
                          <span>{new Date(item.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          {idx === 0 && <span className="badge badge-primary">آخرین ارزیابی</span>}
                        </div>

                        <button 
                          onClick={() => handleDeleteSize(item.id)}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                          title="حذف رکورد"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Metrics Row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '12px',
                        borderRadius: '10px',
                        marginBottom: '16px',
                        textAlign: 'center'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>وزن</span>
                          <strong style={{ fontSize: '0.95rem' }}>{item.weight} <span style={{ fontSize: '0.65rem' }}>kg</span></strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>شکم</span>
                          <strong style={{ fontSize: '0.95rem' }}>{item.waist} <span style={{ fontSize: '0.65rem' }}>cm</span></strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>باسن</span>
                          <strong style={{ fontSize: '0.95rem' }}>{item.hips} <span style={{ fontSize: '0.65rem' }}>cm</span></strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>بازو</span>
                          <strong style={{ fontSize: '0.95rem' }}>{item.arms} <span style={{ fontSize: '0.65rem' }}>cm</span></strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>سینه</span>
                          <strong style={{ fontSize: '0.95rem' }}>{item.chest} <span style={{ fontSize: '0.65rem' }}>cm</span></strong>
                        </div>
                      </div>

                      {/* Photo & Feedback */}
                      <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                        
                        {item.photoUrl && (
                          <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.photoUrl} alt="تصویر آنالیز" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        
                        {item.aiFeedback && (
                          <div style={{
                            background: 'rgba(255,107,82,0.04)',
                            border: '1px solid rgba(255,107,82,0.08)',
                            borderRadius: '12px',
                            padding: '16px',
                            fontSize: '0.9rem',
                            lineHeight: '1.7',
                            position: 'relative'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: 'var(--primary)',
                              fontWeight: '700',
                              fontSize: '0.8rem',
                              marginBottom: '8px'
                            }}>
                              <Sparkles size={14} />
                              <span>تحلیل هوشمند مربی سِت:</span>
                            </div>
                            <p style={{ color: '#e2e8f0' }}>{item.aiFeedback}</p>
                          </div>
                        )}

                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default function ProfilePage() {
  return (
    <React.Suspense fallback={<div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>در حال بارگذاری پروفایل...</div>}>
      <ProfileContent />
    </React.Suspense>
  );
}
