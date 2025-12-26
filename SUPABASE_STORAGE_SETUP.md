# Supabase Storage Setup Guide

## Quick Setup

Your images will now be stored in Supabase Storage bucket named **"BillSync"** instead of local `/uploads` folder.

## Prerequisites

1. ✅ Supabase URL added to `.env`: `NEXT_PUBLIC_SUPABASE_URL`
2. ✅ Supabase Anon Key added to `.env`: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Setup Steps

### 1. Create the Storage Bucket

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Name: `BillSync`
6. **Important:** Make it **PUBLIC** (toggle "Public bucket")
7. Click **"Create bucket"**

**Option B: Using SQL Editor**
1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('BillSync', 'BillSync', true)
   ON CONFLICT (id) DO NOTHING;
   ```

### 2. Set Up Bucket Policies (If Not Public)

If you didn't make it public, you need to set up RLS policies:

1. Go to **Storage** → **Policies** → Select `BillSync` bucket
2. Click **"New Policy"**
3. For **Upload Policy:**
   - Policy name: `Allow authenticated uploads`
   - Allowed operation: `INSERT`
   - Policy definition:
     ```sql
     (bucket_id = 'BillSync' AND (storage.foldername(name))[1] = auth.uid()::text)
     ```

4. For **Read Policy:**
   - Policy name: `Allow public read`
   - Allowed operation: `SELECT`
   - Policy definition:
     ```sql
     bucket_id = 'BillSync'
     ```

### 3. Verify Setup

Run the verification script:
```bash
npm run supabase:verify
```

This will check:
- ✅ Environment variables are set
- ✅ Supabase connection works
- ✅ Storage bucket exists
- ✅ Bucket is accessible

### 4. Test Image Upload

1. Start your dev server: `npm run dev`
2. Go to Admin → Inventory
3. Try uploading a product image
4. Check Supabase Dashboard → Storage → BillSync bucket to see the uploaded file

## Environment Variables

Make sure your `.env` file has:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

**Note about Anon Key:**
- The anon key is safe to use in client-side code (it's in `NEXT_PUBLIC_`)
- For production, consider using a service role key for server-side uploads
- The anon key format should be a JWT token (starts with `eyJ...`)

## Troubleshooting

### "Bucket not found" Error
- ✅ Create the bucket in Supabase Dashboard
- ✅ Make sure it's named exactly `BillSync` (case-sensitive)

### "Permission denied" Error
- ✅ Make the bucket PUBLIC, OR
- ✅ Set up proper RLS policies (see step 2 above)

### "Invalid API key" Error
- ✅ Verify your anon key is correct
- ✅ Check if key starts with `eyJ...` (JWT format)
- ✅ Get the key from: Settings → API → Project API keys → `anon` `public`

### Images Not Showing
- ✅ Check if bucket is PUBLIC
- ✅ Verify the image URL in database points to Supabase Storage
- ✅ Check browser console for CORS errors

## Migration from Local Uploads

If you have existing images in `/public/uploads`:
1. They will continue to work (old URLs are preserved)
2. New uploads will go to Supabase Storage
3. To migrate old images:
   - Download them from your server
   - Upload manually to Supabase Storage bucket
   - Update database URLs if needed

## Security Notes

- **Public Bucket:** Anyone with the URL can access images (good for product images)
- **Private Bucket:** Requires authentication (better for sensitive files)
- For product images, public bucket is usually fine

## File Limits

- Max file size: **5MB** (enforced in code)
- Allowed types: JPEG, JPG, PNG, WebP, GIF
- Files are automatically named with timestamp to prevent conflicts

