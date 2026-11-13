/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { callGeminiApi } from '@/lib/ai';
import { formatMusclesToPersian } from '@/lib/muscles';

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    const match = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (match) {
      cleaned = match[1].trim();
    }
  }
  
  return cleaned;
}

export interface Exercise {
  id: string;
  name: string;
  setsCount: number;
  reps: string;
  rest: string;
}

export interface WorkoutDay {
  dayName: string;
  exercises: Exercise[];
}

export interface WorkoutProgramData {
  id: string;
  goal: string;
  programName: string;
  days: WorkoutDay[];
  isActive: boolean;
  createdAt: string;
}

export interface WorkoutLogData {
  id: string;
  programId: string;
  date: string;
  completedSetsJson: string; // JSON: Record<string, boolean>
  isCompleted: boolean;
  createdAt: string;
}

function parseProgram(prog: any): WorkoutProgramData {
  let parsed = { goal: '', programName: '', days: [] };
  try {
    parsed = JSON.parse(prog.programJson);
  } catch (e) {
    console.error('Failed to parse workout program JSON', e);
  }

  return {
    id: prog.id,
    goal: parsed.goal || 'تناسب اندام',
    programName: parsed.programName || 'برنامه ورزشی سِت',
    days: parsed.days || [],
    isActive: prog.isActive,
    createdAt: prog.createdAt.toISOString(),
  };
}

export async function getActiveWorkoutProgram(): Promise<{ success: boolean; program?: WorkoutProgramData; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    const program = await prisma.workoutProgram.findFirst({
      where: { userId: currentUser.id, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!program) {
      return { success: true }; // No active program found
    }

    return { success: true, program: parseProgram(program) };
  } catch (error) {
    console.error('Error fetching active program:', error);
    return { success: false, error: 'خطا در بارگذاری برنامه ورزشی.' };
  }
}

export async function getUserWorkoutContextAction(): Promise<{
  success: boolean;
  gender?: string;
  height?: number | null;
  targetMuscles?: string[];
  latestWeight?: number | null;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: 'احراز هویت انجام نشده است.' };

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        sizes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    let targetMuscles: string[] = [];
    if (user?.targetMuscles) {
      try {
        const parsed = JSON.parse(user.targetMuscles);
        if (Array.isArray(parsed)) targetMuscles = parsed;
      } catch {}
    }

    return {
      success: true,
      gender: user?.gender || 'female',
      height: user?.height !== null && user?.height !== undefined ? Number(user.height) : null,
      targetMuscles,
      latestWeight: user?.sizes?.[0]?.weight || null,
    };
  } catch (err) {
    console.error('Error fetching user workout context:', err);
    return { success: false, error: 'خطا در دریافت مشخصات کاربر.' };
  }
}

