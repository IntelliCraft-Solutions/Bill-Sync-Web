#!/usr/bin/env node

/**
 * Database Connection Verification Script
 * Verifies Supabase connection and checks if all tables exist
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

async function verifyDatabase() {
  console.log('🔍 Verifying database connection...\n')

  try {
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful!\n')

    // Check each table exists and get counts
    const tables = {
      Admin: prisma.admin,
      Product: prisma.product,
      Bill: prisma.bill,
      BillItem: prisma.billItem,
      BillingAccount: prisma.billingAccount,
      StoreDetails: prisma.storeDetails,
    }

    console.log('📊 Checking tables:\n')
    for (const [tableName, model] of Object.entries(tables)) {
      try {
        const count = await model.count()
        console.log(`  ✅ ${tableName.padEnd(20)} - ${count} record(s)`)
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`  ❌ ${tableName.padEnd(20)} - Table not found`)
        } else {
          console.log(`  ⚠️  ${tableName.padEnd(20)} - Error: ${error.message}`)
        }
      }
    }

    console.log('\n✨ Database verification complete!')
    console.log('\n💡 Tips:')
    console.log('   - If tables are missing, run: npx prisma db push')
    console.log('   - To view data: npx prisma studio')
    console.log('   - Check Supabase Dashboard → Table Editor\n')

  } catch (error) {
    console.error('\n❌ Database connection failed!\n')
    console.error('Error:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check DATABASE_URL in .env file')
    console.error('   2. Verify Supabase project is active')
    console.error('   3. Ensure you\'re using Transaction pooler (port 6543)')
    console.error('   4. Check Supabase Dashboard → Settings → Database\n')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabase()

