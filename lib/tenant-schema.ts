import { prisma } from './prisma'
import { PrismaClient } from '@prisma/client'

/**
 * Creates a new tenant schema in PostgreSQL
 * This ensures complete data isolation per tenant
 */
export async function createTenantSchema(tenantId: string, schemaName: string) {
  // Get raw database connection from Prisma
  const rawDb = prisma.$queryRawUnsafe

  try {
    // Create schema
    await rawDb(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`)

    // Grant usage to app role (adjust role name as needed)
    await rawDb(`GRANT USAGE ON SCHEMA ${schemaName} TO CURRENT_USER`)

    // Set search path and create tenant-specific tables
    await rawDb(`
      SET search_path = ${schemaName};
      
      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        sku TEXT,
        category TEXT,
        price DECIMAL(10, 2) NOT NULL,
        "quantityInStock" INTEGER NOT NULL DEFAULT 0,
        "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
        "imageUrl" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Bills table
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "billNumber" SERIAL,
        "customerName" TEXT NOT NULL,
        "billType" TEXT NOT NULL,
        "totalAmount" DECIMAL(10, 2) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Bill Items table
      CREATE TABLE IF NOT EXISTS "billItems" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "billId" TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
        "productId" TEXT REFERENCES products(id),
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        "unitPrice" DECIMAL(10, 2) NOT NULL,
        "totalPrice" DECIMAL(10, 2) NOT NULL
      );

      -- Billing Accounts (Cashiers) table
      CREATE TABLE IF NOT EXISTS "billingAccounts" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'CASHIER',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Store Details table
      CREATE TABLE IF NOT EXISTS "storeDetails" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "storeName" TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        "gstNumber" TEXT,
        website TEXT,
        logo TEXT,
        "footerText" TEXT DEFAULT 'Thank you for shopping!',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_bills_created ON bills("createdAt");
      CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON "billItems"("billId");
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    `)

    // Reset search path
    await rawDb('SET search_path = public')

    return { success: true }
  } catch (error) {
    console.error('Error creating tenant schema:', error)
    throw new Error(`Failed to create tenant schema: ${error}`)
  }
}

/**
 * Drops a tenant schema (for tenant deletion)
 */
export async function dropTenantSchema(schemaName: string) {
  const rawDb = prisma.$queryRawUnsafe

  try {
    await rawDb(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`)
    return { success: true }
  } catch (error) {
    console.error('Error dropping tenant schema:', error)
    throw new Error(`Failed to drop tenant schema: ${error}`)
  }
}

/**
 * Gets a Prisma client configured for a specific tenant schema
 */
export function getTenantPrismaClient(schemaName: string): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set')
  }

  // Modify connection string to use tenant schema
  const urlWithSchema = databaseUrl.includes('?')
    ? `${databaseUrl}&schema=${schemaName}`
    : `${databaseUrl}?schema=${schemaName}`

  return new PrismaClient({
    datasources: {
      db: {
        url: urlWithSchema,
      },
    },
  })
}

