import type { Member, Plan, AttendanceRecord, PaymentTicket, MemberStatus, User, Product, ProductSale, AuditLog, AuditActionType } from '../types';

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
  AUDIT_LOGS: 'controlgym_audit_logs_v2',
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
  { id: 'p1', name: 'Agua Mineral 500ml', barCode: '7790001112223', description: 'Agua mineral sin gas 500ml', category: 'BEBIDAS', price: 1500, costPrice: 700, stock: 30, minStock: 5 },
  { id: 'p2', name: 'Gatorade 500ml', barCode: '7790003334445', description: 'Bebida isotónica sabor Frutas Tropicales', category: 'BEBIDAS', price: 2500, costPrice: 1200, stock: 20, minStock: 5 },
  { id: 'p3', name: 'Barrita Proteica', barCode: '7790005556667', description: 'Barrita de cereal con 20g de proteína', category: 'SUPLEMENTOS', price: 2000, costPrice: 900, stock: 15, minStock: 4 },
  { id: 'p4', name: 'Whey Protein 1kg', barCode: '7790007778889', description: 'Proteína aislada sabor Vainilla', category: 'SUPLEMENTOS', price: 28000, costPrice: 16000, stock: 8, minStock: 2 },
  { id: 'p5', name: 'Remera Oficial ControlGYM', barCode: '7790009990001', description: 'Remera deportiva dry-fit talle M/L', category: 'INDUMENTARIA', price: 18000, costPrice: 9000, stock: 10, minStock: 3 },
  { id: 'p6', name: 'Toalla Entrenamiento', barCode: '7790001231234', description: 'Toalla microfibra secado rápido', category: 'ACCESORIOS', price: 8000, costPrice: 4000, stock: 12, minStock: 3 },
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
    accountBalance: 1500,
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

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  logAuditAction(user: User, actionType: AuditActionType, details: string): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      actionType,
      details,
    };
    logs.unshift(newLog);
    // Keep last 500 logs to preserve space
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500));
    return newLog;
  }

  // --- USERS ---
  getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  authenticatePin(pin: string): User | null {
    const users = this.getUsers();
    const found = users.find(u => u.pin === pin && u.active) || null;
    if (found) {
      this.logAuditAction(found, 'LOGIN', `Inicio de turno en el sistema`);
    }
    return found;
  }

  saveUser(user: Partial<User> & { name: string; role: User['role']; pin: string }, actorUser?: User): User {
    const users = this.getUsers();
    if (user.id) {
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...user };
        this.set(STORAGE_KEYS.USERS, users);
        if (actorUser) {
          this.logAuditAction(actorUser, 'USER_CREATE_EDIT', `Editó los datos/PIN del usuario "${user.name}"`);
        }
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
    if (actorUser) {
      this.logAuditAction(actorUser, 'USER_CREATE_EDIT', `Creó el usuario empleado "${user.name}" (PIN: ${user.pin})`);
    }
    return newUser;
  }

  deleteUser(id: string, actorUser?: User): void {
    const target = this.getUsers().find(u => u.id === id);
    const users = this.getUsers().filter(u => u.id !== id);
    this.set(STORAGE_KEYS.USERS, users);
    if (actorUser && target) {
      this.logAuditAction(actorUser, 'USER_CREATE_EDIT', `Eliminó el perfil del empleado "${target.name}"`);
    }
  }

  // --- SETTINGS ---
  getSettings(): GymSettings {
    return this.get<GymSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  saveSettings(settings: GymSettings, actorUser?: User): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
    if (actorUser) {
      this.logAuditAction(actorUser, 'PLAN_UPDATE', `Actualizó los datos comerciales del gimnasio (${settings.name})`);
    }
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

  saveMember(member: Partial<Member> & { dni: string; firstName: string; lastName: string }, actorUser?: User): Member {
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
        if (actorUser) {
          this.logAuditAction(actorUser, 'MEMBER_CREATE_EDIT', `Actualizó el expediente del socio ${member.firstName} ${member.lastName} (DNI: ${member.dni})`);
        }
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

    if (actorUser) {
      this.logAuditAction(actorUser, 'MEMBER_CREATE_EDIT', `Registró al nuevo socio ${member.firstName} ${member.lastName} (DNI: ${member.dni})`);
    }

    return newMember;
  }

  deleteMember(id: string, actorUser?: User): void {
    const target = this.getMembers().find(m => m.id === id);
    const members = this.getMembers().filter(m => m.id !== id);
    this.set(STORAGE_KEYS.MEMBERS, members);
    if (actorUser && target) {
      this.logAuditAction(actorUser, 'MEMBER_DELETE', `Eliminó la ficha del socio ${target.firstName} ${target.lastName} (DNI: ${target.dni})`);
    }
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

  savePlan(plan: Partial<Plan> & { name: string; price: number }, actorUser?: User): Plan {
    const plans = this.getPlans();
    if (plan.id) {
      const index = plans.findIndex(p => p.id === plan.id);
      if (index !== -1) {
        plans[index] = { ...plans[index], ...plan };
        this.set(STORAGE_KEYS.PLANS, plans);
        if (actorUser) {
          this.logAuditAction(actorUser, 'PLAN_UPDATE', `Modificó el plan "${plan.name}" (Precio: $${plan.price})`);
        }
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
    if (actorUser) {
      this.logAuditAction(actorUser, 'PLAN_UPDATE', `Creó el plan de cuota "${plan.name}" (Precio: $${plan.price})`);
    }
    return newPlan;
  }

  deletePlan(id: string, actorUser?: User): void {
    const target = this.getPlans().find(p => p.id === id);
    const plans = this.getPlans().filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PLANS, plans);
    if (actorUser && target) {
      this.logAuditAction(actorUser, 'PLAN_UPDATE', `Eliminó el plan "${target.name}"`);
    }
  }

  // --- ATTENDANCE ---
  getAttendance(): AttendanceRecord[] {
    return this.get<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  }

  recordAttendance(member: Member, actorUser?: User): AttendanceRecord {
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

    if (actorUser) {
      this.logAuditAction(actorUser, 'ATTENDANCE_CHECKIN', `Registró ingreso por DNI para ${member.firstName} ${member.lastName} (DNI: ${member.dni})`);
    }

    return newRecord;
  }

  // --- PAYMENT TICKETS ---
  getTickets(): PaymentTicket[] {
    return this.get<PaymentTicket[]>(STORAGE_KEYS.TICKETS, []);
  }

  createPaymentTicket(ticketData: Omit<PaymentTicket, 'id' | 'ticketNumber' | 'paymentDate'>, actorUser?: User): PaymentTicket {
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

    if (actorUser) {
      this.logAuditAction(actorUser, 'MEMBERSHIP_PAYMENT', `Cobró cuota de $${ticketData.amount} a ${ticketData.memberName} (${ticketData.planName} - ${ticketData.paymentMethod}). Ticket N° ${ticketNumber}`);
    }

    return newTicket;
  }

  deleteTicket(id: string, actorUser?: User): void {
    const target = this.getTickets().find(t => t.id === id);
    const tickets = this.getTickets().filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TICKETS, tickets);
    if (actorUser && target) {
      this.logAuditAction(actorUser, 'TICKET_DELETE', `Anuló/Eliminó el ticket de cuota N° ${target.ticketNumber} ($${target.amount} - ${target.memberName})`);
    }
  }

  // --- PRODUCTS & POS ---
  getProducts(): Product[] {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  }

  saveProduct(product: Partial<Product> & { name: string; price: number; stock: number }, actorUser?: User): Product {
    const products = this.getProducts();
    if (product.id) {
      const index = products.findIndex(p => p.id === product.id);
      if (index !== -1) {
        products[index] = { ...products[index], ...product };
        this.set(STORAGE_KEYS.PRODUCTS, products);
        if (actorUser) {
          this.logAuditAction(actorUser, 'STOCK_UPDATE', `Editó el producto "${product.name}" (Stock: ${product.stock}, Precio: $${product.price})`);
        }
        return products[index];
      }
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: product.name,
      barCode: product.barCode || '',
      description: product.description || '',
      category: product.category || 'BEBIDAS',
      price: product.price,
      costPrice: product.costPrice || 0,
      stock: product.stock,
      minStock: product.minStock || 3,
      imageUrl: product.imageUrl || '',
    };
    products.push(newProduct);
    this.set(STORAGE_KEYS.PRODUCTS, products);
    if (actorUser) {
      this.logAuditAction(actorUser, 'STOCK_UPDATE', `Agregó un nuevo producto a cantina "${product.name}" (Stock: ${product.stock})`);
    }
    return newProduct;
  }

  deleteProduct(id: string, actorUser?: User): void {
    const target = this.getProducts().find(p => p.id === id);
    const products = this.getProducts().filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PRODUCTS, products);
    if (actorUser && target) {
      this.logAuditAction(actorUser, 'STOCK_UPDATE', `Eliminó el producto "${target.name}" de la cantina`);
    }
  }

  updateProductStock(productId: string, addQuantity: number, actorUser?: User): void {
    const products = this.getProducts();
    const prod = products.find(p => p.id === productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock + addQuantity);
      this.set(STORAGE_KEYS.PRODUCTS, products);
      if (actorUser) {
        this.logAuditAction(actorUser, 'STOCK_UPDATE', `Reabasteció stock de "${prod.name}" (+${addQuantity} unidades). Nuevo stock: ${prod.stock}`);
      }
    }
  }

  getProductSales(): ProductSale[] {
    return this.get<ProductSale[]>(STORAGE_KEYS.PRODUCT_SALES, []);
  }

  createProductSale(saleData: Omit<ProductSale, 'id' | 'saleNumber' | 'timestamp'>, actorUser?: User): ProductSale {
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

    // Descontar Stock
    saleData.items.forEach(item => {
      this.updateProductStock(item.productId, -item.quantity);
    });

    // Si es cuenta corriente/fiado a un socio, sumar al saldo del socio
    if (saleData.isAccountCharge && saleData.memberId) {
      this.updateMemberBalance(saleData.memberId, saleData.totalAmount);
    }

    if (actorUser) {
      const summaryItems = saleData.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');
      this.logAuditAction(actorUser, 'POS_SALE', `Registró venta de cantina N° ${saleNumber} ($${saleData.totalAmount} - ${saleData.paymentMethod}): ${summaryItems}`);
    }

    return newSale;
  }

  deleteProductSale(id: string, actorUser?: User): void {
    const target = this.getProductSales().find(s => s.id === id);
    const sales = this.getProductSales().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.PRODUCT_SALES, sales);
    if (actorUser && target) {
      this.logAuditAction(actorUser, 'TICKET_DELETE', `Anuló/Eliminó la venta de cantina N° ${target.saleNumber} ($${target.totalAmount})`);
    }
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
      auditLogs: this.getAuditLogs(),
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
      if (data.auditLogs) this.set(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);
      return true;
    } catch (e) {
      console.error('Error importing backup', e);
      return false;
    }
  }
}

export const db = new DatabaseService();
