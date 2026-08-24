export type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON' | 'INACTIVE';

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string;
}

export interface Member {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  createdAt: string;
  planId: string;
  planName: string;
  expirationDate: string; // Formato interno YYYY-MM-DD
  status: MemberStatus;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberDni: string;
  memberName: string;
  timestamp: string; // ISO string
  statusAtCheckin: MemberStatus;
}

export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'POSNET' | 'MERCADO_PAGO';

export interface PaymentTicket {
  id: string;
  ticketNumber: string;
  memberId: string;
  memberDni: string;
  memberName: string;
  planName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // ISO string
  previousExpiration: string;
  newExpiration: string;
  issuedBy: string; // Recepcionista
  notes?: string;
}

export interface CashShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  initialAmount: number;
  totalCash: number;
  totalTransfer: number;
  totalCard: number;
  totalMercadoPago: number;
  status: 'OPEN' | 'CLOSED';
}

export interface SystemStats {
  activeMembers: number;
  expiringSoonMembers: number;
  expiredMembers: number;
  todayAttendances: number;
  todayRevenue: number;
  monthRevenue: number;
}
