#!/usr/bin/env node

/**
 * Supabase Connection Verification Script
 * Verifies Supabase Storage bucket access
 */

// Load environment variables only when this script is run manually
// This script is not part of the startup process
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BUCKET_NAME = 'BillSync'

async function verifySupabase() {
  console.log('🔍 Verifying Supabase connection...\n')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!')
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env')
    process.exit(1)
  }

  console.log('✅ Environment variables found')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...\n`)

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test connection by listing buckets
    console.log('📦 Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Error accessing storage:', bucketsError.message)
      console.error('\n💡 Tips:')
      console.error('   - Verify your Supabase anon key is correct')
      console.error('   - Check if Storage is enabled in your Supabase project')
      console.error('   - The anon key should start with "eyJ..." (JWT format)')
      process.exit(1)
    }

    console.log('✅ Storage access successful!\n')

    // Check if BillSync bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)

    if (bucketExists) {
      console.log(`✅ Bucket "${BUCKET_NAME}" exists\n`)
      
      // Try to list files in bucket
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { limit: 1 })

      if (listError) {
        console.warn(`⚠️  Warning: Cannot list files in bucket: ${listError.message}`)
        console.warn('   You may need to update bucket policies in Supabase Dashboard\n')
      } else {
        console.log(`✅ Bucket access verified (${files?.length || 0} files)\n`)
      }
    } else {
      console.log(`❌ Bucket "${BUCKET_NAME}" not found!\n`)
      console.log('💡 To create the bucket:')
      console.log('   1. Go to Supabase Dashboard → Storage')
      console.log(`   2. Click "New bucket"`)
      console.log(`   3. Name it: ${BUCKET_NAME}`)
      console.log('   4. Make it PUBLIC (or set up proper RLS policies)\n')
      console.log('   Or use SQL in Supabase SQL Editor:')
      console.log(`   INSERT INTO storage.buckets (id, name, public) VALUES ('${BUCKET_NAME}', '${BUCKET_NAME}', true);\n`)
    }

    console.log('✨ Supabase verification complete!')

  } catch (error) {
    console.error('\n❌ Connection failed!')
    console.error('Error:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check your Supabase URL format')
    console.error('   2. Verify your anon key (should be a JWT token starting with "eyJ...")')
    console.error('   3. Make sure Storage API is enabled in Supabase')
    process.exit(1)
  }
}

verifySupabase()

