# 🤖 Automated Setup Scripts

## ✅ Automatic Pre-Development Setup

Your project now automatically handles all setup tasks before starting!

---

## 🚀 What Happens Automatically

When you run `npm run dev`, the following happens automatically:

### 1. **Creates Upload Directory** 📁
- Checks if `public/uploads` exists
- Creates it if missing
- Skips if already exists

### 2. **Generates Prisma Client** 🔧
- Runs `npx prisma generate`
- Updates TypeScript types
- Ensures database models are available

### 3. **Syncs Database Schema** 🗄️
- Runs `npx prisma db push`
- Applies any schema changes to database
- No manual migration needed

### 4. **Starts Dev Server** 🚀
- Launches Next.js development server
- Everything ready to use!

---

## 📝 Scripts Added

### `npm run dev`
**Full automated development start:**
```bash
npm run dev
```

**What it does:**
1. ✅ Creates `public/uploads` directory
2. ✅ Generates Prisma Client
3. ✅ Syncs database schema
4. ✅ Starts development server

### `npm run build`
**Full automated production build:**
```bash
npm run build
```

**What it does:**
1. ✅ Creates `public/uploads` directory
2. ✅ Generates Prisma Client
3. ✅ Syncs database schema (with --accept-data-loss for production)
4. ✅ Builds Next.js application

---

## 🎯 Usage

### Development
```bash
# Just run this - everything else is automatic!
npm run dev
```

### Production Build
```bash
# Just run this - everything else is automatic!
npm run build
```

### Manual Commands (if needed)
```bash
# Only generate Prisma Client
npx prisma generate

# Only sync database
npx prisma db push

# Open Prisma Studio
npm run db:studio
```

---

## 📁 Files Created

### `scripts/pre-dev.js`
- Runs before `npm run dev`
- Creates uploads directory
- Generates Prisma Client
- Syncs database schema

### `scripts/pre-build.js`
- Runs before `npm run build`
- Same as pre-dev but for production
- Uses `--accept-data-loss` flag for deployments

---

## 🔄 How It Works

### NPM Scripts Lifecycle

```
npm run dev
    ↓
predev script runs (automatic)
    ↓
1. Create public/uploads
2. npx prisma generate
3. npx prisma db push
    ↓
dev script runs
    ↓
next dev (server starts)
```

---

## ✅ Benefits

### For Development:
- ✅ No manual setup needed
- ✅ Always up-to-date database schema
- ✅ No missing directories errors
- ✅ Fresh Prisma Client every time

### For Deployment:
- ✅ Automated build process
- ✅ No manual intervention needed
- ✅ Consistent across environments
- ✅ Production-ready builds

### For Team Members:
- ✅ Clone and run - that's it!
- ✅ No setup documentation needed
- ✅ Same experience for everyone
- ✅ Fewer support issues

---

## 🐛 Troubleshooting

### Script Fails to Run
**Error:** `Cannot find module 'scripts/pre-dev.js'`

**Solution:** Make sure the `scripts` folder exists with both files:
- `scripts/pre-dev.js`
- `scripts/pre-build.js`

### Database Connection Error
**Error:** `Can't reach database server`

**Solution:** 
1. Make sure PostgreSQL is running
2. Check `.env` file has correct `DATABASE_URL`
3. Verify database exists

### Prisma Generate Fails
**Error:** `EPERM: operation not permitted`

**Solution:**
- This is a Windows file lock issue
- Stop the dev server
- Run `npm run dev` again
- The script will retry

### Upload Directory Not Created
**Error:** Permission denied

**Solution:**
- Run terminal as administrator
- Or manually create: `mkdir public\uploads`

---

## 🎉 No More Manual Setup!

You never need to:
- ❌ Manually create uploads folder
- ❌ Run `npx prisma generate`
- ❌ Run `npx prisma db push`
- ❌ Remember setup steps

Just run:
```bash
npm run dev
```

**Everything happens automatically!** 🚀

---

## 📋 Quick Reference

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Auto-setup + start dev server |
| `npm run build` | Auto-setup + build for production |
| `npm start` | Start production server |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:push` | Manually sync database |

---

## 🔧 Customization

Want to add more pre-dev tasks? Edit `scripts/pre-dev.js`:

```javascript
// Add your custom setup here
console.log('🎨 Running custom setup...');

// Example: Create another directory
const customDir = path.join(__dirname, '..', 'public', 'temp');
if (!fs.existsSync(customDir)) {
  fs.mkdirSync(customDir, { recursive: true });
}

// Example: Copy files
// fs.copyFileSync('source.txt', 'destination.txt');

// Example: Run another command
// execSync('npm run custom-command', { stdio: 'inherit' });
```

---

**Setup is now fully automated!** 🎊
