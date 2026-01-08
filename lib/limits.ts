export const PLAN_LIMITS = {
  FREE_TRIAL: {
    products: 10,
    billsPerMonth: 15,
    adminAccounts: 1,
    cashierAccounts: 3,
    storageMB: 100,
    features: ['basic_reports', 'email_support']
  },
  STANDARD: {
    products: -1, // unlimited
    billsPerMonth: -1,
    adminAccounts: 5,
    cashierAccounts: 20,
    storageMB: 1000,
    features: ['advanced_reports', 'analytics', 'priority_support', 'custom_branding']
  },
  PROFESSIONAL: {
    products: -1,
    billsPerMonth: -1,
    adminAccounts: -1,
    cashierAccounts: -1,
    storageMB: 10000,
    features: ['all_standard', 'api_access', 'white_label', 'phone_support', 'custom_integrations']
  }
};

export type PlanType = keyof typeof PLAN_LIMITS;
export type MetricType = 'PRODUCTS' | 'BILLS' | 'ADMIN_ACCOUNTS' | 'CASHIER_ACCOUNTS' | 'STORAGE';

export const getLimit = (planName: string, metric: MetricType): number => {
  // Handle legacy plan names for backward compatibility
  const normalizedPlanName = planName === 'STANDARD' && !PLAN_LIMITS[planName as PlanType] ? 'FREE_TRIAL' : planName
  const plan = PLAN_LIMITS[normalizedPlanName as PlanType] || PLAN_LIMITS.FREE_TRIAL;
  switch (metric) {
    case 'PRODUCTS': return plan.products;
    case 'BILLS': return plan.billsPerMonth;
    case 'ADMIN_ACCOUNTS': return plan.adminAccounts;
    case 'CASHIER_ACCOUNTS': return plan.cashierAccounts;
    case 'STORAGE': return plan.storageMB;
    default: return 0;
  }
};
