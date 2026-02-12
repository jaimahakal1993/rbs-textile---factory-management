
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Shield, 
  Trash2, 
  RefreshCw, 
  Download, 
  Upload,
  Monitor,
  Terminal,
  Cpu,
  ShieldAlert,
  Clock,
  ShieldCheck,
  Package,
  FileCode,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { db, BackupConfig } from '../db';
import { UserRole } from '../types';

interface SettingsViewProps {
  userRole: UserRole;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'DEPLOY'>('SYSTEM');
  const [backupStatus, setBackupStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(() => db.getBackupConfig());

  const handleBackup = () => {
    setBackupStatus('LOADING');
    setTimeout(() => {
      db.backup();
      setBackupStatus('SUCCESS');
      setBackupConfig(db.getBackupConfig()); 
      setTimeout(() => setBackupStatus('IDLE'), 3000);
    }, 1000);
  };

  const updateAutoBackup = (updates: Partial<BackupConfig>) => {
    db.updateBackupConfig(updates);
    setBackupConfig({ ...backupConfig, ...updates });
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (confirm('Restoring will overwrite current data. Continue?')) {
        try {
          await db.restore(e.target.files[0]);
          alert('System Restored Successfully! Reloading...');
          window.location.reload();
        } catch (err) {
          alert('Invalid Backup File');
        }
      }
    }
  };

