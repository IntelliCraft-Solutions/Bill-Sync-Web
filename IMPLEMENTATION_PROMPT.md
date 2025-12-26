# BillSync Landing Page & Subscription System - Implementation Prompt for ORCHID IDE

## 🎯 Project Overview

Transform the existing BillSync SaaS application into a marketable product with a professional dark-themed landing page, subscription management system, usage tracking, and payment integration. The landing page should be fully responsive, mobile-optimized, with modern animations and instant page transitions.

---

## 📋 Current System Context

**Existing Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- PostgreSQL with Prisma ORM
- NextAuth.js for authentication
- Supabase Storage for images
- Tailwind CSS
- Admin and Cashier user roles

**Current Flow:**
- Root route (`/`) currently redirects to `/auth/signin` if not authenticated
- Need to change this to show landing page instead

---

## 🎨 Design Requirements

### Color Theme (Dark)
- **Primary Background**: `#0a0a0f` or `#0f0f1a` (deep dark blue-black)
- **Secondary Background**: `#1a1a2e`
- **Card Background**: `#16213e` or `#1e2746` (dark blue-gray)
- **Primary Accent**: `#6366f1` (indigo) or `#8b5cf6` (purple)
- **Secondary Accent**: `#06b6d4` (cyan) or `#3b82f6` (blue)
- **Text Primary**: `#ffffff` (white)
- **Text Secondary**: `#a1a1aa` (gray-400)
- **Borders**: `#27272a` with subtle glow effects
- **Gradients**: Purple-to-blue (`#8b5cf6` → `#3b82f6`)

### Typography
- **Font Family**: Inter, system-ui, -apple-system
- **Hero Headings**: 2.5rem - 4rem, bold
- **Body Text**: 16px base, regular weight
- **Line Height**: 1.6-1.8

### Card Design
- Rounded: `12px` or `16px`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Shadow: Dark with subtle glow
- Glass morphism: `backdrop-blur-sm` with transparency
- Hover: Lift effect + accent glow

---

## 🚀 Implementation Tasks

### PHASE 1: Database Schema & Foundation

1. **Update Prisma Schema** (`prisma/schema.prisma`):
   - Add `SubscriptionPlan` model
   - Add `Subscription` model (linked to Admin)
   - Add `UsageRecord` model
   - Add `Payment` model
   - Update `Admin` model to include `subscription` relation

2. **Create Migration**:
   - Run `npx prisma migrate dev --name add_subscription_system`
   - Generate Prisma client

3. **Seed Subscription Plans**:
   - Create seed script to insert 3 plans:
     - STANDARD (Free): ₹0/month
     - PROFESSIONAL: ₹X,XXX/month (set price)
     - PREMIUM: ₹X,XXX/month (set price)

4. **Create Utility Libraries**:
   - `lib/subscriptions.ts`: Subscription management functions
   - `lib/usage-tracker.ts`: Usage tracking and limit checking
   - `lib/limits.ts`: Plan limits configuration
   - `lib/payments.ts`: Payment processing utilities

---

### PHASE 2: Landing Page Structure

1. **Update Root Route** (`app/page.tsx`):
   - Remove redirect to `/auth/signin`
   - Show landing page for unauthenticated users
   - Keep redirect logic for authenticated users (to their dashboards)

2. **Create Landing Page Components** (`app/landing/page.tsx`):
   - Main landing page that imports all sections
   - Smooth scroll behavior
   - Section navigation

3. **Navigation Bar** (`components/landing/Navbar.tsx`):
   - Sticky/fixed position
   - Logo on left
   - Navigation links: Home, About, Inventory Management, Pricing, Downloads, Login/Sign Up
   - Mobile hamburger menu
   - Smooth scroll to sections
   - Active link highlighting
   - Dark theme with glass morphism
   - Animated underline on hover

