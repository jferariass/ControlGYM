import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import type { ActiveTab } from './components/layout/Navbar';
import { ReceptionView } from './components/reception/ReceptionView';
import { MembersView } from './components/members/MembersView';
import { PaymentsView } from './components/payments/PaymentsView';
import { DashboardView } from './components/dashboard/DashboardView';
import { SettingsView } from './components/settings/SettingsView';
import { PosView } from './components/pos/PosView';
import { UsersView } from './components/users/UsersView';
import { AuditLogView } from './components/audit/AuditLogView';
import { LoginView } from './components/auth/LoginView';
import type { Member, User } from './types';
import { db } from './services/db';

export function App() {
  // Always require PIN authentication on app open/refresh (starts as null)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('reception');
  const [paymentSelectedMember, setPaymentSelectedMember] = useState<Member | null>(null);
  const [openNewMemberModal, setOpenNewMemberModal] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (currentUser) {
      updatePendingCount();
    }
  }, [activeTab, currentUser]);

  const updatePendingCount = () => {
    const members = db.getMembers();
    const count = members.filter(m => m.status === 'EXPIRING_SOON' || m.status === 'EXPIRED').length;
    setPendingCount(count);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('reception');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleGoToPayment = (member: Member) => {
    setPaymentSelectedMember(member);
    setActiveTab('payments');
  };

  const handleGoToNewMember = () => {
    setOpenNewMemberModal(true);
    setActiveTab('members');
  };

  // 1. MANDATORY PIN ACCESS SCREEN: Clean, empty page with ONLY the PIN Login Modal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 w-full flex items-center justify-center">
        <LoginView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 2. AUTHENTICATED SYSTEM: Render app based on user role (Employee vs Owner)
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation (Sidebar for PC / Top & Bottom Navigation Bar for Mobile) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setOpenNewMemberModal(false);
        }}
        pendingExpiringCount={pendingCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full mb-20 md:mb-0">
        {activeTab === 'reception' && (
          <ReceptionView
            onGoToPayment={handleGoToPayment}
            onGoToNewMember={handleGoToNewMember}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'members' && (
          <MembersView
            onGoToPayment={handleGoToPayment}
            openNewModalDirectly={openNewMemberModal}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsView
            initialSelectedMember={paymentSelectedMember}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'pos' && (
          <PosView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'dashboard' && currentUser.role === 'ADMIN' && (
          <DashboardView
            onGoToPayment={handleGoToPayment}
          />
        )}

        {activeTab === 'users' && currentUser.role === 'ADMIN' && (
          <UsersView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'audit' && currentUser.role === 'ADMIN' && (
          <AuditLogView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'settings' && currentUser.role === 'ADMIN' && (
          <SettingsView />
        )}
      </main>
    </div>
  );
}

export default App;
