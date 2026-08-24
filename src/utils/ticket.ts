import { jsPDF } from 'jspdf';
import type { PaymentTicket } from '../types';
import { formatDate } from './date';
import { db } from '../services/db';

export function generateTicketPDF(ticket: PaymentTicket) {
  const settings = db.getSettings();

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 160], // Thermal printer format (80mm width)
  });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(settings.name || 'ControlGYM', 40, 9, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('Helvetica', 'normal');
  if (settings.address) doc.text(settings.address, 40, 14, { align: 'center' });
  if (settings.phone) doc.text(`Tel/WA: ${settings.phone}`, 40, 18, { align: 'center' });
  if (settings.cuit) doc.text(`CUIT: ${settings.cuit}`, 40, 22, { align: 'center' });

  doc.text('---------------------------------------------------', 40, 26, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.text('COMPROBANTE DE PAGO', 40, 31, { align: 'center' });
  doc.text('---------------------------------------------------', 40, 35, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Ticket: ${ticket.ticketNumber}`, 5, 41);
  doc.text(`Fecha: ${formatDate(ticket.paymentDate)} ${new Date(ticket.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 5, 46);
  doc.text(`Atendió: ${ticket.issuedBy}`, 5, 51);

  doc.text('---------------------------------------------------', 40, 56, { align: 'center' });

  doc.setFont('Helvetica', 'bold');
  doc.text('DATOS DEL SOCIO:', 5, 62);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Socio: ${ticket.memberName}`, 5, 67);
  doc.text(`DNI: ${ticket.memberDni}`, 5, 72);

  doc.text('---------------------------------------------------', 40, 77, { align: 'center' });

  doc.setFont('Helvetica', 'bold');
  doc.text('CONCEPTO Y PAGO:', 5, 83);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Plan: ${ticket.planName}`, 5, 88);
  doc.text(`Medio de Pago: ${ticket.paymentMethod}`, 5, 93);
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`MONTO ABONADO: $${ticket.amount.toLocaleString('es-AR')}`, 5, 102);

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text('---------------------------------------------------', 40, 108, { align: 'center' });

  doc.setFont('Helvetica', 'bold');
  doc.text('NUEVO VENCIMIENTO:', 5, 114);
  doc.setFontSize(10);
  doc.text(`${formatDate(ticket.newExpiration)}`, 5, 120);

  doc.setFontSize(7);
  doc.setFont('Helvetica', 'italic');
  doc.text(settings.ticketFooter || '¡Gracias por entrenar con nosotros!', 40, 135, { align: 'center' });

  // Save PDF
  doc.save(`Ticket_${ticket.ticketNumber}_${ticket.memberDni}.pdf`);
}
