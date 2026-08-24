import type { Member, Plan, AttendanceRecord, PaymentTicket, MemberStatus } from '../types';

const STORAGE_KEYS = {
  MEMBERS: 'controlgym_members',
  PLANS: 'controlgym_plans',
  ATTENDANCE: 'controlgym_attendance',
  TICKETS: 'controlgym_tickets',
  LAST_BACKUP: 'controlgym_last_backup',
  GYM_SETTINGS: 'controlgym_settings',
};

export interface GymSettings {
  name: string;
  address: string;
  phone: string;
  cuit: string;
  bankAlias: string;
  ticketFooter: string;
}

const DEFAULT_GYM_SETTINGS: GymSettings = {
  name: 'ControlGYM',
  address: 'Av. Principal 1234',
  phone: '1122334455',
  cuit: '30-12345678-9',
  bankAlias: 'controlgym.mp',
  ticketFooter: '¡Gracias por entrenar con nosotros! Conserve este comprobante.',
};

// Seed initial plans
const INITIAL_PLANS: Plan[] = [
  { id: '1', name: 'Musculación Mensual', price: 25000, durationDays: 30, description: 'Acceso ilimitado a sala de máquinas' },
  { id: '2', name: 'Pase Libre Full', price: 32000, durationDays: 30, description: 'Máquinas + Clases grupales + Funcional' },
  { id: '3', name: 'Plan Trimestral', price: 68000, durationDays: 90, description: 'Descuento especial pago anticipado' },
  { id: '4', name: 'Pase 10 Clases', price: 18000, durationDays: 60, description: '10 asistencias con validez 60 días' },
];

export function computeMemberStatus(expirationDate: string): MemberStatus {
  if (!expirationDate) return 'INACTIVE';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const exp = new Date(expirationDate);
  exp.setHours(23, 59, 59, 999);
  
  const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 3) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    dni: '38450123',
    firstName: 'Carlos',
    lastName: 'González',
    phone: '1154238910',
    email: 'carlos.g@gmail.com',
    emergencyContact: 'María (Esposa) - 1144332211',
    medicalNotes: 'Apto médico al día. Sin lesiones.',
    createdAt: new Date().toISOString(),
    planId: '1',
    planName: 'Musculación Mensual',
    expirationDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    status: 'ACTIVE',
  },
  {
    id: 'm2',
    dni: '40112987',
    firstName: 'Lucía',
    lastName: 'Fernández',
    phone: '1167890123',
    email: 'lucia.f@gmail.com',
    emergencyContact: 'Juan (Padre) - 1122334455',
    medicalNotes: 'Hipertensión leve bajo control.',
    createdAt: new Date().toISOString(),
    planId: '2',
    planName: 'Pase Libre Full',
    expirationDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    status: 'EXPIRING_SOON',
  },
  {
    id: 'm3',
    dni: '35900111',
    firstName: 'Roberto',
    lastName: 'Martínez',
    phone: '1198765432',
    email: 'roberto.m@hotmail.com',
    emergencyContact: 'Ana (Hermana) - 1166778899',
    createdAt: new Date().toISOString(),
    planId: '1',
    planName: 'Musculación Mensual',
    expirationDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    status: 'EXPIRED',
  },
];

