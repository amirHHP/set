'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getActiveWorkoutProgram,
  generateWorkoutProgramAction,
  getWorkoutLogs,
  saveWorkoutLogAction,
  WorkoutProgramData,
  WorkoutLogData
} from '@/app/actions/workout';
import { getCurrentUser, PublicUser } from '@/app/actions/auth';
import { Dumbbell, CheckCircle, Calendar, Sparkles, RefreshCw, AlertCircle, Play, Check } from 'lucide-react';

export default function WorkoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [program, setProgram] = useState<WorkoutProgramData | null>(null);
  const [logs, setLogs] = useState<WorkoutLogData[]>([]);
  
  // Loading & Action State
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [error, setError] = useState('');
  
  // Generator wizard state
  const [goal, setGoal] = useState('عضله‌سازی و فرم‌دهی عضلات');
  const [level, setLevel] = useState('متوسط');
  const [weight, setWeight] = useState('');
  
  // Active workout checklist state
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({}); // key format: `exerciseId_setIdx`
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          const progRes = await getActiveWorkoutProgram();
          if (progRes.success && progRes.program) {
            setProgram(progRes.program);
          }
          
          const logsRes = await getWorkoutLogs();
          if (logsRes.success && logsRes.logs) {
            setLogs(logsRes.logs);
          }
        }
      } catch (err) {
        console.error('Error loading workout page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGenerating(true);

    try {
      const res = await generateWorkoutProgramAction({
        goal,
        level,
        currentWeight: parseFloat(weight) || 0
      });

      if (res.success && res.program) {
        setProgram(res.program);
        setSelectedDayIdx(0);
        setCompletedSets({});
      } else {
        setError(res.error || 'خطا در ساخت برنامه تمرینی.');
      }
    } catch (err) {
      console.error('Error generating program:', err);
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleSet = (exerciseId: string, setIdx: number) => {
    const key = `${exerciseId}_${setIdx}`;
    const newSets = { ...completedSets, [key]: !completedSets[key] };
    setCompletedSets(newSets);
  };

  const handleSaveWorkoutLog = async () => {
    if (!program) return;
    setSavingLog(true);
    setError('');
    setSavedSuccess(false);

    // Calculate if all sets of all exercises for the active day are completed
    const activeDay = program.days[selectedDayIdx];
    let totalSetsInDay = 0;
    let completedSetsInDay = 0;

    activeDay.exercises.forEach(ex => {
      for (let i = 0; i < ex.setsCount; i++) {
        totalSetsInDay++;
        if (completedSets[`${ex.id}_${i}`]) {
          completedSetsInDay++;
        }
      }
    });

    const isCompleted = totalSetsInDay > 0 && completedSetsInDay === totalSetsInDay;
    const dateStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    try {
      const res = await saveWorkoutLogAction({
        programId: program.id,
        date: dateStr,
        completedSetsJson: JSON.stringify(completedSets),
        isCompleted
      });

      if (res.success) {
        setSavedSuccess(true);
        // Refresh logs
        const logsRes = await getWorkoutLogs();
        if (logsRes.success && logsRes.logs) {
          setLogs(logsRes.logs);
        }
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setError(res.error || 'خطا در ذخیره‌سازی لاگ.');
      }
    } catch (e) {
      console.error('Error saving workout log:', e);
      setError('خطا در اتصال به سرور.');
    } finally {
      setSavingLog(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>در حال بارگذاری...</div>;
  }

  // Not logged in guard
  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
        <div className="glass-card animate-fade-in" style={{ padding: '40px 30px' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '20px' }}>
            <Dumbbell size={60} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>برنامه ورزشی هوشمند با هوش مصنوعی</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '30px' }}>
            جهت تولید برنامه هفتگی اختصاصی بر اساس اهداف تمرینی و سطحتان توسط مربی هوشمند، و همچنین ثبت تمرینات و مشاهده تاریخچه ورزش خود، ابتدا باید وارد شوید.
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
          <Dumbbell size={32} />
          <span>برنامه ورزشی و لاگ تمرین</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          برنامه‌های ورزشی اختصاصی دریافت کنید و تیک ست‌های انجام شده را در باشگاه بزنید تا سابقه ورزشتان حفظ شود
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
          marginBottom: '24px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Program Content vs Generator Wizard */}
      {!program ? (
        /* Wizard form to generate new program */
        <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Sparkles size={36} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>تولید برنامه تمرینی جدید با هوش مصنوعی</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              مشخصات خود را وارد کنید تا هوش مصنوعی مربی سِت برنامه ۳ روزه شما را به صورت کامل بنویسد
            </p>
          </div>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">هدف ورزشی شما</label>
              <select 
                className="input-field"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                style={{ background: '#181b24', color: 'white' }}
              >
                <option value="عضله‌سازی و فرم‌دهی عضلات">💪 عضله‌سازی و فرم‌دهی عضلات (حجم خشک)</option>
                <option value="چربی‌سوزی و کاهش وزن عمومی">🔥 چربی‌سوزی و کاهش وزن عمومی (کات بدنی)</option>
                <option value="فرم‌دهی تخصصی باسن و ران (پایین‌تنه)">🍑 فرم‌دهی تخصصی باسن و ران (پایین‌تنه)</option>
                <option value="افزایش قدرت و استقامت بدنی">🏋️ افزایش قدرت و استقامت بدنی</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">سطح آمادگی جسمانی</label>
              <select
                className="input-field"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={{ background: '#181b24', color: 'white' }}
              >
                <option value="مبتدی">مبتدی (کمتر از ۶ ماه سابقه تمرین)</option>
                <option value="متوسط">متوسط (۶ ماه تا ۲ سال سابقه تمرین)</option>
                <option value="حرفه‌ای">حرفه‌ای (بیش از ۲ سال سابقه تمرین مستمر)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">وزن فعلی شما (کیلوگرم - اختیاری)</label>
              <input
                type="number"
                className="input-field"
                placeholder="مثال: 65"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '1rem', gap: '10px' }}
              disabled={generating}
            >
              <Sparkles size={18} />
              <span>{generating ? 'در حال نگارش برنامه ورزشی توسط AI...' : 'تولید برنامه تمرینی هوشمند'}</span>
            </button>
          </form>
        </div>
      ) : (
        /* Render Active Program and Logs */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
          alignItems: 'start'
        }}>
          
          {/* Active Workout Card (Left Column) */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '4px' }}>برنامه فعال شما</span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{program.programName}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>هدف: {program.goal}</span>
              </div>
              
              {/* Reset program button */}
              <button 
                onClick={() => {
                  if (confirm('آیا مایلید برنامه تمرینی فعلی را بایگانی کرده و برنامه جدیدی بسازید؟')) {
                    setProgram(null);
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
              >
                <RefreshCw size={14} />
                <span>برنامه جدید</span>
              </button>
            </div>

            {/* Days Tabs */}
            <div style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              padding: '4px',
              gap: '4px'
            }}>
              {program.days.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDayIdx(idx);
                    setCompletedSets({}); // Reset ticks on day change for logging today
                  }}
                  style={{
                    flex: 1,
                    background: selectedDayIdx === idx ? 'var(--primary)' : 'none',
                    color: selectedDayIdx === idx ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    padding: '8px 4px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  روز {idx + 1}
                </button>
              ))}
            </div>

            {/* Active Day Description */}
            <div style={{ padding: '4px 0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--secondary)' }}>
                {program.days[selectedDayIdx].dayName}
              </h3>
            </div>

            {/* Exercise List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {program.days[selectedDayIdx].exercises.map((ex) => (
                <div key={ex.id} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{ex.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        تکرارها: {ex.reps} | استراحت: {ex.rest}
                      </span>
                    </div>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                      {ex.setsCount} ست
                    </span>
                  </div>

                  {/* Set Tickboxes */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {Array.from({ length: ex.setsCount }).map((_, setIdx) => {
                      const isChecked = completedSets[`${ex.id}_${setIdx}`];
                      return (
                        <button
                          key={setIdx}
                          onClick={() => toggleSet(ex.id, setIdx)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: isChecked ? 'none' : '1px solid var(--border)',
                            background: isChecked ? 'var(--primary)' : 'rgba(0,0,0,0.3)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            transition: 'var(--transition)'
                          }}
                        >
                          {isChecked ? <Check size={14} /> : setIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              {savedSuccess && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#22c55e',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle size={16} />
                  <span>تمرین امروز با موفقیت ثبت و ذخیره شد!</span>
                </div>
              )}

              <button
                onClick={handleSaveWorkoutLog}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '1rem', gap: '8px' }}
                disabled={savingLog}
              >
                <CheckCircle size={18} />
                <span>{savingLog ? 'در حال ثبت...' : 'ذخیره لاگ تمرین امروز'}</span>
              </button>
            </div>

          </div>

          {/* Workout History (Right Column) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={22} className="logoIcon" />
              <span>تقویم و سابقه تمرینات کامل شده</span>
            </h2>

            {logs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                border: '1px dashed var(--border)',
                borderRadius: '16px',
                color: 'var(--text-muted)',
                background: 'var(--bg-card)'
              }}>
                هنوز هیچ سابقه‌ای از ورزش ثبت نشده است. ست‌های ورزشی خود را در سمت چپ تیک بزنید و تمرین خود را ذخیره کنید!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {logs.map((log) => (
                  <div key={log.id} className="glass-card" style={{
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: log.isCompleted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 107, 82, 0.15)',
                        color: log.isCompleted ? '#22c55e' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {log.isCompleted ? <CheckCircle size={20} /> : <Play size={16} />}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                          {log.isCompleted ? 'جلسه تمرینی کامل شد' : 'جلسه تمرینی نیمه‌کاره'}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          برنامه: {program.programName}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <Calendar size={14} />
                      <span>{new Date(log.date).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
