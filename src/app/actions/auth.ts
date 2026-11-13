/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { generateSalt, hashPassword, verifyPassword } from '@/lib/auth/password';
import { sendOtpEmail } from '@/lib/email';

const SESSION_KEY = 'set_session';

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  role: string;
  createdAt: string;
}

function toPublicUser(user: any): PublicUser {
  let createdAt = new Date().toISOString();
  if (user?.createdAt) {
    if (user.createdAt instanceof Date) {
      createdAt = user.createdAt.toISOString();
    } else {
      try {
        const d = new Date(user.createdAt);
        createdAt = isNaN(d.getTime()) ? String(user.createdAt) : d.toISOString();
      } catch {
        createdAt = String(user.createdAt);
      }
    }
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email || null,
    role: user.role,
    createdAt,
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

export async function loginAction(
  usernameOrEmailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const identifier = usernameOrEmailInput.trim().toLowerCase();
    const password = passwordInput;

    if (!identifier || !password) {
      return { success: false, error: 'نام کاربری/ایمیل و رمز عبور الزامی است.' };
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ]
      }
    });

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
  } catch (error: any) {
    console.error('Login action error:', error);
    return { success: false, error: error?.message || 'خطایی در ورود به سیستم رخ داد.' };
  }
}

export async function registerAction(
  nameInput: string,
  usernameInput: string,
  passwordInput: string,
  emailInput?: string
): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const name = nameInput.trim();
    const username = usernameInput.trim().toLowerCase();
    const password = passwordInput;
    const email = emailInput?.trim().toLowerCase() || null;

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

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'فرمت ایمیل نامعتبر است.' };
      }
      const existingEmail = await prisma.user.findFirst({ where: { email } });
      if (existingEmail) {
        return { success: false, error: 'این ایمیل قبلاً ثبت شده است.' };
      }
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    // If first user, make them admin
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'admin' : 'user';

    const userId = crypto.randomUUID();
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        username,
        email: email || undefined,
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
  } catch (error: any) {
    console.error('Register action error:', error);
    return { success: false, error: error?.message || 'خطایی در ثبت نام رخ داد.' };
  }
}

export async function sendEmailOtpAction(emailInput: string): Promise<{
  success: boolean;
  message?: string;
  devCode?: string;
  error?: string;
}> {
  try {
    const email = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.' };
    }

    // Check if already registered
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return { success: false, error: 'این ایمیل قبلاً در سیستم ثبت شده است. لطفاً وارد شوید.' };
    }

    // Rate limiting: check recent OTP in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await prisma.emailOtp.findFirst({
      where: {
        email,
        createdAt: { gte: oneMinuteAgo }
      }
    });

    if (recentOtp) {
      return { success: false, error: 'کد تایید اخیراً ارسال شده است. لطفاً ۱ دقیقه صبر کنید.' };
    }

    // Clean up expired OTPs for this email
    await prisma.emailOtp.deleteMany({
      where: {
        email,
        expiresAt: { lt: new Date() }
      }
    }).catch(() => {});

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const otpId = crypto.randomUUID();
    await prisma.emailOtp.create({
      data: {
        id: otpId,
        email,
        code,
        expiresAt,
      }
    });

    // Send email
    const emailResult = await sendOtpEmail(email, code);
    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'خطا در ارسال ایمیل تایید.' };
    }

    return {
      success: true,
      message: emailResult.devMode
        ? `کد تایید (آزمایشی: ${code}) آماده است.`
        : 'کد تایید به ایمیل شما ارسال شد.',
      devCode: emailResult.devCode,
    };
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return { success: false, error: error?.message || 'خطا در ارسال کد تایید.' };
  }
}

