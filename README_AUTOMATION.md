# 🚀 Automated Development Setup

## ✅ Everything is Now Automatic!

Your project now handles all setup tasks automatically. No more manual steps!

---

## 🎯 Quick Start

### First Time Setup
```bash
# 1. Clone the repository
git clone <your-repo-url>

# 2. Install dependencies
npm install

# 3. Create .env file with your DATABASE_URL

# 4. Run the project - THAT'S IT!
npm run dev
```

**Everything else happens automatically!** 🎉

---

## 🤖 What Happens Automatically

When you run `npm run dev`, the script automatically:

### ✅ Step 1: Creates Upload Directory
```
📁 Creating uploads directory...
✅ Created: public/uploads
```

### ✅ Step 2: Generates Prisma Client
```
🔧 Generating Prisma Client...
✅ Prisma Client generated
```

### ✅ Step 3: Syncs Database
```
🗄️  Syncing database schema...
✅ Database schema synced
```

### ✅ Step 4: Starts Dev Server
```
✨ Pre-development setup complete!
🚀 Starting development server...

▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

---

## 📝 Available Commands

### Development
```bash
npm run dev
```
**Automatically:**
- Creates `public/uploads` folder
- Generates Prisma Client
- Syncs database schema
- Starts development server

### Production Build
```bash
npm run build
```
**Automatically:**
- Creates `public/uploads` folder
- Generates Prisma Client
- Syncs database schema
- Builds Next.js application

### Start Production Server
```bash
npm start
```
Starts the production server (after build)

### Database Studio
```bash
npm run db:studio
```
Opens Prisma Studio to view/edit database

---

## 🎨 Example Output

```bash
$ npm run dev

> billing-webapp@1.0.0 predev
> node scripts/pre-dev.js

🚀 Running pre-development setup...

📁 Creating uploads directory...
✅ Created: public/uploads

🔧 Generating Prisma Client...
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
✔ Generated Prisma Client to .\node_modules\@prisma\client
✅ Prisma Client generated

🗄️  Syncing database schema...
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "billing_db"
Your database is now in sync with your Prisma schema.
✅ Database schema synced

✨ Pre-development setup complete!

🚀 Starting development server...

> billing-webapp@1.0.0 dev
> next dev

   ▲ Next.js 14.0.4
   - Local:        http://localhost:3000

 ✓ Ready in 2.5s
```

---

## 🔧 How It Works

### NPM Lifecycle Scripts

NPM automatically runs scripts with special prefixes:

```
npm run dev
    ↓
1. predev (runs first)
    ↓
2. dev (runs after predev)
```

### Our Setup

**`package.json`:**
```json
{
  "scripts": {
    "predev": "node scripts/pre-dev.js",    // Runs BEFORE dev
    "dev": "next dev",                       // Runs AFTER predev
    "prebuild": "node scripts/pre-build.js", // Runs BEFORE build
    "build": "next build"                    // Runs AFTER prebuild
  }
}
```

---

## 📁 Script Files

### `scripts/pre-dev.js`
Runs before development server starts:
- Creates `public/uploads` directory
- Generates Prisma Client
- Syncs database schema
- Handles errors gracefully

### `scripts/pre-build.js`
Runs before production build:
- Same as pre-dev
- Uses `--accept-data-loss` for production deployments
- Ensures clean build environment

---

## 🛡️ Error Handling

The scripts are smart and handle common issues:

### File Lock Errors
If dev server is already running:
```
⚠️  Prisma Client already in use (dev server may be running)
✅ Continuing with existing Prisma Client
```

### Database Already Synced
If no schema changes:
```
✅ Database already in sync
```

### Missing Directory
If uploads folder doesn't exist:
```
📁 Creating uploads directory...
✅ Created: public/uploads
```

---

## 🚀 Deployment

### Vercel / Netlify / Other Platforms

The `prebuild` script runs automatically during deployment:

```bash
# Platform runs this automatically
npm run build
    ↓
1. prebuild script runs
   - Creates uploads folder
   - Generates Prisma Client
   - Syncs database
    ↓
2. Next.js build runs
```

**No manual configuration needed!**

---

## 👥 Team Onboarding

### For New Team Members

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd Bill-Sync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/billing_db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   ```

4. **Run the project**
   ```bash
   npm run dev
   ```

**That's it!** Everything else is automatic.

---

## 🐛 Troubleshooting

### Script Doesn't Run
**Problem:** `Cannot find module 'scripts/pre-dev.js'`

**Solution:** Make sure the `scripts` folder exists with both files:
```
scripts/
  ├── pre-dev.js
  └── pre-build.js
```

### Database Connection Error
**Problem:** `Can't reach database server`

**Solution:**
1. Make sure PostgreSQL is running
2. Check `.env` file has correct `DATABASE_URL`
3. Verify database exists:
   ```bash
   createdb billing_db
   ```

### Prisma Generate Fails
**Problem:** `EPERM: operation not permitted`

**Solution:**
- Stop the dev server
- Run `npm run dev` again
- The script will handle it gracefully

### Permission Denied
**Problem:** Can't create uploads folder

**Solution:**
- Run terminal as administrator (Windows)
- Or manually create: `mkdir public\uploads`

---

## 📊 Benefits

### Before Automation ❌
```bash
# Manual steps every time
mkdir public\uploads
npx prisma generate
npx prisma db push
npm run dev
```

### After Automation ✅
```bash
# Just one command
npm run dev
```

### Comparison

| Task | Before | After |
|------|--------|-------|
| Setup steps | 4 commands | 1 command |
| Time to start | ~2 minutes | ~30 seconds |
| Things to remember | 3 steps | 0 steps |
| Errors possible | Many | Handled automatically |
| Team onboarding | Complex | Simple |

---

## 🎉 Summary

### What You Get

✅ **Automatic setup** - No manual steps
✅ **Error handling** - Graceful failures
✅ **Team friendly** - Easy onboarding
✅ **Deployment ready** - Works everywhere
✅ **Always up-to-date** - Fresh database schema
✅ **No missing files** - Uploads folder always exists

### What You Don't Need

❌ Manual directory creation
❌ Remembering Prisma commands
❌ Setup documentation
❌ Pre-deployment checklists
❌ Support for "it doesn't work"

---

## 🔗 Related Files

- `package.json` - NPM scripts configuration
- `scripts/pre-dev.js` - Development setup script
- `scripts/pre-build.js` - Build setup script
- `AUTOMATION_SETUP.md` - Detailed documentation

---

**Just run `npm run dev` and everything works!** 🚀
