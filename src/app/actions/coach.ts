/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getCurrentUser, generateUniqueCoachCode } from './auth';

export interface TraineeSummary {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  gender?: string | null;
  height?: number | null;
  targetMuscles?: string[];
  createdAt: string;
  latestSize?: {
    weight: number;
    waist: number;
    hips: number;
    arms: number;
    chest: number;
    photoUrl?: string | null;
    aiFeedback?: string | null;
    createdAt: string;
  } | null;
  firstSize?: {
    weight: number;
    createdAt: string;
  } | null;
  weightChange?: number | null;
  totalSizesCount: number;
  activeProgramName?: string | null;
  latestLogDate?: string | null;
  totalLogsCount: number;
  notesCount: number;
}

export interface CoachDashboardData {
  coach: {
    id: string;
    name: string;
    username: string;
    coachCode: string;
    coachBio: string | null;
    coachPhone: string | null;
    coachWelcomeMessage: string | null;
  };
  trainees: TraineeSummary[];
  stats: {
    totalTrainees: number;
    activeWorkoutsThisWeek: number;
    sizesLoggedThisMonth: number;
  };
}

export interface TraineeDetailData {
  trainee: {
    id: string;
    name: string;
    username: string;
    email?: string | null;
    gender?: string | null;
    height?: number | null;
    targetMuscles?: string[];
    createdAt: string;
  };
  sizes: Array<{
    id: string;
    weight: number;
    waist: number;
    hips: number;
    arms: number;
    chest: number;
    photoUrl?: string | null;
    aiFeedback?: string | null;
    createdAt: string;
  }>;
  program: {
    id: string;
    goal: string;
    programName: string;
    days: any[];
    isActive: boolean;
    createdAt: string;
  } | null;
  logs: Array<{
    id: string;
    date: string;
    completedSetsCount: number;
    isCompleted: boolean;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    note: string;
    createdAt: string;
  }>;
}

