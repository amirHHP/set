/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { generateSalt, hashPassword, verifyPassword } from '@/lib/auth/password';

const SESSION_KEY = 'set_session';

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  role: string;
  createdAt: string;
}

function toPublicUser(user: any): PublicUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_KEY)?.value || null;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      await logoutAction();
      return null;
    }

    return toPublicUser(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function loginAction(usernameInput: string, passwordInput: string): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const username = usernameInput.trim().toLowerCase();
    const password = passwordInput;

    if (!username || !password) {
      return { success: false, error: 'نام کاربری و رمز عبور الزامی است.' };
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_KEY, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true, user: toPublicUser(user) };
  } catch (error) {
    console.error('Login action error:', error);
    return { success: false, error: 'خطایی در ورود به سیستم رخ داد.' };
  }
}

export async function registerAction(nameInput: string, usernameInput: string, passwordInput: string): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const name = nameInput.trim();
    const username = usernameInput.trim().toLowerCase();
    const password = passwordInput;

    if (!name || !username || !password) {
      return { success: false, error: 'پر کردن تمام فیلدها الزامی است.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return { success: false, error: 'این نام کاربری قبلاً انتخاب شده است.' };
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    // If first user, make them admin
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        salt,
        role,
      }
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_KEY, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true, user: toPublicUser(user) };
  } catch (error) {
    console.error('Register action error:', error);
    return { success: false, error: 'خطایی در ثبت نام رخ داد.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_KEY);
}

export async function listUsersAction(): Promise<{ success: boolean; users?: PublicUser[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, users: users.map(toPublicUser) };
  } catch (error) {
    console.error('List users action error:', error);
    return { success: false, error: 'خطا در بارگذاری کاربران.' };
  }
}

export async function deleteUserAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    if (currentUser.id === id) {
      return { success: false, error: 'شما نمی‌توانید حساب کاربری خودتان را حذف کنید.' };
    }

    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: 'خطا در حذف کاربر.' };
  }
}
