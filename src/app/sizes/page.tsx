'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logBodySizesAction, getBodySizes, deleteBodySizeAction, BodySizeData } from '@/app/actions/sizes';
import { getCurrentUser, PublicUser } from '@/app/actions/auth';
import { Scale, Trash2, Calendar, Sparkles, Image as ImageIcon, AlertCircle, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

export default function SizesPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [sizes, setSizes] = useState<BodySizeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [arms, setArms] = useState('');
  const [chest, setChest] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const res = await getBodySizes();
          if (res.success && res.sizes) {
            setSizes(res.sizes);
          }
        }
      } catch (err) {
        console.error('Error loading sizes page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const weightNum = parseFloat(weight);
    const waistNum = parseFloat(waist);
    const hipsNum = parseFloat(hips);
    const armsNum = parseFloat(arms);
    const chestNum = parseFloat(chest);

    if (isNaN(weightNum) || isNaN(waistNum) || isNaN(hipsNum) || isNaN(armsNum) || isNaN(chestNum)) {
      setError('لطفاً تمام فیلدها را با اعداد معتبر پر کنید.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await logBodySizesAction({
        weight: weightNum,
        waist: waistNum,
        hips: hipsNum,
        arms: armsNum,
        chest: chestNum,
        photoUrl: photo
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
        // Clear input file
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(res.error || 'خطا در ثبت اندازه‌ها.');
      }
    } catch (err) {
      console.error('Error logging body sizes:', err);
      setError('خطا در ارتباط با سرور.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این رکورد اطمینان دارید؟')) return;

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

  // Helper to calculate statistics between the last two inputs
  const getProgressStats = () => {
    if (sizes.length < 2) return null;
    const latest = sizes[0];
    const previous = sizes[1];
    
    return {
      weightDiff: latest.weight - previous.weight,
      waistDiff: latest.waist - previous.waist,
      hipsDiff: latest.hips - previous.hips
    };
  };

  const progressStats = getProgressStats();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>در حال بارگذاری...</div>;
  }

  // Not logged in view
  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
        <div className="glass-card animate-fade-in" style={{ padding: '40px 30px' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '20px' }}>
            <Scale size={60} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>آنالیز پیشرفت بدنی با هوش مصنوعی</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '30px' }}>
            برای ثبت مشخصات فیزیکی، آپلود تصویر بدن و دریافت بازخورد تخصصی مربی هوشمند بر اساس تغییرات دور شکم، باسن و وزن خود، ابتدا باید وارد حساب کاربری شوید.
          </p>
          <button onClick={() => router.push('/login')} className="btn btn-primary" style={{ padding: '12px 30px' }}>
            ورود به حساب کاربری
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 0 50px' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Scale size={32} />
          <span>ثبت اندازه‌ها و تحلیل هوش مصنوعی</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          اندام خود را به طور مرتب ثبت کنید و بازخورد و راهنمایی‌های هوشمند مربی سِت را روی روند رشدتان دریافت کنید
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
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>کیلوگرم</span>
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
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>سانتی‌متر</span>
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
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>سانتی‌متر</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--primary)' }}>ثبت آنالیز جدید</h3>
            
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
                  <label className="form-label">باسن (سانتی‌متر)</label>
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
                  <label className="form-label">بازو (سانتی‌متر)</label>
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
                  <label className="form-label">سینه (سانتی‌متر)</label>
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
                <label className="form-label">آپلود عکس فیزیک بدنی (اختیاری)</label>
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
                disabled={submitting}
              >
                <Sparkles size={18} />
                <span>{submitting ? 'در حال تحلیل با هوش مصنوعی...' : 'ثبت مشخصات و تحلیل بدنی'}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: History & AI Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={22} className="logoIcon" />
            <span>تاریخچه اندازه‌گیری‌ها و پاسخ هوش مصنوعی</span>
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
                      onClick={() => handleDelete(item.id)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                      title="حذف"
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

                  {/* Photo & Feedback Flex layout */}
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
                          <span>تحلیل مربی هوشمند سِت:</span>
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
  );
}
