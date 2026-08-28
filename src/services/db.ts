import type { Member, Plan, AttendanceRecord, PaymentTicket, MemberStatus, User, Product, ProductSale } from '../types';

export interface GymSettings {
  name: string;
  address: string;
  phone: string;
  cuit: string;
  bankAlias: string;
  ticketFooter: string;
}

const STORAGE_KEYS = {
  USERS: 'controlgym_users_v2',
  MEMBERS: 'controlgym_members_v2',
  PLANS: 'controlgym_plans_v2',
  ATTENDANCE: 'controlgym_attendance_v2',
  TICKETS: 'controlgym_tickets_v2',
  SETTINGS: 'controlgym_settings_v2',
  PRODUCTS: 'controlgym_products_v2',
  PRODUCT_SALES: 'controlgym_product_sales_v2',
};

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Juan (Dueño 1)', role: 'ADMIN', pin: '1111', active: true },
  { id: '2', name: 'Pedro (Dueño 2)', role: 'ADMIN', pin: '2222', active: true },
  { id: '3', name: 'Lucas (Dueño 3)', role: 'ADMIN', pin: '3333', active: true },
  { id: '4', name: 'Sofía (Recepción)', role: 'STAFF', pin: '1234', active: true },
  { id: '5', name: 'Mateo (Recepción)', role: 'STAFF', pin: '5678', active: true },
];

const DEFAULT_PLANS: Plan[] = [
  { id: '1', name: 'Musculación Mensual', price: 25000, durationDays: 30, description: 'Acceso ilimitado a sala de máquinas' },
  { id: '2', name: 'Pase Libre Musculación + Clases', price: 32000, durationDays: 30, description: 'Musculación y clases grupales de Spin, Cross y Yoga' },
  { id: '3', name: 'Pack 10 Clases Pass', price: 18000, durationDays: 60, description: 'Válido para 10 ingresos en 2 meses' },
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Agua Mineral 500ml', category: 'BEBIDAS', price: 1500, costPrice: 700, stock: 30, minStock: 5 },
  { id: 'p2', name: 'Gatorade / Energizante 500ml', category: 'BEBIDAS', price: 2500, costPrice: 1200, stock: 20, minStock: 5 },
  { id: 'p3', name: 'Barrita Proteica', category: 'SUPLEMENTOS', price: 2000, costPrice: 900, stock: 15, minStock: 4 },
  { id: 'p4', name: 'Whey Protein 1kg', category: 'SUPLEMENTOS', price: 28000, costPrice: 16000, stock: 8, minStock: 2 },
  { id: 'p5', name: 'Remera Oficial ControlGYM', category: 'INDUMENTARIA', price: 18000, costPrice: 9000, stock: 10, minStock: 3 },
  { id: 'p6', name: 'Toalla Entrenamiento', category: 'ACCESORIOS', price: 8000, costPrice: 4000, stock: 12, minStock: 3 },
];

const DEFAULT_SETTINGS: GymSettings = {
  name: 'ControlGYM Fitness',
  address: 'Av. Principal 1234, Centro',
  phone: '1122334455',
  cuit: '30-12345678-9',
  bankAlias: 'gimnasio.control.mp',
  ticketFooter: '¡Gracias por entrenar con nosotros! Conserve este comprobante.',
};

const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'm1',
    dni: '38450123',
    firstName: 'Carlos',
    lastName: 'González',
    phone: '1154238910',
    email: 'carlos@gmail.com',
    status: 'ACTIVE',
    planId: '1',
    planName: 'Musculación Mensual',
    expirationDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    registrationDate: '2025-01-10',
    emergencyContact: 'María (Esposa) - 1144332211',
    accountBalance: 0,
  },
  {
    id: 'm2',
    dni: '40123987',
    firstName: 'Lucía',
    lastName: 'Martínez',
    phone: '1133221100',
    email: 'lucia@hotmail.com',
    status: 'EXPIRING_SOON',
    planId: '2',
    planName: 'Pase Libre Musculación + Clases',
    expirationDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    registrationDate: '2025-01-15',
    accountBalance: 0,
  },
  {
    id: 'm3',
    dni: '35999888',
    firstName: 'Roberto',
    lastName: 'Fernández',
    phone: '1166778899',
    status: 'EXPIRED',
    planId: '1',
    planName: 'Musculación Mensual',
    expirationDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    registrationDate: '2024-11-01',
    accountBalance: 1500, // Deuda de 1 agua mineral
  },
];