export async function registerWithOtpAction(
  nameInput: string,
  emailInput: string,
  codeInput: string,
  passwordInput?: string
): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const name = nameInput.trim();
    const email = emailInput.trim().toLowerCase();
    const code = codeInput.trim();
    const password = passwordInput ? passwordInput.trim() : null;

    if (!name) {
      return { success: false, error: 'نام و نام خانوادگی الزامی است.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: 'آدرس ایمیل معتبر نیست.' };
    }

    if (!code || code.length !== 6) {
      return { success: false, error: 'کد تایید باید ۶ رقم باشد.' };
    }

    if (password && password.length < 6) {
      return { success: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
    }

    // Verify OTP
    const validOtp = await prisma.emailOtp.findFirst({
      where: {
        email,
        code,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!validOtp) {
      return { success: false, error: 'کد تایید اشتباه است یا منقضی شده است.' };
    }

    // Check existing email
    const existingEmail = await prisma.user.findFirst({ where: { email } });
    if (existingEmail) {
      return { success: false, error: 'این ایمیل قبلاً ثبت شده است.' };
    }

    // Generate unique username based on email local part
    const localPart = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user';
    let candidateUsername = localPart.toLowerCase();
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username: candidateUsername } })) {
      candidateUsername = `${localPart.toLowerCase()}${counter}`;
      counter++;
    }

    const userPassword = password || crypto.randomBytes(16).toString('hex');
    const salt = generateSalt();
    const passwordHash = hashPassword(userPassword, salt);

    // If first user, make admin
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'admin' : 'user';

    const userId = crypto.randomUUID();
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        username: candidateUsername,
        email,
        passwordHash,
        salt,
        role,
      }
    });

    // Clean up OTPs for this email
    await prisma.emailOtp.deleteMany({
      where: { email }
    }).catch(() => {});

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_KEY, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true, user: toPublicUser(user) };
  } catch (error: any) {
    console.error('Register with OTP error:', error);
    return { success: false, error: error?.message || 'خطایی در ثبت‌نام رخ داد.' };
  }
}

export async function sendLoginOtpAction(emailInput: string): Promise<{
  success: boolean;
  message?: string;
  devCode?: string;
  error?: string;
}> {
  try {
    const email = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.' };
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return { success: false, error: 'کاربری با این ایمیل یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' };
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await prisma.emailOtp.findFirst({
      where: {
        email,
        createdAt: { gte: oneMinuteAgo }
      }
    });

    if (recentOtp) {
      return { success: false, error: 'کد تایید اخیراً ارسال شده است. لطفاً ۱ دقیقه صبر کنید.' };
    }

    await prisma.emailOtp.deleteMany({
      where: {
        email,
        expiresAt: { lt: new Date() }
      }
    }).catch(() => {});

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const otpId = crypto.randomUUID();
    await prisma.emailOtp.create({
      data: {
        id: otpId,
        email,
        code,
        expiresAt,
      }
    });

    const emailResult = await sendOtpEmail(email, code);
    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'خطا در ارسال ایمیل تایید.' };
    }

    return {
      success: true,
      message: emailResult.devMode
        ? `کد ورود (آزمایشی: ${code}) آماده است.`
        : 'کد تایید به ایمیل شما ارسال شد.',
      devCode: emailResult.devCode,
    };
  } catch (error: any) {
    console.error('Send login OTP error:', error);
    return { success: false, error: error?.message || 'خطا در ارسال کد ورود.' };
  }
}

export async function loginWithOtpAction(
  emailInput: string,
  codeInput: string
): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const email = emailInput.trim().toLowerCase();
    const code = codeInput.trim();

    if (!email || !code) {
      return { success: false, error: 'ایمیل و کد تایید الزامی است.' };
    }

    const validOtp = await prisma.emailOtp.findFirst({
      where: {
        email,
        code,
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!validOtp) {
      return { success: false, error: 'کد تایید اشتباه است یا منقضی شده است.' };
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return { success: false, error: 'کاربری با این ایمیل یافت نشد.' };
    }

    await prisma.emailOtp.deleteMany({
      where: { email }
    }).catch(() => {});

    const cookieStore = await cookies();
    cookieStore.set(SESSION_KEY, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true, user: toPublicUser(user) };
  } catch (error: any) {
    console.error('Login with OTP error:', error);
    return { success: false, error: error?.message || 'خطا در ورود با کد تایید.' };
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
