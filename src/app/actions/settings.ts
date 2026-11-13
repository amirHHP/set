/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_KEY = 'set_session';

export type AiProvider = 'gemini' | 'openai' | 'deepseek' | 'anthropic' | 'openrouter';

export interface FullAiConfig {
  provider: AiProvider;
  
  // Google Gemini
  geminiApiKey: string;
  geminiModel: string;
  geminiBaseUrl: string;

  // OpenAI
  openaiApiKey: string;
  openaiModel: string;
  openaiBaseUrl: string;

  // DeepSeek
  deepseekApiKey: string;
  deepseekModel: string;
  deepseekBaseUrl: string;

  // Anthropic
  anthropicApiKey: string;
  anthropicModel: string;

  // OpenRouter
  openrouterApiKey: string;
  openrouterModel: string;
  openrouterBaseUrl: string;

  // Active shortcuts
  activeApiKey: string;
  activeModel: string;
  activeBaseUrl: string;

  // Backwards compatibility
  apiKey: string;
  model: string;
}

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
      update: { value: value.trim() },
      create: { key, value: value.trim() }
    });
    return { success: true };
  } catch (error) {
    console.error(`Error writing config for ${key}:`, error);
    return { success: false, error: 'خطا در ثبت تنظیمات.' };
  }
}

export async function setSystemSettingsBatch(settings: Record<string, string>): Promise<{ success: boolean; error?: string }> {
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

    const entries = Object.entries(settings);
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value: (value ?? '').trim() },
          create: { key, value: (value ?? '').trim() }
        })
      )
    );
    return { success: true };
  } catch (error) {
    console.error('Error saving settings batch:', error);
    return { success: false, error: 'خطا در ثبت گروهی تنظیمات.' };
  }
}

export async function getAiConfig(): Promise<FullAiConfig> {
  const configs = await prisma.systemConfig.findMany().catch(() => []);
  const map: Record<string, string> = {};
  for (const c of configs) {
    map[c.key] = c.value;
  }

  const rawProvider = map['ai-provider'] as AiProvider;
  const validProviders: AiProvider[] = ['gemini', 'openai', 'deepseek', 'anthropic', 'openrouter'];
  const provider: AiProvider = validProviders.includes(rawProvider) ? rawProvider : 'gemini';

  const geminiApiKey = map['gemini-api-key'] || '';
  const geminiModel = map['ai-model-gemini'] || 'gemini-2.0-flash';
  const geminiBaseUrl = map['gemini-base-url'] || '';

  const openaiApiKey = map['openai-api-key'] || '';
  const openaiModel = map['ai-model-openai'] || 'gpt-4o-mini';
  const openaiBaseUrl = map['openai-base-url'] || '';

  const deepseekApiKey = map['deepseek-api-key'] || '';
  const deepseekModel = map['ai-model-deepseek'] || 'deepseek-chat';
  const deepseekBaseUrl = map['deepseek-base-url'] || '';

  const anthropicApiKey = map['anthropic-api-key'] || '';
  const anthropicModel = map['ai-model-anthropic'] || 'claude-3-5-haiku-20241022';

  const openrouterApiKey = map['openrouter-api-key'] || '';
  const openrouterModel = map['ai-model-openrouter'] || 'google/gemini-2.0-flash-001';
  const openrouterBaseUrl = map['openrouter-base-url'] || '';

  // Determine active keys based on current provider
  let activeApiKey = geminiApiKey;
  let activeModel = geminiModel;
  let activeBaseUrl = geminiBaseUrl;

  if (provider === 'openai') {
    activeApiKey = openaiApiKey;
    activeModel = openaiModel;
    activeBaseUrl = openaiBaseUrl;
  } else if (provider === 'deepseek') {
    activeApiKey = deepseekApiKey;
    activeModel = deepseekModel;
    activeBaseUrl = deepseekBaseUrl;
  } else if (provider === 'anthropic') {
    activeApiKey = anthropicApiKey;
    activeModel = anthropicModel;
    activeBaseUrl = '';
  } else if (provider === 'openrouter') {
    activeApiKey = openrouterApiKey;
    activeModel = openrouterModel;
    activeBaseUrl = openrouterBaseUrl;
  }

  return {
    provider,
    geminiApiKey,
    geminiModel,
    geminiBaseUrl,
    openaiApiKey,
    openaiModel,
    openaiBaseUrl,
    deepseekApiKey,
    deepseekModel,
    deepseekBaseUrl,
    anthropicApiKey,
    anthropicModel,
    openrouterApiKey,
    openrouterModel,
    openrouterBaseUrl,
    activeApiKey,
    activeModel,
    activeBaseUrl,
    // Backwards compatibility
    apiKey: activeApiKey || geminiApiKey,
    model: activeModel || geminiModel,
  };
}