4. **Hero Section** (`components/landing/Hero.tsx`):
   - Full viewport height (100vh on desktop, 90vh on mobile)
   - Background image with blur/overlay effect
   - Large headline: "Modern Billing & Inventory Management for Growing Businesses"
   - Subheadline: Brief value proposition
   - Two CTA buttons:
     - "Start My Free Trial" → `/auth/register?plan=free`
     - "Request a Demo" → `/demo`
   - Floating animated elements (icons, particles)
   - Gradient overlays
   - Scroll reveal animation
   - Responsive: Stack content on mobile

5. **Demo Section** (`components/landing/Demo.tsx`):
   - Animated app preview/screenshots
   - Overlapping mockups with subtle rotation/tilt
   - "Explore Demo Account" button → `/demo`
   - Description of demo features
   - Hover effects on mockups
   - Scroll reveal: fade + slide up

6. **About Section** (`components/landing/About.tsx`):
   - Company story and mission
   - Two-column layout (desktop), stacked (mobile)
   - Key values with icons
   - Scroll reveal animations
   - Dark cards with glow effects

7. **Testimonials Section** (`components/landing/Testimonials.tsx`):
   - 3-5 testimonial cards
   - Auto-rotating carousel (5s interval)
   - Customer names, businesses, photos (placeholders)
   - Star ratings
   - Smooth slide transitions
   - Pause on hover
   - Scroll reveal

8. **Brand Logos Section** (`components/landing/BrandLogos.tsx`):
   - "Trusted by" heading
   - Horizontal scrolling logos (or grid)
   - Grayscale with hover color
   - Placeholder logos for now
   - Infinite scroll animation (optional)

9. **Features Section** (`components/landing/Features.tsx`):
   - Grid layout: 3 columns (desktop), 2 (tablet), 1 (mobile)
   - Feature cards:
     - Inventory Management
     - Billing & Invoicing
     - Sales Reports
     - Employee Management
     - Analytics Dashboard
     - Multi-user Support
   - Icons for each feature
   - Hover: lift + glow
   - Staggered scroll reveal (0.1s delay between cards)

10. **Pricing Section** (`components/landing/Pricing.tsx`):
    - Three pricing cards:
      - **Standard (Free)**: ₹0/month
      - **Professional**: ₹X,XXX/month (highlighted with "Popular" badge)
      - **Premium**: ₹X,XXX/month
    - Feature lists for each plan
    - CTA buttons on each card
    - Hover effects
    - Scroll reveal with scale animation
    - Mobile: Stacked cards

11. **Contact Section** (`components/landing/Contact.tsx`):
    - Contact form (Name, Email, Subject, Message)
    - Contact information (Email, Phone, Address)
    - Two-column layout (form + info)
    - Form validation
    - Success/error messages
    - API endpoint: `/api/contact`
    - Dark card design
    - Scroll reveal

12. **FAQ Section** (`components/landing/FAQ.tsx`):
    - Accordion-style questions
    - Common FAQs (8-10 questions)
    - Smooth expand/collapse animations
    - Icon rotation on expand
    - Search functionality (optional)
    - Scroll reveal

13. **Footer** (`components/landing/Footer.tsx`):
    - Multi-column layout
    - Company info
    - Quick links
    - Social media icons
    - Newsletter signup (optional)
    - Copyright notice
    - Dark background
    - Responsive: Stack on mobile

---

### PHASE 3: Subscription System

1. **API Routes**:
   - `app/api/subscriptions/route.ts`: GET (list), POST (create)
   - `app/api/subscriptions/[id]/route.ts`: GET, PATCH, DELETE
   - `app/api/usage/route.ts`: GET usage stats
   - `app/api/usage/check/route.ts`: Check if limit exceeded

2. **Update Registration** (`app/auth/register/page.tsx`):
   - Auto-assign STANDARD (Free) plan on registration
   - Create subscription record
   - Initialize usage records

3. **Usage Tracking Middleware**:
   - Check limits before:
     - Creating products
     - Creating bills
     - Creating admin accounts
     - Uploading images
   - Return appropriate error messages
   - Show usage warnings at 80% limit

4. **Subscription Management UI** (`app/admin/settings/subscription/page.tsx`):
   - Current plan display
   - Usage statistics with progress bars
   - Upgrade/downgrade options
   - Payment history
   - Cancel subscription option

---

### PHASE 4: Payment Integration

1. **Install Razorpay**:
   ```bash
   npm install razorpay
   ```

2. **Environment Variables**:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`

3. **Checkout Page** (`app/checkout/page.tsx`):
   - Plan selection display
   - Razorpay checkout integration
   - Payment form
   - Success/error handling

4. **Payment API**:
   - `app/api/payments/route.ts`: Create payment order
   - `app/api/payments/webhook/route.ts`: Handle Razorpay webhooks
   - Update subscription on successful payment

---

### PHASE 5: Demo Account

1. **Demo Seed Script** (`scripts/seed-demo.ts`):
   - Create demo admin account
   - Populate with sample data:
     - 20-30 products
     - 50-100 bills
     - 2-3 cashier accounts
     - Store details
     - Analytics data

2. **Demo Route** (`app/demo/page.tsx`):
   - Auto-login to demo account
   - "DEMO MODE" banner
   - Reset button (optional)
   - Redirect to admin dashboard

---

### PHASE 6: Route Protection

1. **Middleware** (`middleware.ts`):
   - Check authentication for `/admin/*` and `/cashier/*`
   - Check active subscription
   - Redirect to pricing if subscription expired
   - Allow demo account access

2. **API Route Protection**:
   - Add usage limit checks to:
     - `app/api/products/route.ts` (POST)
     - `app/api/billing/route.ts` (POST)
     - `app/api/employees/route.ts` (POST)
     - `app/api/upload/route.ts` (POST)

3. **Upgrade Prompts**:
   - Show modal/banner when limit reached
   - Link to pricing/checkout page

---

### PHASE 7: Additional Pages

1. **Downloads Page** (`app/downloads/page.tsx`):
   - List of downloadable software versions
   - Download links (after payment verification)
   - Version history
   - Dark theme, responsive

2. **Contact API** (`app/api/contact/route.ts`):
   - Handle contact form submissions
   - Send email notifications (optional)
   - Store in database (optional)

---

## 🎬 Animation Requirements

### Scroll Animations (Reveal on Scroll)
- Use `framer-motion` or `react-intersection-observer`
- Fade in: `opacity: 0 → 1`
- Slide up: `translateY(30px) → 0`
- Stagger: 0.1s delay between elements
- Trigger at 20% visibility

### Continuous Animations
- Floating elements: `translateY` animation (2-3px, 3-4s, infinite)
- Rotating icons: `rotate(360deg)` (20-30s, infinite, linear)
- Gradient shifts: Background position animation
- Glow pulses: Opacity animation (0.5 → 1, 2s, infinite)

### Page Transitions
- Use Next.js `<Link>` with `prefetch`
- Fade transition between pages (0.3s)
- No full page reloads
- Instant navigation

### Hover Effects
- Cards: `translateY(-4px)` + shadow increase
- Buttons: Scale (1.02) + glow
- Smooth transitions: `transition: all 0.3s ease`

### Performance
- Use `transform` and `opacity` only (GPU accelerated)
- Debounce scroll events
- Use `will-change` sparingly
- Respect `prefers-reduced-motion`

---

## 📱 Responsive Design

### Breakpoints
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

### Mobile Optimization
- Touch-friendly buttons (min 44x44px)
- Swipe gestures for carousels
- Collapsible navigation
- Stacked layouts
- Optimized images
- No horizontal scrolling
- Fast tap response

### Orientation Support
- Portrait: Vertical layouts
- Landscape: Adjusted spacing

---

## 🔧 Technical Specifications

### File Structure
```
app/
  page.tsx                    # Landing page (updated)
  landing/
    page.tsx                  # Alternative landing route
  demo/
    page.tsx                  # Demo account access
  checkout/
    page.tsx                  # Payment checkout
  downloads/
    page.tsx                  # Downloads page
  api/
    subscriptions/
      route.ts
      [id]/
        route.ts
    usage/
      route.ts
      check/
        route.ts
    payments/
      route.ts
      webhook/
        route.ts
    contact/
      route.ts

components/
  landing/
    Navbar.tsx
    Hero.tsx
    Demo.tsx
    About.tsx
    Testimonials.tsx
    BrandLogos.tsx
    Features.tsx
    Pricing.tsx
    Contact.tsx
    FAQ.tsx
    Footer.tsx

lib/
  subscriptions.ts
  usage-tracker.ts
  limits.ts
  payments.ts

middleware.ts                 # Route protection
```

### Dependencies to Install
```bash
npm install framer-motion react-intersection-observer
npm install razorpay
npm install @types/razorpay
npm install react-swipeable  # For mobile swipe gestures (optional)
```

### Animation Setup

**Create Animation Utilities** (`lib/animations.ts`):
```typescript
// Common animation variants for reuse
export const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const floating = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
}
```

### Environment Variables
```env
# Payment
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Subscription
DEFAULT_PLAN_ID=... # Free plan ID
TRIAL_DAYS=14

# Demo
DEMO_ADMIN_EMAIL=demo@billsync.com
DEMO_ADMIN_PASSWORD=...
```

---

## ✅ Implementation Checklist

### Database & Backend
- [ ] Update Prisma schema with subscription models
- [ ] Run migration
- [ ] Seed subscription plans
- [ ] Create subscription utilities
- [ ] Create usage tracking utilities
- [ ] Create payment utilities

### Landing Page Components
- [ ] Update root route
- [ ] Create Navbar component
- [ ] Create Hero section
- [ ] Create Demo section
- [ ] Create About section
- [ ] Create Testimonials section
- [ ] Create Brand Logos section
- [ ] Create Features section
- [ ] Create Pricing section
- [ ] Create Contact section
- [ ] Create FAQ section
- [ ] Create Footer component

### Subscription System
- [ ] Create subscription API routes
- [ ] Update registration to assign free plan
- [ ] Create subscription management UI
- [ ] Implement usage tracking middleware
- [ ] Add usage limits to existing features

### Payment Integration
- [ ] Install Razorpay
- [ ] Create checkout page
- [ ] Create payment API routes
- [ ] Implement webhook handler
- [ ] Test payment flow

### Demo Account
- [ ] Create demo seed script
- [ ] Create demo route
- [ ] Add demo mode indicators

### Route Protection
- [ ] Create middleware
- [ ] Add subscription checks
- [ ] Add usage limit checks to API routes
- [ ] Create upgrade prompts

### Additional Pages
- [ ] Create downloads page
- [ ] Create contact API

### Animations & Polish
- [ ] Add scroll reveal animations
- [ ] Add continuous animations
- [ ] Add hover effects
- [ ] Optimize performance
- [ ] Test on mobile devices
- [ ] Test all user flows

---

## 🎯 Success Criteria

1. ✅ Landing page loads in < 3 seconds
2. ✅ All sections are responsive and mobile-optimized
3. ✅ Smooth animations without performance issues
4. ✅ Instant page transitions (no full reloads)
5. ✅ Subscription system tracks usage accurately
6. ✅ Payment integration works end-to-end
7. ✅ Demo account accessible and functional
8. ✅ Free tier limits enforced properly
9. ✅ All routes properly protected
10. ✅ Dark theme consistent throughout

---

## 📝 Important Notes

- **Do NOT break existing functionality** - All current admin/cashier features must work
- **Mobile-first approach** - Test on mobile devices frequently
- **Performance is critical** - Optimize images, code split, lazy load
- **Accessibility matters** - Use semantic HTML, proper ARIA labels
- **SEO optimization** - Proper meta tags, semantic structure
- **Error handling** - Graceful error messages, fallbacks
- **Security** - Validate all inputs, protect API routes, secure payments

---

## 🚀 Start Implementation

Begin with Phase 1 (Database Schema) and work through each phase sequentially. Test thoroughly after each phase before moving to the next.

**Good luck! 🎉**

