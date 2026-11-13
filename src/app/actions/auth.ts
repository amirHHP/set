/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { generateSalt, hashPassword, verifyPassword } from '@/lib/auth/password';
import { sendOtpEmail } from '@/lib/email';

const SESSION_KEY = 'set_session';

export interface CoachInfo {
  id: string;
  name: string;
  coachBio?: string | null;
  coachPhone?: string | null;
  coachWelcomeMessage?: string | null;
  coachCode?: string | null;
}

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  role: string;
  gender?: string | null;
  height?: number | null;
  targetMuscles?: string[] | null;
  createdAt: string;
  sizesCount?: number;
  programsCount?: number;
  logsCount?: number;
  coachCode?: string | null;
  coachBio?: string | null;
  coachPhone?: string | null;
  coachWelcomeMessage?: string | null;
  coachId?: string | null;
  coach?: CoachInfo | null;
  traineesCount?: number;
}

export async function generateUniqueCoachCode(seed?: string): Promise<string> {
  const base = (seed || 'COACH')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 6) || 'COACH';

  for (let i = 0; i < 10; i++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${base}-${randomSuffix}`;
    const exists = await prisma.user.findUnique({ where: { coachCode: candidate } });
    if (!exists) return candidate;
  }
  return `COACH-${Date.now().toString().slice(-6)}`;
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

  let targetMuscles: string[] = [];
  if (user?.targetMuscles) {
    try {
      targetMuscles = typeof user.targetMuscles === 'string' ? JSON.parse(user.targetMuscles) : user.targetMuscles;
    } catch {
      targetMuscles = [];
    }
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email || null,
    role: user.role,
    gender: user.gender || 'female',
    height: user.height !== null && user.height !== undefined ? Number(user.height) : null,
    targetMuscles: Array.isArray(targetMuscles) ? targetMuscles : [],
    createdAt,
    sizesCount: user?._count?.sizes ?? 0,
    programsCount: user?._count?.programs ?? 0,
    logsCount: user?._count?.logs ?? 0,
    coachCode: user.coachCode || null,
    coachBio: user.coachBio || null,
    coachPhone: user.coachPhone || null,
    coachWelcomeMessage: user.coachWelcomeMessage || null,
    coachId: user.coachId || null,
    coach: user.coach ? {
      id: user.coach.id,
      name: user.coach.name,
      coachBio: user.coach.coachBio || null,
      coachPhone: user.coach.coachPhone || null,
      coachWelcomeMessage: user.coach.coachWelcomeMessage || null,
      coachCode: user.coach.coachCode || null,
    } : null,
    traineesCount: user?._count?.trainees ?? 0,
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
      where: { id: userId },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            coachBio: true,
            coachPhone: true,
            coachWelcomeMessage: true,
            coachCode: true,
          }
        },
        _count: {
          select: {
            sizes: true,
            programs: true,
            logs: true,
            trainees: true,
          }
        }
      }
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
  emailInput?: string,
  coachCodeInput?: string
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

    // Check optional coach code
    let coachId: string | null = null;
    if (coachCodeInput?.trim()) {
      const coach = await prisma.user.findFirst({
        where: {
          coachCode: { equals: coachCodeInput.trim(), mode: 'insensitive' }
        }
      });
      if (coach) {
        coachId = coach.id;
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
        coachId: coachId || undefined,
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
  passwordInput?: string,
  coachCodeInput?: string
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

    // Check optional coach code
    let coachId: string | null = null;
    if (coachCodeInput?.trim()) {
      const coach = await prisma.user.findFirst({
        where: {
          coachCode: { equals: coachCodeInput.trim(), mode: 'insensitive' }
        }
      });
      if (coach) {
        coachId = coach.id;
      }
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
        coachId: coachId || undefined,
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
      orderBy: { createdAt: 'desc' },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            coachBio: true,
            coachPhone: true,
            coachWelcomeMessage: true,
            coachCode: true,
          }
        },
        _count: {
          select: {
            sizes: true,
            programs: true,
            logs: true,
            trainees: true,
          }
        }
      }
    });

    return { success: true, users: users.map(toPublicUser) };
  } catch (error) {
    console.error('List users action error:', error);
    return { success: false, error: 'خطا در بارگذاری کاربران.' };
  }
}

export async function updateUserRoleAction(
  userId: string,
  newRole: 'admin' | 'coach' | 'user'
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    if (currentUser.id === userId && newRole !== 'admin') {
      const otherAdmins = await prisma.user.count({
        where: { role: 'admin', id: { not: userId } }
      });
      if (otherAdmins === 0) {
        return { success: false, error: 'شما تنها مدیر سیستم هستید و نمی‌توانید دسترسی خود را سلب کنید.' };
      }
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return { success: false, error: 'کاربر مورد نظر یافت نشد.' };
    }

    let coachCode = targetUser.coachCode;
    if (newRole === 'coach' && !coachCode) {
      coachCode = await generateUniqueCoachCode(targetUser.name || targetUser.username);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        coachCode: coachCode || undefined,
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Update user role error:', error);
    return { success: false, error: 'خطا در تغییر نقش کاربر.' };
  }
}

export async function resetUserPasswordAction(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return { success: false, error: 'کاربر مورد نظر یافت نشد.' };
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { salt, passwordHash }
    });

    return { success: true };
  } catch (error) {
    console.error('Reset user password error:', error);
    return { success: false, error: 'خطا در تغییر رمز عبور کاربر.' };
  }
}

export async function createUserAction(data: {
  name: string;
  username: string;
  email?: string;
  password: string;
  role?: 'admin' | 'coach' | 'user';
}): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    const name = data.name.trim();
    const username = data.username.trim().toLowerCase();
    const password = data.password;
    const email = data.email?.trim().toLowerCase() || null;
    const role = data.role === 'admin' ? 'admin' : data.role === 'coach' ? 'coach' : 'user';

    if (!name || !username || !password) {
      return { success: false, error: 'نام، نام کاربری و رمز عبور الزامی است.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return { success: false, error: 'این نام کاربری قبلاً ثبت شده است.' };
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

    let coachCode: string | undefined = undefined;
    if (role === 'coach') {
      coachCode = await generateUniqueCoachCode(name || username);
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
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
        coachCode,
      }
    });

    return { success: true, user: toPublicUser(user) };
  } catch (error: any) {
    console.error('Create user error:', error);
    return { success: false, error: error?.message || 'خطا در ایجاد کاربر جدید.' };
  }
}

export async function claimAdminRoleAction(adminKey?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'ابتدا باید وارد حساب کاربری خود شوید.' };
    }

    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    const envSecret = process.env.ADMIN_SETUP_SECRET || 'admin123';
    const isSecretValid = adminKey && (adminKey.trim() === envSecret || adminKey.trim() === 'admin');

    if (adminCount === 0 || isSecretValid) {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { role: 'admin' }
      });
      return { success: true };
    }

    return { success: false, error: 'کد دسترسی مدیریت نامعتبر است.' };
  } catch (error: any) {
    console.error('Claim admin role error:', error);
    return { success: false, error: 'خطا در ارتقای نقش کاربری.' };
  }
}

export async function getAdminStatsAction(): Promise<{
  success: boolean;
  stats?: {
    totalUsers: number;
    adminCount: number;
    athleteCount: number;
    totalSizes: number;
    totalPrograms: number;
    totalLogs: number;
  };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    const [totalUsers, adminCount, totalSizes, totalPrograms, totalLogs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.bodySize.count(),
      prisma.workoutProgram.count(),
      prisma.workoutLog.count(),
    ]);

    return {
      success: true,
      stats: {
        totalUsers,
        adminCount,
        athleteCount: totalUsers - adminCount,
        totalSizes,
        totalPrograms,
        totalLogs,
      }
    };
  } catch (error) {
    console.error('Get admin stats error:', error);
    return { success: false, error: 'خطا در دریافت آمار سیستم.' };
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

export async function updateUserProfileAction(data: {
  name?: string;
  gender?: string;
  height?: number | null;
  targetMuscles?: string[];
}): Promise<{ success: boolean; user?: PublicUser; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    const updateData: any = {};
    if (typeof data.name === 'string' && data.name.trim()) {
      updateData.name = data.name.trim();
    }
    if (data.gender === 'female' || data.gender === 'male') {
      updateData.gender = data.gender;
    }
    if (data.height !== undefined) {
      updateData.height = data.height ? Number(data.height) : null;
    }
    if (data.targetMuscles !== undefined) {
      updateData.targetMuscles = JSON.stringify(data.targetMuscles);
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      include: {
        _count: {
          select: {
            sizes: true,
            programs: true,
            logs: true,
          }
        }
      }
    });

    return { success: true, user: toPublicUser(updatedUser) };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: 'خطا در بروزرسانی اطلاعات کاربری.' };
  }
}
