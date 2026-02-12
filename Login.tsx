
import React from 'react';
import { Cpu, ShieldCheck, User, ShieldAlert, Settings, HardDrive } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full space-y-12">
        {/* Branding Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-slate-900 border-2 border-slate-800 rounded-3xl flex items-center justify-center text-indigo-500 shadow-2xl mx-auto">
            <Cpu size={40} />
          </div>
          <div>
            <h1 className="text-white font-black tracking-tighter text-4xl uppercase">RBS Textile</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Industrial Management System — Local Edition</p>
          </div>
        </div>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RoleButton 
            role={UserRole.DEVELOPER}
            title="Developer"
            description="Root Access & System Protection"
            icon={<ShieldAlert size={28} />}
            color="indigo"
            onClick={() => onLogin(UserRole.DEVELOPER)}
          />
          <RoleButton 
            role={UserRole.ADMIN}
            title="Admin"
            description="Payroll, Reports & Config"
            icon={<Settings size={28} />}
            color="emerald"
            onClick={() => onLogin(UserRole.ADMIN)}
          />
          <RoleButton 
            role={UserRole.OPERATOR}
            title="Operator"
            description="Daily Logs & Floor Entries"
            icon={<User size={28} />}
            color="slate"
            onClick={() => onLogin(UserRole.OPERATOR)}
          />
        </div>

        {/* Footer Security Notice */}
        <div className="flex flex-col items-center gap-4">
           <div className="flex items-center gap-2 text-slate-700 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck size={14} /> Local Data Persistence Active
           </div>
           <div className="flex items-center gap-6 px-6 py-3 bg-slate-900/50 rounded-2xl border border-slate-800/50">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Database: Offline</span>
              </div>
              <div className="w-[1px] h-3 bg-slate-800"></div>
              <div className="flex items-center gap-2">
                 <HardDrive size={12} className="text-slate-600" />
                 <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Encryption: SHA-256</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

interface RoleButtonProps {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'slate';
  onClick: () => void;
}

const RoleButton: React.FC<RoleButtonProps> = ({ title, description, icon, color, onClick }) => {
  const colorClasses = {
    indigo: 'border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500 text-indigo-400 hover:text-white',
    emerald: 'border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500 text-emerald-400 hover:text-white',
    slate: 'border-slate-500/20 hover:border-slate-400 bg-slate-500/5 hover:bg-slate-700 text-slate-400 hover:text-white'
  };

  return (
    <button 
      onClick={onClick}
      className={`group flex flex-col items-center text-center p-8 rounded-[2.5rem] border-2 transition-all duration-300 active:scale-95 shadow-xl ${colorClasses[color]}`}
    >
      <div className="mb-6 p-4 rounded-2xl bg-black/20 group-hover:bg-white/20 transition-colors">
        {icon}
      </div>
      <h3 className="font-black text-xl uppercase tracking-tight mb-2">{title}</h3>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-relaxed px-2">
        {description}
      </p>
    </button>
  );
}

export default Login;
