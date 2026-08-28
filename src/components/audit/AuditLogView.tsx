import React, { useState, useEffect } from 'react';
import type { User, AuditLog, AuditActionType } from '../../types';
import { db } from '../../services/db';
import { ShieldCheck, Search, History, Filter, UserCheck, CreditCard, ShoppingCart, Package, Users, LogIn, Trash2, Calendar } from 'lucide-react';
import { formatDate } from '../../utils/date';

interface AuditLogViewProps {
  currentUser: User;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | AuditActionType>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLogs(db.getAuditLogs());
    setUsers(db.getUsers());
  };

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
        <ShieldCheck className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-black text-white">Acceso Restringido</h3>
        <p className="text-xs text-slate-400">Solo los Dueños / Administradores pueden supervisar el historial de auditoría del personal.</p>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      log.userName.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      log.actionType.toLowerCase().includes(query);

    const matchesUser = selectedUserFilter === 'ALL' || log.userId === selectedUserFilter;
    const matchesCategory = selectedCategoryFilter === 'ALL' || log.actionType === selectedCategoryFilter;

    return matchesQuery && matchesUser && matchesCategory;
  });

  const getActionBadge = (actionType: AuditActionType) => {
    switch (actionType) {
      case 'MEMBERSHIP_PAYMENT':
        return {
          label: 'Cobro de Cuota',
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          icon: <CreditCard className="w-3.5 h-3.5" />,
        };
      case 'POS_SALE':
        return {
          label: 'Venta Cantina',
          color: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
          icon: <ShoppingCart className="w-3.5 h-3.5" />,
        };
      case 'STOCK_UPDATE':
        return {
          label: 'Gestión Stock',
          color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          icon: <Package className="w-3.5 h-3.5" />,
        };
      case 'ATTENDANCE_CHECKIN':
        return {
          label: 'Ingreso DNI',
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
          icon: <UserCheck className="w-3.5 h-3.5" />,
        };
      case 'MEMBER_CREATE_EDIT':
      case 'MEMBER_DELETE':
        return {
          label: 'ABM Socio',
          color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
          icon: <Users className="w-3.5 h-3.5" />,
        };
      case 'USER_CREATE_EDIT':
        return {
          label: 'ABM Empleados',
          color: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
          icon: <UserCheck className="w-3.5 h-3.5" />,
        };
      case 'TICKET_DELETE':
        return {
          label: 'Anulación Ticket',
          color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          icon: <Trash2 className="w-3.5 h-3.5" />,
        };
      case 'LOGIN':
        return {
          label: 'Inicio Turno',
          color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          icon: <LogIn className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: 'Acción General',
          color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          icon: <History className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Log de Auditoría & Actividades
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Supervisión en tiempo real de las acciones realizadas por empleados y dueños.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-300">
            {logs.length} Registros
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl space-y-3 shadow">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input (6 cols) */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por empleado, detalle de cobro, producto o ticket..."
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-emerald-400"
            />
          </div>

          {/* Filter by Employee User (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={selectedUserFilter}
              onChange={e => setSelectedUserFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl outline-none focus:border-emerald-400"
            >
              <option value="ALL">👤 Todos los Usuarios</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'ADMIN' ? 'Dueño' : 'Empleado'})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Category (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl outline-none focus:border-emerald-400"
            >
              <option value="ALL">📋 Todas las Acciones</option>
              <option value="MEMBERSHIP_PAYMENT">💳 Cobros de Cuota</option>
              <option value="POS_SALE">🛒 Ventas de Cantina</option>
              <option value="STOCK_UPDATE">📦 Cambios de Stock</option>
              <option value="ATTENDANCE_CHECKIN">⚡ Ingresos por DNI</option>
              <option value="MEMBER_CREATE_EDIT">👥 ABM Socios</option>
              <option value="USER_CREATE_EDIT">💼 ABM Empleados</option>
              <option value="TICKET_DELETE">🚨 Anulaciones / Borrados</option>
              <option value="LOGIN">🔑 Inicios de Turno</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Timeline List */}
      <div className="space-y-2.5">
        {filteredLogs.length > 0 ? (
          filteredLogs.map(log => {
            const badge = getActionBadge(log.actionType);
            const dateFormatted = formatDate(log.timestamp);
            const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return (
              <div
                key={log.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 sm:p-4 transition shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${badge.color}`}>
                    {badge.icon}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-white text-xs sm:text-sm">
                        {log.userName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        log.userRole === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {log.userRole === 'ADMIN' ? '👑 Dueño' : '💼 Empleado'}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0 self-end sm:self-auto">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{dateFormatted} - {timeFormatted} hs</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
            <Filter className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="font-bold text-white text-sm">No se encontraron registros de auditoría</h4>
            <p className="text-xs text-slate-400">Probá modificando los filtros de búsqueda arriba.</p>
          </div>
        )}
      </div>
    </div>
  );
};
