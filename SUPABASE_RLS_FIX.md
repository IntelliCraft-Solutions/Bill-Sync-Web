# Fixing Supabase Storage RLS Policy Error

The error "new row violates row-level security policy" means the bucket has RLS enabled but no policy allows uploads.

## Solution 1: Use Service Role Key (Recommended for Server-Side)

The service role key bypasses RLS policies and is perfect for server-side uploads.

### Steps:

1. **Get Service Role Key from Supabase:**
   - Go to Supabase Dashboard → Settings → API
   - Under "Project API keys"
   - Copy the `service_role` `secret` key (⚠️ Keep this secret!)
   - It's a long JWT token starting with `eyJ...`

2. **Add to .env file:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

**Note:** Service role key bypasses all RLS policies, so keep it secure and only use it server-side (never expose it in client-side code).

## Solution 2: Set Up RLS Policies (Alternative)

If you prefer to use the anon key, set up RLS policies:

### Steps:

1. **Go to Supabase Dashboard → Storage → Policies**

2. **Select the `BillSync` bucket**

3. **Create Upload Policy:**
   - Click "New Policy"
   - Policy name: `Allow public uploads`
   - Allowed operation: `INSERT`
   - Policy definition:
     ```sql
     bucket_id = 'BillSync'
     ```
   - Or for authenticated only:
     ```sql
     bucket_id = 'BillSync' AND auth.role() = 'authenticated'
     ```

4. **Create Read Policy (if not public bucket):**
   - Click "New Policy"
   - Policy name: `Allow public read`
   - Allowed operation: `SELECT`
   - Policy definition:
     ```sql
     bucket_id = 'BillSync'
     ```

## Quick Fix Command

After adding the service role key, the upload should work immediately!

## Environment Variables Summary

Your `.env` should have:
```env
# Public (safe to expose)
NEXT_PUBLIC_SUPABASE_URL="https://zytlfjbuuvqcygurlrrj.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..." 
# OR
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_..."

# Secret (server-side only, never commit to git!)
SUPABASE_SERVICE_ROLE_KEY="eyJ..." # Get from Settings → API → service_role secret
```

