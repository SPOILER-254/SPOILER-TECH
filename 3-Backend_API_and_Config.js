// ============================================================
// FILE 3: Backend API Routes, Database & Configuration
// Contains: All route.js files, database.js, package.json, configs
// Repository: Samsung-xmd by frozenlorddev
// ============================================================


// ============================================================
// FILE: package.json
// ============================================================
{
  "name": "mzazi-tech",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.0",
    "next": "^14.2.29",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "axios": "^1.7.9",
    "cookies-next": "^4.3.0",
    "next-auth": "^4.24.7"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49"
  }
}


// ============================================================
// FILE: jsconfig.json
// ============================================================
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}


// ============================================================
// FILE: postcss.config.js
// ============================================================
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}


// ============================================================
// FILE: tailwind.config.js
// ============================================================
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0a0a0f',
          secondary: '#111121',
          card: '#16182a',
          border: '#1e2d4a',
        },
        blue: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'blue-gradient': 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a0f, #111121)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.4), 0 0 40px rgba(37, 99, 235, 0.1)',
        'glow-blue-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}


// ============================================================
// FILE: lib/database.js
// ============================================================
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        fullname VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        google_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(255) DEFAULT ''`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname VARCHAR(255) DEFAULT ''`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`;

    // Add expires_after_hours to packages (safe on re-run)
    await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS expires_after_hours INTEGER DEFAULT NULL`;

    // Add expires_at to panels (safe on re-run)
    await sql`ALTER TABLE panels ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL`;

    await sql`
      CREATE TABLE IF NOT EXISTS wallet (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE NOT NULL,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        reference VARCHAR(255),
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS panels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        ptero_server_id INTEGER,
        ptero_user_id INTEGER,
        ptero_username VARCHAR(255),
        package_name VARCHAR(255),
        package_price DECIMAL(10, 2),
        nest_id INTEGER,
        egg_id INTEGER,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER,
        package_name VARCHAR(255),
        amount DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'pending',
        reference VARCHAR(255) UNIQUE,
        pterodactyl_credentials TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        message TEXT NOT NULL,
        approved BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        admin_reply TEXT,
        replied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Packages table — replaces the hardcoded PACKAGES array
    await sql`
      CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        cpu INTEGER NOT NULL DEFAULT 0,
        ram INTEGER NOT NULL DEFAULT 0,
        disk INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        popular BOOLEAN DEFAULT false,
        accent VARCHAR(20) DEFAULT '#2563eb',
        active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed default packages if the table is empty
    const existing = await sql`SELECT COUNT(*) AS cnt FROM packages`;
    if (parseInt(existing[0].cnt) === 0) {
      await sql`
        INSERT INTO packages (name, price, cpu, ram, disk, description, popular, accent, sort_order)
        VALUES
          ('Starter',  50,  20,  512,   2048,  'Perfect for small bots and lightweight servers',           false, '#1e3a8a', 1),
          ('Standard', 75,  50,  1024,  5120,  'Great for Minecraft, Discord bots & medium workloads',    true,  '#2563eb', 2),
          ('Premium',  100, 100, 5120,  10240, 'Full power for high-performance game servers',             false, '#1d4ed8', 3),
          ('Ultimate', 120, 0,   0,     0,     'No limits. Maximum performance for any workload.',         false, '#4f46e5', 4)
      `;
    }

    // Insert Testing Server package if it doesn't exist
    await sql`
      INSERT INTO packages (name, price, cpu, ram, disk, description, popular, accent, active, sort_order, expires_after_hours)
      SELECT 'Testing Server', 5, 20, 512, 1024, 'Try our platform risk-free. Server is automatically removed after 6 hours.', false, '#7c3aed', true, 0, 6
      WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Testing Server')
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS voucher_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_by VARCHAR(255),
        used_by INTEGER REFERENCES users(id),
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export { sql };
export default sql;
// This content is patched below in initializeDatabase — see voucher_codes addition


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/inquiries/[id]/messages/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

async function verifyAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    if (!token) return false;
    const d = jwt.verify(token.value, ADMIN_JWT_SECRET);
    return d.role === 'admin';
  } catch { return false; }
}

// GET /api/admin/inquiries/[id]/messages
export async function GET(request, { params }) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  const inquiry = await sql`SELECT * FROM inquiries WHERE id = ${parseInt(id)}`;
  if (inquiry.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const messages = await sql`
    SELECT id, sender, message, created_at
    FROM inquiry_messages
    WHERE inquiry_id = ${parseInt(id)}
    ORDER BY created_at ASC
  `;

  return NextResponse.json({ inquiry: inquiry[0], messages });
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/inquiries/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

async function verifyAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    if (!token) return false;
    const d = jwt.verify(token.value, ADMIN_JWT_SECRET);
    return d.role === 'admin';
  } catch { return false; }
}

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS inquiries (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_email  VARCHAR(255),
      user_name   VARCHAR(255),
      subject     VARCHAR(255) NOT NULL,
      message     TEXT NOT NULL,
      status      VARCHAR(50) DEFAULT 'open',
      admin_reply TEXT,
      replied_at  TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
  await sql`
    CREATE TABLE IF NOT EXISTS inquiry_messages (
      id          SERIAL PRIMARY KEY,
      inquiry_id  INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
      sender      VARCHAR(20) NOT NULL DEFAULT 'user',
      message     TEXT NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// GET /api/admin/inquiries — list all inquiry threads for admin
export async function GET() {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await ensureTables();
    const inquiries = await sql`
      SELECT
        i.id, i.subject, i.message, i.status,
        i.admin_reply, i.replied_at, i.created_at, i.updated_at,
        COALESCE(i.user_email, u.email)    AS user_email,
        COALESCE(i.user_name,  u.fullname) AS user_name,
        i.user_id,
        (SELECT COUNT(*) FROM inquiry_messages im WHERE im.inquiry_id = i.id) AS message_count,
        (SELECT message FROM inquiry_messages im WHERE im.inquiry_id = i.id ORDER BY im.created_at DESC LIMIT 1) AS last_message,
        (SELECT sender  FROM inquiry_messages im WHERE im.inquiry_id = i.id ORDER BY im.created_at DESC LIMIT 1) AS last_sender
      FROM inquiries i
      LEFT JOIN users u ON u.id = i.user_id
      ORDER BY
        CASE WHEN i.status = 'open' THEN 0 ELSE 1 END,
        COALESCE(i.updated_at, i.created_at) DESC
    `;
    const open    = inquiries.filter(i => i.status === 'open').length;
    const replied = inquiries.filter(i => i.status === 'replied').length;
    return NextResponse.json({ inquiries, stats: { open, replied, total: inquiries.length } });
  } catch (error) {
    console.error('Admin inquiries GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries', detail: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/inquiries — admin replies to an inquiry (adds a message)
export async function PATCH(request) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id, admin_reply, status } = await request.json();
    if (!id) return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
    if (!admin_reply?.trim()) return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 });

    await ensureTables();

    const newStatus = status || 'replied';

    // Add reply as a message in the thread
    await sql`
      INSERT INTO inquiry_messages (inquiry_id, sender, message)
      VALUES (${id}, 'admin', ${admin_reply.trim()})
    `;

    // Update the inquiry record too (for backwards compat + status)
    await sql`
      UPDATE inquiries
      SET
        admin_reply = ${admin_reply.trim()},
        status      = ${newStatus},
        replied_at  = NOW(),
        updated_at  = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Admin inquiries PATCH error:', error);
    return NextResponse.json({ error: 'Failed to send reply', detail: error.message }, { status: 500 });
  }
}

// GET /api/admin/inquiries/[id]/messages handled separately, but we can also
// support ?id=X query param for messages:
// This DELETE closes an inquiry
export async function DELETE(request) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
    await sql`UPDATE inquiries SET status = 'closed', updated_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ message: 'Inquiry closed' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to close inquiry', detail: error.message }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/login/route.js
