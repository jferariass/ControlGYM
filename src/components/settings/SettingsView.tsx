import React, { useState, useEffect } from 'react';
import type { Plan } from '../../types';
import { db } from '../../services/db';
import type { GymSettings } from '../../services/db';
import { Settings, DollarSign, Plus, Edit, Trash2, Save, CheckCircle2, Building, X, Database, Download, Upload, ShieldCheck, RefreshCw } from 'lucide-react';
import { exportGymDataToExcel } from '../../utils/excel';

export const SettingsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'plans' | 'backup'>('general');

  const [settings, setSettings] = useState<GymSettings>({
    name: '',
    address: '',
    phone: '',
    cuit: '',
    bankAlias: '',
    ticketFooter: '',
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    price: 0,
    durationDays: 30,
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSettings(db.getSettings());
    setPlans(db.getPlans());
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveSettings(settings);
    setNotification({
      message: '¡Configuración del gimnasio guardada correctamente!',
      type: 'success',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenNewPlan = () => {
    setEditingPlan(null);
    setPlanFormData({
      name: '',
      price: 25000,
      durationDays: 30,
      description: '',
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      description: plan.description,
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormData.name.trim() || planFormData.price <= 0) return;

    db.savePlan({
      id: editingPlan ? editingPlan.id : undefined,
      name: planFormData.name.trim(),
      price: Number(planFormData.price),
      durationDays: Number(planFormData.durationDays),
      description: planFormData.description.trim(),
    });

    loadData();
    setIsPlanModalOpen(false);
    setNotification({
      message: editingPlan ? 'Plan actualizado correctamente.' : 'Nuevo plan registrado.',
      type: 'success',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeletePlan = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el plan "${name}"?`)) {
      db.deletePlan(id);
      loadData();
    }
  };

  // Backup functions
  const handleExportExcel = () => {
    try {
      exportGymDataToExcel();
      setNotification({
        message: '¡Planilla Excel (.xlsx) generada correctamente! Lista para Google Drive.',
        type: 'success',
      });
    } catch (err) {
      setNotification({
        message: 'Ocurrió un error al generar la planilla Excel.',
        type: 'error',
      });
    }
  };

  const handleExportJSON = () => {
    try {
      const jsonStr = db.exportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ControlGYM_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setNotification({
        message: 'Respaldo JSON descargado correctamente.',
        type: 'success',
      });
    } catch (err) {
      setNotification({
        message: 'Error al exportar el respaldo JSON.',
        type: 'error',
      });
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = db.importBackupJSON(content);
        if (success) {
          setNotification({
            message: '¡Base de Datos restaurada exitosamente desde el respaldo!',
            type: 'success',
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setNotification({
            message: 'El archivo de respaldo no es válido.',
            type: 'error',
          });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow">
        <h2 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          Ajustes del Sistema
        </h2>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border shadow-md ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-xs sm:text-sm">{notification.message}</span>
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'general'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          Gimnasio
        </button>

        <button
          onClick={() => setActiveSubTab('plans')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'plans'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Planes y Precios
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'backup'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          Copia & Backup
        </button>
      </div>

      {/* Section 1: General Settings */}
      {activeSubTab === 'general' && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl space-y-4 max-w-2xl mx-auto">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" />
            Datos Comerciales del Gimnasio
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Gimnasio</label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={e => setSettings({ ...settings, name: e.target.value })}
                placeholder="Ej: ControlGYM Fitness"
                className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="1122334455"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">CUIT / Razón Social</label>
                <input
                  type="text"
                  value={settings.cuit}
                  onChange={e => setSettings({ ...settings, cuit: e.target.value })}
                  placeholder="30-12345678-9"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Dirección del Establecimiento</label>
              <input
                type="text"
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                placeholder="Av. Principal 1234, Centro"
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Alias / CBU para Transferencias</label>
              <input
                type="text"
                value={settings.bankAlias}
                onChange={e => setSettings({ ...settings, bankAlias: e.target.value })}
                placeholder="gimnasio.control.mp"
                className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Pie de Página del Ticket</label>
              <textarea
                rows={2}
                value={settings.ticketFooter}
                onChange={e => setSettings({ ...settings, ticketFooter: e.target.value })}
                placeholder="¡Gracias por entrenar con nosotros!"
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl outline-none focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              Guardar Datos del Gimnasio
            </button>
          </form>
        </div>
      )}

      {/* Section 2: Plans & Pricing (Clean Responsive Cards) */}
      {activeSubTab === 'plans' && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl space-y-4 max-w-3xl mx-auto">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Mensualidades y Packs ({plans.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Configurá el nombre, duración y precios de las cuotas.</p>
            </div>
            <button
              onClick={handleOpenNewPlan}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              + Nuevo Plan
            </button>
          </div>

          {/* Clean Plan Cards */}
          {plans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-md"
                >
                  {/* Top info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-white text-sm">{plan.name}</h4>
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                        ${plan.price.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-400 font-bold block">
                      ⏱️ Duración: {plan.durationDays} días
                    </span>
                    {plan.description && (
                      <p className="text-xs text-slate-400 pt-1 leading-snug">{plan.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => handleOpenEditPlan(plan)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5 text-emerald-400" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id, plan.name)}
                      className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 p-2 rounded-lg text-xs transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6">No hay planes registrados.</p>
          )}
        </div>
      )}

      {/* Section 3: Backup & Maintenance */}
      {activeSubTab === 'backup' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Excel Export */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              1. Exportar a Excel (Google Drive)
            </h3>
            <p className="text-xs text-slate-400">
              Generá el archivo Excel (`.xlsx`) consolidado con todos los datos de socios, pagos y asistencias.
            </p>
            <button
              onClick={handleExportExcel}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow"
            >
              Descargar Excel (.xlsx)
            </button>
          </div>

          {/* Full Backup */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              2. Respaldo Integral JSON
            </h3>
            <p className="text-xs text-slate-400">
              Descargá el archivo de respaldo técnico completo para guardar en tu disco o la nube.
            </p>
            <button
              onClick={handleExportJSON}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition"
            >
              Descargar Respaldo JSON
            </button>
          </div>

          {/* Restoration */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              3. Restaurar Base de Datos
            </h3>
            <p className="text-xs text-slate-400">
              Cargar un archivo JSON de respaldo para recuperar información ante borrados accidentales.
            </p>
            <label className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Seleccionar Archivo JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Plan */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Plan*</label>
                <input
                  type="text"
                  required
                  value={planFormData.name}
                  onChange={e => setPlanFormData({ ...planFormData, name: e.target.value })}
                  placeholder="Ej: Pase Libre Musculación"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-sm px-3.5 py-2 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Precio ($)*</label>
                  <input
                    type="number"
                    required
                    value={planFormData.price}
                    onChange={e => setPlanFormData({ ...planFormData, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-sm px-3.5 py-2 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duración (Días)*</label>
                  <input
                    type="number"
                    required
                    value={planFormData.durationDays}
                    onChange={e => setPlanFormData({ ...planFormData, durationDays: Number(e.target.value) })}
                    placeholder="30"
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm px-3.5 py-2 rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={planFormData.description}
                  onChange={e => setPlanFormData({ ...planFormData, description: e.target.value })}
                  placeholder="Acceso a sala de máquinas..."
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2 rounded-xl text-xs transition shadow-md"
                >
                  {editingPlan ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
