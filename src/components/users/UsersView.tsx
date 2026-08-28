import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { db } from '../../services/db';
import { Users, UserPlus, ShieldCheck, UserCheck, Trash2, Edit, CheckCircle2, X } from 'lucide-react';

interface UsersViewProps {
  currentUser: User;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    pin: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(db.getUsers());
  };

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      pin: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      pin: u.pin,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.pin.trim()) return;

    if (formData.pin.length < 4) {
      alert('El PIN debe contener al menos 4 dígitos.');
      return;
    }

    db.saveUser({
      id: editingUser ? editingUser.id : undefined,
      name: formData.name.trim(),
      role: editingUser ? editingUser.role : 'STAFF', // Strictly STAFF for new employees created by owners
      pin: formData.pin.trim(),
    }, currentUser);

    loadUsers();
    setIsModalOpen(false);
    setNotification(editingUser ? 'Empleado actualizado correctamente.' : 'Nuevo empleado registrado.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteUser = (id: string, name: string, role: string) => {
    if (role === 'ADMIN') {
      alert('No podés eliminar perfiles de Dueños.');
      return;
    }
    if (confirm(`¿Eliminar al empleado "${name}"?`)) {
      db.deleteUser(id, currentUser);
      loadUsers();
    }
  };

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
        <ShieldCheck className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-black text-white">Acceso Restringido</h3>
        <p className="text-xs text-slate-400">Solo los Dueños / Administradores pueden gestionar el personal del gimnasio.</p>
      </div>
    );
  }

  const staffUsers = users.filter(u => u.role === 'STAFF');
  const adminUsers = users.filter(u => u.role === 'ADMIN');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Gestión de Personal
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Creá perfiles de empleados y administrá sus PINs de acceso.</p>
        </div>
        <button
          onClick={handleOpenNewUser}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          + Nuevo Empleado
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Staff Section (Employees) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          Empleados Registrados ({staffUsers.length})
        </h3>

        {staffUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {staffUsers.map(u => (
              <div
                key={u.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm leading-tight">{u.name}</h4>
                      <span className="text-[11px] font-semibold text-emerald-400 block mt-0.5">
                        💼 Recepcionista / Staff
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-black bg-slate-950 border border-slate-800 text-emerald-400 px-2.5 py-1 rounded-lg">
                    PIN: {u.pin}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenEditUser(u)}
                    className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-400" />
                    Editar PIN
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name, u.role)}
                    className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 p-2 rounded-lg text-xs transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-4">No hay empleados registrados. Presioná "+ Nuevo Empleado" arriba para agregar uno.</p>
        )}
      </div>

      {/* Admin Section (Owners - Read Only) */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Perfiles de Dueños / Administradores ({adminUsers.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {adminUsers.map(u => (
            <div
              key={u.id}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow opacity-90"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs">{u.name}</h4>
                  <span className="text-[10px] text-amber-400 font-semibold block">👑 Dueño / Admin</span>
                </div>
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                PIN: {u.pin}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add / Edit Employee (Strictly Staff Role) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white">
                {editingUser ? 'Editar PIN de Empleado' : 'Registrar Nuevo Empleado'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo del Empleado*</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Sofía (Turno Mañana)"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">PIN de Acceso (4 a 6 dígitos)*</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.pin}
                  onChange={e => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="Ej: 1234"
                  className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-emerald-400 block">💼 Rol Asignado: Recepcionista / Staff</span>
                <p>Tendrá acceso a validación de DNI, cobro de cuotas, venta de cantina e ingreso de mercadería.</p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2 rounded-xl text-xs transition shadow-md"
                >
                  {editingUser ? 'Guardar Cambios' : 'Registrar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
