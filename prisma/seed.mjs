import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import crypto from 'crypto'

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

function generateSalt() {
  return crypto.randomBytes(16).toString('hex')
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Clean existing data
  await prisma.systemConfig.deleteMany().catch(() => {})
  await prisma.blogPost.deleteMany().catch(() => {})
  await prisma.product.deleteMany().catch(() => {})
  await prisma.bodySize.deleteMany().catch(() => {})
  await prisma.workoutLog.deleteMany().catch(() => {})
  await prisma.workoutProgram.deleteMany().catch(() => {})
  await prisma.user.deleteMany().catch(() => {})

  // 2. Create default users
  const adminSalt = generateSalt()
  const adminHash = hashPassword('admin123', adminSalt)
  const admin = await prisma.user.create({
    data: {
      name: 'مدیریت سیستم',
      username: 'admin',
      passwordHash: adminHash,
      salt: adminSalt,
      role: 'admin',
    },
  })
  console.log('✅ Admin user created (username: admin, password: admin123)')

  const userSalt = generateSalt()
  const userHash = hashPassword('sara123', userSalt)
  const user = await prisma.user.create({
    data: {
      name: 'سارا احمدی',
      username: 'sara',
      passwordHash: userHash,
      salt: userSalt,
      role: 'user',
    },
  })
  console.log('✅ Test user created (username: sara, password: sara123)')

  // 3. Create shop products
  const products = [
    {
      name: 'پودر پروتئین وی ایزوله ۱۰۰٪ (کاله پرو)',
      description: 'پروتئین وی ایزوله با کیفیت بالا جهت ریکاوری سریع عضلات، حاوی ۲۴ گرم پروتئین خالص در هر اسکوپ بدون قند و چربی اضافی، مناسب برای دوره کات و عضله‌سازی خشک بانوان.',
      price: 2450000,
      image: 'whey_protein',
      category: 'supplement',
    },
    {
      name: 'کراتین مونوهیدرات میکرونایز شده (آپتیموم نوتریشن)',
      description: 'کراتین خالص ۳۰۰ گرمی مناسب برای افزایش قدرت و استقامت در تمرینات مقاومتی باشگاه. افزایش حجم سلولی عضلانی و بهبود عملکرد در ست‌های پرفشار.',
      price: 1100000,
      image: 'creatine',
      category: 'supplement',
    },
    {
      name: 'کش مینی لوپ لاتکس بسته ۵ عددی (گریپ)',
      description: 'مجموعه ۵ تایی کش‌های مینی لوپ با ضخامت‌ها و مقاومت‌های مختلف از سبک تا فوق سنگین. عالی برای تمرینات فرم‌دهی باسن و ران در خانه یا باشگاه.',
      price: 250000,
      image: 'resistance_bands',
      category: 'equipment',
    },
    {
      name: 'دمبل شش‌ضلعی روکش‌دار ۲ عددی (۵ کیلوگرمی)',
      description: 'یک جفت دمبل ۵ کیلویی با روکش نئوپرن نرم جهت جلوگیری از آسیب به دست‌ها و کاهش صدای برخورد با زمین. طراحی شش‌ضلعی برای ثبات کامل روی زمین.',
      price: 490000,
      image: 'dumbbells',
      category: 'equipment',
    },
    {
      name: 'نیم‌تنه ورزشی سیملس (طرح گلبهی)',
      description: 'نیم‌تنه ورزشی بدون درز (Seamless) با پشتی تنفس‌پذیر و کشسانی فوق‌العاده. حمایت عالی از سینه در حین دویدن و تمرینات پرشی باشگاه.',
      price: 380000,
      image: 'sport_bra',
      category: 'clothing',
    },
    {
      name: 'لگ ورزشی کمر پهن ضد سلولیت (رنگ مشکی)',
      description: 'لگ ورزشی فاق بلند با کمر پهن جهت جمع کردن شکم و پهلو. دوخت محکم اسکوآت‌پروف (بدون بدن‌نمایی) و پارچه جذب رطوبت برای راحتی تمام در حین تمرین.',
      price: 520000,
      image: 'leggings',
      category: 'clothing',
    },
  ]

  for (const prod of products) {
    await prisma.product.create({ data: prod })
  }
  console.log(`✅ Seeded ${products.length} products to marketplace.`)

  // 4. Create SEO Blog Posts
  const blogPosts = [
    {
      title: 'راهنمای جامع تغذیه قبل و بعد از باشگاه برای بانوان',
      slug: 'nutrition-guide-before-after-workout-women',
      summary: 'چه چیزهایی قبل از تمرین بخوریم تا انرژی داشته باشیم و بعد از تمرین چه مصرف کنیم تا عضلات بازیابی شوند؟ در این مقاله به بررسی علمی این موضوع می‌پردازیم.',
      content: `### اهمیت تغذیه ورزشی برای بانوان

تغذیه مناسب نقشی کلیدی در کارایی ورزشی، ریکاوری و رسیدن به اندام دلخواه دارد. بسیاری از خانم‌ها به دلیل ترس از افزایش وزن، میزان کالری دریافتی خود را بیش از حد کاهش می‌دهند که این امر منجر به افت قند خون و تحلیل رفتن بافت عضلانی در حین تمرین می‌شود.

#### ۱. تغذیه قبل از تمرین (سوخت‌رسانی)
هدف اصلی وعده قبل از تمرین، رساندن کربوهیدرات کافی برای تامین انرژی و پروتئین برای پیشگیری از تحلیل عضلانی است. این وعده را بستگی به حجم آن، بین **۱ تا ۲ ساعت** قبل از تمرین میل کنید:
- **گزینه‌های عالی قبل از تمرین:**
  - یک عدد موز به همراه یک قاشق مرباخوری کره بادام‌زمینی
  - جو دوسر پخته شده با شیر کم‌چرب و کمی عسل
  - نان تست جو با یک عدد تخم‌مرغ آب‌پز

#### ۲. تغذیه بعد از تمرین (ریکاوری)
پس از یک تمرین سخت، عضلات نیاز به پروتئین برای بازسازی و کربوهیدرات برای پر کردن مجدد ذخایر گلیکوژن دارند. بهترین زمان مصرف وعده ریکاوری **تا ۴۵ دقیقه پس از پایان تمرین** است:
- **گزینه‌های عالی بعد از تمرین:**
  - شیک پروتئین وی با آب یا شیر گیاهی
  - فیله مرغ گریل شده به همراه برنج قهوه‌ای و سبزیجات بخارپز
  - عدسی یا خوراک لوبیا به همراه سالاد کاهو

با رعایت این نکات ساده اما علمی، شادابی و سرعت پیشرفت خود در باشگاه را دوچندان کنید!`,
      coverImage: 'nutrition_blog',
    },
    {
      title: 'چرا خانم‌ها باید کار با وزنه را شروع کنند؟ (افسانه‌زدایی از عضلانی شدن)',
      slug: 'why-women-should-lift-weights',
      summary: 'آیا کار با وزنه باعث می‌شود هیکل مردانه پیدا کنید؟ در این مقاله با دلایل علمی و فیزیولوژیک ثابت می‌کنیم چرا تمرینات مقاومتی بهترین دوست شما هستند.',
      content: `### اشتباه بزرگ: ترس از وزنه در بانوان

یکی از شایع‌ترین باورهای غلط در میان خانم‌ها این است که کار با وزنه یا دمبل‌های سنگین باعث می‌شود اندام آن‌ها شبیه مردان شود. از نظر فیزیولوژیکی این موضوع کاملاً غیرممکن است. بگذارید دلایل علمی آن را بررسی کنیم.

#### هورمون تستوسترون؛ کلید اصلی رشد عضلات حجیم
تستوسترون هورمون اصلی رشد و افزایش حجم عضلانی سنگین است. سطح این هورمون در بدن بانوان به طور میانگین **۱۵ تا ۲۰ برابر کمتر** از آقایان است. بنابراین، کار با وزنه در خانم‌ها نه تنها ظاهر مردانه ایجاد نمی‌کند، بلکه باعث سفت شدن عضلات، چربی‌سوزی بیشتر و فرم‌دهی بسیار شیک به اندام می‌شود.

#### مزایای شگفت‌انگیز تمرینات مقاومتی برای بانوان:
1. **افزایش متابولیسم و چربی‌سوزی مستمر:** عضلات فعال حتی در زمان خواب و استراحت نیز کالری می‌سوزانند. با افزایش بافت عضلانی، سوخت‌وساز بدن شما بالا می‌رود.
2. **پیشگیری از پوکی استخوان:** کار با وزنه تراکم استخوان‌ها را به شدت افزایش داده و از ابتلا به پوکی استخوان در سنین بالاتر جلوگیری می‌کند.
3. **فرم‌دهی و تراشیدن اندام:** کاردیو (مانند دویدن) وزن شما را کم می‌کند اما تمرین با وزنه است که به بدن شکل و انحناهای زیبا می‌دهد (مانند فرم‌دهی به باسن، باریک کردن کمر و سفت کردن بازوها).
4. **بهبود خلق‌وخو و اعتماد به نفس:** ترشح اندورفین پس از تمرینات قدرتی به شدت استرس را کاهش داده و حس قدرت و تسلط را در شما تقویت می‌کند.

از دمبل‌های صورتی و سبک نترسید و به مرور زمان مقاومت تمرینات خود را افزایش دهید تا تغییرات واقعی را لمس کنید!`,
      coverImage: 'lifting_blog',
    },
  ]

  for (const post of blogPosts) {
    await prisma.blogPost.create({ data: post })
  }
  console.log(`✅ Seeded ${blogPosts.length} SEO articles to blog.`)

  // 5. Create System Configuration
  const configs = [
    { key: 'ai-provider', value: 'gemini' },
    { key: 'ai-model-gemini', value: 'gemini-2.0-flash' },
    { key: 'gemini-api-key', value: '' }, // Admin will update in panel
  ]

  for (const config of configs) {
    await prisma.systemConfig.create({ data: config })
  }
  console.log('✅ System configurations initialized.')

  console.log('🎉 Seeding successfully completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
