export const PLAN_LIMITS = {
  STANDARD: {
    products: 20,
    billsPerMonth: 10,
    adminAccounts: 1,
    cashierAccounts: 3,
    storageMB: 100,
    features: ['basic_reports', 'email_support']
  },
  PROFESSIONAL: {
    products: -1, // unlimited
    billsPerMonth: -1,
    adminAccounts: 5,
    cashierAccounts: 20,
    storageMB: 1000,
    features: ['advanced_reports', 'analytics', 'priority_support', 'custom_branding']
  },
  PREMIUM: {
    products: -1,
    billsPerMonth: -1,
    adminAccounts: -1,
    cashierAccounts: -1,
    storageMB: 10000,
    features: ['all_professional', 'api_access', 'white_label', 'phone_support', 'custom_integrations']
  }
};

export type PlanType = keyof typeof PLAN_LIMITS;
export type MetricType = 'PRODUCTS' | 'BILLS' | 'ADMIN_ACCOUNTS' | 'CASHIER_ACCOUNTS' | 'STORAGE';

export const getLimit = (planName: string, metric: MetricType): number => {
  const plan = PLAN_LIMITS[planName as PlanType] || PLAN_LIMITS.STANDARD;
  switch (metric) {
    case 'PRODUCTS': return plan.products;
    case 'BILLS': return plan.billsPerMonth;
    case 'ADMIN_ACCOUNTS': return plan.adminAccounts;
    case 'CASHIER_ACCOUNTS': return plan.cashierAccounts;
    case 'STORAGE': return plan.storageMB;
    default: return 0;
  }
};
