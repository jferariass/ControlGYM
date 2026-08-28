import React, { useState, useEffect } from 'react';
import type { Member, PaymentTicket, ProductSale } from '../../types';
import { db } from '../../services/db';
import { formatDate } from '../../utils/date';
import { LayoutDashboard, CreditCard, DollarSign, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  onGoToPayment: (member: Member) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onGoToPayment }) => {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'expiring'>('summary');
  const [members, setMembers] = useState<Member[]>([]);
  const [tickets, setTickets] = useState<PaymentTicket[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [attendancesCount, setAttendancesCount] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allMembers = db.getMembers();
    const allTickets = db.getTickets();
    const allProductSales = db.getProductSales();
    const allAttendances = db.getAttendance();

    setMembers(allMembers);
    setTickets(allTickets);
    setProductSales(allProductSales);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAtt = allAttendances.filter(a => a.timestamp.startsWith(todayStr));
    setAttendancesCount(todayAtt.length);
  };

  const activeMembers = members.filter(m => m.status === 'ACTIVE');
  const expiringSoonMembers = members.filter(m => m.status === 'EXPIRING_SOON');
  const expiredMembers = members.filter(m => m.status === 'EXPIRED');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTickets = tickets.filter(t => t.paymentDate.startsWith(todayStr));
  const todayProductSales = productSales.filter(s => s.timestamp.startsWith(todayStr));

  const todayMembershipRevenue = todayTickets.reduce((sum, t) => sum + t.amount, 0);
  const todayPosRevenue = todayProductSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTodayRevenue = todayMembershipRevenue + todayPosRevenue;

  // Breakdown by payment method
  const cashMembership = todayTickets.filter(t => t.paymentMethod === 'EFECTIVO').reduce((sum, t) => sum + t.amount, 0);
  const cashPos = todayProductSales.filter(s => s.paymentMethod === 'EFECTIVO').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCashToday = cashMembership + cashPos;

  const mpMembership = todayTickets.filter(t => t.paymentMethod === 'MERCADO_PAGO').reduce((sum, t) => sum + t.amount, 0);
  const mpPos = todayProductSales.filter(s => s.paymentMethod === 'MERCADO_PAGO').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalMpToday = mpMembership + mpPos;

  const transferMembership = todayTickets.filter(t => t.paymentMethod === 'TRANSFERENCIA').reduce((sum, t) => sum + t.amount, 0);
  const transferPos = todayProductSales.filter(s => s.paymentMethod === 'TRANSFERENCIA').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTransferToday = transferMembership + transferPos;

  const posnetMembership = todayTickets.filter(t => t.paymentMethod === 'POSNET').reduce((sum, t) => sum + t.amount, 0);
  const posnetPos = todayProductSales.filter(s => s.paymentMethod === 'POSNET').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPosnetToday = posnetMembership + posnetPos;

  const totalExpiringCount = expiringSoonMembers.length + expiredMembers.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow">
        <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-emerald-400" />
          Panel de Control & Caja Diaria
        </h2>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'summary'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Resumen & Caja
        </button>

        <button
          onClick={() => setActiveSubTab('expiring')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'expiring'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Vencidos & Por Vencer ({totalExpiringCount})
        </button>
      </div>

      {/* Subtab 1: Summary & Cash */}
      {activeSubTab === 'summary' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Socios Activos</span>
              <span className="text-2xl font-black text-white block">{activeMembers.length}</span>
              <span className="text-[10px] text-emerald-400 font-medium">De {members.length} socios</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Ingresos Hoy</span>
              <span className="text-2xl font-black text-emerald-400 block">{attendancesCount}</span>
              <span className="text-[10px] text-slate-500">Asistencias</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Recaudado Hoy</span>
              <span className="text-xl font-mono font-black text-emerald-400 block">${totalTodayRevenue.toLocaleString('es-AR')}</span>
              <span className="text-[10px] text-slate-500">{todayTickets.length + todayProductSales.length} cobros totales</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase">Por Vencer</span>
              <span className="text-2xl font-black text-amber-400 block">{totalExpiringCount}</span>
              <span className="text-[10px] text-slate-500">{expiredMembers.length} vencidos</span>
            </div>
          </div>

          {/* Revenue Breakdown by Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Cuotas de Socios Hoy
              </span>
              <span className="text-xl font-mono font-black text-white block">
                ${todayMembershipRevenue.toLocaleString('es-AR')}
              </span>
              <span className="text-[10px] text-slate-500">{todayTickets.length} tickets de cuota</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                Ventas de Cantina Hoy
              </span>
              <span className="text-xl font-mono font-black text-emerald-400 block">
                ${todayPosRevenue.toLocaleString('es-AR')}
              </span>
              <span className="text-[10px] text-slate-500">{todayProductSales.length} ventas de productos</span>
            </div>
          </div>

          {/* Cash breakdown */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Desglose de Caja por Medio de Pago ({formatDate(todayStr)})
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">💵 Efectivo (Total en Caja)</span>
                <span className="font-mono font-bold text-white">${totalCashToday.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">🏦 Transferencia Bancaria</span>
                <span className="font-mono font-bold text-white">${totalTransferToday.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">💙 Mercado Pago (QR)</span>
                <span className="font-mono font-bold text-white">${totalMpToday.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">💳 Posnet / Tarjetas</span>
                <span className="font-mono font-bold text-white">${totalPosnetToday.toLocaleString('es-AR')}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-1">
                <span className="font-bold text-slate-200 text-xs">TOTAL RECAUDADO HOY:</span>
                <span className="text-lg font-mono font-black text-emerald-400">${totalTodayRevenue.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Expiring Members */}
      {activeSubTab === 'expiring' && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3 max-w-2xl mx-auto shadow">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Socios con Cuota Vencida o Por Vencer ({totalExpiringCount})
          </h3>

          {totalExpiringCount > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {[...expiringSoonMembers, ...expiredMembers].map(member => (
                <div
                  key={member.id}
                  className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2 flex flex-col justify-between shadow"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs sm:text-sm">{member.firstName} {member.lastName}</span>
                      {member.status === 'EXPIRING_SOON' ? (
                        <span className="text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded">
                          Por Vencer
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded">
                          Vencido
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      DNI: {member.dni} | Plan: {member.planName}
                    </p>
                    <p className="text-[11px] text-amber-400 font-mono font-bold mt-0.5">
                      Vencimiento: {formatDate(member.expirationDate)}
                    </p>
                  </div>

                  <button
                    onClick={() => onGoToPayment(member)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2 rounded-lg transition shadow flex items-center justify-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Cobrar Cuota
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6">¡Genial! No hay socios vencidos ni por vencer.</p>
          )}
        </div>
      )}

    </div>
  );
};