  const handleReset = () => {
    if(confirm("CRITICAL WARNING: This will permanently WIPE ALL data. IRREVERSIBLE.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Settings Navigation */}
      <div className="flex gap-4 border-b border-slate-200 pb-4 no-print">
         <button 
           onClick={() => setActiveTab('SYSTEM')}
           className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'SYSTEM' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
         >
           <Database size={14} /> System Core
         </button>
         <button 
           onClick={() => setActiveTab('DEPLOY')}
           className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'DEPLOY' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
         >
           <Package size={14} /> Deploy Local (.exe)
         </button>
      </div>

      {activeTab === 'SYSTEM' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           <div className="space-y-6">
              <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                 <ShieldCheck className="text-emerald-500" size={32} />
                 <h4 className="text-sm font-black uppercase text-slate-900">Local Integrity</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">System status: OFFLINE. Your data is strictly persisted to the local machine disk.</p>
              </div>
              
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-indigo-400">Auto-Vault</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={backupConfig.enabled} onChange={e => updateAutoBackup({enabled: e.target.checked})} />
                      <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                 </div>
                 <p className="text-[11px] font-medium text-slate-400">Schedule automatic exports to prevent data loss.</p>
              </div>
           </div>

           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 space-y-8">
                 <h4 className="font-black text-slate-800 uppercase text-base tracking-tight flex items-center gap-3">
                    <HardDrive size={20} className="text-indigo-600" />
                    Data Maintenance
                 </h4>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button onClick={handleBackup} className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-600 transition-all group">
                       <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Download size={24} />
                       </div>
                       <div className="text-left">
                          <p className="text-xs font-black uppercase text-slate-900">Manual Export</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">JSON Snapshot</p>
                       </div>
                    </button>

                    <div className="relative">
                       <input type="file" accept=".json" onChange={handleRestore} className="absolute inset-0 opacity-0 cursor-pointer" id="res-in" />
                       <label htmlFor="res-in" className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-600 transition-all cursor-pointer group">
                          <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                             <Upload size={24} />
                          </div>
                          <div className="text-left">
                             <p className="text-xs font-black uppercase text-slate-900">Import Data</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase">System Restore</p>
                          </div>
                       </label>
                    </div>
                 </div>
              </div>

              {userRole === UserRole.DEVELOPER && (
                <div className="bg-rose-50 rounded-[2.5rem] p-10 border border-rose-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <ShieldAlert size={32} className="text-rose-600" />
                      <div>
                         <h4 className="text-sm font-black uppercase text-rose-900">Emergency Factory Wipe</h4>
                         <p className="text-[10px] font-bold uppercase text-rose-400">IRREVERSIBLE DATA DELETION</p>
                      </div>
                   </div>
                   <button onClick={handleReset} className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-rose-700 shadow-xl shadow-rose-200">Wipe Database</button>
                </div>
              )}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-8 duration-500">
           {/* Deployment Info Section */}
           <div className="space-y-8">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
                 <div className="absolute -right-12 -bottom-12 opacity-10">
                    <Package size={280} />
                 </div>
                 <div className="relative z-10 space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Deployment Wizard</h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                       To generate a native Windows <b>.exe</b> or Linux <b>AppImage</b>, follow the industrial build sequence. This "compiles" your app into a single, professional software file.
                    </p>
                    
                    {/* Pre-flight Checklist */}
                    <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Pre-Flight Checklist</h4>
                       <div className="space-y-3">
                          <CheckItem label="Node.js Installed (18+)" />
                          <CheckItem label="Source Code in local folder" />
                          <CheckItem label="Terminal / CMD access" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm space-y-6">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Target Output Binaries</h4>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[9px] font-black uppercase">Production Ready</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-2xl flex flex-col items-center gap-3 border border-slate-100 group hover:border-indigo-600 transition-colors">
                       <Monitor size={32} className="text-indigo-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Windows (.exe)</span>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl flex flex-col items-center gap-3 border border-slate-100 group hover:border-indigo-600 transition-colors">
                       <Terminal size={32} className="text-indigo-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Linux (AppImage)</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Command Sequence Section */}
           <div className="space-y-8">
              <div className="bg-slate-950 rounded-[2.5rem] p-10 shadow-2xl space-y-8 border border-white/5">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Terminal size={20} className="text-indigo-400" />
                       <h3 className="text-white text-sm font-black uppercase tracking-widest">Build Terminal Commands</h3>
                    </div>
                    <a href="https://nodejs.org" target="_blank" className="text-indigo-400 hover:text-white transition-colors"><ExternalLink size={16} /></a>
                 </div>

                 <div className="space-y-6">
                    <BuildStep 
                      step="1" 
                      title="Install Build Engine" 
                      description="Downloads packaging tools"
                      cmd="npm install" 
                    />
                    <BuildStep 
                      step="2" 
                      title="Create Native Bundle" 
                      description="Wraps files into binary"
                      cmd="npm run package" 
                    />
                    <BuildStep 
                      step="3" 
                      title="Export Final Binaries" 
                      description="Generates .exe and .zip"
                      cmd="npm run make" 
                    />
                 </div>

                 <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Final .EXE Location</p>
                       <AlertCircle size={12} className="text-indigo-400" />
                    </div>
                    <p className="text-[10px] font-mono text-indigo-200 break-all bg-black/40 p-2 rounded">/out/make/squirrel.windows/x64/RBS-Textile-Setup.exe</p>
                 </div>
              </div>

              <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
                    <ShieldCheck size={20} />
                 </div>
                 <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase">
                    After Step 3, you can copy the <b>Setup.exe</b> to a Pendrive and install it on any factory computer.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const CheckItem = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center">
       <CheckCircle2 size={10} className="text-white" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</span>
  </div>
);

const BuildStep = ({ step, title, description, cmd }: any) => (
  <div className="flex gap-6 group">
     <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 font-black shrink-0 group-hover:border-indigo-500 transition-all shadow-lg">
        {step}
     </div>
     <div className="space-y-2 flex-1">
        <div className="flex justify-between items-baseline">
           <p className="text-[11px] font-black text-white uppercase tracking-widest">{title}</p>
           <p className="text-[9px] font-black text-slate-600 uppercase italic">{description}</p>
        </div>
        <div className="p-3 bg-black/60 border border-white/5 rounded-xl font-mono text-[10px] text-emerald-400 flex justify-between items-center group/cmd hover:bg-black transition-colors">
           <span>{cmd}</span>
           <button 
             onClick={() => navigator.clipboard.writeText(cmd)}
             className="text-slate-700 hover:text-white transition-colors"
           >
              <Copy size={12} />
           </button>
        </div>
     </div>
  </div>
);

export default SettingsView;
