import React, { useState, useEffect } from 'react';
import type { Member, Plan, PaymentMethod, PaymentTicket, User } from '../../types';
import { db } from '../../services/db';
import { generateTicketPDF } from '../../utils/ticket';
import { formatDate } from '../../utils/date';
import { CreditCard, Printer, Search, CheckCircle2, DollarSign, FileText, Trash2 } from 'lucide-react';

interface PaymentsViewProps {
  initialSelectedMember?: Member | null;
  currentUser: User;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ initialSelectedMember, currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pay' | 'tickets'>('pay');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tickets, setTickets] = useState<PaymentTicket[]>([]);

  const [selectedMember, setSelectedMember] = useState<Member | null>(initialSelectedMember || null);
  const [searchDni, setSearchDni] = useState(initialSelectedMember ? initialSelectedMember.dni : '');

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [newExpirationDate, setNewExpirationDate] = useState<string>('');

  const [lastIssuedTicket, setLastIssuedTicket] = useState<PaymentTicket | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialSelectedMember) {
      handleSelectMember(initialSelectedMember);
    }
  }, [initialSelectedMember]);

  const loadData = () => {
    const allPlans = db.getPlans();
    const allTickets = db.getTickets();

    setPlans(allPlans);
    setTickets(allTickets);

    if (allPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(allPlans[0].id);
      setAmount(allPlans[0].price);
    }
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setSearchDni(member.dni);

    const currentExp = new Date(member.expirationDate);
    const today = new Date();
    
    const baseDate = currentExp > today ? currentExp : today;
    const targetDate = new Date(baseDate.getTime() + 30 * 86400000);
    setNewExpirationDate(targetDate.toISOString().split('T')[0]);
  };

  const handleSearchDni = (e: React.FormEvent) => {
    e.preventDefault();
    const found = db.getMemberByDni(searchDni.trim());
    if (found) {
      handleSelectMember(found);
    } else {
      alert(`No se encontró socio con el DNI ${searchDni}`);
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setAmount(plan.price);
      const baseDate = selectedMember && new Date(selectedMember.expirationDate) > new Date()
        ? new Date(selectedMember.expirationDate)
        : new Date();
      const targetDate = new Date(baseDate.getTime() + plan.durationDays * 86400000);
      setNewExpirationDate(targetDate.toISOString().split('T')[0]);
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      alert('Por favor seleccioná un socio.');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlanId);

    const ticket = db.createPaymentTicket({
      memberId: selectedMember.id,
      memberDni: selectedMember.dni,
      memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      planName: plan ? plan.name : 'Cobro General',
      amount: Number(amount),
      paymentMethod,
      previousExpiration: selectedMember.expirationDate,
      newExpiration: newExpirationDate,
      issuedBy: currentUser.name,
      issuedById: currentUser.id,
    }, currentUser);

    setLastIssuedTicket(ticket);
    loadData();

    const updatedMember = db.getMemberByDni(selectedMember.dni);
    if (updatedMember) setSelectedMember(updatedMember);
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (currentUser.role !== 'ADMIN') {
      alert('⚠️ Restringido: Los empleados no pueden anular ni eliminar tickets sin autorización del dueño.');
      return;
    }
    if (confirm('¿Estás seguro de anular este ticket de cobro?')) {
      db.deleteTicket(ticketId, currentUser);
      loadData();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow">
        <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          Cobros de Cuotas y Tickets
        </h2>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('pay')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'pay'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Registrar Cobro
        </button>

        <button
          onClick={() => setActiveSubTab('tickets')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'tickets'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Historial Tickets ({tickets.length})
        </button>
      </div>

      {/* Subtab 1: Form */}
      {activeSubTab === 'pay' && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow space-y-4 max-w-2xl mx-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            1. Seleccionar Socio
          </h3>

          {/* DNI Search Form */}
          <form onSubmit={handleSearchDni} className="flex gap-2">
            <input
              type="text"
              value={searchDni}
              onChange={e => setSearchDni(e.target.value)}
              placeholder="Ingresá DNI del socio..."
              className="flex-1 bg-slate-950 border border-slate-800 text-white font-mono text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-xs transition border border-slate-700 flex items-center gap-1"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </form>

          {/* Selected Member Card */}
          {selectedMember ? (
            <div className="bg-slate-950/80 border border-emerald-500/40 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-white">{selectedMember.firstName} {selectedMember.lastName}</h4>
                <p className="text-xs font-mono text-slate-400">
                  DNI: {selectedMember.dni} | Vence: <strong className="text-amber-400">{formatDate(selectedMember.expirationDate)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-xs text-slate-400 hover:text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl text-center text-xs text-slate-400">
              Buscá por DNI arriba para proceder con el cobro.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCreateTicket} className="space-y-3.5 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                2. Detalle de Cobro y Vencimiento
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">Atendido por: {currentUser.name}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Plan / Membresía</label>
                <select
                  value={selectedPlanId}
                  onChange={e => handlePlanChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl outline-none focus:border-emerald-400"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.price.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Monto ($)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-sm p-3 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Medio de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl outline-none focus:border-emerald-400"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="MERCADO_PAGO">Mercado Pago (QR)</option>
                  <option value="POSNET">Tarjeta Débito/Crédito (Posnet)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1 font-bold">
                  NUEVO Vencimiento (DD/MM/AAAA)
                </label>
                <input
                  type="date"
                  required
                  value={newExpirationDate}
                  onChange={e => setNewExpirationDate(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-amber-500/60 text-white font-mono font-bold text-xs p-2.5 rounded-xl outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedMember}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                !selectedMember
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              REGISTRAR PAGO Y GENERAR TICKET
            </button>
          </form>
        </div>
      )}

      {/* Subtab 2: History */}
      {activeSubTab === 'tickets' && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl max-w-2xl mx-auto shadow space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            Historial Completo de Comprobantes ({tickets.length})
          </h3>

          {tickets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1.5 shadow flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-mono font-bold text-emerald-400">{ticket.ticketNumber}</span>
                      <span className="text-slate-500">{formatDate(ticket.paymentDate)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{ticket.memberName}</span>
                      <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        ${ticket.amount.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>{ticket.planName} ({ticket.paymentMethod})</span>
                      <span className="text-amber-400 font-mono">Vence: {formatDate(ticket.newExpiration)}</span>
                    </div>

                    <div className="text-[10px] text-slate-500">
                      Atendido por: <strong className="text-slate-300">{ticket.issuedBy}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => generateTicketPDF(ticket)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      Imprimir PDF
                    </button>
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 p-1.5 rounded-lg text-xs transition"
                        title="Anular Ticket (Solo Dueños)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6">No hay tickets emitidos aún.</p>
          )}
        </div>
      )}

      {/* Modal Ticket Preview */}
      {lastIssuedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-sm p-5 shadow-2xl text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white">¡Pago Registrado!</h3>
            <p className="text-xs text-slate-400">
              Comprobante <span className="text-emerald-400 font-bold font-mono">{lastIssuedTicket.ticketNumber}</span>
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-xs font-mono space-y-1 text-slate-300">
              <p><span className="text-slate-500">Socio:</span> {lastIssuedTicket.memberName}</p>
              <p><span className="text-slate-500">Monto:</span> ${lastIssuedTicket.amount.toLocaleString('es-AR')}</p>
              <p><span className="text-slate-500">Atendido por:</span> {lastIssuedTicket.issuedBy}</p>
              <p><span className="text-slate-500">Vencimiento:</span> <strong className="text-amber-400">{formatDate(lastIssuedTicket.newExpiration)}</strong></p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setLastIssuedTicket(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  generateTicketPDF(lastIssuedTicket);
                  setLastIssuedTicket(null);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
