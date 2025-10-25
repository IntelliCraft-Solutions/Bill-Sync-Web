# Fix "Internal Server Error" 

## ❌ Current Problem

You're seeing "Internal server error" when trying to register because:
1. **NEXTAUTH_SECRET is not properly configured**
2. NextAuth cannot encrypt/decrypt sessions

## ✅ Solution (2 Steps)

### Step 1: Generate a Secure Secret

Run this command:

```bash
node generate-secret.js
```

This will output something like:
```
🔑 Your NEXTAUTH_SECRET:
===========================================
abc123XYZ789randombase64string==
```

### Step 2: Update .env File

1. Open `.env` file
2. Find the line with `NEXTAUTH_SECRET`
3. Replace it with your generated secret:

**Before:**
```env
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
```

**After:**
```env
NEXTAUTH_SECRET="abc123XYZ789randombase64string=="
```

### Step 3: Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Complete .env Example

Your `.env` should look like this:

```env
DATABASE_URL="postgresql://postgres.xxx:password@aws-region.pooler.supabase.com:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="uB5D7mK9pL2nQ8wX3vY6zA1cF4eG0hI5jN7oP2rS8tU6vW9xY="
```

## Verification Steps

After updating `.env`:

1. ✅ Stop the server (Ctrl+C)
2. ✅ Restart: `npm run dev`
3. ✅ Go to http://localhost:3000/auth/register
4. ✅ Fill in the form
5. ✅ Click "Create Account"

You should now see success instead of "Internal server error"!

## Other Fixes Applied

I've also fixed:
- ✅ Removed deprecated `experimental.serverActions` from next.config.js
- ✅ Fixed metadata/viewport warnings in layout.tsx
- ✅ Updated TypeScript configuration

## Quick Command Reference

```bash
# Generate new secret
node generate-secret.js

# Start dev server
npm run dev

# Initialize database (if not done)
npm run db:push
```

## Still Getting Errors?

### Error: "JWEDecryptionFailed"
- Your NEXTAUTH_SECRET is still wrong/missing
- Generate a new one: `node generate-secret.js`
- Update `.env` and restart server

### Error: "Cannot connect to database"
- Your DATABASE_URL is wrong
- Use a free Supabase database: https://supabase.com
- Update `.env` with the connection string

### Error: Port 3000 in use
- Your server is already running
- The app will automatically use port 3001, 3002, etc.
- Just go to the port shown in the terminal

## Database Not Set Up Yet?

If you haven't set up a database:

1. **Quick Option: Supabase (Free)**
   - Go to https://supabase.com
   - Create project
   - Copy connection string
   - Paste in `.env` as `DATABASE_URL`

2. **Initialize Database:**
   ```bash
   npm run db:push
   ```

3. **Start App:**
   ```bash
   npm run dev
   ```

## Success Checklist

- [ ] `.env` file exists
- [ ] `NEXTAUTH_SECRET` is a 32+ character random string (not the placeholder)
- [ ] `DATABASE_URL` is a real database connection
- [ ] Ran `npm run db:push` successfully
- [ ] Server starts without errors
- [ ] Can access the registration page
- [ ] Can create an account without "Internal server error"

Once all checked ✅, your app is ready!
