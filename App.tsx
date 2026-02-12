
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Settings, 
  HelpCircle, 
  Printer, 
  Save, 
  Search, 
  User, 
  Clipboard, 
  PieChart, 
  Truck,
  LayoutDashboard,
  LogOut,
  Bell,
  HardDrive,
  Cpu,
  ShieldCheck,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { db } from './db';
import { UserRole } from './types';
import Dashboard from './components/Dashboard';
import WorkerManagement from './components/WorkerManagement';
import LotManagement from './components/LotManagement';
import JobWorkEntry from './components/JobWorkEntry';
import Payments from './components/Payments';
import Reports from './components/Reports';
import SettingsView from './components/SettingsView';
import Login from './components/Login';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    return localStorage.getItem('rbs_active_role') as UserRole || null;
  });

  useEffect(() => {
    setDbStatus(db.getDbStatus());

    const heartbeat = setInterval(() => {
      const config = db.getBackupConfig();
      if (!config.enabled) return;

      const now = Date.now();
      const last = config.lastBackup;
      
      const intervalsInMs = {
        'hourly': 3600000,
        '12h': 43200000,
        'daily': 86400000,
        'weekly': 604800000
      };

      const threshold = intervalsInMs[config.interval];
      
      if (now - last >= threshold) {
        db.backup(true);
      }
    }, 60000);

    return () => clearInterval(heartbeat);
  }, []);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('rbs_active_role', role);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('rbs_active_role');
  };

  if (!userRole) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#eaeff5] overflow-hidden font-sans text-slate-900">
      <aside className="w-64 bg-slate-950 flex flex-col no-print border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-indigo-400 shadow-xl">
            <Cpu size={22} />
          </div>
          <div>
            <h1 className="text-white font-black tracking-tight text-lg leading-none uppercase">RBS Textile</h1>
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1 block">Desktop Enterprise Edition</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          <NavButton icon={<LayoutDashboard size={18} />} label="Main Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<Truck size={18} />} label="Stitching Lots" active={activeTab === 'lots'} onClick={() => setActiveTab('lots')} />
          <NavButton icon={<User size={18} />} label="Worker Directory" active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} />
          <NavButton icon={<Clipboard size={18} />} label="Daily Work Logs" active={activeTab === 'jobwork'} onClick={() => setActiveTab('jobwork')} />
          
          {(userRole === UserRole.DEVELOPER || userRole === UserRole.ADMIN) && (
            <NavButton icon={<Save size={18} />} label="Payroll & Advances" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
          )}

          <div className="pt-6 pb-2 px-4">
             <span className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">Factory Suite</span>
          </div>

          {(userRole === UserRole.DEVELOPER || userRole === UserRole.ADMIN) && (
            <NavButton icon={<PieChart size={18} />} label="Production Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          )}

          {(userRole === UserRole.DEVELOPER || userRole === UserRole.ADMIN) && (
            <NavButton 
              icon={userRole === UserRole.DEVELOPER ? <ShieldAlert size={18} /> : <Settings size={18} />} 
              label={userRole === UserRole.DEVELOPER ? "Protection" : "Software Settings"}
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          )}
        </nav>

        <div className="p-4 bg-slate-900/50">
           <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500">
                 <span>{userRole} Mode</span>
                 <button onClick={handleLogout} className="text-indigo-400 hover:text-white flex items-center gap-1 transition-colors">
                    <LogOut size={10} /> Exit
                 </button>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                 <div className={`h-full w-full ${userRole === UserRole.DEVELOPER ? 'bg-indigo-500' : userRole === UserRole.ADMIN ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 no-print shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-slate-900 font-black text-sm uppercase tracking-widest">{activeTab.replace('-', ' ')}</h2>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <span className="text-slate-400 text-[10px] font-bold flex items-center gap-2">
              <HardDrive size={12} /> Native App Directory
            </span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{userRole} Session Active</span>
             </div>
             <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                <Lock size={18} />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-[#eaeff5] custom-scrollbar">
           <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'workers' && <WorkerManagement />}
            {activeTab === 'lots' && <LotManagement />}
            {activeTab === 'jobwork' && <JobWorkEntry />}
            {activeTab === 'payments' && <Payments userRole={userRole} />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'settings' && <SettingsView userRole={userRole} />}
           </div>
        </div>

        <footer className="h-7 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between no-print text-[9px] font-black uppercase tracking-widest text-slate-500">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-500"></div> System: NATIVE EXE</span>
              <span className="flex items-center gap-1.5">DB ENCRYPTION: ACTIVE</span>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => db.backup()} className="hover:text-slate-900 transition-colors flex items-center gap-1">
                <Save size={10} /> Local Export
              </button>
              <div className="h-3 w-[1px] bg-slate-300"></div>
              <span>{new Date().toLocaleDateString()}</span>
           </div>
        </footer>
      </main>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 group ${
      active 
        ? 'bg-slate-800 text-white border border-white/10 shadow-lg' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
    }`}
  >
    <span className={`${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>{icon}</span>
    <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
