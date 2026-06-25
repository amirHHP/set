import Link from 'next/link';
import { getBlogPosts, BlogPostData } from '@/app/actions/blog';
import { BookOpen, Calendar, Clock, ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'وبلاگ تندرستی سِت | مقالات تخصصی سلامت و ورزش بانوان',
  description: 'آخرین مقالات علمی تغذیه ورزشی، تناسب اندام، کار با وزنه و آموزش‌های تخصصی بدنسازی ویژه خانم‌ها',
};

// Simulated read time calculation helper
function calculateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  const readTime = Math.ceil(words / 150); // Assumes 150 words per minute for Farsi reading
  return readTime || 3;
}

export default async function BlogPage() {
  const res = await getBlogPosts();
  const posts: BlogPostData[] = res.success && res.posts ? res.posts : [];

  const renderCoverImage = (imageName: string) => {
    let color = 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)';
    if (imageName === 'nutrition_blog') {
      color = 'linear-gradient(135deg, #1e293b 0%, #ff6b52 100%)';
    } else if (imageName === 'lifting_blog') {
      color = 'linear-gradient(135deg, #2e1065 0%, #8b5cf6 100%)';
    }
    return (
      <div style={{
        width: '100%',
        height: '200px',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '3rem',
      }}>
        {imageName === 'nutrition_blog' && '🥗'}
        {imageName === 'lifting_blog' && '🏋️‍♀️'}
        {!['nutrition_blog', 'lifting_blog'].includes(imageName) && '📰'}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px 0 50px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--primary)',
          fontSize: '0.9rem',
          fontWeight: '700',
          background: 'rgba(255, 107, 82, 0.1)',
          padding: '6px 16px',
          borderRadius: '9999px',
          marginBottom: '16px'
        }}>
          <BookOpen size={16} />
          <span>مجله سلامتی و ورزشی سِت</span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '12px' }}>مطالب آموزشی و علمی</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '580px', margin: '0 auto', lineHeight: '1.6' }}>
          راهنماهای گام‌به‌گام و مقالات تایید شده علمی درباره تغذیه، چربی‌سوزی، رشد عضلانی و سبک زندگی فعال بانوان
        </p>
      </div>

      {posts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          border: '1px dashed var(--border)',
          borderRadius: '16px',
          color: 'var(--text-muted)',
          background: 'var(--bg-card)'
        }}>
          هنوز هیچ مقاله‌ای در وبلاگ منتشر نشده است.
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}>
          {posts.map((post) => (
            <article 
              key={post.id} 
              className="glass-card animate-fade-in" 
              style={{
                display: 'flex',
                gap: '24px',
                padding: '0',
                overflow: 'hidden',
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}
            >
              {/* Cover image (Left column in RTL - technically right side) */}
              <div style={{ flex: '1 1 280px', maxWidth: '340px', minHeight: '200px' }}>
                {renderCoverImage(post.coverImage)}
              </div>

              {/* Text content (Right column in RTL - technically left side) */}
              <div style={{
                flex: '2 1 340px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} />
                      {new Date(post.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      <span>{calculateReadTime(post.content)} دقیقه مطالعه</span>
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '10px', lineHeight: '1.4' }}>
                    <Link href={`/blog/${post.slug}`} style={{ transition: 'var(--transition)' }}>
                      <span className="hover-color" style={{ cursor: 'pointer' }}>{post.title}</span>
                    </Link>
                  </h2>
                  
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '20px' }}>
                    {post.summary}
                  </p>
                </div>

                <Link href={`/blog/${post.slug}`} className="btn btn-secondary" style={{ alignSelf: 'flex-start', gap: '4px', fontSize: '0.85rem' }}>
                  <span>مطالعه کامل مقاله</span>
                  <ChevronLeft size={16} />
                </Link>
              </div>

            </article>
          ))}
        </div>
      )}

    </div>
  );
}
