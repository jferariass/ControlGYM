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
import { LoginView } from './components/auth/LoginView';
import type { Member, User } from './types';
import { db } from './services/db';

const SESSION_KEY = 'controlgym_session_user_v2';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('reception');
  const [paymentSelectedMember, setPaymentSelectedMember] = useState<Member | null>(null);
  const [openNewMemberModal, setOpenNewMemberModal] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    updatePendingCount();
  }, [activeTab, currentUser]);

  const updatePendingCount = () => {
    const members = db.getMembers();
    const count = members.filter(m => m.status === 'EXPIRING_SOON' || m.status === 'EXPIRED').length;
    setPendingCount(count);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setActiveTab('reception');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const handleGoToPayment = (member: Member) => {
    setPaymentSelectedMember(member);
    setActiveTab('payments');
  };

  const handleGoToNewMember = () => {
    setOpenNewMemberModal(true);
    setActiveTab('members');
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

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
          />
        )}

        {activeTab === 'members' && (
          <MembersView
            onGoToPayment={handleGoToPayment}
            openNewModalDirectly={openNewMemberModal}
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

        {activeTab === 'settings' && currentUser.role === 'ADMIN' && (
          <SettingsView />
        )}
      </main>
    </div>
  );
}

export default App;
