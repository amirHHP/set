import { execSync } from 'child_process';
import fs from 'fs';

function readEnv() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    let val = rest.join('=');
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = readEnv();
const connStr = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
const host = new URL(connStr.replace('postgresql://', 'http://')).host;
const endpoint = `https://${host}/sql`;

async function queryNeon(sql, params = []) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': connStr,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql, params }),
  });

  const data = await res.json();
  if (data.message) {
    throw new Error(`Neon Error: ${data.message} (SQL: ${sql})`);
  }
  return data;
}

function getSqliteRows(table) {
  try {
    const out = execSync(`sqlite3 -json dev.db "SELECT * FROM ${table};"`, { encoding: 'utf8' }).trim();
    if (!out) return [];
    return JSON.parse(out);
  } catch (err) {
    console.warn(`Could not read table ${table}:`, err.message);
    return [];
  }
}

async function run() {
  console.log('🚀 شروع ساخت جداول در دیتابیس ابری Neon PostgreSQL...');

  // 1. Create Tables
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "username" TEXT NOT NULL UNIQUE,
      "email" TEXT UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "salt" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'user',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "EmailOtp" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "EmailOtp_email_idx" ON "EmailOtp"("email");`,
    `CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "image" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "BodySize" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "weight" DOUBLE PRECISION NOT NULL,
      "waist" DOUBLE PRECISION NOT NULL,
      "hips" DOUBLE PRECISION NOT NULL,
      "arms" DOUBLE PRECISION NOT NULL,
      "chest" DOUBLE PRECISION NOT NULL,
      "photoUrl" TEXT,
      "aiFeedback" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "WorkoutProgram" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "programJson" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "WorkoutLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "programId" TEXT NOT NULL REFERENCES "WorkoutProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "date" TEXT NOT NULL,
      "completedSetsJson" TEXT NOT NULL,
      "isCompleted" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "BlogPost" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "content" TEXT NOT NULL,
      "summary" TEXT NOT NULL,
      "coverImage" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "SystemConfig" (
      "key" TEXT NOT NULL PRIMARY KEY,
      "value" TEXT NOT NULL
    );`
  ];

  for (const ddl of ddlStatements) {
    await queryNeon(ddl);
  }
  console.log('✅ ساخت ساختار جداول با موفقیت پایان یافت.');

  // 2. Transfer Data
  console.log('📦 در حال استخراج و انتقال داده‌های محلی...');

  // Users
  const users = getSqliteRows('User');
  console.log(`👤 در حال انتقال ${users.length} کاربر...`);
  for (const u of users) {
    await queryNeon(
      `INSERT INTO "User" ("id", "name", "username", "email", "passwordHash", "salt", "role", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("id") DO UPDATE SET
         "name" = EXCLUDED."name",
         "username" = EXCLUDED."username",
         "email" = EXCLUDED."email",
         "passwordHash" = EXCLUDED."passwordHash",
         "salt" = EXCLUDED."salt",
         "role" = EXCLUDED."role";`,
      [u.id, u.name, u.username, u.email || null, u.passwordHash, u.salt, u.role, u.createdAt]
    );
  }

  // Products
  const products = getSqliteRows('Product');
  console.log(`🛍️ در حال انتقال ${products.length} محصول...`);
  for (const p of products) {
    await queryNeon(
      `INSERT INTO "Product" ("id", "name", "description", "price", "image", "category", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT ("id") DO NOTHING;`,
      [p.id, p.name, p.description, p.price, p.image, p.category, p.createdAt]
    );
  }

  // BodySizes
  const bodySizes = getSqliteRows('BodySize');
  console.log(`📏 در حال انتقال ${bodySizes.length} اندازه بدنی...`);
  for (const b of bodySizes) {
    await queryNeon(
      `INSERT INTO "BodySize" ("id", "userId", "weight", "waist", "hips", "arms", "chest", "photoUrl", "aiFeedback", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT ("id") DO NOTHING;`,
      [b.id, b.userId, b.weight, b.waist, b.hips, b.arms, b.chest, b.photoUrl, b.aiFeedback, b.createdAt]
    );
  }

  // WorkoutPrograms
  const programs = getSqliteRows('WorkoutProgram');
  console.log(`🏋️ در حال انتقال ${programs.length} برنامه تمرینی...`);
  for (const pr of programs) {
    await queryNeon(
      `INSERT INTO "WorkoutProgram" ("id", "userId", "programJson", "isActive", "createdAt")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("id") DO NOTHING;`,
      [pr.id, pr.userId, pr.programJson, Boolean(pr.isActive), pr.createdAt]
    );
  }

  // WorkoutLogs
  const logs = getSqliteRows('WorkoutLog');
  console.log(`📝 در حال انتقال ${logs.length} گزارش تمرین...`);
  for (const l of logs) {
    await queryNeon(
      `INSERT INTO "WorkoutLog" ("id", "userId", "programId", "date", "completedSetsJson", "isCompleted", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT ("id") DO NOTHING;`,
      [l.id, l.userId, l.programId, l.date, l.completedSetsJson, Boolean(l.isCompleted), l.createdAt]
    );
  }

  // BlogPosts
  const blogs = getSqliteRows('BlogPost');
  console.log(`📰 در حال انتقال ${blogs.length} پست وبلاگ...`);
  for (const bp of blogs) {
    await queryNeon(
      `INSERT INTO "BlogPost" ("id", "title", "slug", "content", "summary", "coverImage", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT ("id") DO NOTHING;`,
      [bp.id, bp.title, bp.slug, bp.content, bp.summary, bp.coverImage, bp.createdAt]
    );
  }

  // SystemConfigs
  const configs = getSqliteRows('SystemConfig');
  console.log(`⚙️ در حال انتقال ${configs.length} تنظیمات سیستم...`);
  for (const c of configs) {
    await queryNeon(
      `INSERT INTO "SystemConfig" ("key", "value")
       VALUES ($1, $2)
       ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";`,
      [c.key, c.value]
    );
  }

  console.log('\n🎉 تبریک! تمام جداول و اطلاعات با موفقیت به Neon PostgreSQL منتقل شد!');
}

run().catch((err) => {
  console.error('❌ خطا در عملیات انتقال:', err);
  process.exit(1);
});
