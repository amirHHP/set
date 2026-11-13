export interface MuscleInfo {
  id: string;
  name: string;
  category: 'upper' | 'core' | 'lower';
  view: 'front' | 'back' | 'both';
  description: string;
}

export const MUSCLES: Record<string, MuscleInfo> = {
  // Upper body
  chest: {
    id: 'chest',
    name: 'سینه (پکتورال)',
    category: 'upper',
    view: 'front',
    description: 'افزایش حجم، سفت شدن و فرم‌دهی به بالاتنه'
  },
  shoulders: {
    id: 'shoulders',
    name: 'سرشانه (دلتوئید)',
    category: 'upper',
    view: 'both',
    description: 'تقویت و گردتر شدن شانه‌ها و اصلاح افتادگی شانه'
  },
  biceps: {
    id: 'biceps',
    name: 'جلو بازو',
    category: 'upper',
    view: 'front',
    description: 'تقویت قله و عضلات قدامی بازو'
  },
  triceps: {
    id: 'triceps',
    name: 'پشت بازو',
    category: 'upper',
    view: 'back',
    description: 'سفت کردن پشت بازو و جلوگیری از شل شدگی'
  },
  traps: {
    id: 'traps',
    name: 'کول و گردن',
    category: 'upper',
    view: 'back',
    description: 'عضلات کول، ذوزنقه‌ای و پشت گردن'
  },
  lats: {
    id: 'lats',
    name: 'زیربغل و پشت',
    category: 'upper',
    view: 'back',
    description: 'عضلات پشتی بزرگ جهت فرم V-شکل و عریض‌تر شدن پشت'
  },
  forearms: {
    id: 'forearms',
    name: 'ساعد و مچ',
    category: 'upper',
    view: 'both',
    description: 'تقویت گیرایی دست و عضلات مچ و ساعد'
  },

  // Core
  abs: {
    id: 'abs',
    name: 'عضلات شکم (سیکس‌پک)',
    category: 'core',
    view: 'front',
    description: 'تخت شدن شکم و نمایان شدن خطوط عضلات راست شکمی'
  },
  obliques: {
    id: 'obliques',
    name: 'پهلوها (مورب شکمی)',
    category: 'core',
    view: 'front',
    description: 'باریک شدن کمر و جمع شدن چربی‌های پهلو'
  },
  lower_back: {
    id: 'lower_back',
    name: 'فیله کمر',
    category: 'core',
    view: 'back',
    description: 'تقویت ستون فقرات و پیشگیری از کمردرد'
  },

  // Lower body
  glutes: {
    id: 'glutes',
    name: 'باسن (عضلات سرینی)',
    category: 'lower',
    view: 'back',
    description: 'لیفت، برجسته‌سازی و فرم‌دهی گرد به باسن'
  },
  quads: {
    id: 'quads',
    name: 'چهارسر ران (جلوی ران)',
    category: 'lower',
    view: 'front',
    description: 'سفت شدن، تفکیک و تراشیدگی جلوی ران‌ها'
  },
  hamstrings: {
    id: 'hamstrings',
    name: 'پشت ران (همسترینگ)',
    category: 'lower',
    view: 'back',
    description: 'تفکیک خط زیر باسن و رفع افتادگی پشت ران'
  },
  calves: {
    id: 'calves',
    name: 'ساق پا',
    category: 'lower',
    view: 'both',
    description: 'کشیدگی، فرم‌دهی و قدرت عضلات دوقلوی ساق'
  },
};

export const MUSCLE_LIST = Object.values(MUSCLES);

export function getMuscleName(id: string): string {
  return MUSCLES[id]?.name || id;
}

export function formatMusclesToPersian(ids: string[]): string {
  if (!ids || ids.length === 0) return 'همه عضلات بدن (تمرین بالانس و متعادل)';
  return ids.map(id => getMuscleName(id)).join('، ');
}