class DatabaseService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  // --- USERS ---
  getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  authenticatePin(pin: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.pin === pin && u.active) || null;
  }

  saveUser(user: Partial<User> & { name: string; role: User['role']; pin: string }): User {
    const users = this.getUsers();
    if (user.id) {
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...user };
        this.set(STORAGE_KEYS.USERS, users);
        return users[index];
      }
    }
    const newUser: User = {
      id: Date.now().toString(),
      name: user.name,
      role: user.role,
      pin: user.pin,
      active: true,
    };
    users.push(newUser);
    this.set(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    this.set(STORAGE_KEYS.USERS, users);
  }

  // --- SETTINGS ---
  getSettings(): GymSettings {
    return this.get<GymSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  saveSettings(settings: GymSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  // --- MEMBERS ---
  getMembers(): Member[] {
    const members = this.get<Member[]>(STORAGE_KEYS.MEMBERS, DEFAULT_MEMBERS);
    return members.map(m => ({
      ...m,
      status: this.calculateMemberStatus(m.expirationDate),
    }));
  }

  getMemberByDni(dni: string): Member | null {
    const members = this.getMembers();
    return members.find(m => m.dni.trim() === dni.trim()) || null;
  }

  saveMember(member: Partial<Member> & { dni: string; firstName: string; lastName: string }): Member {
    const members = this.getMembers();

    if (member.id) {
      const index = members.findIndex(m => m.id === member.id);
      if (index !== -1) {
        const updated = {
          ...members[index],
          ...member,
          status: this.calculateMemberStatus(member.expirationDate || members[index].expirationDate),
        };
        members[index] = updated;
        this.set(STORAGE_KEYS.MEMBERS, members);
        return updated;
      }
    }

    const newMember: Member = {
      id: Date.now().toString(),
      dni: member.dni,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone || '',
      email: member.email || '',
      status: this.calculateMemberStatus(member.expirationDate || new Date().toISOString().split('T')[0]),
      planId: member.planId || '1',
      planName: member.planName || 'Musculación Mensual',
      expirationDate: member.expirationDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      registrationDate: new Date().toISOString().split('T')[0],
      emergencyContact: member.emergencyContact || '',
      medicalNotes: member.medicalNotes || '',
      accountBalance: 0,
    };

    members.push(newMember);
    this.set(STORAGE_KEYS.MEMBERS, members);
    return newMember;
  }

  deleteMember(id: string): void {
    const members = this.getMembers().filter(m => m.id !== id);
    this.set(STORAGE_KEYS.MEMBERS, members);
  }

  updateMemberBalance(memberId: string, deltaAmount: number): void {
    const members = this.getMembers();
    const member = members.find(m => m.id === memberId);
    if (member) {
      member.accountBalance = (member.accountBalance || 0) + deltaAmount;
      this.set(STORAGE_KEYS.MEMBERS, members);
    }
  }

  private calculateMemberStatus(expirationDate: string): MemberStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exp = new Date(expirationDate);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 3) return 'EXPIRING_SOON';
    return 'ACTIVE';
  }

  // --- PLANS ---
  getPlans(): Plan[] {
    return this.get<Plan[]>(STORAGE_KEYS.PLANS, DEFAULT_PLANS);
  }

  savePlan(plan: Partial<Plan> & { name: string; price: number }): Plan {
    const plans = this.getPlans();
    if (plan.id) {
      const index = plans.findIndex(p => p.id === plan.id);
      if (index !== -1) {
        plans[index] = { ...plans[index], ...plan };
        this.set(STORAGE_KEYS.PLANS, plans);
        return plans[index];
      }
    }
    const newPlan: Plan = {
      id: Date.now().toString(),
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays || 30,
      description: plan.description || '',
    };
    plans.push(newPlan);
    this.set(STORAGE_KEYS.PLANS, plans);
    return newPlan;
  }

  deletePlan(id: string): void {
    const plans = this.getPlans().filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PLANS, plans);
  }

  // --- ATTENDANCE ---
  getAttendance(): AttendanceRecord[] {
    return this.get<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  }

  recordAttendance(member: Member): AttendanceRecord {
    const records = this.getAttendance();
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      memberId: member.id,
      memberDni: member.dni,
      memberName: `${member.firstName} ${member.lastName}`,
      timestamp: new Date().toISOString(),
    };
    records.unshift(newRecord);
    this.set(STORAGE_KEYS.ATTENDANCE, records);
    return newRecord;
  }

  // --- PAYMENT TICKETS ---
  getTickets(): PaymentTicket[] {
    return this.get<PaymentTicket[]>(STORAGE_KEYS.TICKETS, []);
  }

  createPaymentTicket(ticketData: Omit<PaymentTicket, 'id' | 'ticketNumber' | 'paymentDate'>): PaymentTicket {
    const tickets = this.getTickets();

    const countToday = tickets.filter(t => t.paymentDate.startsWith(new Date().toISOString().split('T')[0])).length;
    const ticketNumber = `TKT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${(countToday + 1).toString().padStart(3, '0')}`;

    const newTicket: PaymentTicket = {
      ...ticketData,
      id: Date.now().toString(),
      ticketNumber,
      paymentDate: new Date().toISOString(),
    };

    tickets.unshift(newTicket);
    this.set(STORAGE_KEYS.TICKETS, tickets);

    // Actualizar fecha de vencimiento del socio automáticamente
    const members = this.getMembers();
    const member = members.find(m => m.id === ticketData.memberId);
    if (member) {
      member.expirationDate = ticketData.newExpiration;
      member.status = this.calculateMemberStatus(ticketData.newExpiration);
      this.set(STORAGE_KEYS.MEMBERS, members);
    }

    return newTicket;
  }

  deleteTicket(id: string): void {
    const tickets = this.getTickets().filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TICKETS, tickets);
  }

  // --- PRODUCTS & POS ---
  getProducts(): Product[] {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  }

  saveProduct(product: Partial<Product> & { name: string; price: number; stock: number }): Product {
    const products = this.getProducts();
    if (product.id) {
      const index = products.findIndex(p => p.id === product.id);
      if (index !== -1) {
        products[index] = { ...products[index], ...product };
        this.set(STORAGE_KEYS.PRODUCTS, products);
        return products[index];
      }
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: product.name,
      category: product.category || 'BEBIDAS',
      price: product.price,
      costPrice: product.costPrice || 0,
      stock: product.stock,
      minStock: product.minStock || 3,
    };
    products.push(newProduct);
    this.set(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PRODUCTS, products);
  }

  updateProductStock(productId: string, addQuantity: number): void {
    const products = this.getProducts();
    const prod = products.find(p => p.id === productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock + addQuantity);
      this.set(STORAGE_KEYS.PRODUCTS, products);
    }
  }

  getProductSales(): ProductSale[] {
    return this.get<ProductSale[]>(STORAGE_KEYS.PRODUCT_SALES, []);
  }

  createProductSale(saleData: Omit<ProductSale, 'id' | 'saleNumber' | 'timestamp'>): ProductSale {
    const sales = this.getProductSales();
    const countToday = sales.filter(s => s.timestamp.startsWith(new Date().toISOString().split('T')[0])).length;
    const saleNumber = `POS-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${(countToday + 1).toString().padStart(3, '0')}`;

    const newSale: ProductSale = {
      ...saleData,
      id: Date.now().toString(),
      saleNumber,
      timestamp: new Date().toISOString(),
    };

    sales.unshift(newSale);
    this.set(STORAGE_KEYS.PRODUCT_SALES, sales);

    // Descontar Stock si no es devolución
    saleData.items.forEach(item => {
      this.updateProductStock(item.productId, -item.quantity);
    });

    // Si es cuenta corriente/fiado a un socio, sumar al saldo del socio
    if (saleData.isAccountCharge && saleData.memberId) {
      this.updateMemberBalance(saleData.memberId, saleData.totalAmount);
    }

    return newSale;
  }

  deleteProductSale(id: string): void {
    const sales = this.getProductSales().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.PRODUCT_SALES, sales);
  }

  // --- BACKUP & RESTORE ---
  exportBackupJSON(): string {
    const backupData = {
      users: this.getUsers(),
      members: this.getMembers(),
      plans: this.getPlans(),
      attendance: this.getAttendance(),
      tickets: this.getTickets(),
      settings: this.getSettings(),
      products: this.getProducts(),
      productSales: this.getProductSales(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  importBackupJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) this.set(STORAGE_KEYS.USERS, data.users);
      if (data.members) this.set(STORAGE_KEYS.MEMBERS, data.members);
      if (data.plans) this.set(STORAGE_KEYS.PLANS, data.plans);
      if (data.attendance) this.set(STORAGE_KEYS.ATTENDANCE, data.attendance);
      if (data.tickets) this.set(STORAGE_KEYS.TICKETS, data.tickets);
      if (data.settings) this.set(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.products) this.set(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.productSales) this.set(STORAGE_KEYS.PRODUCT_SALES, data.productSales);
      return true;
    } catch (e) {
      console.error('Error importing backup', e);
      return false;
    }
  }
}

export const db = new DatabaseService();
