/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { callGeminiApi } from '@/lib/ai';

export interface BodySizeData {
  id: string;
  weight: number;
  waist: number;
  hips: number;
  arms: number;
  chest: number;
  photoUrl: string | null;
  aiFeedback: string | null;
  createdAt: string;
}

function toBodySizeData(size: any): BodySizeData {
  return {
    id: size.id,
    weight: size.weight,
    waist: size.waist,
    hips: size.hips,
    arms: size.arms,
    chest: size.chest,
    photoUrl: size.photoUrl,
    aiFeedback: size.aiFeedback,
    createdAt: size.createdAt.toISOString(),
  };
}

export async function getBodySizes(): Promise<{ success: boolean; sizes?: BodySizeData[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    const sizes = await prisma.bodySize.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, sizes: sizes.map(toBodySizeData) };
  } catch (error) {
    console.error('Error fetching body sizes:', error);
    return { success: false, error: 'خطا در بارگذاری اطلاعات پیشرفت.' };
  }
}

export async function logBodySizesAction(data: {
  weight: number;
  waist: number;
  hips: number;
  arms: number;
  chest: number;
  photoUrl?: string | null;
}): Promise<{ success: boolean; size?: BodySizeData; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    if (!data.weight || !data.waist || !data.hips || !data.arms || !data.chest) {
      return { success: false, error: 'وارد کردن تمام اندازه‌ها الزامی است.' };
    }

    // Call Gemini API for feedback
    let aiFeedback = '';
    try {
      const prompt = `
تو یک مربی بدنسازی و کارشناس تغذیه مجرب و دلسوز هستی.
یک خانم ورزشکار اندازه‌های فیزیکی جدید خود را ثبت کرده است:
- وزن: ${data.weight} کیلوگرم
- دور شکم: ${data.waist} سانتی‌متر
- دور باسن: ${data.hips} سانتی‌متر
- دور بازو: ${data.arms} سانتی‌متر
- دور سینه: ${data.chest} سانتی‌متر
${data.photoUrl ? 'او یک عکس نیز از وضعیت فعلی فیزیک بدنی خود بارگذاری کرده است.' : ''}

با توجه به این مقادیر (و تحلیل بصری عکس در صورت وجود)، یک بازخورد ورزشی، تغذیه‌ای و انگیزشی بسیار جذاب، علمی و صمیمی به زبان فارسی بنویس. 
تلاش کن پاسخ کوتاه و در حد ۳ تا ۴ جمله باشد. از کلمات انگلیسی استفاده نکن. نکات تمرکزی برای تمرین (مثلا تمرکز روی عضلات شکم یا باسن یا حفظ توده عضلانی) را بیان کن.
`;
      aiFeedback = await callGeminiApi({
        prompt,
        image: data.photoUrl,
        jsonMode: false
      });
    } catch (aiErr: any) {
      console.error('Gemini feedback error:', aiErr);
      aiFeedback = `اندازه‌های شما با موفقیت ثبت شد. به دلیل عدم دسترسی به کلید هوش مصنوعی در حال حاضر تحلیل پیشرفت امکان‌پذیر نیست. (${aiErr.message || 'خطای اتصال'})`;
    }

    const size = await prisma.bodySize.create({
      data: {
        userId: currentUser.id,
        weight: Number(data.weight),
        waist: Number(data.waist),
        hips: Number(data.hips),
        arms: Number(data.arms),
        chest: Number(data.chest),
        photoUrl: data.photoUrl || null,
        aiFeedback: aiFeedback
      }
    });

    return { success: true, size: toBodySizeData(size) };
  } catch (error) {
    console.error('Error logging body sizes:', error);
    return { success: false, error: 'خطا در ثبت اندازه‌ها.' };
  }
}

export async function deleteBodySizeAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    await prisma.bodySize.delete({
      where: { id, userId: currentUser.id }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting body size entry:', error);
    return { success: false, error: 'خطا در حذف رکورد.' };
  }
}
