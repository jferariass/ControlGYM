import React from 'react';
import { QrCode, Users, CreditCard, LayoutDashboard, Settings, Dumbbell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ActiveTab = 'reception' | 'members' | 'payments' | 'dashboard' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingExpiringCount: number;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  badge?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, pendingExpiringCount }) => {
  const navItems: NavItem[] = [
    { id: 'reception', label: 'Recepción', shortLabel: 'Recepción', icon: QrCode },
    { id: 'members', label: 'Socios', shortLabel: 'Socios', icon: Users },
    { id: 'payments', label: 'Cobros y Tickets', shortLabel: 'Cobros', icon: CreditCard },
    { 
      id: 'dashboard', 
      label: 'Panel & Caja', 
      shortLabel: 'Panel', 
      icon: LayoutDashboard,
      badge: pendingExpiringCount > 0 ? pendingExpiringCount : undefined 
    },
    { id: 'settings', label: 'Ajustes', shortLabel: 'Ajustes', icon: Settings },
  ];

  const currentItem = navItems.find(i => i.id === activeTab);

  return (
    <>
      {/* PC / Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-100 min-h-screen p-6 select-none shrink-0">
        {/* Logo Brand */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-emerald-500 p-2.5 rounded-xl text-slate-950 font-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white">ControlGYM</h1>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Recepción PWA</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 font-bold scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-800/80 text-xs text-slate-500">
          <p className="font-semibold text-slate-400">ControlGYM PWA v1.0</p>
          <p className="mt-1">Modo Híbrido | Respaldos OK</p>
        </div>
      </aside>

      {/* Mobile Header + 5 Clean Bottom Tabs */}
      <div className="md:hidden flex flex-col w-full">
        {/* Top Header */}
        <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500 p-1.5 rounded-lg text-slate-950 font-black">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span className="font-black text-base tracking-tight text-white">ControlGYM</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {currentItem?.label}
            </span>
          </div>
        </header>

        {/* 5 Perfect Spaced Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-1.5 py-2 shadow-2xl">
          <div className="flex items-center justify-between max-w-md mx-auto px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                    isActive
                      ? 'text-emerald-400 font-black scale-105'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="relative">
                    <div className={`p-1.5 rounded-xl ${isActive ? 'bg-emerald-500/10 border border-emerald-500/30' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5 font-medium">{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};
