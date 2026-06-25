/* eslint-disable @typescript-eslint/no-explicit-any */
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

function getModelRateLimits(modelName: string) {
  const name = modelName.toLowerCase();
  if (name.includes('gemini-2.0-flash-lite')) {
    return { rpm: '30 RPM', tpm: '1M TPM', rpd: '1,500 RPD', note: 'رایگان / فوق سریع' };
  } else if (name.includes('gemini-2.0-flash') || name.includes('gemini-2.5-flash') || name.includes('gemini-1.5-flash')) {
    return { rpm: '15 RPM', tpm: '1M TPM', rpd: '1,500 RPD', note: 'رایگان / سرعت بالا' };
  } else if (name.includes('gemini-1.5-pro') || name.includes('gemini-2.0-pro') || name.includes('gemini-2.5-pro') || name.includes('gemini-pro')) {
    return { rpm: '2 RPM', tpm: '32K TPM', rpd: '50 RPD', note: 'رایگان / دقت بالا' };
  }
  return { rpm: 'نامشخص', tpm: 'نامشخص', rpd: 'نامشخص', note: 'بر اساس لایسنس کاربری شما' };
}

export async function fetchAvailableGeminiModels(): Promise<{ success: boolean; models?: any[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_KEY)?.value;
    if (!sessionUserId) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }
    
    const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    const apiKey = await getSystemSetting('gemini-api-key');
    if (!apiKey) {
      return { success: false, error: 'لطفاً ابتدا کلید API خود را ذخیره کنید.' };
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini models API error:', errText);
      return { success: false, error: 'خطا در ارتباط با سرویس گوگل. مطمئن شوید کلید API معتبر است.' };
    }

    const data = await res.json();
    if (!data.models) {
      return { success: false, error: 'مدلی یافت نشد یا کلید معتبر نیست.' };
    }

    const annotatedModels = data.models
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => ({
        name: m.name,
        displayName: m.displayName || m.name.replace('models/', ''),
        description: m.description || '',
        inputTokenLimit: m.inputTokenLimit || 0,
        outputTokenLimit: m.outputTokenLimit || 0,
        rateLimits: getModelRateLimits(m.name)
      }));

    return { success: true, models: annotatedModels };
  } catch (error: any) {
    console.error('Error fetching available models:', error);
    return { success: false, error: `خطا در اتصال به سرور: ${error.message || 'نامشخص'}` };
  }
}
