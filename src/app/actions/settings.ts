'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_KEY = 'set_session';

export async function getSystemSetting(key: string): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });
    return config ? config.value : '';
  } catch (error) {
    console.error(`Error reading config for ${key}:`, error);
    return '';
  }
}

export async function setSystemSetting(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Basic auth check
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_KEY)?.value;
    if (!sessionUserId) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }
    
    const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    return { success: true };
  } catch (error) {
    console.error(`Error writing config for ${key}:`, error);
    return { success: false, error: 'خطا در ثبت تنظیمات.' };
  }
}

export async function getAiConfig() {
  const provider = await getSystemSetting('ai-provider') || 'gemini';
  const model = await getSystemSetting('ai-model-gemini') || 'gemini-2.0-flash';
  const apiKey = await getSystemSetting('gemini-api-key') || '';
  
  return { provider, model, apiKey };
}
