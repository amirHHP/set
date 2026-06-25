import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug } from '@/app/actions/blog';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await getBlogPostBySlug(slug);
  if (res.success && res.post) {
    return {
      title: `${res.post.title} | وبلاگ تندرستی سِت`,
      description: res.post.summary,
    };
  }
  return {
    title: 'مقاله یافت نشد | سِت',
  };
}

// Custom Markdown to React Parser (No dependencies, extremely robust)
function parseMarkdownToReact(content: string) {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('###')) {
      return (
        <h3 key={idx} style={{
          fontSize: '1.5rem',
          fontWeight: '800',
          marginTop: '28px',
          marginBottom: '14px',
          color: 'var(--primary)'
        }}>
          {trimmed.replace('###', '').trim()}
        </h3>
      );
    }

    if (trimmed.startsWith('####')) {
      return (
        <h4 key={idx} style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          marginTop: '22px',
          marginBottom: '10px',
          color: 'var(--secondary)'
        }}>
          {trimmed.replace('####', '').trim()}
        </h4>
      );
    }

    if (trimmed.startsWith('-')) {
      return (
        <li key={idx} style={{
          marginRight: '20px',
          marginBottom: '8px',
          color: '#e2e8f0',
          fontSize: '0.95rem',
          listStyleType: 'disc'
        }}>
          {trimmed.replace('-', '').trim()}
        </li>
      );
    }

    if (trimmed === '') {
      return <div key={idx} style={{ height: '12px' }} />;
    }

    return (
      <p key={idx} style={{
        fontSize: '1rem',
        lineHeight: '1.8',
        color: '#cbd5e1',
        marginBottom: '14px',
        textAlign: 'justify'
      }}>
        {trimmed}
      </p>
    );
  });
}

function calculateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 150) || 3;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const res = await getBlogPostBySlug(slug);

  if (!res.success || !res.post) {
    notFound();
  }

  const post = res.post;

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
        height: '320px',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '5rem',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)'
      }}>
        {imageName === 'nutrition_blog' && '🥗'}
        {imageName === 'lifting_blog' && '🏋️‍♀️'}
        {!['nutrition_blog', 'lifting_blog'].includes(imageName) && '📰'}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '10px 0 50px' }}>
      
      {/* Back Button */}
      <Link href="/blog" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        marginBottom: '24px',
        transition: 'var(--transition)'
      }} className="hover-color">
        <ArrowRight size={16} />
        <span>بازگشت به مقالات وبلاگ</span>
      </Link>

      <article className="glass-card animate-fade-in" style={{ padding: '30px' }}>
        
        {/* Meta Header */}
        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {new Date(post.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} />
            <span>{calculateReadTime(post.content)} دقیقه زمان مطالعه</span>
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: '900',
          lineHeight: '1.3',
          marginBottom: '20px',
          color: 'white'
        }}>
          {post.title}
        </h1>

        {/* Summary Description */}
        <p style={{
          fontSize: '1.05rem',
          lineHeight: '1.8',
          color: 'var(--text-muted)',
          borderRight: '3px solid var(--primary)',
          paddingRight: '14px',
          marginBottom: '30px',
          fontStyle: 'italic'
        }}>
          {post.summary}
        </p>

        {/* Cover illustration */}
        {renderCoverImage(post.coverImage)}

        {/* Main Parsed Body */}
        <div style={{ marginTop: '20px' }}>
          {parseMarkdownToReact(post.content)}
        </div>

      </article>

    </div>
  );
}
