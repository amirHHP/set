/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAiConfig } from '@/app/actions/settings';

export interface CallAiOptions {
  prompt: string;
  image?: string | null; // Base64 string or data URL optional
  jsonMode?: boolean;
}

export async function callAiApi({
  prompt,
  image,
  jsonMode = false,
}: CallAiOptions): Promise<string> {
  const config = await getAiConfig();
  const provider = config.provider || 'gemini';

  // Find active key or fallback to any provider that has a key configured
  let activeProvider = provider;
  let activeApiKey = config.activeApiKey;
  let activeModel = config.activeModel;
  let activeBaseUrl = config.activeBaseUrl;

  if (!activeApiKey) {
    if (config.geminiApiKey) {
      activeProvider = 'gemini';
      activeApiKey = config.geminiApiKey;
      activeModel = config.geminiModel;
      activeBaseUrl = config.geminiBaseUrl;
    } else if (config.openaiApiKey) {
      activeProvider = 'openai';
      activeApiKey = config.openaiApiKey;
      activeModel = config.openaiModel;
      activeBaseUrl = config.openaiBaseUrl;
    } else if (config.deepseekApiKey) {
      activeProvider = 'deepseek';
      activeApiKey = config.deepseekApiKey;
      activeModel = config.deepseekModel;
      activeBaseUrl = config.deepseekBaseUrl;
    } else if (config.anthropicApiKey) {
      activeProvider = 'anthropic';
      activeApiKey = config.anthropicApiKey;
      activeModel = config.anthropicModel;
    } else if (config.openrouterApiKey) {
      activeProvider = 'openrouter';
      activeApiKey = config.openrouterApiKey;
      activeModel = config.openrouterModel;
      activeBaseUrl = config.openrouterBaseUrl;
    }
  }

  if (!activeApiKey) {
    throw new Error('هیچ کلید هوش مصنوعی در پنل ادمین تنظیم نشده است. لطفاً ابتدا در پنل مدیریت کلید هوش مصنوعی را وارد کنید.');
  }

  // 1. Google Gemini
  if (activeProvider === 'gemini') {
    const cleanModelName = activeModel.startsWith('models/') ? activeModel : `models/${activeModel}`;
    const base = activeBaseUrl?.trim() ? activeBaseUrl.trim().replace(/\/+$/, '') : 'https://generativelanguage.googleapis.com';
    const url = `${base}/v1beta/${cleanModelName}:generateContent?key=${activeApiKey}`;

    const parts: any[] = [{ text: prompt }];

    if (image) {
      let encoded = image;
      let mimeType = 'image/jpeg';
      if (image.includes(',')) {
        const partsList = image.split(',');
        const header = partsList[0];
        encoded = partsList[1];
        const mimeMatch = /data:([^;]+);base64/.exec(header);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }
      parts.push({
        inlineData: {
          mimeType,
          data: encoded
        }
      });
    }

    const requestBody: any = { contents: [{ parts }] };
    requestBody.generationConfig = {
      maxOutputTokens: 4096
    };
    if (jsonMode) {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `خطای سرور گوگل جمینای (${response.status})`;
      throw new Error(msg);
    }

    const data = await response.json();
    const responseParts = data.candidates?.[0]?.content?.parts || [];
    const answerParts = responseParts.filter((p: any) => !p.thought && p.text);
    const text = answerParts.length > 0
      ? answerParts.map((p: any) => p.text).join('')
      : responseParts[0]?.text;

    if (!text) {
      throw new Error('پاسخ خالی از هوش مصنوعی دریافت شد.');
    }
    return text;
  }

  // 2. OpenAI / DeepSeek / OpenRouter (OpenAI-compatible Chat Completions)
  if (activeProvider === 'openai' || activeProvider === 'deepseek' || activeProvider === 'openrouter') {
    let defaultBaseUrl = 'https://api.openai.com/v1';
    let defaultModel = 'gpt-4o-mini';

    if (activeProvider === 'deepseek') {
      defaultBaseUrl = 'https://api.deepseek.com';
      defaultModel = 'deepseek-chat';
    } else if (activeProvider === 'openrouter') {
      defaultBaseUrl = 'https://openrouter.ai/api/v1';
      defaultModel = 'google/gemini-2.0-flash-001';
    }

    const baseUrl = activeBaseUrl?.trim() ? activeBaseUrl.trim().replace(/\/+$/, '') : defaultBaseUrl;
    const url = `${baseUrl}/chat/completions`;
    const model = activeModel?.trim() || defaultModel;

    const userContent: any[] = [{ type: 'text', text: prompt }];

    if (image) {
      const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUrl }
      });
    }

    const requestBody: any = {
      model,
      messages: [
        {
          role: 'user',
          content: userContent.length === 1 ? prompt : userContent
        }
      ],
      max_tokens: 4096
    };

    if (jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeApiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `خطای سرور (${response.status})`;
      throw new Error(msg);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('پاسخ خالی از مدل هوش مصنوعی دریافت شد.');
    }
    return text;
  }

  // 3. Anthropic (Claude)
  if (activeProvider === 'anthropic') {
    const url = 'https://api.anthropic.com/v1/messages';
    const model = activeModel?.trim() || 'claude-3-5-haiku-20241022';

    const content: any[] = [];

    if (image) {
      let base64Data = image;
      let mediaType = 'image/jpeg';
      if (image.includes(',')) {
        const parts = image.split(',');
        base64Data = parts[1];
        const match = /data:([^;]+);base64/.exec(parts[0]);
        if (match) mediaType = match[1];
      }
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data
        }
      });
    }

    content.push({ type: 'text', text: prompt });

    const requestBody: any = {
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': activeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `خطای سرور Anthropic (${response.status})`;
      throw new Error(msg);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      throw new Error('پاسخ خالی از مدل کلود دریافت شد.');
    }
    return text;
  }

  throw new Error(`ارائه‌دهنده ${activeProvider} پشتیبانی نمی‌شود.`);
}

// Backwards compatibility for existing imports in sizes.ts and workout.ts
export const callGeminiApi = callAiApi;