export async function getCoachDashboardData(): Promise<{
  success: boolean;
  data?: CoachDashboardData;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    if (currentUser.role !== 'coach' && currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی فقط مخصوص مربیان است.' };
    }

    // Ensure coach has a unique code
    let coachCode = currentUser.coachCode;
    if (!coachCode) {
      coachCode = await generateUniqueCoachCode(currentUser.name || currentUser.username);
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { coachCode }
      });
    }

    // Fetch trainees
    const traineesRaw = await prisma.user.findMany({
      where: { coachId: currentUser.id },
      include: {
        sizes: {
          orderBy: { createdAt: 'desc' }
        },
        programs: {
          where: { isActive: true },
          take: 1
        },
        logs: {
          orderBy: { createdAt: 'desc' }
        },
        notesReceived: {
          where: { coachId: currentUser.id }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let activeWorkoutsThisWeek = 0;
    let sizesLoggedThisMonth = 0;

    const trainees: TraineeSummary[] = traineesRaw.map((t) => {
      // sizes
      const latestSizeRaw = t.sizes[0];
      const firstSizeRaw = t.sizes[t.sizes.length - 1];

      let weightChange: number | null = null;
      if (latestSizeRaw && firstSizeRaw && t.sizes.length > 1) {
        weightChange = Number((latestSizeRaw.weight - firstSizeRaw.weight).toFixed(1));
      }

      // active program
      let activeProgramName: string | null = null;
      if (t.programs[0]?.programJson) {
        try {
          const parsed = JSON.parse(t.programs[0].programJson);
          activeProgramName = parsed.programName || parsed.goal || 'برنامه ورزشی فعال';
        } catch {
          activeProgramName = 'برنامه ورزشی فعال';
        }
      }

      // latest log
      const latestLog = t.logs[0];

      // stats counters
      const hasRecentWorkout = t.logs.some(l => new Date(l.createdAt) >= oneWeekAgo);
      if (hasRecentWorkout) activeWorkoutsThisWeek++;

      const hasRecentSize = t.sizes.some(s => new Date(s.createdAt) >= oneMonthAgo);
      if (hasRecentSize) sizesLoggedThisMonth++;

      let targetMuscles: string[] = [];
      if (t.targetMuscles) {
        try {
          targetMuscles = typeof t.targetMuscles === 'string' ? JSON.parse(t.targetMuscles) : t.targetMuscles;
        } catch {
          targetMuscles = [];
        }
      }

      return {
        id: t.id,
        name: t.name,
        username: t.username,
        email: t.email,
        gender: t.gender,
        height: t.height !== null && t.height !== undefined ? Number(t.height) : null,
        targetMuscles: Array.isArray(targetMuscles) ? targetMuscles : [],
        createdAt: t.createdAt.toISOString(),
        latestSize: latestSizeRaw ? {
          weight: latestSizeRaw.weight,
          waist: latestSizeRaw.waist,
          hips: latestSizeRaw.hips,
          arms: latestSizeRaw.arms,
          chest: latestSizeRaw.chest,
          photoUrl: latestSizeRaw.photoUrl,
          aiFeedback: latestSizeRaw.aiFeedback,
          createdAt: latestSizeRaw.createdAt.toISOString(),
        } : null,
        firstSize: firstSizeRaw ? {
          weight: firstSizeRaw.weight,
          createdAt: firstSizeRaw.createdAt.toISOString(),
        } : null,
        weightChange,
        totalSizesCount: t.sizes.length,
        activeProgramName,
        latestLogDate: latestLog?.date || null,
        totalLogsCount: t.logs.length,
        notesCount: t.notesReceived.length,
      };
    });

    return {
      success: true,
      data: {
        coach: {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          coachCode,
          coachBio: currentUser.coachBio || null,
          coachPhone: currentUser.coachPhone || null,
          coachWelcomeMessage: currentUser.coachWelcomeMessage || null,
        },
        trainees,
        stats: {
          totalTrainees: trainees.length,
          activeWorkoutsThisWeek,
          sizesLoggedThisMonth,
        }
      }
    };
  } catch (error) {
    console.error('Error fetching coach dashboard data:', error);
    return { success: false, error: 'خطا در بارگذاری اطلاعات پنل مربی.' };
  }
}

export async function updateCoachProfileAction(data: {
  name?: string;
  coachCode?: string;
  coachBio?: string;
  coachPhone?: string;
  coachWelcomeMessage?: string;
}): Promise<{ success: boolean; coachCode?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    if (currentUser.role !== 'coach' && currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    let codeToUpdate = currentUser.coachCode;
    if (data.coachCode && data.coachCode.trim()) {
      const formatted = data.coachCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      if (formatted.length < 3) {
        return { success: false, error: 'کد ورود مربی باید حداقل ۳ کاراکتر انگلیسی یا عدد باشد.' };
      }

      if (formatted !== currentUser.coachCode) {
        const existing = await prisma.user.findUnique({
          where: { coachCode: formatted }
        });
        if (existing && existing.id !== currentUser.id) {
          return { success: false, error: 'این کد مربی قبلاً توسط مربی دیگری انتخاب شده است.' };
        }
        codeToUpdate = formatted;
      }
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: data.name?.trim() || undefined,
        coachCode: codeToUpdate || undefined,
        coachBio: data.coachBio !== undefined ? data.coachBio.trim() : undefined,
        coachPhone: data.coachPhone !== undefined ? data.coachPhone.trim() : undefined,
        coachWelcomeMessage: data.coachWelcomeMessage !== undefined ? data.coachWelcomeMessage.trim() : undefined,
      }
    });

    return { success: true, coachCode: codeToUpdate || undefined };
  } catch (error: any) {
    console.error('Error updating coach profile:', error);
    return { success: false, error: error?.message || 'خطا در ذخیره مشخصات مربی.' };
  }
}