class DatabaseService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.GYM_SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.GYM_SETTINGS, JSON.stringify(DEFAULT_GYM_SETTINGS));
    }
  }

  // --- GYM SETTINGS ---
  getSettings(): GymSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.GYM_SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_GYM_SETTINGS;
  }

  saveSettings(settings: GymSettings): GymSettings {
    localStorage.setItem(STORAGE_KEYS.GYM_SETTINGS, JSON.stringify(settings));
    return settings;
  }

  // --- MEMBERS ---
  getMembers(): Member[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    const members: Member[] = raw ? JSON.parse(raw) : [];
    return members.map(m => ({
      ...m,
      status: computeMemberStatus(m.expirationDate)
    }));
  }

  getMemberByDni(dni: string): Member | undefined {
    const members = this.getMembers();
    return members.find(m => m.dni.trim() === dni.trim());
  }

  saveMember(memberData: Partial<Member> & { dni: string; firstName: string; lastName: string }): Member {
    const members = this.getMembers();
    const existingIndex = members.findIndex(m => m.id === memberData.id || m.dni === memberData.dni);

    let updatedMember: Member;

    if (existingIndex >= 0) {
      updatedMember = {
        ...members[existingIndex],
        ...memberData,
        status: computeMemberStatus(memberData.expirationDate || members[existingIndex].expirationDate),
      };
      members[existingIndex] = updatedMember;
    } else {
      updatedMember = {
        id: memberData.id || 'm_' + Date.now(),
        dni: memberData.dni,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        phone: memberData.phone || '',
        email: memberData.email || '',
        emergencyContact: memberData.emergencyContact || '',
        medicalNotes: memberData.medicalNotes || '',
        createdAt: new Date().toISOString(),
        planId: memberData.planId || '1',
        planName: memberData.planName || 'Musculación Mensual',
        expirationDate: memberData.expirationDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: computeMemberStatus(memberData.expirationDate || new Date().toISOString()),
        notes: memberData.notes || '',
      };
      members.unshift(updatedMember);
    }

    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    return updatedMember;
  }

  deleteMember(id: string) {
    const members = this.getMembers().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }

  // --- PLANS ---
  getPlans(): Plan[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PLANS);
    return raw ? JSON.parse(raw) : INITIAL_PLANS;
  }

  savePlan(planData: Partial<Plan> & { name: string; price: number }): Plan {
    const plans = this.getPlans();
    const existingIndex = plans.findIndex(p => p.id === planData.id);

    let updatedPlan: Plan;

    if (existingIndex >= 0) {
      updatedPlan = {
        ...plans[existingIndex],
        ...planData,
      };
      plans[existingIndex] = updatedPlan;
    } else {
      updatedPlan = {
        id: planData.id || 'plan_' + Date.now(),
        name: planData.name,
        price: Number(planData.price),
        durationDays: planData.durationDays || 30,
        description: planData.description || '',
      };
      plans.push(updatedPlan);
    }

    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    return updatedPlan;
  }

  deletePlan(id: string) {
    const plans = this.getPlans().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  }

  // --- ATTENDANCE ---
  getAttendance(): AttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return raw ? JSON.parse(raw) : [];
  }

  recordAttendance(member: Member): AttendanceRecord {
    const records = this.getAttendance();
    const newRecord: AttendanceRecord = {
      id: 'att_' + Date.now(),
      memberId: member.id,
      memberDni: member.dni,
      memberName: `${member.firstName} ${member.lastName}`,
      timestamp: new Date().toISOString(),
      statusAtCheckin: computeMemberStatus(member.expirationDate),
    };
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    return newRecord;
  }

  // --- TICKETS / PAYMENTS ---
  getTickets(): PaymentTicket[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return raw ? JSON.parse(raw) : [];
  }

  createPaymentTicket(ticketData: Omit<PaymentTicket, 'id' | 'ticketNumber' | 'paymentDate'>): PaymentTicket {
    const tickets = this.getTickets();
    const ticketCount = tickets.length + 1;
    const ticketNumber = `T-00${ticketCount.toString().padStart(4, '0')}`;

    const newTicket: PaymentTicket = {
      ...ticketData,
      id: 't_' + Date.now(),
      ticketNumber,
      paymentDate: new Date().toISOString(),
    };

    tickets.unshift(newTicket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));

    // Automatically update member expiration date
    const member = this.getMembers().find(m => m.id === ticketData.memberId);
    if (member) {
      this.saveMember({
        ...member,
        expirationDate: ticketData.newExpiration,
        planName: ticketData.planName,
        status: computeMemberStatus(ticketData.newExpiration),
      });
    }

    return newTicket;
  }

  // --- BACKUP & RESTORE ---
  exportBackupJSON(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      members: this.getMembers(),
      plans: this.getPlans(),
      attendance: this.getAttendance(),
      tickets: this.getTickets(),
    };
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());
    return JSON.stringify(backup, null, 2);
  }

  importBackupJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) {
        localStorage.setItem(STORAGE_KEYS.GYM_SETTINGS, JSON.stringify(data.settings));
      }
      if (data.members && Array.isArray(data.members)) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(data.members));
      }
      if (data.plans && Array.isArray(data.plans)) {
        localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(data.plans));
      }
      if (data.attendance && Array.isArray(data.attendance)) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data.attendance));
      }
      if (data.tickets && Array.isArray(data.tickets)) {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(data.tickets));
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  }
}

export const db = new DatabaseService();
