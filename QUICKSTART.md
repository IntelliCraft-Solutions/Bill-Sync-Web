# Quick Start Guide

## ⚠️ REQUIRED: Create .env File

**You must create a `.env` file before running the app!**

### Option 1: Using the Setup Script (Recommended)
```bash
npm run setup
```

This will:
- Create `.env` from `.env.example`
- Auto-generate a secure `NEXTAUTH_SECRET`

### Option 2: Manual Setup
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and update:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/billing_db?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="<run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">"
   ```

## Database Setup

### Option A: Use Free Cloud Database (Easiest)

**Supabase (Recommended):**
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database → Connection String
4. Copy the URI and update `DATABASE_URL` in `.env`

**Example:**
```env
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres"
```

### Option B: Local PostgreSQL
1. Install PostgreSQL
2. Create database:
   ```bash
   createdb billing_db
   ```
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/billing_db?schema=public"
   ```

## Initialize Database
```bash
npm run db:push
```

## Run Development Server
```bash
npm run dev
```

## Access the App
Open http://localhost:3000

## First-Time Setup
1. Go to `/auth/register`
2. Create your admin account
3. Login and start using the app!

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
- You haven't created the `.env` file
- Run: `npm run setup` or manually create it

### Error: Database connection failed
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running (if using local)
- Test connection: `npm run db:push`

### TypeScript/Lint Errors
- These will disappear after:
  1. Creating `.env` file
  2. Running `npm run dev` once
  3. The IDE picks up the changes

## Next Steps
After setup:
- Create cashier accounts in Employee Management
- Add products to inventory
- Start generating bills!