export async function getTraineeDetailsAction(traineeId: string): Promise<{
  success: boolean;
  data?: TraineeDetailData;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    if (currentUser.role !== 'coach' && currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    const trainee = await prisma.user.findUnique({
      where: { id: traineeId },
      include: {
        sizes: {
          orderBy: { createdAt: 'desc' }
        },
        programs: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 30
        },
        notesReceived: {
          where: { coachId: currentUser.id },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!trainee) {
      return { success: false, error: 'کاربر مورد نظر یافت نشد.' };
    }

    // Check that trainee belongs to this coach (unless admin)
    if (currentUser.role !== 'admin' && trainee.coachId !== currentUser.id) {
      return { success: false, error: 'این ورزشکار عضو تیم مربیگری شما نیست.' };
    }

    let programData: any = null;
    if (trainee.programs[0]?.programJson) {
      try {
        const parsed = JSON.parse(trainee.programs[0].programJson);
        programData = {
          id: trainee.programs[0].id,
          goal: parsed.goal || 'تناسب اندام',
          programName: parsed.programName || 'برنامه ورزشی سِت',
          days: parsed.days || [],
          isActive: trainee.programs[0].isActive,
          createdAt: trainee.programs[0].createdAt.toISOString(),
        };
      } catch (err) {
        console.error('Failed to parse trainee programJson', err);
      }
    }

    const logsData = trainee.logs.map(l => {
      let completedCount = 0;
      if (l.completedSetsJson) {
        try {
          const parsed = JSON.parse(l.completedSetsJson);
          completedCount = Object.values(parsed).filter(Boolean).length;
        } catch {
          completedCount = 0;
        }
      }
      return {
        id: l.id,
        date: l.date,
        completedSetsCount: completedCount,
        isCompleted: l.isCompleted,
        createdAt: l.createdAt.toISOString(),
      };
    });

    let targetMuscles: string[] = [];
    if (trainee.targetMuscles) {
      try {
        targetMuscles = typeof trainee.targetMuscles === 'string' ? JSON.parse(trainee.targetMuscles) : trainee.targetMuscles;
      } catch {
        targetMuscles = [];
      }
    }

    return {
      success: true,
      data: {
        trainee: {
          id: trainee.id,
          name: trainee.name,
          username: trainee.username,
          email: trainee.email,
          gender: trainee.gender,
          height: trainee.height !== null && trainee.height !== undefined ? Number(trainee.height) : null,
          targetMuscles: Array.isArray(targetMuscles) ? targetMuscles : [],
          createdAt: trainee.createdAt.toISOString(),
        },
        sizes: trainee.sizes.map(s => ({
          id: s.id,
          weight: s.weight,
          waist: s.waist,
          hips: s.hips,
          arms: s.arms,
          chest: s.chest,
          photoUrl: s.photoUrl,
          aiFeedback: s.aiFeedback,
          createdAt: s.createdAt.toISOString(),
        })),
        program: programData,
        logs: logsData,
        notes: trainee.notesReceived.map(n => ({
          id: n.id,
          note: n.note,
          createdAt: n.createdAt.toISOString(),
        })),
      }
    };
  } catch (error) {
    console.error('Error fetching trainee details:', error);
    return { success: false, error: 'خطا در بارگذاری پرونده شاگرد.' };
  }
}

export async function addCoachNoteAction(
  traineeId: string,
  noteText: string
): Promise<{ success: boolean; note?: any; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    if (currentUser.role !== 'coach' && currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    const note = noteText.trim();
    if (!note) {
      return { success: false, error: 'متن یادداشت نمی‌تواند خالی باشد.' };
    }

    // Verify trainee
    const trainee = await prisma.user.findUnique({ where: { id: traineeId } });
    if (!trainee) {
      return { success: false, error: 'شاگرد یافت نشد.' };
    }

    if (currentUser.role !== 'admin' && trainee.coachId !== currentUser.id) {
      return { success: false, error: 'این شاگرد تحت نظر شما نیست.' };
    }

    const newNote = await prisma.coachNote.create({
      data: {
        id: crypto.randomUUID(),
        coachId: currentUser.id,
        traineeId,
        note,
      }
    });

    return {
      success: true,
      note: {
        id: newNote.id,
        note: newNote.note,
        createdAt: newNote.createdAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Error adding coach note:', error);
    return { success: false, error: 'خطا در ثبت یادداشت مربی.' };
  }
}

export async function deleteCoachNoteAction(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    const note = await prisma.coachNote.findUnique({ where: { id: noteId } });
    if (!note) {
      return { success: false, error: 'یادداشت یافت نشد.' };
    }

    if (currentUser.role !== 'admin' && note.coachId !== currentUser.id) {
      return { success: false, error: 'شما مجاز به حذف این یادداشت نیستید.' };
    }

    await prisma.coachNote.delete({ where: { id: noteId } });
    return { success: true };
  } catch (error) {
    console.error('Error deleting coach note:', error);
    return { success: false, error: 'خطا در حذف یادداشت.' };
  }
}

export async function linkCoachByCodeAction(coachCodeInput: string): Promise<{
  success: boolean;
  coach?: {
    id: string;
    name: string;
    coachBio?: string | null;
    coachPhone?: string | null;
    coachWelcomeMessage?: string | null;
    coachCode: string;
  };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' };
    }

    const code = coachCodeInput.trim().toUpperCase();
    if (!code) {
      return { success: false, error: 'لطفاً کد مربی را وارد نمایید.' };
    }

    const coach = await prisma.user.findFirst({
      where: {
        coachCode: { equals: code, mode: 'insensitive' },
        role: { in: ['coach', 'admin'] }
      }
    });

    if (!coach) {
      return { success: false, error: 'مربی با این کد ورود یافت نشد. لطفاً کد را با مربی خود چک کنید.' };
    }

    if (coach.id === currentUser.id) {
      return { success: false, error: 'شما نمی‌توانید کد مربیگری خودتان را وارد کنید.' };
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { coachId: coach.id }
    });

    return {
      success: true,
      coach: {
        id: coach.id,
        name: coach.name,
        coachBio: coach.coachBio || null,
        coachPhone: coach.coachPhone || null,
        coachWelcomeMessage: coach.coachWelcomeMessage || null,
        coachCode: coach.coachCode || code,
      }
    };
  } catch (error) {
    console.error('Error linking coach by code:', error);
    return { success: false, error: 'خطا در اتصال به مربی.' };
  }
}

