# 🔧 Port Redirect Issue - Quick Fix

## Problem
When logging out, you're redirected to `http://localhost:3000/auth/signin` even though your server is running on port 3001.

## Cause
The `NEXTAUTH_URL` in your `.env` file is set to port 3000, but your server is running on 3001.

## Solution

### Option 1: Update .env File (Recommended)
Open your `.env` file and change:

**From:**
```env
NEXTAUTH_URL="http://localhost:3000"
```

**To:**
```env
NEXTAUTH_URL="http://localhost:3001"
```

Then restart your dev server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Option 2: Free Up Port 3000
If you want to use port 3000 (the default):

1. Find what's using port 3000:
```bash
# Windows
netstat -ano | findstr :3000

# Then kill the process
taskkill /PID <process_id> /F
```

2. Restart your server:
```bash
npm run dev
```

It should now run on port 3000.

### Option 3: Always Use Port 3001
Add this to your `package.json`:

```json
"scripts": {
  "dev": "next dev -p 3001",
  ...
}
```

And set in `.env`:
```env
NEXTAUTH_URL="http://localhost:3001"
```

## Why This Happens

NextAuth uses the `NEXTAUTH_URL` environment variable for:
- ✅ Redirects after login
- ✅ Redirects after logout
- ✅ Callback URLs
- ✅ Session management

If the port doesn't match, redirects go to the wrong URL.

## Quick Fix Steps

1. **Open `.env` file**
2. **Find the line:** `NEXTAUTH_URL="http://localhost:3000"`
3. **Change to:** `NEXTAUTH_URL="http://localhost:3001"`
4. **Save the file**
5. **Restart server:** Stop (Ctrl+C) and run `npm run dev`
6. **Test:** Login and logout should now work correctly

## Verification

After fixing:
1. Login at: http://localhost:3001/auth/signin
2. Click logout
3. Should redirect to: http://localhost:3001/auth/signin ✅
4. Not: http://localhost:3000/auth/signin ❌

## Note

The `.env` file is gitignored, so you need to update it manually. The `.env.example` file shows the template but doesn't affect the running app.

**Fix applied! Just update your `.env` file and restart the server.** 🎉
