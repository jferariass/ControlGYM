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
  accountBalance?: number;
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
  barCode?: string;
  description?: string;
  category: ProductCategory;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
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

export type AuditActionType =
  | 'LOGIN'
  | 'ATTENDANCE_CHECKIN'
  | 'MEMBERSHIP_PAYMENT'
  | 'POS_SALE'
  | 'STOCK_UPDATE'
  | 'MEMBER_CREATE_EDIT'
  | 'MEMBER_DELETE'
  | 'USER_CREATE_EDIT'
  | 'PLAN_UPDATE'
  | 'TICKET_DELETE';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  userId: string;
  userName: string;
  userRole: UserRole;
  actionType: AuditActionType;
  details: string;
}