export async function unlinkCoachAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { coachId: null }
    });

    return { success: true };
  } catch (error) {
    console.error('Error unlinking coach:', error);
    return { success: false, error: 'خطا در قطع ارتباط با مربی.' };
  }
}

export async function getTraineeCoachNotesAction(): Promise<{
  success: boolean;
  notes?: Array<{ id: string; note: string; createdAt: string; coachName: string }>;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    const notes = await prisma.coachNote.findMany({
      where: { traineeId: currentUser.id },
      include: {
        coach: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      notes: notes.map(n => ({
        id: n.id,
        note: n.note,
        createdAt: n.createdAt.toISOString(),
        coachName: n.coach.name,
      }))
    };
  } catch (error) {
    console.error('Error fetching trainee coach notes:', error);
    return { success: false, error: 'خطا در دریافت پیام‌های مربی.' };
  }
}

export async function assignCustomWorkoutToTraineeAction(
  traineeId: string,
  program: {
    goal: string;
    programName: string;
    days: any[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'احراز هویت انجام نشده است.' };
    }

    if (currentUser.role !== 'coach' && currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    const trainee = await prisma.user.findUnique({ where: { id: traineeId } });
    if (!trainee) {
      return { success: false, error: 'شاگرد یافت نشد.' };
    }

    if (currentUser.role !== 'admin' && trainee.coachId !== currentUser.id) {
      return { success: false, error: 'این شاگرد عضو تیم مربیگری شما نیست.' };
    }

    // Deactivate previous active programs
    await prisma.workoutProgram.updateMany({
      where: { userId: traineeId, isActive: true },
      data: { isActive: false }
    });

    const programJson = JSON.stringify({
      goal: program.goal || 'برنامه اختصاصی مربی',
      programName: program.programName || `برنامه تمرینی اختصاصی از طرف مربی ${currentUser.name}`,
      days: program.days || []
    });

    await prisma.workoutProgram.create({
      data: {
        id: crypto.randomUUID(),
        userId: traineeId,
        programJson,
        isActive: true,
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error assigning custom workout to trainee:', error);
    return { success: false, error: 'خطا در ذخیره برنامه ورزشی شاگرد.' };
  }
}
