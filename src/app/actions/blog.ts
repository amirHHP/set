/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';

export interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
  createdAt: string;
}

function toBlogPostData(post: any): BlogPostData {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    summary: post.summary,
    coverImage: post.coverImage,
    createdAt: post.createdAt.toISOString(),
  };
}

export async function getBlogPosts(): Promise<{ success: boolean; posts?: BlogPostData[]; error?: string }> {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, posts: posts.map(toBlogPostData) };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { success: false, error: 'خطا در بارگذاری مقالات وبلاگ.' };
  }
}

export async function getBlogPostBySlug(slug: string): Promise<{ success: boolean; post?: BlogPostData; error?: string }> {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (!post) {
      return { success: false, error: 'مقاله مورد نظر پیدا نشد.' };
    }

    return { success: true, post: toBlogPostData(post) };
  } catch (error) {
    console.error(`Error fetching blog post with slug ${slug}:`, error);
    return { success: false, error: 'خطا در بارگذاری مقاله.' };
  }
}

export async function createBlogPostAction(data: {
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
}): Promise<{ success: boolean; post?: BlogPostData; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    if (!data.title || !data.slug || !data.content || !data.summary || !data.coverImage) {
      return { success: false, error: 'تمام فیلدها الزامی هستند.' };
    }

    // Clean slug: replace spaces with dashes, lowercase
    const slug = data.slug.trim().toLowerCase().replace(/\s+/g, '-');

    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return { success: false, error: 'این آدرس مقاله (Slug) قبلاً ثبت شده است.' };
    }

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        summary: data.summary,
        coverImage: data.coverImage,
      }
    });

    return { success: true, post: toBlogPostData(post) };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return { success: false, error: 'خطا در ثبت مقاله.' };
  }
}
