# Setup Instructions

## Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory with the following:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/billing_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

### 3. Set Up PostgreSQL Database

**Option A: Local PostgreSQL**
```bash
# Create database
createdb billing_db

# Update DATABASE_URL in .env with your credentials
```

**Option B: Cloud PostgreSQL (Recommended)**
- Use [Supabase](https://supabase.com) (Free tier available)
- Use [Railway](https://railway.app) (Easy setup)
- Use [Neon](https://neon.tech) (Serverless Postgres)

Copy the connection string to your `.env` file.

### 4. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## First Time Setup

### Create Admin Account
1. Navigate to `/auth/register`
2. Enter your business details
3. Create your admin account

### Add Cashier Accounts
1. Login as admin
2. Go to "Employees" section
3. Click "Add Employee"
4. Provide username and password
5. Cashiers can now login

## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy automatically

### Deploy to Railway
1. Connect GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Deploy

## Troubleshooting

### Database Connection Failed
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists
- Test connection: `npx prisma db pull`

### Authentication Not Working
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies

### Build Errors
- Delete `node_modules` and `.next`
- Run `npm install` again
- Ensure Node.js version 18+

## Development Tips

### Reset Database
```bash
npx prisma db push --force-reset
```

### View Database
```bash
npx prisma studio
```

### Check Logs
- Browser console for frontend errors
- Terminal for API errors
- Check Network tab for API calls

## Features Overview

### Admin Features
- Dashboard with analytics
- Inventory management (CRUD)
- Employee management
- Sales analytics and charts
- PDF/CSV report exports
- Low stock alerts

### Cashier Features
- Create inventory bills
- Create custom bills
- View billing history
- Export bills to PDF

## Tech Stack
- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **PDF Generation:** jsPDF
- **Charts:** Recharts
- **Icons:** Lucide React

## Support
For issues, check:
1. Environment variables are correct
2. Database is accessible
3. All dependencies installed
4. Node.js version 18+
