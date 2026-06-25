import Link from 'next/link';
import { ShoppingCart, Scale, Dumbbell, BookOpen, ChevronLeft, Award } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      title: 'فروشگاه تخصصی ورزشی',
      desc: 'خرید انواع مکمل‌های باکیفیت و استاندارد، لباس‌های ورزشی شیک و لوازم باشگاهی با قیمت مناسب.',
      link: '/shop',
      icon: ShoppingCart,
      color: 'var(--primary)',
      badge: 'مکمل و پوشاک',
    },
    {
      title: 'ثبت اندازه‌ها و تحلیل هوش مصنوعی',
      desc: 'ثبت وزن، دور شکم، باسن، بازو و سینه همراه با آپلود عکس و دریافت تحلیل صمیمی و علمی از AI.',
      link: '/sizes',
      icon: Scale,
      color: 'var(--secondary)',
      badge: 'آنالیز پیشرفت',
    },
    {
      title: 'برنامه ورزشی هوشمند',
      desc: 'دریافت برنامه تمرینی اختصاصی از هوش مصنوعی، تیک زدن ست‌های انجام شده و مشاهده تقویم پیشرفت.',
      link: '/workout',
      icon: Dumbbell,
      color: '#8b5cf6', // Violet
      badge: 'تمرین در باشگاه',
    },
    {
      title: 'وبلاگ تندرستی بانوان',
      desc: 'مقالات علمی، نکات تغذیه‌ای پیشرفته و رازهای تمرینی برای شادابی و انگیزه روزافزون در باشگاه.',
      link: '/blog',
      icon: BookOpen,
      color: '#06b6d4', // Cyan
      badge: 'آموزش و سئو',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0 60px' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'linear-gradient(135deg, rgba(255, 107, 82, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 107, 82, 0.1)',
        marginBottom: '50px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          right: '-50%',
          bottom: '-50%',
          background: 'radial-gradient(circle, rgba(255,107,82,0.05) 0%, rgba(0,0,0,0) 60%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 107, 82, 0.15)',
            color: 'var(--primary)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '16px'
          }}>
            <Award size={16} />
            <span>پلتفرم همه‌جانبه تندرستی بانوان</span>
          </div>

          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: '900',
            lineHeight: '1.25',
            marginBottom: '20px',
            background: 'linear-gradient(to left, #ffffff, #ffb3a7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            تناسب اندام با <span style={{ color: 'var(--primary)', WebkitTextFillColor: 'initial' }}>سِـت</span>
          </h1>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            maxWidth: '680px',
            margin: '0 auto 32px',
            lineHeight: '1.8'
          }}>
            برنامه ورزشی هوشمند دریافت کنید، تغییرات اندازه بدنتان را ثبت و با هوش مصنوعی تحلیل کنید، و تمام مکمل‌ها و ملزومات باشگاه را در یک‌جا خریداری نمایید.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/sizes" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              <span>شروع آنالیز بدن</span>
              <ChevronLeft size={20} />
            </Link>
            <Link href="/workout" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              <span>دریافت برنامه تمرینی</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '24px', textAlign: 'center' }}>
        دسترسی به بخش‌های مختلف اپلیکیشن
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div key={feat.link} className="glass-card" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `rgba(${feat.color === 'var(--primary)' ? '255, 107, 82' : feat.color === 'var(--secondary)' ? '212, 163, 115' : '139, 92, 246'}, 0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: feat.color === 'var(--primary)' ? 'var(--primary)' : feat.color === 'var(--secondary)' ? 'var(--secondary)' : feat.color
                  }}>
                    <Icon size={24} />
                  </div>
                  <span className="badge badge-secondary" style={{
                    background: `rgba(${feat.color === 'var(--primary)' ? '255, 107, 82' : feat.color === 'var(--secondary)' ? '212, 163, 115' : '139, 92, 246'}, 0.08)`,
                    color: feat.color === 'var(--primary)' ? 'var(--primary)' : feat.color === 'var(--secondary)' ? 'var(--secondary)' : feat.color
                  }}>{feat.badge}</span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px' }}>{feat.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>{feat.desc}</p>
              </div>

              <Link href={feat.link} className="btn btn-secondary" style={{ width: '100%', gap: '4px' }}>
                <span>ورود به این بخش</span>
                <ChevronLeft size={16} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
