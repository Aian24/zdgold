export type GoldKarat = '24K' | '22K' | '18K' | '14K' | '10K';

export type ProductCategory = 
  | 'RINGS'
  | 'NECKLACES'
  | 'BRACELETS'
  | 'EARRINGS'
  | 'PENDANTS'
  | 'BANGLES';

export type OrderType = 'CASH' | 'LAYAWAY';

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type LayawayStatus = 
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DEFAULTED'
  | 'CANCELLED';

export type InstallmentStatus = 
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'PARTIAL';

export type PaymentMethod = 
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'GCASH'
  | 'CRYPTO';

export type PaymentType = 
  | 'FULL_ORDER'
  | 'DOWN_PAYMENT'
  | 'INSTALLMENT'
  | 'SETTLEMENT';

export interface GoldRateData {
  id: string;
  karat: GoldKarat;
  purityRatio: number;
  pricePerGram: number;
  change24h: number;
  lastUpdated: string | Date;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  karat: GoldKarat;
  purityPercentage: number;
  weightGrams: number;
  craftFee: number;
  basePrice: number;
  isAutoPriced: boolean;
  stockQuantity: number;
  isFeatured: boolean;
  images: string[];
  hallmarkCertNumber?: string;
  dimensions?: string;
  createdAt?: string | Date;
  calculatedPrice?: number;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  lockedPricePerGram: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LayawayPlanOption {
  termMonths: number;
  downPaymentPercent: number; // 20, 30, 50
  downPaymentAmount: number;
  remainingBalance: number;
  monthlyInstallment: number;
  totalPayable: number;
  dueDate: Date;
  monthlySchedule: {
    installmentNumber: number;
    dueDate: Date;
    amount: number;
  }[];
}

export interface LayawayContractWithDetails {
  id: string;
  contractNumber: string;
  orderId: string;
  userId: string;
  totalAmount: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  remainingBalance: number;
  termMonths: number;
  monthlyInstallment: number;
  lockedGoldSpotRate: number;
  status: LayawayStatus;
  startDate: string | Date;
  dueDate: string | Date;
  nextDueDate?: string | Date;
  notes?: string;
  installments: {
    id: string;
    installmentNumber: number;
    dueDate: string | Date;
    amountDue: number;
    amountPaid: number;
    status: InstallmentStatus;
    paidAt?: string | Date;
    receiptNumber?: string;
  }[];
  payments: {
    id: string;
    paymentNumber: string;
    invoiceNumber: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentType: PaymentType;
    status: string;
    referenceCode: string;
    createdAt: string | Date;
  }[];
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    totalGoldWeightGrams: number;
    orderItems: {
      id: string;
      product: ProductItem;
      quantity: number;
      unitPrice: number;
      weightGrams: number;
      karat: string;
    }[];
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  avatar?: string;
}