// ============================================================
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mzazi.shop';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD || '';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    let valid = false;
    if (ADMIN_PASSWORD_HASH) {
      valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } else if (ADMIN_PASSWORD_PLAIN) {
      valid = password === ADMIN_PASSWORD_PLAIN;
    } else {
      valid = password === '42246776@aA';
    }

    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = jwt.sign({ role: 'admin', email: ADMIN_EMAIL }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    });
    return NextResponse.json({ message: 'Admin login successful' });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/logout/route.js
// ============================================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set('admin_token', '', { maxAge: 0, path: '/' });
  return NextResponse.json({ message: 'Admin logged out' });
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/me/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = jwt.verify(token.value, ADMIN_JWT_SECRET);
    if (decoded.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ admin: { email: decoded.email } });
  } catch {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/packages/[id]/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) return false;
  try { const d = jwt.verify(token.value, ADMIN_JWT_SECRET); return d.role === 'admin'; }
  catch { return false; }
}

// PUT — update a package
export async function PUT(request, { params }) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const { name, price, cpu, ram, disk, description, popular, accent, active, sort_order, expires_after_hours } = await request.json();
    if (!name || price == null) return NextResponse.json({ error: 'name and price are required' }, { status: 400 });

    const rows = await sql`
      UPDATE packages SET
        name        = ${name},
        price       = ${parseFloat(price)},
        cpu         = ${parseInt(cpu) || 0},
        ram         = ${parseInt(ram) || 0},
        disk        = ${parseInt(disk) || 0},
        description = ${description || ''},
        popular     = ${popular === true || popular === 'true'},
        accent      = ${accent || '#2563eb'},
        active           = ${active !== false && active !== 'false'},
        sort_order       = ${parseInt(sort_order) || 0},
        expires_after_hours = ${expires_after_hours ? parseInt(expires_after_hours) : null}
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ package: rows[0] });
  } catch (error) {
    console.error('Admin packages PUT error:', error);
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
  }
}

// DELETE — remove a package
export async function DELETE(request, { params }) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    await sql`DELETE FROM packages WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin packages DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/packages/restore-defaults/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

const DEFAULTS = [
  { name: 'Starter',  price: 50,  cpu: 20,  ram: 512,   disk: 2048,  description: 'Perfect for small bots and lightweight servers',        popular: false, accent: '#1e3a8a', sort_order: 1 },
  { name: 'Standard', price: 75,  cpu: 50,  ram: 1024,  disk: 5120,  description: 'Great for Minecraft, Discord bots & medium workloads',  popular: true,  accent: '#2563eb', sort_order: 2 },
  { name: 'Premium',  price: 100, cpu: 100, ram: 5120,  disk: 10240, description: 'Full power for high-performance game servers',           popular: false, accent: '#1d4ed8', sort_order: 3 },
  { name: 'Ultimate', price: 120, cpu: 0,   ram: 0,     disk: 0,     description: 'No limits. Maximum performance for any workload.',      popular: false, accent: '#4f46e5', sort_order: 4 },
];

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) return false;
  try { const d = jwt.verify(token.value, ADMIN_JWT_SECRET); return d.role === 'admin'; }
  catch { return false; }
}

