/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAiConfig } from '@/app/actions/settings';

export async function callGeminiApi({
  prompt,
  image, // Base64 string optional
  jsonMode = false,
}: {
  prompt: string;
  image?: string | null;
  jsonMode?: boolean;
}): Promise<string> {
  const { apiKey, model } = await getAiConfig();
  if (!apiKey) {
    throw new Error('کلید API هوش مصنوعی تنظیم نشده است. لطفاً ابتدا در پنل ادمین ثبت کنید.');
  }

  const cleanModelName = model.startsWith('models/') ? model : `models/${model}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/${cleanModelName}:generateContent?key=${apiKey}`;

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
    const msg = errData?.error?.message || `خطای سرور هوش مصنوعی (${response.status})`;
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
