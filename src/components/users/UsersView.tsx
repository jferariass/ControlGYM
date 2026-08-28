import React, { useState, useEffect } from 'react';
import type { User, UserRole } from '../../types';
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
    role: 'STAFF' as UserRole,
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
      role: 'STAFF',
      pin: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      role: u.role,
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
      role: formData.role,
      pin: formData.pin.trim(),
    });

    loadUsers();
    setIsModalOpen(false);
    setNotification(editingUser ? 'Usuario actualizado correctamente.' : 'Nuevo empleado registrado.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === currentUser.id) {
      alert('No podés eliminar tu propio usuario en uso.');
      return;
    }
    if (confirm(`¿Eliminar al usuario "${name}"?`)) {
      db.deleteUser(id);
      loadUsers();
    }
  };

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
        <ShieldCheck className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-black text-white">Acceso Restringido</h3>
        <p className="text-xs text-slate-400">Solo los Dueños / Administradores pueden gestionar usuarios y empleados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Gestión de Personal ({users.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Administrá los PINs de acceso para recepcionistas y dueños.</p>
        </div>
        <button
          onClick={handleOpenNewUser}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center gap-1.5 shrink-0"
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

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {users.map(u => (
          <div
            key={u.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                  u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {u.role === 'ADMIN' ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm leading-tight">{u.name}</h4>
                  <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                    {u.role === 'ADMIN' ? '👑 Dueño / Administrador' : '💼 Recepcionista / Staff'}
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
                onClick={() => handleDeleteUser(u.id, u.name)}
                disabled={u.id === currentUser.id}
                className={`p-2 rounded-lg text-xs transition border ${
                  u.id === currentUser.id
                    ? 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                    : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border-rose-800/50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: New / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white">
                {editingUser ? 'Editar Empleado' : 'Nuevo Empleado'}
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
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo*</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Sofía (Turno Mañana)"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Rol</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl outline-none focus:border-emerald-400"
                  >
                    <option value="STAFF">Empleado / Recepcionista</option>
                    <option value="ADMIN">Dueño / Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PIN de Acceso (4 dígitos)*</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
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
                  {editingUser ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
