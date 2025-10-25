# Billing & Sales Management WebApp

A modern, production-ready billing and sales management system built with Next.js 14, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL.

## 🚀 Features

### Admin Features
- **Dashboard**: Real-time sales analytics with daily, monthly, and yearly revenue tracking
- **Inventory Management**: Full CRUD operations for products with low-stock alerts
- **Employee Management**: Create and manage cashier accounts
- **Sales Analytics**: Interactive charts showing sales trends, top products, and employee performance
- **Reports**: Export inventory, sales, and bills in PDF and CSV formats
- **Low Stock Alerts**: Automatic notifications when products fall below threshold

### Cashier Features
- **Billing System**: Two billing modes:
  - **Inventory Bill**: Select products from inventory (auto stock reduction)
  - **Custom Bill**: Add unlisted products temporarily
- **Bill History**: View personal billing history
- **PDF Export**: Generate PDF invoices for customers

### Security & Data Isolation
- Role-based authentication (Admin/Cashier)
- JWT session management
- Complete data isolation between admins
- Secure password hashing with bcrypt

### Responsive Design
- Mobile-first approach
- Works perfectly on desktop, tablet, and mobile
- PWA-ready for offline capabilities

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
cd "e:/Intellicreaft Sol/billing webapp"
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/billing_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
billing-webapp/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── billing/      # Billing operations
│   │   ├── inventory/    # Inventory management
│   │   ├── employees/    # Employee management
│   │   └── analytics/    # Analytics data
│   ├── admin/            # Admin dashboard pages
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── analytics/
│   │   ├── employees/
│   │   └── reports/
│   ├── cashier/          # Cashier dashboard pages
│   │   ├── dashboard/
│   │   └── billing/
│   └── auth/             # Authentication pages
├── components/           # Reusable React components
├── lib/                  # Utility functions
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # NextAuth configuration
│   ├── pdf-generator.ts # PDF generation utilities
│   └── csv-generator.ts # CSV export utilities
├── prisma/
│   └── schema.prisma    # Database schema
└── public/              # Static assets
    ├── manifest.json    # PWA manifest
    └── sw.js           # Service worker
```

## 🗄️ Database Schema

The application uses four main models:

- **Admin**: Business owners with full access
- **BillingAccount**: Cashier accounts linked to admins
- **Product**: Inventory items with stock tracking
- **Bill**: Sales records with line items
- **BillItem**: Individual items in each bill

## 🔐 Authentication

### Admin Registration
1. Navigate to `/auth/register`
2. Enter business name, email, and password
3. Login at `/auth/signin`

### Cashier Login
1. Admin creates cashier account in Employee Management
2. Cashier logs in with username and password at `/auth/signin`

## 📊 Usage Guide

### For Admins

**Managing Inventory:**
1. Go to Inventory page
2. Click "Add Product" to create new items
3. Set low stock thresholds for alerts
4. Edit or delete products as needed

**Managing Employees:**
1. Navigate to Employees page
2. Click "Add Employee" 
3. Provide username and password
4. Employees can now login as cashiers

**Viewing Analytics:**
1. Dashboard shows overview statistics
2. Analytics page displays detailed charts
3. Filter by date range and employee

**Generating Reports:**
1. Go to Reports page
2. Select report type (Inventory/Sales/Bills)
3. Choose date range
4. Export as PDF or CSV

### For Cashiers

**Creating Bills:**
1. Navigate to Billing page
2. Choose bill type (Inventory/Custom)
3. Add items with quantities
4. Enter customer name
5. Generate bill and download PDF

**Viewing History:**
1. Dashboard shows recent bills
2. Click on any bill to view details
3. Download PDF invoice

## 🎨 Customization

### Styling
- Tailwind CSS configuration in `tailwind.config.ts`
- Global styles in `app/globals.css`
- Primary color: `#0ea5e9` (customizable in config)

### Business Logic
- API routes in `app/api/`
- Modify validation schemas in route files
- Adjust analytics calculations in `/api/analytics`

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all environment variables are set:
- `DATABASE_URL`: Production PostgreSQL connection string
- `NEXTAUTH_URL`: Production domain URL
- `NEXTAUTH_SECRET`: Strong random secret

### Recommended Platforms
- **Vercel**: Automatic deployments with GitHub integration
- **Railway**: Easy PostgreSQL + Next.js hosting
- **DigitalOcean**: Full control with App Platform

## 📱 PWA Configuration

The app is PWA-ready with:
- `manifest.json` for app metadata
- Service worker for offline caching
- Installable on mobile devices

## 🔧 Troubleshooting

**Database Connection Issues:**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

**Authentication Errors:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and retry

**Build Errors:**
- Run `npm install` to ensure all dependencies
- Delete `.next` folder and rebuild
- Check Node.js version (18+)

## 📄 License

MIT License - feel free to use for commercial projects

## 🤝 Support

For issues or questions:
1. Check existing documentation
2. Review error logs in console
3. Verify environment variables
4. Check database connectivity

## 🎯 Roadmap

- [ ] Multi-currency support
- [ ] Email notifications
- [ ] Advanced reporting with charts
- [ ] Barcode scanning
- [ ] Inventory forecasting
- [ ] Multi-location support
- [ ] API documentation with Swagger

---

Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS
