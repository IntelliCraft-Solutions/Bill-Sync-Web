# BillSync Landing Page & Subscription System - Requirements & Implementation Plan

## 📋 Executive Summary

This document outlines the requirements and implementation plan for transforming BillSync from a direct-access SaaS application into a marketable product with:
- Professional landing page
- Subscription/plan management system
- Free tier with usage tracking
- Demo account functionality
- Payment integration for premium plans

---

## 🎯 Current System Analysis

### Existing Architecture
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Credentials Provider)
- **Storage**: Supabase Storage for images
- **User Roles**: ADMIN, CASHIER
- **Current Flow**: Root (`/`) → Redirects to `/auth/signin` if not authenticated

### Current Limitations
1. ❌ No landing page - direct redirect to signin
2. ❌ No subscription/plan system
3. ❌ No usage tracking or limits
4. ❌ No free tier restrictions
5. ❌ No payment integration
6. ❌ No demo account system
7. ❌ No marketing/presentation layer

---

## 🏗️ Architecture Recommendation

### **Option 1: Integrated Approach (RECOMMENDED)**
**Single Next.js Application with Route Separation**

```
/app
  /landing          # Public marketing pages
  /auth             # Authentication (existing)
  /admin            # SaaS app (existing, protected)
  /cashier          # SaaS app (existing, protected)
  /demo             # Demo account access
  /api
    /subscriptions  # Subscription management
    /usage          # Usage tracking
    /payments       # Payment processing
```

**Pros:**
- ✅ Single codebase, easier maintenance
- ✅ Shared components and utilities
- ✅ Unified authentication
- ✅ Better SEO with Next.js SSR
- ✅ Faster development
- ✅ Lower hosting costs

**Cons:**
- ⚠️ Slightly larger bundle size (mitigated by code splitting)

### **Option 2: Separate Frontend/Backend**
**Landing Page (Separate Next.js) + API Backend**

**Pros:**
- ✅ Complete separation of concerns
- ✅ Can use different tech stacks
- ✅ Independent deployments

**Cons:**
- ❌ More complex setup
- ❌ Duplicate authentication logic
- ❌ CORS configuration needed
- ❌ Higher maintenance overhead
- ❌ More expensive hosting

**Recommendation: Option 1 (Integrated Approach)**

---

## 📐 Detailed Requirements

### 1. Landing Page Structure

#### 1.1 Navigation Bar
**Components:**
- Logo (BillSync branding)
- Navigation Links:
  - Home (scroll to top)
  - About (scroll to about section)
  - Inventory Management (scroll to features)
  - Pricing (scroll to pricing section)
  - Downloads (link to downloads page)
  - Login/Sign Up (button → `/auth/signin`)

**Design:**
- Sticky/fixed navbar
- Responsive mobile menu
- Active link highlighting
- Smooth scroll behavior

#### 1.2 Hero Section
**Components:**
- Background image with blur/overlay effect
- Headline: Compelling value proposition
- Subheadline: Brief description
- Two CTA Buttons:
  - "Start My Free Trial" → `/auth/register?plan=free`
  - "Request a Demo" → Opens demo modal or `/demo`
- Optional: Animated elements or gradient effects

**Design:**
- Full viewport height (or 80vh)
- Centered content
- Modern, clean aesthetic
- Mobile-responsive

#### 1.3 Demo Section
**Components:**
- Animated/interactive preview of the app
- Screenshots or embedded iframe (if possible)
- "Explore Demo Account" button → `/demo`
- Brief description of demo features

**Design:**
- Animated mockups or screenshots
- Hover effects
- Smooth transitions
- Call-to-action prominent

#### 1.4 About Section
**Components:**
- Company/product story
- Mission statement
- Key values
- Team highlights (optional)

**Design:**
- Clean, readable typography
- Image placeholders for team (optional)
- Two-column layout (desktop)

#### 1.5 Testimonials Section
**Components:**
- 3-5 customer testimonials
- Customer names, businesses, photos (optional)
- Star ratings
- Carousel/slider for multiple testimonials

**Design:**
- Card-based layout
- Auto-rotating carousel
- Smooth transitions
- Responsive grid

#### 1.6 Brand Logos Section
**Components:**
- Logos of businesses using BillSync
- "Trusted by" or "Used by" heading
- Placeholder logos for future partnerships
- Optional: Clickable links to case studies

**Design:**
- Horizontal scrolling or grid
- Grayscale with hover color
- Equal sizing
- Responsive

#### 1.7 Features Section
**Components:**
- Feature cards with icons
- Key features:
  - Inventory Management
  - Billing & Invoicing
  - Sales Reports
  - Employee Management
  - Analytics Dashboard
  - Multi-user Support
- Screenshots or illustrations for each feature

**Design:**
- Grid layout (3 columns desktop, 2 tablet, 1 mobile)
- Icon + title + description
- Hover effects
- Modern card design

#### 1.8 Pricing Section
**Components:**
- Three pricing tiers:

**Standard (Free)**
- ₹0/month
- Features:
  - Up to 50 products
  - Up to 100 bills/month
  - 1 admin account
  - Basic reports
  - Email support
- "Get Started" button

**Professional**
- ₹X,XXX/month (to be determined)
- Features:
  - Unlimited products
  - Unlimited bills
  - Up to 5 admin accounts
  - Advanced reports & analytics
  - Priority email support
  - Custom branding
- "Start Free Trial" button

**Premium**
- ₹X,XXX/month (to be determined)
- Features:
  - Everything in Professional
  - Unlimited admin accounts
  - API access
  - White-label option
  - Phone support
  - Custom integrations
- "Start Free Trial" button

**Design:**
- Three-column layout
- Highlighted "Popular" badge (on Professional)
- Feature comparison table
- Clear CTA buttons
- Mobile: Stacked cards

#### 1.9 Contact Section
**Components:**
- Contact form:
  - Name
  - Email
  - Subject
  - Message
  - Submit button
- Contact information:
  - Email address
  - Phone number (optional)
  - Office address (optional)
- Social media links (optional)

**Design:**
- Card-based form
- Two-column layout (form + info)
- Validation feedback
- Success/error messages
- API endpoint for form submission

#### 1.10 FAQ Section
**Components:**
- Accordion-style questions
- Common questions:
  - How does the free trial work?
  - What payment methods do you accept?
  - Can I upgrade/downgrade my plan?
  - Is my data secure?
  - Do you offer refunds?
  - How do I cancel my subscription?
  - Can I export my data?
  - Is there a mobile app?

**Design:**
- Expandable accordion
- Smooth animations
- Search functionality (optional)
- Categorized sections (optional)

#### 1.11 Footer
**Components:**
- Company information
- Quick links:
  - About
  - Features
  - Pricing
  - Contact
  - Privacy Policy
  - Terms of Service
  - Blog (optional)
- Social media icons
- Newsletter signup (optional)
- Copyright notice

**Design:**
- Multi-column layout
- Dark background
- Organized sections
- Responsive

---

### 2. Subscription & Plan Management System

#### 2.1 Database Schema Extensions

**New Models:**

```prisma
model SubscriptionPlan {
  id          String   @id @default(cuid())
  name        String   // "STANDARD", "PROFESSIONAL", "PREMIUM"
  displayName String   // "Standard", "Professional", "Premium"
  price       Float    // Monthly price in INR
  currency    String   @default("INR")
  features    Json     // Feature list as JSON
  limits      Json     // Usage limits as JSON
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  subscriptions Subscription[]
}

model Subscription {
  id              String   @id @default(cuid())
  adminId         String   @unique
  planId          String
  status          String   // "ACTIVE", "CANCELLED", "EXPIRED", "TRIAL"
  startDate       DateTime
  endDate         DateTime?
  trialEndDate    DateTime?
  isTrial         Boolean  @default(false)
  paymentMethod   String?  // "RAZORPAY", "STRIPE", etc.
  paymentId       String?  // External payment ID
  autoRenew       Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  admin           Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  plan            SubscriptionPlan @relation(fields: [planId], references: [id])
  usageRecords    UsageRecord[]
}

model UsageRecord {
  id             String   @id @default(cuid())
  adminId        String
  subscriptionId String
  metricType     String   // "PRODUCTS", "BILLS", "STORAGE", "USERS"
  currentValue   Int      // Current usage count
  limitValue     Int      // Limit from plan
  period         String   // "MONTHLY", "YEARLY"
  periodStart    DateTime
  periodEnd      DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  admin          Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  @@index([adminId, metricType, periodStart])
}

model Payment {
  id              String   @id @default(cuid())
  subscriptionId  String
  amount          Float
  currency        String   @default("INR")
  status          String   // "PENDING", "SUCCESS", "FAILED", "REFUNDED"
  paymentMethod   String
  paymentId       String?  // External payment gateway ID
  transactionId  String?  // Internal transaction ID
  receiptUrl      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  subscription    Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  @@index([subscriptionId, status])
}
```

**Admin Model Extension:**
```prisma
model Admin {
  // ... existing fields
  subscription Subscription?
}
```

#### 2.2 Plan Limits Configuration

**Standard (Free) Plan:**
```json
{
  "products": 50,
  "billsPerMonth": 100,
  "adminAccounts": 1,
  "cashierAccounts": 3,
  "storageMB": 100,
  "features": ["basic_reports", "email_support"]
}
```

**Professional Plan:**
```json
{
  "products": -1, // unlimited
  "billsPerMonth": -1,
  "adminAccounts": 5,
  "cashierAccounts": 20,
  "storageMB": 1000,
  "features": ["advanced_reports", "analytics", "priority_support", "custom_branding"]
}
```

**Premium Plan:**
```json
{
  "products": -1,
  "billsPerMonth": -1,
  "adminAccounts": -1,
  "cashierAccounts": -1,
  "storageMB": 10000,
  "features": ["all_professional", "api_access", "white_label", "phone_support", "custom_integrations"]
}
```

---

### 3. Usage Tracking System

#### 3.1 Tracking Points

**Product Creation:**
- Check: `currentProducts < planLimit.products`
- Increment: `UsageRecord` for `PRODUCTS` metric
- Block if limit exceeded

**Bill Creation:**
- Check: `currentBillsThisMonth < planLimit.billsPerMonth`
- Increment: `UsageRecord` for `BILLS` metric
- Block if limit exceeded

**Admin Account Creation:**
- Check: `currentAdminAccounts < planLimit.adminAccounts`
- Increment: `UsageRecord` for `ADMIN_ACCOUNTS` metric
- Block if limit exceeded

**Storage Usage:**
- Track: Total image size uploaded
- Check: `currentStorageMB < planLimit.storageMB`
- Block uploads if limit exceeded

#### 3.2 Usage Tracking Implementation

**Middleware/Utility Functions:**
```typescript
// lib/usage-tracker.ts
- checkUsageLimit(adminId, metricType)
- incrementUsage(adminId, metricType, amount = 1)
- getUsageStats(adminId)
- resetMonthlyUsage(adminId) // Cron job
```

**API Middleware:**
- Protect routes with usage checks
- Return appropriate error messages
- Show usage warnings at 80% limit

**UI Indicators:**
- Usage bars in dashboard
- Warning banners when approaching limits
- Upgrade prompts when limit reached

---

### 4. Demo Account System

#### 4.1 Demo Account Setup

**Pre-configured Demo Admin:**
- Email: `demo@billsync.com` (or configurable)
- Password: `Demo@123` (or auto-generated)
- Pre-populated data:
  - 20-30 sample products
  - 50-100 sample bills
  - 2-3 sample cashier accounts
  - Sample store details
  - Sample analytics data

#### 4.2 Demo Account Access

**Route:** `/demo`
- Auto-login to demo account
- Read-only mode (optional)
- Clear "DEMO MODE" banner
- Reset button to restore original demo data
- Time-limited session (optional, e.g., 30 minutes)

**Protection:**
- Demo account cannot modify subscription
- Demo account cannot access payment settings
- Demo account data resets periodically

---

### 5. Payment Integration

#### 5.1 Payment Gateway Options

**Razorpay (Recommended for India):**
- ✅ INR support
- ✅ Subscription management
- ✅ Webhook support
- ✅ Good documentation
- ✅ Easy integration

**Alternative: Stripe**
- ✅ International support
- ✅ More features
- ⚠️ Higher fees for INR

**Recommendation: Razorpay for primary, Stripe as backup**

#### 5.2 Payment Flow

1. User selects plan → `/pricing`
2. Clicks "Start Free Trial" or "Subscribe"
3. Redirects to `/checkout?plan=professional`
4. Payment form (Razorpay checkout)
5. Payment success → Webhook → Activate subscription
6. Redirect to dashboard with success message

#### 5.3 Subscription Management

**User Dashboard:**
- Current plan display
- Usage statistics
- Upgrade/downgrade options
- Payment history
- Invoice downloads
- Cancel subscription option

---

### 6. Route Protection & Access Control

#### 6.1 Route Structure

```
/                           → Landing page (public)
/landing                    → Alias to /
/about                      → About section (scroll or separate page)
/pricing                    → Pricing section (scroll or separate page)
/downloads                  → Downloads page
/demo                       → Demo account access
/auth/signin                → Login (existing)
/auth/register              → Register (existing, with plan selection)
/checkout                   → Payment checkout
/admin/*                    → Protected, requires subscription
/cashier/*                  → Protected, requires subscription
```

#### 6.2 Protection Middleware

**Middleware Functions:**
```typescript
// middleware.ts
- requireAuth() // Check authentication
- requireSubscription() // Check active subscription
- checkUsageLimit() // Check usage before action
- requirePlanFeature() // Check specific feature access
```

**Implementation:**
- Next.js middleware for route protection
- Server-side checks in API routes
- Client-side checks in components

---

### 7. UI/UX Requirements

#### 7.1 Design System - Dark Theme

**Color Palette:**
- **Primary Background**: `#0a0a0f` or `#0f0f1a` (deep dark blue-black)
- **Secondary Background**: `#1a1a2e` (slightly lighter dark)
- **Card Background**: `#16213e` or `#1e2746` (dark blue-gray cards)
- **Accent Colors**:
  - Primary: `#6366f1` (indigo) or `#8b5cf6` (purple)
  - Secondary: `#06b6d4` (cyan) or `#3b82f6` (blue)
  - Success: `#10b981` (green)
  - Warning: `#f59e0b` (amber/yellow)
  - Error: `#ef4444` (red)
- **Text Colors**:
  - Primary Text: `#ffffff` (white)
  - Secondary Text: `#a1a1aa` (gray-400)
  - Muted Text: `#71717a` (gray-500)
- **Border Colors**: `#27272a` (gray-800) with subtle glow effects
- **Gradient Overlays**: Purple-to-blue gradients (`#8b5cf6` → `#3b82f6`)

**Typography:**
- **Primary Font**: Inter, system-ui, -apple-system (clean, modern sans-serif)
- **Headings**: Bold, large (2.5rem - 4rem for hero)
- **Body**: Regular weight, 16px base size
- **Line Height**: 1.6-1.8 for readability
- **Letter Spacing**: Slightly increased for headings (0.02em)

**Card Design:**
- Rounded corners: `12px` or `16px`
- Subtle border: `1px solid rgba(255, 255, 255, 0.1)`
- Background: Dark with slight transparency
- Shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)`
- Hover: Subtle glow effect with accent color
- Glass morphism effect: `backdrop-blur-sm` with semi-transparent background

#### 7.2 Responsive Design & Mobile Optimization

**Breakpoints:**
- Mobile: `< 640px` (sm)
- Tablet: `640px - 1024px` (md)
- Desktop: `1024px - 1280px` (lg)
- Large Desktop: `> 1280px` (xl)

**Mobile-First Approach:**
- All components must be fully functional on mobile
- Touch-friendly buttons (min 44x44px)
- Swipe gestures for carousels
- Collapsible navigation menu
- Stacked layouts on mobile
- Optimized images for mobile bandwidth
- Proper viewport meta tags
- No horizontal scrolling

**Orientation Support:**
- Portrait: Optimized vertical layouts
- Landscape: Adjusted spacing and layouts
- Responsive images that adapt to orientation

**Performance on Mobile:**
- Lazy load images below the fold
- Optimize animations for mobile GPUs
- Reduce motion for users with motion sensitivity
- Fast tap response (< 100ms)

#### 7.3 Animations & Effects

**Page Transitions:**
- **Instant Navigation**: Use Next.js `<Link>` with `prefetch` for instant page loads
- **No Full Page Reloads**: Client-side navigation only
- **Smooth Transitions**: Fade-in effect (0.3s ease-in-out) between pages
- **Loading States**: Skeleton loaders or subtle spinners

**Scroll Animations (Reveal on Scroll):**
- **Fade In**: Elements fade in as they enter viewport (opacity 0 → 1)
- **Slide Up**: Elements slide up from bottom (translateY 30px → 0)
- **Slide In Left/Right**: Alternating slide-in from sides
- **Scale In**: Subtle scale effect (scale 0.95 → 1)
- **Stagger Effect**: Multiple elements animate with delay (0.1s between each)
- **Threshold**: Trigger at 20% visibility in viewport
- **Use Libraries**: `framer-motion`, `react-intersection-observer`, or `AOS` (Animate On Scroll)

**Continuous Animations (Always Running):**
- **Floating Elements**: Subtle up-down motion (2-3px, 3-4s duration, infinite)
- **Rotating Icons**: Slow rotation (360deg, 20-30s, infinite, linear)
- **Gradient Shifts**: Animated gradient backgrounds (position shift, 5-10s, infinite)
- **Particle Effects**: Subtle moving particles in background
- **Glow Pulses**: Accent colors with pulsing glow effect (opacity 0.5 → 1, 2s, infinite)
- **Background Patterns**: Subtle animated patterns or grids

**Hover Effects:**
- **Card Lift**: `translateY(-4px)` with increased shadow
- **Scale**: Slight scale (1.02-1.05)
- **Glow**: Border or shadow glow with accent color
- **Color Shift**: Background or text color transition
- **Icon Animation**: Icons rotate, scale, or change color

**Interactive Elements:**
- **Button Hover**: Scale + glow effect
- **Button Active**: Slight scale down (0.98)
- **Form Input Focus**: Border glow with accent color
- **Smooth Transitions**: All hover effects use `transition: all 0.3s ease`

**Performance Considerations:**
- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left` (causes reflow)
- Use `will-change` sparingly and only for actively animating elements
- Debounce scroll events
- Use `requestAnimationFrame` for smooth animations
- Reduce motion for users with `prefers-reduced-motion`

#### 7.4 Component-Specific Animations

**Hero Section:**
- Background image with parallax or subtle zoom
- Text fade-in with stagger
- CTA buttons slide up with bounce
- Floating icons around hero content
- Gradient overlay animation

**Feature Cards:**
- Reveal on scroll (fade + slide up)
- Hover: lift + glow
- Icon animations on hover
- Staggered entrance (delay between cards)

**Testimonials Carousel:**
- Smooth slide transitions (0.5s ease)
- Auto-rotate every 5 seconds
- Fade between testimonials
- Pause on hover

**Pricing Cards:**
- Reveal with scale + fade
- "Popular" badge pulse animation
- Hover: lift + border glow
- Feature list animate in on hover

**FAQ Accordion:**
- Smooth height transition (0.3s ease)
- Icon rotation on expand
- Content fade in

**Navigation:**
- Smooth scroll to sections
- Active link highlight with underline animation
- Mobile menu slide in from right
- Sticky navbar with background blur on scroll

#### 7.5 Performance Requirements

**Page Load:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

**Optimization Techniques:**
- **Image Optimization**: Next.js `Image` component with WebP format
- **Code Splitting**: Dynamic imports for heavy components
- **Lazy Loading**: Components and images below the fold
- **Font Optimization**: Self-hosted fonts with `font-display: swap`
- **CSS Optimization**: Purge unused Tailwind classes
- **Bundle Size**: Keep main bundle < 200KB (gzipped)
- **API Calls**: Debounce and cache where appropriate

**SEO Optimization:**
- Proper meta tags (title, description, OG tags)
- Semantic HTML structure
- Schema.org markup for business/product
- Sitemap.xml
- robots.txt
- Fast server-side rendering

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1-2)
1. ✅ Database schema updates (Subscription, Usage, Payment models)
2. ✅ Prisma migration
3. ✅ Seed subscription plans
4. ✅ Update Admin model with subscription relation
5. ✅ Create usage tracking utilities

### Phase 2: Landing Page (Week 2-3)
1. ✅ Create landing page route structure
2. ✅ Build navigation component
3. ✅ Build hero section
4. ✅ Build demo section
5. ✅ Build about section
6. ✅ Build testimonials section
7. ✅ Build brand logos section
8. ✅ Build features section
9. ✅ Build pricing section
10. ✅ Build contact section
11. ✅ Build FAQ section
12. ✅ Build footer

### Phase 3: Subscription System (Week 3-4)
1. ✅ Create subscription API routes
2. ✅ Implement plan assignment on registration
3. ✅ Create subscription management UI
4. ✅ Implement usage tracking middleware
5. ✅ Add usage limits to existing features
6. ✅ Create usage dashboard

### Phase 4: Payment Integration (Week 4-5)
1. ✅ Set up Razorpay account
2. ✅ Integrate Razorpay SDK
3. ✅ Create checkout page
4. ✅ Implement webhook handler
5. ✅ Create payment history UI
6. ✅ Implement invoice generation

### Phase 5: Demo Account (Week 5)
1. ✅ Create demo account seed script
2. ✅ Implement demo login route
3. ✅ Create demo data reset functionality
4. ✅ Add demo mode indicators

### Phase 6: Route Protection (Week 5-6)
1. ✅ Implement Next.js middleware
2. ✅ Add subscription checks to protected routes
3. ✅ Add usage limit checks to API routes
4. ✅ Create upgrade prompts
5. ✅ Handle limit exceeded scenarios

### Phase 7: Testing & Polish (Week 6-7)
1. ✅ Test all user flows
2. ✅ Test payment integration
3. ✅ Test usage tracking
4. ✅ Performance optimization
5. ✅ SEO optimization
6. ✅ Bug fixes
7. ✅ Documentation

---

## 🔧 Technical Implementation Details

### File Structure
```
app/
  landing/
    page.tsx              # Main landing page
    components/
      Hero.tsx
      Demo.tsx
      About.tsx
      Testimonials.tsx
      Features.tsx
      Pricing.tsx
      Contact.tsx
      FAQ.tsx
      Footer.tsx
      Navbar.tsx
  demo/
    page.tsx              # Demo account access
  checkout/
    page.tsx              # Payment checkout
  downloads/
    page.tsx              # Downloads page
  api/
    subscriptions/
      route.ts            # Subscription CRUD
      [id]/
        route.ts
    usage/
      route.ts            # Usage tracking
      check/
        route.ts          # Check limits
    payments/
      route.ts            # Payment processing
      webhook/
        route.ts          # Payment webhooks
    contact/
      route.ts            # Contact form submission

lib/
  usage-tracker.ts        # Usage tracking utilities
  subscriptions.ts        # Subscription utilities
  payments.ts             # Payment utilities
  limits.ts               # Plan limits configuration

components/
  landing/                # Landing page components
  subscription/           # Subscription UI components
  usage/                  # Usage display components
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

## 📊 Success Metrics

1. **Conversion Rate**: Landing page → Signup
2. **Trial Conversion**: Free trial → Paid subscription
3. **Usage Tracking**: Accurate limit enforcement
4. **Payment Success**: Successful payment processing rate
5. **User Engagement**: Time on landing page, scroll depth

---

## 🔒 Security Considerations

1. **Payment Security**: PCI compliance, secure webhook handling
2. **Usage Tracking**: Prevent manipulation of usage counts
3. **Demo Account**: Prevent abuse, rate limiting
4. **Route Protection**: Proper authentication and authorization
5. **Data Privacy**: GDPR compliance, data export

---

## 📝 Notes

- All prices in INR (₹)
- Free plan should be truly free (no credit card required)
- Trial period: 14 days recommended
- Grace period for expired subscriptions: 7 days
- Data retention: 30 days after cancellation

---

## 🎨 Design Resources Needed

1. Hero background image
2. Feature illustrations/icons
3. Logo variations
4. Brand color palette
5. Typography choices
6. Testimonial photos (placeholders initially)
7. Partner/brand logos (placeholders initially)

---

## 🎬 Animation Implementation Details

### Recommended Libraries

**Primary Animation Library:**
- **Framer Motion** (`framer-motion`): Best for React animations, scroll animations, and page transitions
- **React Intersection Observer** (`react-intersection-observer`): For scroll-triggered animations

**Alternative:**
- **AOS (Animate On Scroll)**: Simpler, but less flexible
- **GSAP**: More powerful, but heavier

### Animation Patterns

**Scroll Reveal Pattern (using Framer Motion):**
```typescript
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
}

// Usage
const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true })
<motion.div ref={ref} initial="initial" animate={inView ? "animate" : "initial"} variants={fadeInUp}>
  Content
</motion.div>
```

**Stagger Animation Pattern:**
```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}
```

**Continuous Animation Pattern:**
```typescript
const floating = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
}
```

### Performance Best Practices

1. **Use CSS transforms** instead of changing layout properties
2. **Debounce scroll listeners** (use `useDebounce` or `lodash.debounce`)
3. **Lazy load animations** - only animate elements in viewport
4. **Use `will-change` sparingly** - only for actively animating elements
5. **Respect `prefers-reduced-motion`**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

### Animation Timing

- **Fast interactions**: 0.2s (hover, focus)
- **Medium transitions**: 0.3-0.5s (page transitions, card reveals)
- **Slow animations**: 2-4s (continuous floating, gradients)
- **Easing**: Use `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for continuous

---

## 📱 Mobile-Specific Considerations

### Touch Interactions
- **Swipe gestures**: Use `react-swipeable` or `swiper` for carousels
- **Touch feedback**: Add `active:` states for buttons
- **Pull to refresh**: Consider for mobile lists (optional)

### Performance on Mobile
- **Reduce animation complexity** on mobile devices
- **Use `transform3d`** for GPU acceleration
- **Limit continuous animations** to 1-2 per page
- **Test on real devices**, not just emulators

### Orientation Handling
```typescript
// Detect orientation changes
useEffect(() => {
  const handleOrientationChange = () => {
    // Adjust layout
  }
  window.addEventListener('orientationchange', handleOrientationChange)
  return () => window.removeEventListener('orientationchange', handleOrientationChange)
}, [])
```

---

## ✅ Next Steps

1. Review and approve this document
2. Set up Razorpay account
3. Determine pricing for Professional and Premium plans
4. Gather design assets
5. Begin Phase 1 implementation

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Status:** Ready for Implementation

