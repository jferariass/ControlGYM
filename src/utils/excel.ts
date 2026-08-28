import * as XLSX from 'xlsx';
import { db } from '../services/db';
import { formatDate } from './date';

export function exportGymDataToExcel() {
  const members = db.getMembers();
  const tickets = db.getTickets();
  const attendance = db.getAttendance();
  const productSales = db.getProductSales();

  // Create workbook
  const wb = XLSX.utils.book_new();

  // 1. Members Sheet
  const membersData = members.map(m => ({
    DNI: m.dni,
    Nombre: m.firstName,
    Apellido: m.lastName,
    Teléfono: m.phone,
    Email: m.email || '',
    Plan: m.planName,
    'Fecha de Vencimiento': formatDate(m.expirationDate),
    Estado: m.status === 'ACTIVE' ? 'ACTIVO' : m.status === 'EXPIRING_SOON' ? 'POR VENCER' : 'VENCIDO',
    'Contacto Emergencia': m.emergencyContact || '',
    'Fecha de Alta': formatDate(m.registrationDate),
    'Saldo Cantina ($)': m.accountBalance || 0,
  }));
  const wsMembers = XLSX.utils.json_to_sheet(membersData);
  XLSX.utils.book_append_sheet(wb, wsMembers, 'Padron_Socios');

  // 2. Payments & Tickets Sheet
  const ticketsData = tickets.map(t => ({
    'N° Ticket': t.ticketNumber,
    DNI: t.memberDni,
    Socio: t.memberName,
    Plan: t.planName,
    'Monto ($)': t.amount,
    'Medio de Pago': t.paymentMethod,
    'Fecha de Cobro': formatDate(t.paymentDate),
    'Vencimiento Anterior': formatDate(t.previousExpiration),
    'Nuevo Vencimiento': formatDate(t.newExpiration),
    AtendidoPor: t.issuedBy,
  }));
  const wsTickets = XLSX.utils.json_to_sheet(ticketsData);
  XLSX.utils.book_append_sheet(wb, wsTickets, 'Historial_Pagos_Cuotas');

  // 3. Product Sales (Cantina) Sheet
  const salesData = productSales.map(s => ({
    'N° Venta': s.saleNumber,
    Fecha: formatDate(s.timestamp),
    Vendedor: s.sellerName,
    Socio: s.memberName || 'Cliente Libre',
    Productos: s.items.map(i => `${i.productName} (x${i.quantity})`).join(', '),
    'Monto Total ($)': s.totalAmount,
    'Medio de Pago': s.isAccountCharge ? 'Cuenta Corriente (Fiado)' : s.paymentMethod,
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Ventas_Cantina');

  // 4. Attendance Sheet
  const attendanceData = attendance.map(a => ({
    Fecha: formatDate(a.timestamp),
    Hora: new Date(a.timestamp).toLocaleTimeString(),
    DNI: a.memberDni,
    Socio: a.memberName,
  }));
  const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Asistencias');

  // Download file
  const dateStr = formatDate(new Date().toISOString()).replace(/\//g, '-');
  XLSX.writeFile(wb, `ControlGYM_Respaldo_${dateStr}.xlsx`);
}
