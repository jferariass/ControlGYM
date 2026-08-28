export type MemberStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO' | 'POSNET';

export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  active: boolean;
}

export interface Member {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: MemberStatus;
  planId: string;
  planName: string;
  expirationDate: string; // ISO date string YYYY-MM-DD
  registrationDate: string;
  emergencyContact?: string;
  medicalNotes?: string;
  accountBalance?: number; // Deuda/Saldo a favor de cantina
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberDni: string;
  memberName: string;
  timestamp: string; // ISO String
}

export interface PaymentTicket {
  id: string;
  ticketNumber: string;
  memberId: string;
  memberDni: string;
  memberName: string;
  planName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // ISO String
  previousExpiration: string;
  newExpiration: string;
  issuedBy: string;
  issuedById?: string;
}

export interface CashShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialCash: number;
  finalCash?: number;
  expectedCash?: number;
  notes?: string;
}

export type ProductCategory = 'BEBIDAS' | 'SUPLEMENTOS' | 'INDUMENTARIA' | 'ACCESORIOS' | 'OTROS';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
}

export interface ProductSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ProductSale {
  id: string;
  saleNumber: string;
  items: ProductSaleItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  sellerId: string;
  sellerName: string;
  memberId?: string;
  memberName?: string;
  isAccountCharge?: boolean;
  timestamp: string; // ISO String
}