export async function testAiConnectionAction(params: {
  provider: AiProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}): Promise<{
  success: boolean;
  latencyMs?: number;
  message?: string;
  error?: string;
}> {
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

    const { provider, apiKey, model, baseUrl } = params;
    if (!apiKey || !apiKey.trim()) {
      return { success: false, error: 'کلید API وارد نشده است.' };
    }

    const key = apiKey.trim();
    const startTime = Date.now();

    if (provider === 'gemini') {
      const selectedModel = model?.trim() || 'gemini-2.0-flash';
      const cleanModel = selectedModel.startsWith('models/') ? selectedModel : `models/${selectedModel}`;
      const base = baseUrl?.trim() ? baseUrl.trim().replace(/\/+$/, '') : 'https://generativelanguage.googleapis.com';
      const url = `${base}/v1beta/${cleanModel}:generateContent?key=${key}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'سلام، لطفاً فقط کلمه «تایید» را ارسال کن.' }] }],
          generationConfig: { maxOutputTokens: 20 }
        }),
        signal: AbortSignal.timeout(15000)
      });

      const latency = Date.now() - startTime;
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `کد خطای HTTP ${res.status}`;
        return { success: false, latencyMs: latency, error: `پاسخ ناموفق از گوگل جمینای: ${msg}` };
      }

      return {
        success: true,
        latencyMs: latency,
        message: `اتصال به Google Gemini با موفقیت برقرار شد (${latency} میلی‌ثانیه).`
      };
    } else if (provider === 'openai') {
      const selectedModel = model?.trim() || 'gpt-4o-mini';
      const base = baseUrl?.trim() ? baseUrl.trim().replace(/\/+$/, '') : 'https://api.openai.com/v1';
      const url = `${base}/chat/completions`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'سلام، فقط بنویس تایید' }],
          max_tokens: 10
        }),
        signal: AbortSignal.timeout(15000)
      });

      const latency = Date.now() - startTime;
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `کد خطای HTTP ${res.status}`;
        return { success: false, latencyMs: latency, error: `پاسخ ناموفق از OpenAI: ${msg}` };
      }

      return {
        success: true,
        latencyMs: latency,
        message: `اتصال به OpenAI (${selectedModel}) با موفقیت برقرار شد (${latency} میلی‌ثانیه).`
      };
    } else if (provider === 'deepseek') {
      const selectedModel = model?.trim() || 'deepseek-chat';
      const base = baseUrl?.trim() ? baseUrl.trim().replace(/\/+$/, '') : 'https://api.deepseek.com';
      const url = `${base}/chat/completions`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'سلام، فقط بنویس تایید' }],
          max_tokens: 10
        }),
        signal: AbortSignal.timeout(15000)
      });

      const latency = Date.now() - startTime;
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `کد خطای HTTP ${res.status}`;
        return { success: false, latencyMs: latency, error: `پاسخ ناموفق از DeepSeek: ${msg}` };
      }

      return {
        success: true,
        latencyMs: latency,
        message: `اتصال به DeepSeek (${selectedModel}) با موفقیت برقرار شد (${latency} میلی‌ثانیه).`
      };
    } else if (provider === 'anthropic') {
      const selectedModel = model?.trim() || 'claude-3-5-haiku-20241022';
      const url = 'https://api.anthropic.com/v1/messages';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'سلام، فقط بنویس تایید' }]
        }),
        signal: AbortSignal.timeout(15000)
      });

      const latency = Date.now() - startTime;
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `کد خطای HTTP ${res.status}`;
        return { success: false, latencyMs: latency, error: `پاسخ ناموفق از Anthropic: ${msg}` };
      }

      return {
        success: true,
        latencyMs: latency,
        message: `اتصال به Anthropic Claude (${selectedModel}) با موفقیت برقرار شد (${latency} میلی‌ثانیه).`
      };
    } else if (provider === 'openrouter') {
      const selectedModel = model?.trim() || 'google/gemini-2.0-flash-001';
      const base = baseUrl?.trim() ? baseUrl.trim().replace(/\/+$/, '') : 'https://openrouter.ai/api/v1';
      const url = `${base}/chat/completions`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'سلام، فقط بنویس تایید' }],
          max_tokens: 10
        }),
        signal: AbortSignal.timeout(15000)
      });

      const latency = Date.now() - startTime;
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `کد خطای HTTP ${res.status}`;
        return { success: false, latencyMs: latency, error: `پاسخ ناموفق از OpenRouter: ${msg}` };
      }

      return {
        success: true,
        latencyMs: latency,
        message: `اتصال به OpenRouter با موفقیت برقرار شد (${latency} میلی‌ثانیه).`
      };
    }

    return { success: false, error: 'ارائه‌دهنده انتخابی پشتیبانی نمی‌شود.' };
  } catch (error: any) {
    console.error('Error testing AI connection:', error);
    return { success: false, error: `خطا در اتصال: ${error?.message || 'پاسخی دریافت نشد یا زمان به اتمام رسید'}` };
  }
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

    const customBase = await getSystemSetting('gemini-base-url');
    const base = customBase?.trim() ? customBase.trim().replace(/\/+$/, '') : 'https://generativelanguage.googleapis.com';
    const res = await fetch(`${base}/v1beta/models?key=${apiKey}`);
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
