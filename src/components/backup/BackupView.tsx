import React, { useState } from 'react';
import { db } from '../../services/db';
import { exportGymDataToExcel } from '../../utils/excel';
import { Database, FileSpreadsheet, Download, Upload, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const BackupView: React.FC = () => {
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExportExcel = () => {
    try {
      exportGymDataToExcel();
      setNotification({
        message: '¡Planilla Excel (.xlsx) generada correctamente! Ya podés guardarla en tu Google Drive.',
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
      a.download = `ControlGYM_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setNotification({
        message: 'Respaldo completo de la Base de Datos descargado correctamente (JSON).',
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
            message: '¡Base de Datos restaurada exitosamente desde el archivo de respaldo!',
            type: 'success',
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setNotification({
            message: 'El archivo de respaldo no tiene el formato válido.',
            type: 'error',
          });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            Mantenimiento y Resguardo de Datos (Modelo Híbrido)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Herramientas de respaldo para servicio técnico, exportación a Excel para Google Drive y restauración ante emergencias.
          </p>
        </div>
      </div>

      {notification && (
        <div className={`p-5 rounded-2xl flex items-center gap-3 border shadow-lg ${
          notification.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
            : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
          )}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Grid Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Option 1: Excel Backup for Google Drive */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Exportar a Excel / Google Drive</h3>
            <p className="text-xs text-slate-400 mt-1">
              Generá la planilla consolidada en formato Excel (`.xlsx`) con las pestañas de **Socios, Historial de Cobros y Asistencias**.
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-6 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            Descargar Planilla Excel (.xlsx)
          </button>
        </div>

        {/* Option 2: Full System Database Backup (JSON) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Respaldo Integral de Base de Datos</h3>
            <p className="text-xs text-slate-400 mt-1">
              Descargá un archivo de respaldo completo en formato JSON para guardar como soporte técnico de mantenimiento.
            </p>
          </div>

          <button
            onClick={handleExportJSON}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-extrabold py-3.5 px-6 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Descargar Respaldo JSON Completo
          </button>
        </div>

      </div>

      {/* Maintenance Restoration Box */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-400" />
          Restauración de Emergencia (Servicio de Mantenimiento)
        </h3>
        <p className="text-xs text-slate-400">
          Si el cliente borró información o realizó modificaciones incorrectas, seleccioná un archivo de respaldo `.json` previamente exportado para recuperar todos los datos.
        </p>

        <label className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold px-6 py-3 rounded-xl text-sm cursor-pointer transition">
          <Upload className="w-4 h-4 text-emerald-400" />
          <span>Cargar y Restaurar Archivo JSON</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
