import React, { useState, useEffect } from 'react';
import type { Member, MemberStatus, Plan, User } from '../../types';
import { db } from '../../services/db';
import { formatDate } from '../../utils/date';
import { Users, Search, UserPlus, CreditCard, Edit, Trash2, X } from 'lucide-react';

interface MembersViewProps {
  onGoToPayment: (member: Member) => void;
  openNewModalDirectly?: boolean;
  currentUser?: User;
}

export const MembersView: React.FC<MembersViewProps> = ({ onGoToPayment, openNewModalDirectly = false, currentUser }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MemberStatus>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(openNewModalDirectly);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [formData, setFormData] = useState({
    dni: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emergencyContact: '',
    medicalNotes: '',
    planId: '1',
    expirationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (openNewModalDirectly) {
      handleOpenNewModal();
    }
  }, [openNewModalDirectly]);

  const loadData = () => {
    setMembers(db.getMembers());
    setPlans(db.getPlans());
  };

  const handleOpenNewModal = () => {
    setEditingMember(null);
    setFormData({
      dni: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      emergencyContact: '',
      medicalNotes: '',
      planId: plans[0]?.id || '1',
      expirationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({
      dni: member.dni,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      email: member.email || '',
      emergencyContact: member.emergencyContact || '',
      medicalNotes: member.medicalNotes || '',
      planId: member.planId,
      expirationDate: member.expirationDate,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dni.trim() || !formData.firstName.trim() || !formData.lastName.trim()) return;

    const selectedPlan = plans.find(p => p.id === formData.planId);

    db.saveMember({
      id: editingMember ? editingMember.id : undefined,
      dni: formData.dni.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      emergencyContact: formData.emergencyContact.trim(),
      medicalNotes: formData.medicalNotes.trim(),
      planId: formData.planId,
      planName: selectedPlan ? selectedPlan.name : 'Musculación Mensual',
      expirationDate: formData.expirationDate,
    }, currentUser);

    loadData();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar a ${name}?`)) {
      db.deleteMember(id, currentUser);
      loadData();
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.dni.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Socios ({members.length})
          </h2>
        </div>
        <button
          onClick={handleOpenNewModal}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-2.5 rounded-xl transition text-xs sm:text-sm flex items-center gap-1.5 shadow"
        >
          <UserPlus className="w-4 h-4" />
          + Registrar Socio
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar DNI o nombre..."
            className="w-full bg-slate-950 border border-slate-800 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-emerald-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-100 text-slate-950 font-black'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              {status === 'ALL' && `Todos (${members.length})`}
              {status === 'ACTIVE' && `🟢 Activos (${members.filter(m => m.status === 'ACTIVE').length})`}
              {status === 'EXPIRING_SOON' && `🟡 Por Vencer (${members.filter(m => m.status === 'EXPIRING_SOON').length})`}
              {status === 'EXPIRED' && `🔴 Vencidos (${members.filter(m => m.status === 'EXPIRED').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Simplified Mobile Cards List */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredMembers.map(member => (
            <div
              key={member.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    {member.firstName} {member.lastName}
                  </h3>
                  <span className="text-xs font-mono text-slate-400 font-bold block mt-0.5">
                    DNI: {member.dni}
                  </span>
                </div>

                <div>
                  {member.status === 'ACTIVE' && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-lg">
                      Activo
                    </span>
                  )}
                  {member.status === 'EXPIRING_SOON' && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-lg">
                      Por Vencer
                    </span>
                  )}
                  {member.status === 'EXPIRED' && (
                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded-lg">
                      Vencido
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">{member.planName}</span>
                <span className="font-mono font-bold text-amber-400">Vence: {formatDate(member.expirationDate)}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onGoToPayment(member)}
                  className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Cobrar
                </button>
                <button
                  onClick={() => handleOpenEditModal(member)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(member.id, `${member.firstName} ${member.lastName}`)}
                  className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 px-2.5 py-2 rounded-xl text-xs transition border border-rose-800/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500">
          <p className="font-bold text-white text-sm">No hay socios</p>
        </div>
      )}

      {/* Modal: Add / Edit Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base text-white">
                {editingMember ? 'Editar Socio' : 'Nuevo Socio'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">DNI*</label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={e => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="38450123"
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="1154238910"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre*</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Carlos"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Apellido*</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="González"
                    className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Plan Inicial</label>
                  <select
                    value={formData.planId}
                    onChange={e => setFormData({ ...formData, planId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-2.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price.toLocaleString('es-AR')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Vencimiento</label>
                  <input
                    type="date"
                    required
                    value={formData.expirationDate}
                    onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs px-2 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contacto de Emergencia</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="María (Esposa) - 1144332211"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                />
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
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-md"
                >
                  {editingMember ? 'Guardar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
