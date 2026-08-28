import React, { useState } from 'react';
import type { User } from '../../types';
import { db } from '../../services/db';
import { Dumbbell, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const users = db.getUsers();

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(null);
      
      // Auto-submit on 4 digits if matches
      if (newPin.length === 4) {
        const authenticatedUser = db.authenticatePin(newPin);
        if (authenticatedUser) {
          onLoginSuccess(authenticatedUser);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    const user = db.authenticatePin(pin);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('PIN incorrecto. Por favor verifique.');
      setPin('');
    }
  };

  const handleSelectQuickUser = (selectedUser: User) => {
    setPin(selectedUser.pin);
    onLoginSuccess(selectedUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 font-black">
          <Dumbbell className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">ControlGYM PWA</h1>
        <p className="text-xs text-slate-400 font-medium">Ingresá tu PIN de acceso para iniciar el turno</p>
      </div>

      {/* Main Login Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
        
        {/* Display PIN Dots */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Ingresá PIN (4 DÍGITOS)
          </span>
          <div className="flex items-center justify-center gap-3 h-8">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  pin.length > idx
                    ? 'bg-emerald-400 border-emerald-400 shadow-md shadow-emerald-400/50 scale-110'
                    : 'bg-slate-900 border-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Tactile Numpad */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xl py-3.5 rounded-2xl border border-slate-800/80 active:scale-95 transition shadow"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="bg-slate-950 hover:bg-slate-800 text-slate-400 font-bold text-xs py-3.5 rounded-2xl border border-slate-800 active:scale-95 transition"
            >
              Borrar
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xl py-3.5 rounded-2xl border border-slate-800/80 active:scale-95 transition shadow"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="bg-slate-950 hover:bg-slate-800 text-rose-400 font-bold text-xs py-3.5 rounded-2xl border border-slate-800 active:scale-95 transition"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-2xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            ENTRAR
          </button>
        </form>

        {/* Quick User Selector Demo */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">
            Perfiles Registrados (Prueba Rápida)
          </span>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectQuickUser(u)}
                className="w-full bg-slate-950 hover:bg-slate-800/80 p-2.5 rounded-xl border border-slate-800 text-left flex items-center justify-between text-xs transition"
              >
                <div className="flex items-center gap-2">
                  {u.role === 'ADMIN' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="font-bold text-white">{u.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  PIN: {u.pin} ({u.role === 'ADMIN' ? 'Dueño' : 'Empleado'})
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

      <p className="text-[11px] text-slate-600 mt-6 font-medium">
        ControlGYM PWA Multi-Rol v2.0
      </p>
    </div>
  );
};