export async function POST() {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        cpu INTEGER NOT NULL DEFAULT 0,
        ram INTEGER NOT NULL DEFAULT 0,
        disk INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        popular BOOLEAN DEFAULT false,
        accent VARCHAR(20) DEFAULT '#2563eb',
        active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // DELETE all existing packages first so restore doesn't create duplicates
    await sql`DELETE FROM packages`;

    // Reset the ID sequence so IDs start cleanly from 1
    await sql`ALTER SEQUENCE packages_id_seq RESTART WITH 1`;

    const inserted = [];
    for (const pkg of DEFAULTS) {
      const rows = await sql`
        INSERT INTO packages (name, price, cpu, ram, disk, description, popular, accent, active, sort_order)
        VALUES (${pkg.name}, ${pkg.price}, ${pkg.cpu}, ${pkg.ram}, ${pkg.disk}, ${pkg.description}, ${pkg.popular}, ${pkg.accent}, true, ${pkg.sort_order})
        RETURNING *
      `;
      inserted.push(rows[0]);
    }
    return NextResponse.json({ message: `Restored ${inserted.length} default packages`, packages: inserted });
  } catch (error) {
    console.error('Restore defaults error:', error);
    return NextResponse.json({ error: 'Failed to restore defaults' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/packages/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) return false;
  try { const d = jwt.verify(token.value, ADMIN_JWT_SECRET); return d.role === 'admin'; }
  catch { return false; }
}

// GET — list all packages (including inactive)
export async function GET() {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const packages = await sql`
      SELECT *, expires_after_hours FROM packages ORDER BY sort_order ASC, id ASC
    `;
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Admin packages GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

// POST — create a new package
export async function POST(request) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { name, price, cpu, ram, disk, description, popular, accent, active, sort_order, expires_after_hours } = await request.json();
    if (!name || price == null) return NextResponse.json({ error: 'name and price are required' }, { status: 400 });

    const rows = await sql`
      INSERT INTO packages (name, price, cpu, ram, disk, description, popular, accent, active, sort_order, expires_after_hours)
      VALUES (
        ${name},
        ${parseFloat(price)},
        ${parseInt(cpu) || 0},
        ${parseInt(ram) || 0},
        ${parseInt(disk) || 0},
        ${description || ''},
        ${popular === true || popular === 'true'},
        ${accent || '#2563eb'},
        ${active !== false && active !== 'false'},
        ${parseInt(sort_order) || 0},
        ${expires_after_hours ? parseInt(expires_after_hours) : null}
      )
      RETURNING *
    `;
    return NextResponse.json({ package: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Admin packages POST error:', error);
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/transactions/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) return false;
  try { const d = jwt.verify(token.value, ADMIN_JWT_SECRET); return d.role === 'admin'; }
  catch { return false; }
}

export async function GET() {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const transactions = await sql`
      SELECT wt.*, u.email AS user_email, u.fullname AS user_name
      FROM wallet_transactions wt
      JOIN users u ON u.id = wt.user_id
      ORDER BY wt.created_at DESC LIMIT 500
    `;
    const orders = await sql`
      SELECT o.*, u.email AS user_email, u.fullname AS user_name
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC LIMIT 500
    `;
    const stats = await sql`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) AS total_revenue,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders
      FROM orders
    `;
    return NextResponse.json({ transactions, orders, stats: stats[0] });
  } catch (error) {
    console.error('Admin transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/users/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) return false;
  try { const d = jwt.verify(token.value, ADMIN_JWT_SECRET); return d.role === 'admin'; }
  catch { return false; }
}

export async function GET() {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const users = await sql`
      SELECT u.id, u.firstname, u.lastname, u.fullname, u.email, u.created_at,
             COALESCE(w.balance, 0) AS wallet_balance,
             COUNT(DISTINCT o.id) AS total_orders
      FROM users u
      LEFT JOIN wallet w ON w.user_id = u.id
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY u.id, w.balance
      ORDER BY u.created_at DESC
    `;
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/admin/vouchers/route.js
// ============================================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

async function verifyAdmin(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) return null;
  try {
    return jwt.verify(token.value, ADMIN_JWT_SECRET);
  } catch {
    return null;
  }
}

// GET — list all vouchers
export async function GET(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const vouchers = await sql`
      SELECT v.*, u.email AS used_by_email
      FROM voucher_codes v
      LEFT JOIN users u ON v.used_by = u.id
      ORDER BY v.created_at DESC
    `;
    return NextResponse.json({ vouchers });
  } catch (error) {
    console.error('List vouchers error:', error);
    return NextResponse.json({ error: 'Failed to list vouchers' }, { status: 500 });
  }
}

// POST — create & activate a voucher
export async function POST(request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { code, amount } = await request.json();

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return NextResponse.json({ error: 'Code must be exactly 6 characters' }, { status: 400 });
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();
    const amountVal = parseFloat(amount);

    const existing = await sql`SELECT id FROM voucher_codes WHERE code = ${upperCode}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Code already exists. Use a different code.' }, { status: 409 });
    }

    const [voucher] = await sql`
      INSERT INTO voucher_codes (code, amount, status, created_by)
      VALUES (${upperCode}, ${amountVal}, 'active', ${admin.email})
      RETURNING *
    `;

    return NextResponse.json({ voucher, message: 'Voucher created and activated successfully' });
  } catch (error) {
    console.error('Create voucher error:', error);
    return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/auth/google/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://official.mzazi.shop';
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

// Step 1: Redirect to Google OAuth
export async function GET(request) {
  if (!GOOGLE_CLIENT_ID) {
    // Google OAuth not configured - redirect to login with error
    return NextResponse.redirect(`${BASE_URL}/login?error=google_not_configured`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    // This is the callback
    return handleCallback(code);
  }

  // Redirect to Google
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');

  return NextResponse.redirect(googleAuthUrl.toString());
}

async function handleCallback(code) {
  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    // Upsert user
    let user;
    const existing = await sql`SELECT * FROM users WHERE email = ${googleUser.email}`;
    if (existing.length > 0) {
      user = existing[0];
      await sql`UPDATE users SET google_id = ${googleUser.id} WHERE id = ${user.id}`;
    } else {
      const nameParts = (googleUser.name || '').split(' ');
      const firstname = nameParts[0] || 'User';
      const lastname = nameParts.slice(1).join(' ') || '';
      const result = await sql`
        INSERT INTO users (firstname, lastname, fullname, email, google_id)
        VALUES (${firstname}, ${lastname}, ${googleUser.name}, ${googleUser.email}, ${googleUser.id})
        RETURNING *
      `;
      user = result[0];
      await sql`INSERT INTO wallet (user_id, balance) VALUES (${user.id}, 0.00) ON CONFLICT (user_id) DO NOTHING`;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.redirect(`${BASE_URL}/dashboard`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/auth/login/route.js
// ============================================================
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json({ error: 'This account uses Google Sign-In. Please login with Google.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, firstname: user.firstname, lastname: user.lastname, fullname: user.fullname, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/auth/logout/route.js
// ============================================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/auth/me/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const rows = await sql`
      SELECT id, firstname, lastname, fullname, email, created_at 
      FROM users WHERE id = ${decoded.userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/auth/signup/route.js
// ============================================================
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

// Run schema migrations inline so signup always works even if init-db was never called
async function ensureSchema() {
  // users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(255) NOT NULL DEFAULT '',
      lastname  VARCHAR(255) NOT NULL DEFAULT '',
      fullname  VARCHAR(255),
      email     VARCHAR(255) UNIQUE NOT NULL,
      password  VARCHAR(255),
      google_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  // add columns if upgrading from old schema that only had fullname
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname  VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`;

  // wallet table
  await sql`
    CREATE TABLE IF NOT EXISTS wallet (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) UNIQUE NOT NULL,
      balance    DECIMAL(10,2) DEFAULT 0.00,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // wallet_transactions table
  await sql`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id),
      type        VARCHAR(50) NOT NULL,
      amount      DECIMAL(10,2) NOT NULL,
      reference   VARCHAR(255),
      description TEXT,
      status      VARCHAR(50) DEFAULT 'pending',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // panels table
  await sql`
    CREATE TABLE IF NOT EXISTS panels (
      id               SERIAL PRIMARY KEY,
      user_id          INTEGER REFERENCES users(id),
      ptero_server_id  INTEGER,
      ptero_user_id    INTEGER,
      ptero_username   VARCHAR(255),
      package_name     VARCHAR(255),
      package_price    DECIMAL(10,2),
      nest_id          INTEGER,
      egg_id           INTEGER,
      status           VARCHAR(50) DEFAULT 'active',
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function POST(request) {
  try {
    const { firstname, lastname, email, password } = await request.json();

    if (!firstname || !lastname || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Auto-migrate schema so signup works even on a fresh / old database
    await ensureSchema();

    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const fullname = `${firstname} ${lastname}`;

    const result = await sql`
      INSERT INTO users (firstname, lastname, fullname, email, password)
      VALUES (${firstname}, ${lastname}, ${fullname}, ${email}, ${hashedPassword})
      RETURNING id
    `;

    const userId = result[0].id;

    // Create wallet for the new user
    await sql`
      INSERT INTO wallet (user_id, balance)
      VALUES (${userId}, 0.00)
      ON CONFLICT (user_id) DO NOTHING
    `;

    return NextResponse.json({ message: 'Account created successfully', userId }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    // Return the real DB error message so it's visible during debugging
    return NextResponse.json(
      { error: 'Signup failed', detail: error.message },
      { status: 500 }
    );
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/init-db/route.js
// ============================================================
import { NextResponse } from 'next/server';
import { initializeDatabase } from '../../../lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('DB init error:', error);
    return NextResponse.json({ error: 'Database initialization failed', details: error.message }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/inquiries/[id]/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token.value, JWT_SECRET);
    const users = await sql`SELECT * FROM users WHERE id = ${decoded.userId}`;
    return users[0] || null;
  } catch { return null; }
}

async function ensureMessagesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS inquiry_messages (
      id          SERIAL PRIMARY KEY,
      inquiry_id  INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
      sender      VARCHAR(20) NOT NULL DEFAULT 'user',
      message     TEXT NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// GET /api/inquiries/[id] — get all messages for a thread
export async function GET(request, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await ensureMessagesTable();

  // Verify inquiry belongs to user
  const inqRows = await sql`SELECT * FROM inquiries WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
  if (inqRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const messages = await sql`
    SELECT id, sender, message, created_at
    FROM inquiry_messages
    WHERE inquiry_id = ${parseInt(id)}
    ORDER BY created_at ASC
  `;

  return NextResponse.json({ inquiry: inqRows[0], messages });
}

// POST /api/inquiries/[id] — user sends follow-up message
export async function POST(request, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { message } = await request.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  await ensureMessagesTable();

  // Verify inquiry belongs to user
  const inqRows = await sql`SELECT * FROM inquiries WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
  if (inqRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`
    INSERT INTO inquiry_messages (inquiry_id, sender, message)
    VALUES (${parseInt(id)}, 'user', ${message.trim()})
  `;

  // Re-open inquiry if it was replied/closed
  await sql`UPDATE inquiries SET status = 'open', updated_at = NOW() WHERE id = ${parseInt(id)}`;

  return NextResponse.json({ message: 'Message sent' });
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/inquiries/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS inquiries (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_email  VARCHAR(255),
      user_name   VARCHAR(255),
      subject     VARCHAR(255) NOT NULL,
      message     TEXT NOT NULL,
      status      VARCHAR(50) DEFAULT 'open',
      admin_reply TEXT,
      replied_at  TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
  await sql`
    CREATE TABLE IF NOT EXISTS inquiry_messages (
      id          SERIAL PRIMARY KEY,
      inquiry_id  INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
      sender      VARCHAR(20) NOT NULL DEFAULT 'user',
      message     TEXT NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token.value, JWT_SECRET);
    const users = await sql`SELECT * FROM users WHERE id = ${decoded.userId}`;
    return users[0] || null;
  } catch { return null; }
}

// POST /api/inquiries — member opens a new inquiry thread
export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Please log in to send an inquiry' }, { status: 401 });

    const { subject, message } = await request.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }
    if (subject.length > 255) {
      return NextResponse.json({ error: 'Subject is too long (max 255 characters)' }, { status: 400 });
    }

    await ensureTables();

    const fullname = user.fullname ||
      ((user.firstname || '') + ' ' + (user.lastname || '')).trim() ||
      user.email;

    const result = await sql`
      INSERT INTO inquiries (user_id, user_email, user_name, subject, message)
      VALUES (${user.id}, ${user.email}, ${fullname}, ${subject.trim()}, ${message.trim()})
      RETURNING id
    `;

    const inquiryId = result[0].id;

    // Also save the opening message in inquiry_messages
    await sql`
      INSERT INTO inquiry_messages (inquiry_id, sender, message)
      VALUES (${inquiryId}, 'user', ${message.trim()})
    `;

    return NextResponse.json({ message: 'Inquiry sent successfully. We will reply within 2 hours.', id: inquiryId });
  } catch (error) {
    console.error('Inquiry POST error:', error);
    return NextResponse.json({ error: 'Failed to send inquiry', detail: error.message }, { status: 500 });
  }
}

// GET /api/inquiries — member views their inquiry threads
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTables();

    const inquiries = await sql`
      SELECT
        i.id, i.subject, i.message, i.status, i.admin_reply,
        i.replied_at, i.created_at, i.updated_at,
        (
          SELECT COUNT(*) FROM inquiry_messages im
          WHERE im.inquiry_id = i.id
        ) AS message_count,
        (
          SELECT message FROM inquiry_messages im
          WHERE im.inquiry_id = i.id
          ORDER BY im.created_at DESC LIMIT 1
        ) AS last_message,
        (
          SELECT sender FROM inquiry_messages im
          WHERE im.inquiry_id = i.id
          ORDER BY im.created_at DESC LIMIT 1
        ) AS last_sender
      FROM inquiries i
      WHERE i.user_id = ${user.id}
      ORDER BY COALESCE(i.updated_at, i.created_at) DESC
    `;

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Inquiry GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries', detail: error.message }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/packages/route.js
// ============================================================
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    // Ensure new columns exist (safe on re-run)
    await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS expires_after_hours INTEGER DEFAULT NULL`;

    const packages = await sql`
      SELECT id, name, price, cpu, ram, disk, description, popular, accent, expires_after_hours
      FROM packages
      WHERE active = true
      ORDER BY sort_order ASC, id ASC
    `;
    return NextResponse.json({ packages }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('Packages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

// ============================================================
// FILE: Samsung-xmd-main/app/api/panel/create/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PTERO_URL = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';
const PTERO_KEY = process.env.PTERODACTYL_API_KEY;

const pteroHeaders = {
  Authorization: `Bearer ${PTERO_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

async function pteroGet(path) {
  const res = await fetch(`${PTERO_URL}/api/application${path}`, { headers: pteroHeaders });
  return res.json();
}

async function pteroPost(path, body) {
  const res = await fetch(`${PTERO_URL}/api/application${path}`, {
    method: 'POST',
    headers: pteroHeaders,
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

export async function POST(request) {
  try {
    // ── Run schema migrations first ──────────────────────────────────────────
    await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS expires_after_hours INTEGER DEFAULT NULL`;
    await sql`ALTER TABLE panels   ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL`;
    await sql`ALTER TABLE panels   ADD COLUMN IF NOT EXISTS ptero_password VARCHAR(255) DEFAULT NULL`;
    await sql`ALTER TABLE panels   ADD COLUMN IF NOT EXISTS ptero_email VARCHAR(255) DEFAULT NULL`;

    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const userId = decoded.userId;

    const { package_id, ptero_username, ptero_password, firstname, lastname, nest_id, egg_id } = await request.json();

    if (!package_id || !ptero_username || !ptero_password || !firstname || !lastname || !nest_id || !egg_id) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Load package from DB
    const pkgRows = await sql`SELECT * FROM packages WHERE id = ${parseInt(package_id)} AND active = true LIMIT 1`;
    if (pkgRows.length === 0) return NextResponse.json({ error: 'Invalid or unavailable package' }, { status: 400 });
    const pkg = pkgRows[0];

    // Check wallet balance
    const walletRows = await sql`SELECT balance FROM wallet WHERE user_id = ${userId}`;
    const balance = walletRows.length > 0 ? parseFloat(walletRows[0].balance) : 0;

    if (balance < parseFloat(pkg.price)) {
      return NextResponse.json({
        error: `Insufficient wallet balance. You need KSH ${pkg.price} but have KSH ${balance.toFixed(2)}. Please top up your wallet.`,
        need_topup: true,
      }, { status: 402 });
    }

    // Get user info
    const userRows = await sql`SELECT email, firstname, lastname FROM users WHERE id = ${userId}`;
    if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch egg details
    const eggData = await pteroGet(`/nests/${nest_id}/eggs/${egg_id}?include=variables`);
    if (!eggData?.attributes) {
      return NextResponse.json({ error: 'Could not fetch egg details from panel' }, { status: 400 });
    }

    const eggAttrs = eggData.attributes;
    const dockerImage = eggAttrs.docker_image || eggAttrs.docker_images?.[0] || 'ghcr.io/pterodactyl/yolks:java_17';
    const startupCmd  = eggAttrs.startup || '{{SERVER_JARFILE}}';

    // Build environment from egg variables
    const eggVariables = eggAttrs.relationships?.variables?.data || [];
    const environment  = {};
    for (const v of eggVariables) {
      const attr = v.attributes;
      environment[attr.env_variable] = attr.default_value ?? '';
    }

    // ── Find-or-create Pterodactyl user ─────────────────────────────────────
    // If the username already exists we reuse that account and just add a
    // new server to it (same username + firstname + lastname = same person).
    const pteroEmail = `${ptero_username.toLowerCase()}_${userId}@panel.mzazitech.local`;
    let pteroUserId   = null;
    let freshlyCreated = false;  // track so we only delete on server-fail if WE made it

    const userRes = await pteroPost('/users', {
      email:      pteroEmail,
      username:   ptero_username,
      first_name: firstname,
      last_name:  lastname,
      password:   ptero_password,
    });

    if (userRes.status === 201) {
      // Brand-new user created successfully
      pteroUserId    = userRes.data.attributes.id;
      freshlyCreated = true;
    } else {
      // Creation failed — check if it's a duplicate username/email conflict
      const errDetail = userRes.data?.errors?.[0]?.detail || '';
      const isConflict =
        userRes.status === 422 ||
        errDetail.toLowerCase().includes('username') ||
        errDetail.toLowerCase().includes('email') ||
        errDetail.toLowerCase().includes('already') ||
        errDetail.toLowerCase().includes('taken');

      if (!isConflict) {
        // Some other error — surface it
        return NextResponse.json({ error: errDetail || 'Failed to create panel user' }, { status: 400 });
      }

      // Username already exists — look it up by username
      const searchRes = await pteroGet(`/users?filter[username]=${encodeURIComponent(ptero_username)}`);
      const match = (searchRes?.data || []).find(
        u => u.attributes.username.toLowerCase() === ptero_username.toLowerCase()
      );

      if (!match) {
        // Conflict but can't find the user — try email search as fallback
        const emailSearch = await pteroGet(`/users?filter[email]=${encodeURIComponent(pteroEmail)}`);
        const emailMatch  = (emailSearch?.data || []).find(
          u => u.attributes.email.toLowerCase() === pteroEmail.toLowerCase()
        );
        if (!emailMatch) {
          return NextResponse.json({ error: 'Username is taken by another account. Please choose a different username.' }, { status: 400 });
        }
        pteroUserId = emailMatch.attributes.id;
      } else {
        pteroUserId = match.attributes.id;
      }
      // Not freshly created — do NOT delete on server failure
      freshlyCreated = false;
    }

    // ── Create Pterodactyl server on the resolved user account ───────────────
    const serverName = `${ptero_username}-${pkg.name.toLowerCase().replace(/\s+/g, '-')}`;
    const serverRes = await pteroPost('/servers', {
      name: serverName,
      user: pteroUserId,
      egg: parseInt(egg_id),
      docker_image: dockerImage,
      startup: startupCmd,
      environment,
      limits: {
        memory: parseInt(pkg.ram),
        swap: 0,
        disk: parseInt(pkg.disk),
        io: 500,
        cpu: parseInt(pkg.cpu),
      },
      feature_limits: { databases: 1, backups: 1, allocations: 1 },
      deploy: { locations: [1], dedicated_ip: false, port_range: [] },
      start_on_completion: true,
      skip_scripts: false,
      oom_disabled: false,
    });

    if (serverRes.status !== 201) {
      // Only clean up the ptero user if we just created them
      if (freshlyCreated) {
        try {
          await fetch(`${PTERO_URL}/api/application/users/${pteroUserId}`, {
            method: 'DELETE',
            headers: pteroHeaders,
          });
        } catch {}
      }
      const errMsg = serverRes.data?.errors?.[0]?.detail || 'Failed to create server';
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const pteroServerId = serverRes.data.attributes.id;

    // ── Deduct from wallet ───────────────────────────────────────────────────
    await sql`
      UPDATE wallet SET balance = balance - ${parseFloat(pkg.price)}, updated_at = NOW()
      WHERE user_id = ${userId}
    `;
    await sql`
      INSERT INTO wallet_transactions (user_id, type, amount, description, status)
      VALUES (${userId}, 'deduction', ${parseFloat(pkg.price)}, ${`Panel created: ${pkg.name}`}, 'success')
    `;

    // ── Save panel record (with credentials stored) ───────────────────────────
    const expiresAt = pkg.expires_after_hours
      ? new Date(Date.now() + parseInt(pkg.expires_after_hours) * 60 * 60 * 1000)
      : null;

    try {
      await sql`
        INSERT INTO panels
          (user_id, ptero_server_id, ptero_user_id, ptero_username, ptero_password, ptero_email,
           package_name, package_price, nest_id, egg_id, expires_at)
        VALUES (
          ${userId}, ${pteroServerId}, ${pteroUserId},
          ${ptero_username}, ${ptero_password}, ${pteroEmail},
          ${pkg.name}, ${parseFloat(pkg.price)}, ${parseInt(nest_id)}, ${parseInt(egg_id)},
          ${expiresAt}
        )
      `;
    } catch (dbErr) {
      console.error('Panel record save failed (panel still created):', dbErr);
    }

    // ── Return all credentials the user needs ────────────────────────────────
    return NextResponse.json({
      message: 'Panel created successfully!',
      panel: {
        ptero_server_id: pteroServerId,
        ptero_user_id:   pteroUserId,
        username:        ptero_username,
        password:        ptero_password,
        email:           pteroEmail,
        panel_url:       PTERO_URL,
        package:         pkg.name,
        price:           pkg.price,
        expires_after_hours: pkg.expires_after_hours || null,
        expires_at:      expiresAt ? expiresAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Panel create error:', error);
    return NextResponse.json({ error: 'Failed to create panel. Please try again.' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/panel/credentials/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PTERO_URL = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';

// POST /api/panel/credentials
// Body: { panel_id, password }
// Returns panel credentials after verifying the user's account password
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const userId = decoded.userId;

    const { panel_id, password } = await request.json();
    if (!panel_id || !password) {
      return NextResponse.json({ error: 'panel_id and password are required' }, { status: 400 });
    }

    // Verify the user's account password
    const userRows = await sql`SELECT id, password, email, google_id FROM users WHERE id = ${userId}`;
    if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = userRows[0];

    if (!user.password) {
      // Google-only account — no password set, allow with a special note
      // We still return credentials but note it's a Google account
    } else {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Fetch the panel — must belong to this user
    await sql`ALTER TABLE panels ADD COLUMN IF NOT EXISTS ptero_password VARCHAR(255) DEFAULT NULL`;
    await sql`ALTER TABLE panels ADD COLUMN IF NOT EXISTS ptero_email VARCHAR(255) DEFAULT NULL`;

    const panelRows = await sql`
      SELECT id, ptero_server_id, ptero_user_id, ptero_username, ptero_password, ptero_email,
             package_name, package_price, status, created_at, expires_at
      FROM panels
      WHERE id = ${parseInt(panel_id)} AND user_id = ${userId}
      LIMIT 1
    `;
    if (panelRows.length === 0) return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    const panel = panelRows[0];

    return NextResponse.json({
      credentials: {
        panel_url:      PTERO_URL,
        username:       panel.ptero_username,
        password:       panel.ptero_password || '(saved before this feature — reset via admin)',
        email:          panel.ptero_email    || `${panel.ptero_username?.toLowerCase()}_${userId}@panel.mzazitech.local`,
        server_id:      panel.ptero_server_id,
        package:        panel.package_name,
        status:         panel.status,
        created_at:     panel.created_at,
        expires_at:     panel.expires_at,
      },
    });
  } catch (error) {
    console.error('Credentials error:', error);
    return NextResponse.json({ error: 'Failed to retrieve credentials' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/panel/eggs/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PTERO_URL = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';
const PTERO_KEY = process.env.PTERODACTYL_API_KEY;

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    jwt.verify(token.value, JWT_SECRET);

    const url = new URL(request.url);
    const nestId = url.searchParams.get('nest_id');
    if (!nestId) return NextResponse.json({ error: 'nest_id is required' }, { status: 400 });

    const res = await fetch(`${PTERO_URL}/api/application/nests/${nestId}/eggs?include=variables`, {
      headers: {
        Authorization: `Bearer ${PTERO_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    const data = await res.json();

    const eggs = (data.data || []).map((e) => ({
      id: e.attributes.id,
      name: e.attributes.name,
      description: e.attributes.description,
    }));

    return NextResponse.json({ eggs });
  } catch (error) {
    console.error('Eggs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch eggs' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/panel/list/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = jwt.verify(token.value, JWT_SECRET);

    // Ensure expires_at column exists
    await sql`ALTER TABLE panels ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL`;

    const panels = await sql`
      SELECT *, expires_at FROM panels WHERE user_id = ${decoded.userId} ORDER BY created_at DESC
    `;

    // Mark expired panels
    const now = new Date();
    const enriched = panels.map(p => ({
      ...p,
      is_expired: p.expires_at ? new Date(p.expires_at) < now : false,
      expires_at: p.expires_at || null,
    }));

    return NextResponse.json({ panels: enriched });
  } catch (error) {
    console.error('Panel list error:', error);
    return NextResponse.json({ error: 'Failed to fetch panels' }, { status: 500 });
  }
}

// ============================================================
// FILE: Samsung-xmd-main/app/api/panel/nests/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PTERO_URL = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';
const PTERO_KEY = process.env.PTERODACTYL_API_KEY;

async function pteroFetch(path) {
  const res = await fetch(`${PTERO_URL}/api/application${path}`, {
    headers: {
      Authorization: `Bearer ${PTERO_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  return res.json();
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    jwt.verify(token.value, JWT_SECRET);

    const data = await pteroFetch('/nests');
    const nests = (data.data || []).map((n) => ({
      id: n.attributes.id,
      name: n.attributes.name,
      description: n.attributes.description,
    }));

    return NextResponse.json({ nests });
  } catch (error) {
    console.error('Nests fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch nests' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/payment/initialize/route.js
// ============================================================
import { NextResponse } from 'next/server';
import https from 'https';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const rows = await sql`SELECT * FROM users WHERE id = ${decoded.userId}`;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { packageName, amount } = await request.json();
    const reference = `MZAZI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await sql`
      INSERT INTO orders (user_id, package_name, amount, reference, status) 
      VALUES (${user.id}, ${packageName}, ${amount}, ${reference}, 'pending')
    `;

    const params = JSON.stringify({
      email: user.email,
      amount: amount * 100,
      reference: reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`,
      metadata: {
        user_id: user.id,
        package_name: packageName
      }
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const paystackResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(params);
      req.end();
    });

    return NextResponse.json(paystackResponse);
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/payment/verify/route.js
// ============================================================
import { NextResponse } from 'next/server';
import https from 'https';
import { neon } from '@neondatabase/serverless';

// Add this line to force dynamic rendering
export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'No reference provided' }, { status: 400 });
    }

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    };

    const verificationResponse = await new Promise((resolve, reject) => {
      https.get(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    if (verificationResponse.status && verificationResponse.data.status === 'success') {
      const { metadata } = verificationResponse.data;
      
      const username = `user_${metadata.user_id}_${Date.now()}`;
      const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const panelLink = `https://panel.mzazitech.com`;
      
      const credentials = JSON.stringify({
        username,
        password,
        panel_link: panelLink,
        package: metadata.package_name
      });

      await sql`
        UPDATE orders 
        SET status = 'completed', pterodactyl_credentials = ${credentials} 
        WHERE reference = ${reference}
      `;

      await sql`
        INSERT INTO payments (reference, amount, status, paid_at) 
        VALUES (${reference}, ${verificationResponse.data.amount / 100}, 'success', NOW())
      `;

      return NextResponse.json({
        status: true,
        message: 'Payment successful',
        credentials: {
          username,
          password,
          panel_link: panelLink
        }
      });
    } else {
      await sql`
        UPDATE orders SET status = 'failed' WHERE reference = ${reference}
      `;

      return NextResponse.json({
        status: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/testimonials/route.js
// ============================================================
import { NextResponse } from 'next/server';
import sql from '../../../lib/database';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      message TEXT NOT NULL,
      approved BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// GET testimonials with pagination — ?offset=0&limit=6
export async function GET(request) {
  try {
    await ensureTable();

    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '6', 10)));

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM testimonials WHERE approved = true
    `;

    const testimonials = await sql`
      SELECT id, name, rating, message, created_at
      FROM testimonials
      WHERE approved = true
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({ testimonials, total: count });
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST a new testimonial
export async function POST(request) {
  try {
    await ensureTable();

    const body = await request.json();
    const { name, rating, message } = body;

    if (!name || !rating || !message) {
      return NextResponse.json({ error: 'Name, rating, and message are required.' }, { status: 400 });
    }

    const ratingNum = parseInt(rating, 10);
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }
    if (name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be between 2 and 100 characters.' }, { status: 400 });
    }
    if (message.trim().length < 10 || message.trim().length > 1000) {
      return NextResponse.json({ error: 'Message must be between 10 and 1000 characters.' }, { status: 400 });
    }

    const [testimonial] = await sql`
      INSERT INTO testimonials (name, rating, message, approved)
      VALUES (${name.trim()}, ${ratingNum}, ${message.trim()}, true)
      RETURNING id, name, rating, message, created_at
    `;

    return NextResponse.json({ testimonial, message: 'Thank you for your testimonial!' }, { status: 201 });
  } catch (error) {
    console.error('Failed to save testimonial:', error);
    return NextResponse.json({ error: 'Failed to save testimonial.' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/vouchers/redeem/route.js
// ============================================================
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const { code } = await request.json();

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a voucher code' }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();

    // Find the voucher
    const [voucher] = await sql`
      SELECT * FROM voucher_codes WHERE code = ${upperCode}
    `;

    if (!voucher) {
      return NextResponse.json({ error: 'Invalid voucher code' }, { status: 404 });
    }
    if (voucher.status === 'used') {
      return NextResponse.json({ error: 'This voucher has already been used' }, { status: 400 });
    }
    if (voucher.status !== 'active') {
      return NextResponse.json({ error: 'This voucher is not active' }, { status: 400 });
    }

    const amount = parseFloat(voucher.amount);

    // Mark as used
    await sql`
      UPDATE voucher_codes
      SET status = 'used', used_by = ${decoded.userId}, used_at = CURRENT_TIMESTAMP
      WHERE id = ${voucher.id} AND status = 'active'
    `;

    // Credit wallet (upsert)
    await sql`
      INSERT INTO wallet (user_id, balance, updated_at)
      VALUES (${decoded.userId}, ${amount}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET balance = wallet.balance + ${amount}, updated_at = CURRENT_TIMESTAMP
    `;

    // Record transaction
    await sql`
      INSERT INTO wallet_transactions (user_id, type, amount, reference, description, status)
      VALUES (
        ${decoded.userId},
        'deposit',
        ${amount},
        ${'VOUCHER-' + upperCode},
        ${'Voucher top-up — code ' + upperCode},
        'success'
      )
    `;

    // Return new balance
    const [wallet] = await sql`SELECT balance FROM wallet WHERE user_id = ${decoded.userId}`;

    return NextResponse.json({
      message: `KSH ${amount.toLocaleString()} has been credited to your wallet!`,
      amount,
      newBalance: parseFloat(wallet.balance),
    });
  } catch (error) {
    console.error('Redeem voucher error:', error);
    return NextResponse.json({ error: 'Failed to redeem voucher' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/wallet/balance/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    
    // Ensure wallet exists
    await sql`INSERT INTO wallet (user_id, balance) VALUES (${decoded.userId}, 0.00) ON CONFLICT (user_id) DO NOTHING`;

    const rows = await sql`SELECT balance FROM wallet WHERE user_id = ${decoded.userId}`;
    const balance = rows.length > 0 ? parseFloat(rows[0].balance) : 0;

    const txRows = await sql`
      SELECT * FROM wallet_transactions WHERE user_id = ${decoded.userId}
      ORDER BY created_at DESC LIMIT 10
    `;

    return NextResponse.json({ balance, transactions: txRows });
  } catch (error) {
    console.error('Wallet balance error:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/wallet/deposit/route.js
// ============================================================
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import https from 'https';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const { amount } = await request.json();

    if (!amount || amount < 10) {
      return NextResponse.json({ error: 'Minimum deposit is KSH 10' }, { status: 400 });
    }

    const userRows = await sql`SELECT email FROM users WHERE id = ${decoded.userId}`;
    if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const reference = `WALLET-${decoded.userId}-${Date.now()}`;

    // Initialize Paystack transaction
    const params = JSON.stringify({
      email: userRows[0].email,
      amount: Math.round(amount * 100), // Paystack uses kobo/cents
      currency: 'KES',
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/wallet/verify`,
      metadata: {
        user_id: decoded.userId,
        type: 'wallet_deposit',
        amount_ksh: amount,
      },
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const paystackResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(params);
      req.end();
    });

    if (!paystackResponse.status) {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
    }

    // Record pending transaction
    await sql`
      INSERT INTO wallet_transactions (user_id, type, amount, reference, description, status)
      VALUES (${decoded.userId}, 'deposit', ${amount}, ${reference}, 'Wallet top-up via Paystack', 'pending')
    `;

    return NextResponse.json({
      authorization_url: paystackResponse.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: 'Failed to initialize deposit' }, { status: 500 });
  }
}


// ============================================================
// FILE: Samsung-xmd-main/app/api/wallet/verify/route.js
// ============================================================
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import https from 'https';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function verifyPaystack(reference) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(reference)}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const reference = url.searchParams.get('reference') || url.searchParams.get('trxref');

    if (!reference) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?error=no_reference`);
    }

    const result = await verifyPaystack(reference);
    if (!result.status || result.data.status !== 'success') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?error=payment_failed`);
    }

    const meta = result.data.metadata || {};
    const userId = meta.user_id;
    const amountKsh = meta.amount_ksh || result.data.amount / 100;

    // Check if already processed
    const existing = await sql`
      SELECT id, status FROM wallet_transactions WHERE reference = ${reference}
    `;
    if (existing.length > 0 && existing[0].status === 'success') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?success=already_credited`);
    }

    // Credit wallet
    await sql`
      INSERT INTO wallet (user_id, balance) VALUES (${userId}, ${amountKsh})
      ON CONFLICT (user_id) DO UPDATE SET balance = wallet.balance + ${amountKsh}, updated_at = NOW()
    `;

    await sql`
      UPDATE wallet_transactions SET status = 'success' WHERE reference = ${reference}
    `;

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?success=credited&amount=${amountKsh}`);
  } catch (error) {
    console.error('Wallet verify error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?error=server_error`);
  }
}

// For manual verification from frontend
export async function POST(request) {
  try {
    const { reference } = await request.json();
    const result = await verifyPaystack(reference);

    if (!result.status || result.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    const meta = result.data.metadata || {};
    const userId = meta.user_id;
    const amountKsh = meta.amount_ksh || result.data.amount / 100;

    const existing = await sql`SELECT status FROM wallet_transactions WHERE reference = ${reference}`;
    if (existing.length > 0 && existing[0].status === 'success') {
      return NextResponse.json({ message: 'Already credited', already: true });
    }

    await sql`
      INSERT INTO wallet (user_id, balance) VALUES (${userId}, ${amountKsh})
      ON CONFLICT (user_id) DO UPDATE SET balance = wallet.balance + ${amountKsh}, updated_at = NOW()
    `;
    await sql`UPDATE wallet_transactions SET status = 'success' WHERE reference = ${reference}`;

    return NextResponse.json({ message: 'Wallet credited', amount: amountKsh });
  } catch (error) {
    console.error('Manual verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

