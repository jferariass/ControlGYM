import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import type { ActiveTab } from './components/layout/Navbar';
import { ReceptionView } from './components/reception/ReceptionView';
import { MembersView } from './components/members/MembersView';
import { PaymentsView } from './components/payments/PaymentsView';
import { DashboardView } from './components/dashboard/DashboardView';
import { SettingsView } from './components/settings/SettingsView';
import type { Member } from './types';
import { db } from './services/db';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reception');
  const [paymentSelectedMember, setPaymentSelectedMember] = useState<Member | null>(null);
  const [openNewMemberModal, setOpenNewMemberModal] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    updatePendingCount();
  }, [activeTab]);

  const updatePendingCount = () => {
    const members = db.getMembers();
    const count = members.filter(m => m.status === 'EXPIRING_SOON' || m.status === 'EXPIRED').length;
    setPendingCount(count);
  };

  const handleGoToPayment = (member: Member) => {
    setPaymentSelectedMember(member);
    setActiveTab('payments');
  };

  const handleGoToNewMember = () => {
    setOpenNewMemberModal(true);
    setActiveTab('members');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation (Sidebar for PC / Top & 5 Bottom Tabs for Mobile) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setOpenNewMemberModal(false);
        }}
        pendingExpiringCount={pendingCount}
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
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            onGoToPayment={handleGoToPayment}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>
    </div>
  );
}

export default App;