export async function generateWorkoutProgramAction(data: {
  goal: string;
  level: string;
  currentWeight?: number;
  gender?: string;
  height?: number;
  targetMuscles?: string[];
}): Promise<{ success: boolean; program?: WorkoutProgramData; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    if (!data.goal || !data.level) {
      return { success: false, error: 'پر کردن فیلدهای هدف و سطح آمادگی الزامی است.' };
    }

    // Fetch user profile and latest body sizes
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        sizes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const latestSize = user?.sizes?.[0];

    // Resolve gender
    const userGender = data.gender || user?.gender || 'female';
    const genderLabel = userGender === 'male' ? 'آقا (مرد)' : 'خانم (زن)';

    // Resolve weight
    const weightNum = data.currentWeight || latestSize?.weight || 0;
    const weightStr = weightNum ? `${weightNum} کیلوگرم` : 'ثبت نشده';

    // Resolve height
    const heightNum = data.height || (user?.height ? Number(user.height) : null);
    const heightStr = heightNum ? `${heightNum} سانتی‌متر` : 'ثبت نشده';

    // Resolve target muscles
    let targetMuscles: string[] = [];
    if (data.targetMuscles && data.targetMuscles.length > 0) {
      targetMuscles = data.targetMuscles;
    } else if (user?.targetMuscles) {
      try {
        const parsed = JSON.parse(user.targetMuscles);
        if (Array.isArray(parsed)) targetMuscles = parsed;
      } catch {}
    }

    const targetMusclesStr = targetMuscles.length > 0 
      ? formatMusclesToPersian(targetMuscles) 
      : 'تمام عضلات اصلی (برنامه جامع و متوازن)';

    // Measurements context if available
    let measurementsContext = '';
    if (latestSize) {
      measurementsContext = `
- آخرین سایزهای بدنی ورزشکار:
  * دور شکم: ${latestSize.waist} سانتی‌متر
  * دور باسن: ${latestSize.hips} سانتی‌متر
  * دور بازو: ${latestSize.arms} سانتی‌متر
  * دور سینه: ${latestSize.chest} سانتی‌متر
`;
    }

    const prompt = `
تو یک مربی بدنسازی و فیتنس ارشد و طراح تمرینات تخصصی با به‌روزترین متدهای علمی تمرین (هایپرتروفی، سازگاری عصبی-عضلانی و کات) هستی.
یک ورزشکار با مشخصات فردی و آناتومیک زیر از تو خواهان یک برنامه تمرینی ۳ روزه اختصاصی است:

مشخصات ورزشکار:
- جنسیت: ${genderLabel}
- قد: ${heightStr}
- وزن: ${weightStr}
- هدف اصلی تمرین: ${data.goal}
- سطح آمادگی جسمانی: ${data.level}
${measurementsContext}
- عضلات دارای اولویت و نیازمند تقویت (Target Muscles): ${targetMusclesStr}

دستورالعمل ویژه مربی:
${targetMuscles.length > 0 
  ? `ورزشکار صراحتاً مشخص کرده که عضلات [${targetMusclesStr}] نیاز به تقویت، رشد، تفکیک یا فرم‌دهی فوری دارند. لطفاً در تمام روزهای تمرینی، حرکات اصلی، ترکیبی (Compound) و ایزوله با شدت و حجم مناسب برای تقویت این عضلات لحاظ کن و نام‌گذاری روزها و ترتیب حرکات نیز بر اساس اولویت این عضلات باشد.`
  : 'برنامه را به صورت متعادل و متناسب با هدف و سطح ورزشکار توزیع کن.'}

یک برنامه تمرینی علمی، استاندارد و باانگیزه در قالب یک فایل JSON معتبر به زبان فارسی بنویس. برنامه باید شامل ۳ روز تمرینی در هفته باشد. 
ساختار خروجی باید دقیقاً مانند قالب زیر باشد و هیچ متنی به جز این JSON برنگردانی (حتی فنس‌های کد markdown مثل \`\`\`json را هم نگذار، فقط یک JSON خام معتبر):
{
  "goal": "${data.goal}",
  "programName": "برنامه تخصصی ${data.goal} سِت",
  "days": [
    {
      "dayName": "نام روز (مثال: روز ۱: تمرین پا و باسن با تمرکز بر عضلات هدف)",
      "exercises": [
        {
          "id": "ex-1",
          "name": "نام حرکت ورزشی (فارسی و دقیق)",
          "setsCount": 4,
          "reps": "12-12-10-10",
          "rest": "60 ثانیه"
        }
      ]
    }
  ]
}
`;

    let generatedJson = '';
    try {
      generatedJson = await callGeminiApi({
        prompt,
        jsonMode: true
      });
    } catch (aiErr: any) {
      console.error('Gemini workout generation error:', aiErr);
      return { success: false, error: `خطا در برقراری ارتباط با هوش مصنوعی: ${aiErr.message || 'لطفاً بعداً تلاش کنید'}` };
    }

    const cleanedJson = cleanJsonString(generatedJson);

    // Validate if JSON is parseable
    try {
      JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error('Invalid JSON returned by Gemini:', generatedJson, parseErr);
      return { success: false, error: 'یافته‌های دریافت شده از هوش مصنوعی قالب معتبری نداشتند. لطفاً مجدداً امتحان کنید.' };
    }

    // Set all previous programs of this user to inactive
    await prisma.workoutProgram.updateMany({
      where: { userId: currentUser.id, isActive: true },
      data: { isActive: false }
    });

    // Create new program
    const newProg = await prisma.workoutProgram.create({
      data: {
        userId: currentUser.id,
        programJson: cleanedJson,
        isActive: true
      }
    });

    return { success: true, program: parseProgram(newProg) };
  } catch (error) {
    console.error('Error generating workout program:', error);
    return { success: false, error: 'خطا در تولید برنامه ورزشی جدید.' };
  }
}

export async function getWorkoutLogs(): Promise<{ success: boolean; logs?: WorkoutLogData[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    const logs = await prisma.workoutLog.findMany({
      where: { userId: currentUser.id },
      orderBy: { date: 'desc' }
    });

    return {
      success: true,
      logs: logs.map((l: any) => ({
        id: l.id,
        programId: l.programId,
        date: l.date,
        completedSetsJson: l.completedSetsJson,
        isCompleted: l.isCompleted,
        createdAt: l.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error('Error fetching workout logs:', error);
    return { success: false, error: 'خطا در بارگذاری تاریخچه تمرینات.' };
  }
}

export async function saveWorkoutLogAction(data: {
  programId: string;
  date: string;
  completedSetsJson: string; // Record<string, boolean>
  isCompleted: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    const existingLog = await prisma.workoutLog.findFirst({
      where: {
        userId: currentUser.id,
        programId: data.programId,
        date: data.date
      }
    });

    if (existingLog) {
      await prisma.workoutLog.update({
        where: { id: existingLog.id },
        data: {
          completedSetsJson: data.completedSetsJson,
          isCompleted: data.isCompleted
        }
      });
    } else {
      await prisma.workoutLog.create({
        data: {
          userId: currentUser.id,
          programId: data.programId,
          date: data.date,
          completedSetsJson: data.completedSetsJson,
          isCompleted: data.isCompleted
        }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving workout log:', error);
    return { success: false, error: 'خطا در ثبت لاگ تمرین.' };
  }
}
