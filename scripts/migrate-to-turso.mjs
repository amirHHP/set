import Database from 'better-sqlite3';
import path from 'path';
import 'dotenv/config';

async function migrate() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !authToken) {
    console.error('❌ خطا: متغیرهای TURSO_DATABASE_URL و TURSO_AUTH_TOKEN در فایل .env یا .env.local یافت نشدند.');
    process.exit(1);
  }

  // Convert libsql:// to https://
  const httpUrl = tursoUrl.replace(/^libsql:\/\//, 'https://') + '/v2/pipeline';
  const sqlitePath = path.resolve(process.cwd(), 'dev.db');
  console.log(`📂 در حال خواندن دیتابیس محلی از: ${sqlitePath}`);
  const sqlite = new Database(sqlitePath);

  // Helper to execute SQL batches on Turso
  async function executeTurso(statements) {
    const requests = statements.map(sql => ({
      type: 'execute',
      stmt: { sql }
    }));
    requests.push({ type: 'close' });

    const res = await fetch(httpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(`Turso API Error: ${data.error}`);
    }
    return data;
  }

  try {
    console.log(`🚀 در حال ساخت جداول روی Turso (${tursoUrl})...`);

    // 1. Create Tables
    const ddl = [
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "username" TEXT NOT NULL UNIQUE,
        "email" TEXT UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "salt" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'user',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "EmailOtp" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "Product" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "price" INTEGER NOT NULL,
        "image" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "BodySize" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "weight" REAL NOT NULL,
        "waist" REAL NOT NULL,
        "hips" REAL NOT NULL,
        "arms" REAL NOT NULL,
        "chest" REAL NOT NULL,
        "photoUrl" TEXT,
        "aiFeedback" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BodySize_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS "WorkoutProgram" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "programJson" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkoutProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS "WorkoutLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "programId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "completedSetsJson" TEXT NOT NULL,
        "isCompleted" BOOLEAN NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "WorkoutLog_programId_fkey" FOREIGN KEY ("programId") REFERENCES "WorkoutProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS "BlogPost" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "content" TEXT NOT NULL,
        "summary" TEXT NOT NULL,
        "coverImage" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "SystemConfig" (
        "key" TEXT NOT NULL PRIMARY KEY,
        "value" TEXT NOT NULL
      );`
    ];

    await executeTurso(ddl);
    console.log('✅ ساخت جداول با موفقیت انجام شد.');

    // 2. Transfer Data
    console.log('📦 در حال انتقال داده‌های محلی...');

    const users = sqlite.prepare('SELECT * FROM User').all();
    for (const u of users) {
      await executeTurso([
        `INSERT OR IGNORE INTO "User" ("id", "name", "username", "email", "passwordHash", "salt", "role", "createdAt")
         VALUES ('${u.id}', '${u.name.replace(/'/g, "''")}', '${u.username}', ${u.email ? `'${u.email}'` : 'NULL'}, '${u.passwordHash}', '${u.salt}', '${u.role}', '${u.createdAt}');`
      ]);
    }
    console.log(`👤 ${users.length} کاربر منتقل شد.`);

    const products = sqlite.prepare('SELECT * FROM Product').all();
    for (const p of products) {
      await executeTurso([
        `INSERT OR IGNORE INTO "Product" ("id", "name", "description", "price", "image", "category", "createdAt")
         VALUES ('${p.id}', '${p.name.replace(/'/g, "''")}', '${p.description.replace(/'/g, "''")}', ${p.price}, '${p.image}', '${p.category}', '${p.createdAt}');`
      ]);
    }
    console.log(`🛍️ ${products.length} محصول منتقل شد.`);

    const configs = sqlite.prepare('SELECT * FROM SystemConfig').all();
    for (const c of configs) {
      await executeTurso([
        `INSERT OR REPLACE INTO "SystemConfig" ("key", "value")
         VALUES ('${c.key}', '${c.value.replace(/'/g, "''")}');`
      ]);
    }
    console.log(`⚙️ ${configs.length} تنظیمات سیستم منتقل شد.`);

    console.log('\n🎉 انتقال با موفقیت به پایان رسید! دیتابیس ابری آماده استفاده است.');
  } catch (err) {
    console.error('❌ خطا در فرآیند انتقال:', err);
  } finally {
    sqlite.close();
  }
}

migrate();
