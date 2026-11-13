import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import 'dotenv/config';

const { Pool } = pg;

async function migrate() {
  const pgUrl = process.env.DATABASE_URL;
  if (!pgUrl || (!pgUrl.startsWith('postgres://') && !pgUrl.startsWith('postgresql://'))) {
    console.error('❌ خطا: لطفاً متغیر DATABASE_URL مربوط به Postgres را در فایل .env قرار دهید.');
    process.exit(1);
  }

  const sqlitePath = path.resolve(process.cwd(), 'dev.db');
  console.log(`📂 در حال خواندن دیتابیس لوکال SQLite از: ${sqlitePath}`);
  const sqlite = new Database(sqlitePath);

  console.log(`🌐 در حال اتصال به دیتابیس آنلاین PostgreSQL...`);
  const pool = new Pool({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });

  try {
    const client = await pool.connect();
    console.log('✅ اتصال به PostgreSQL با موفقیت برقرار شد.');

    // 1. Migrate Users
    const users = sqlite.prepare('SELECT * FROM User').all();
    console.log(`👤 در حال انتقال ${users.length} کاربر...`);
    for (const u of users) {
      await client.query(`
        INSERT INTO "User" (id, name, username, email, "passwordHash", salt, role, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [u.id, u.name, u.username, u.email || null, u.passwordHash, u.salt, u.role, new Date(u.createdAt)]);
    }

    // 2. Migrate Products
    const products = sqlite.prepare('SELECT * FROM Product').all();
    console.log(`🛍️ در حال انتقال ${products.length} محصول...`);
    for (const p of products) {
      await client.query(`
        INSERT INTO "Product" (id, name, description, price, image, category, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [p.id, p.name, p.description, p.price, p.image, p.category, new Date(p.createdAt)]);
    }

    // 3. Migrate BodySize
    const bodySizes = sqlite.prepare('SELECT * FROM BodySize').all();
    console.log(`📏 در حال انتقال ${bodySizes.length} اندازه بدنی...`);
    for (const b of bodySizes) {
      await client.query(`
        INSERT INTO "BodySize" (id, "userId", weight, waist, hips, arms, chest, "photoUrl", "aiFeedback", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [b.id, b.userId, b.weight, b.waist, b.hips, b.arms, b.chest, b.photoUrl, b.aiFeedback, new Date(b.createdAt)]);
    }

    // 4. Migrate WorkoutProgram
    const programs = sqlite.prepare('SELECT * FROM WorkoutProgram').all();
    console.log(`🏋️ در حال انتقال ${programs.length} برنامه تمرینی...`);
    for (const pr of programs) {
      await client.query(`
        INSERT INTO "WorkoutProgram" (id, "userId", "programJson", "isActive", "createdAt")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [pr.id, pr.userId, pr.programJson, Boolean(pr.isActive), new Date(pr.createdAt)]);
    }

    // 5. Migrate WorkoutLog
    const logs = sqlite.prepare('SELECT * FROM WorkoutLog').all();
    console.log(`📝 در حال انتقال ${logs.length} گزارش تمرین...`);
    for (const l of logs) {
      await client.query(`
        INSERT INTO "WorkoutLog" (id, "userId", "programId", date, "completedSetsJson", "isCompleted", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [l.id, l.userId, l.programId, l.date, l.completedSetsJson, Boolean(l.isCompleted), new Date(l.createdAt)]);
    }

    // 6. Migrate BlogPost
    const blogs = sqlite.prepare('SELECT * FROM BlogPost').all();
    console.log(`📰 در حال انتقال ${blogs.length} پست وبلاگ...`);
    for (const bp of blogs) {
      await client.query(`
        INSERT INTO "BlogPost" (id, title, slug, content, summary, "coverImage", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [bp.id, bp.title, bp.slug, bp.content, bp.summary, bp.coverImage, new Date(bp.createdAt)]);
    }

    // 7. Migrate SystemConfig
    const configs = sqlite.prepare('SELECT * FROM SystemConfig').all();
    console.log(`⚙️ در حال انتقال ${configs.length} تنظیمات سیستم...`);
    for (const c of configs) {
      await client.query(`
        INSERT INTO "SystemConfig" (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `, [c.key, c.value]);
    }

    client.release();
    console.log('🎉 تمام اطلاعات با موفقیت از SQLite به PostgreSQL آنلاین منتقل شد!');
  } catch (err) {
    console.error('❌ خطا در فرآیند انتقال:', err);
  } finally {
    sqlite.close();
    await pool.end();
  }
}

migrate();
