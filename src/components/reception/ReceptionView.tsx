import React, { useState, useEffect, useRef } from 'react';
import type { Member, AttendanceRecord } from '../../types';
import { db } from '../../services/db';
import { formatDate } from '../../utils/date';
import { Search, CheckCircle2, AlertTriangle, XCircle, User, CreditCard, Clock, Sparkles, UserPlus } from 'lucide-react';

interface ReceptionViewProps {
  onGoToPayment: (member: Member) => void;
  onGoToNewMember: () => void;
}

export const ReceptionView: React.FC<ReceptionViewProps> = ({ onGoToPayment, onGoToNewMember }) => {
  const [activeSubTab, setActiveSubTab] = useState<'checkin' | 'history'>('checkin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [recentAttendances, setRecentAttendances] = useState<AttendanceRecord[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeSubTab === 'checkin') {
      inputRef.current?.focus();
    }
    loadAttendances();
  }, [activeSubTab]);

  const loadAttendances = () => {
    setRecentAttendances(db.getAttendance());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const found = db.getMemberByDni(searchQuery.trim());
    if (found) {
      setSelectedMember(found);
      setNotification(null);
    } else {
      const allMembers = db.getMembers();
      const match = allMembers.find(
        m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (match) {
        setSelectedMember(match);
        setNotification(null);
      } else {
        setSelectedMember(null);
        setNotification({
          message: `Socio no encontrado con DNI "${searchQuery}".`,
          type: 'error'
        });
      }
    }
  };

  const handleRegisterAttendance = () => {
    if (!selectedMember) return;

    if (selectedMember.status === 'EXPIRED') {
      setNotification({
        message: `¡Atención! La cuota de ${selectedMember.firstName} está VENCIDA.`,
        type: 'error'
      });
      return;
    }

    db.recordAttendance(selectedMember);
    loadAttendances();

    setNotification({
      message: `¡Ingreso registrado para ${selectedMember.firstName} ${selectedMember.lastName}!`,
      type: 'success'
    });

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow">
        <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          Control de Recepción e Ingresos
        </h2>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('checkin')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'checkin'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Validar Ingreso DNI
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'history'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Ingresos Hoy ({recentAttendances.length})
        </button>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-md text-xs sm:text-sm font-semibold max-w-xl mx-auto ${
          notification.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            : notification.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : 'bg-amber-950/90 border-amber-500/50 text-amber-200'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Subtab 1: Check-in */}
      {activeSubTab === 'checkin' && (
        <div className="space-y-4 max-w-xl mx-auto">
          {/* Search Box */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ingresá DNI o Nombre:
              </span>
              <button
                onClick={onGoToNewMember}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                + Nuevo Socio
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej: 38450123"
                className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-emerald-400 text-white font-mono font-bold text-lg px-4 py-3 rounded-xl outline-none transition placeholder:text-slate-600"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 rounded-xl text-xs sm:text-sm transition shadow"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Member Card */}
          {selectedMember ? (
            <div className={`bg-slate-900 border-2 rounded-2xl p-5 space-y-4 shadow-xl ${
              selectedMember.status === 'ACTIVE'
                ? 'border-emerald-500/70 shadow-emerald-500/10'
                : selectedMember.status === 'EXPIRING_SOON'
                ? 'border-amber-500/70 shadow-amber-500/10'
                : 'border-rose-500/70 shadow-rose-500/10'
            }`}>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-black text-lg">
                    {selectedMember.firstName[0]}{selectedMember.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </h3>
                    <span className="text-xs font-mono text-slate-400 font-bold block mt-0.5">
                      DNI: {selectedMember.dni}
                    </span>
                  </div>
                </div>

                <div>
                  {selectedMember.status === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-xl text-xs font-black">
                      🟢 HABILITADO
                    </span>
                  )}
                  {selectedMember.status === 'EXPIRING_SOON' && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-xl text-xs font-black">
                      🟡 POR VENCER
                    </span>
                  )}
                  {selectedMember.status === 'EXPIRED' && (
                    <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3 py-1 rounded-xl text-xs font-black">
                      🔴 VENCIDO / IMPAGO
                    </span>
                  )}
                </div>
              </div>

              {/* Plan & Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block font-medium">Plan</span>
                  <span className="font-bold text-white text-xs sm:text-sm">{selectedMember.planName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Vencimiento</span>
                  <span className="font-bold text-amber-400 text-xs sm:text-sm font-mono">{formatDate(selectedMember.expirationDate)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleRegisterAttendance}
                  disabled={selectedMember.status === 'EXPIRED'}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow ${
                    selectedMember.status === 'EXPIRED'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  MARCAR ASISTENCIA DE INGRESO
                </button>

                <button
                  onClick={() => onGoToPayment(selectedMember)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition border border-slate-700 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Cobrar / Renovar Cuota
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 border-dashed p-8 rounded-2xl text-center text-slate-400">
              <User className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="font-bold text-white text-sm">Esperando consulta de socio</p>
              <p className="text-xs text-slate-500 mt-1">Ingresá el DNI arriba para validar el pase.</p>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Today Attendance History */}
      {activeSubTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3 max-w-xl mx-auto shadow">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Historial Completo de Ingresos Hoy ({recentAttendances.length})
          </h3>

          {recentAttendances.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {recentAttendances.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{rec.memberName}</span>
                    <span className="text-slate-500 font-mono text-[11px]">DNI: {rec.memberDni}</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6">No hay registros de ingreso el día de hoy.</p>
          )}
        </div>
      )}

    </div>
  );
};
