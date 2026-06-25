'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { callGeminiApi } from '@/lib/ai';

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

export async function generateWorkoutProgramAction(data: {
  goal: string;
  level: string;
  currentWeight: number;
}): Promise<{ success: boolean; program?: WorkoutProgramData; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    if (!data.goal || !data.level) {
      return { success: false, error: 'پر کردن فیلدهای هدف و سطح آمادگی الزامی است.' };
    }

    const weightStr = data.currentWeight ? `${data.currentWeight} کیلوگرم` : 'نامشخص';
    const prompt = `
تو یک مربی بدنسازی و بدنساز حرفه‌ای بانوان با اطلاعات علمی به‌روز هستی.
یک خانم ورزشکار با مشخصات زیر خواهان یک برنامه تمرینی است:
- هدف تمرین: ${data.goal} (کاهش وزن، عضله‌سازی، فرم‌دهی، افزایش استقامت)
- سطح آمادگی جسمانی: ${data.level} (مبتدی، متوسط، حرفه‌ای)
- وزن فعلی: ${weightStr}

یک برنامه تمرینی علمی و عالی در قالب یک فایل JSON معتبر به زبان فارسی بنویس. برنامه باید شامل ۳ روز تمرینی در هفته باشد. 
ساختار خروجی باید دقیقاً مانند قالب زیر باشد و هیچ متنی به جز این JSON برنگردانی (حتی فنس‌های کد markdown مثل \`\`\`json را هم نگذار، فقط یک JSON خام معتبر):
{
  "goal": "${data.goal}",
  "programName": "برنامه تخصصی ${data.goal} سِت",
  "days": [
    {
      "dayName": "نام روز (مثال: روز ۱: تمرین پا و باسن جهت فرم‌دهی)",
      "exercises": [
        {
          "id": "ex-1",
          "name": "نام حرکت ورزشی (فارسی - دقیق)",
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

    // Validate if JSON is parseable
    try {
      JSON.parse(generatedJson);
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
        programJson: generatedJson,
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
      logs: logs.map(l => ({
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
