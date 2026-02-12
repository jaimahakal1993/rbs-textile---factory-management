
import React, { useMemo, useState } from 'react';
import { db } from '../db';
import { LotStatus } from '../types';
import { TrendingUp, Users, Package, AlertCircle, Search, Calendar as CalendarIcon, Filter, Layers, Box } from 'lucide-react';

const Dashboard: React.FC = () => {
  const workers = db.getWorkers();
  const lots = db.getLots();
  const jobWorks = db.getJobWorks();
  const payments = db.getPayments();

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [lotSearch, setLotSearch] = useState('');

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Production today is sum of pieces paid/processed today
    const productionToday = jobWorks
      .filter(jw => jw.date === today && jw.qtyCompleted > 0)
      .reduce((sum, jw) => sum + jw.qtyCompleted, 0);
      
    const paymentToday = payments
      .filter(p => p.date === today)
      .reduce((sum, p) => sum + p.netPayable, 0);
      
    // UNFINISHED PIECES ON FLOOR (Sum of all qtyGiven - qtyCompleted for unpaid jobs)
    const floorBalance = jobWorks
      .filter(jw => !jw.paymentId)
      .reduce((sum, jw) => sum + (jw.qtyGiven - jw.qtyCompleted), 0);

    const activeLotsCount = lots.filter(l => l.status === LotStatus.RUNNING).length;

    return { productionToday, paymentToday, floorBalance, activeLotsCount };
  }, [jobWorks, payments, lots]);

  const dailyHistory = useMemo(() => {
    return jobWorks.filter(jw => {
      const matchDate = jw.date === dateFilter;
      const lot = lots.find(l => l.id === jw.lotId);
      const matchLot = lotSearch ? (lot?.lotNumber.includes(lotSearch) || lot?.design.toLowerCase().includes(lotSearch.toLowerCase())) : true;
      return matchDate && matchLot;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [jobWorks, dateFilter, lotSearch, lots]);

  const getWorkerName = (id: string) => workers.find(w => w.id === id)?.name || 'Unknown';
  const getLotNo = (id: string) => lots.find(l => l.id === id)?.lotNumber || '???';
  const getStageName = (lotId: string, stageId: string) => {
    const lot = lots.find(l => l.id === lotId);
    return lot?.stageRates?.find(s => s.id === stageId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <StatCard 
          label="Floor Yield Today" 
          value={stats.productionToday} 
          unit="Ops Done" 
          icon={<TrendingUp className="text-indigo-600" />} 
          color="indigo" 
        />
        <StatCard 
          label="Unpaid Floor Stock" 
          value={stats.floorBalance} 
          unit="Pcs Balance"
          icon={<Box className="text-amber-600" />} 
          color="amber" 
        />
        <StatCard 
          label="Live Designs" 
          value={stats.activeLotsCount} 
          icon={<AlertCircle className="text-sky-600" />} 
          color="sky" 
        />
        <StatCard 
          label="Daily Cash Settle" 
          value={`₹${stats.paymentToday}`} 
          icon={<Package className="text-emerald-600" />} 
          color="emerald" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
                 <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Daily Production Feed</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Stitching Floor Operations</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="relative">
                       <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={14} />
                       <input 
                        type="date" 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-[11px] font-black uppercase text-slate-600 shadow-sm"
                       />
                    </div>
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-slate-100">
                     <tr>
                       <th className="px-8 py-4">Worker</th>
                       <th className="px-8 py-4">Lot Context</th>
                       <th className="px-8 py-4">Stage</th>
                       <th className="px-8 py-4 text-right">In-Hand / Done</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {dailyHistory.map(jw => (
                        <tr key={jw.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-4 font-black text-slate-900 uppercase">{getWorkerName(jw.workerId)}</td>
                           <td className="px-8 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-tighter">
                                LOT {getLotNo(jw.lotId)}
                              </span>
                           </td>
                           <td className="px-8 py-4 font-bold text-slate-500 uppercase text-[10px]">{getStageName(jw.lotId, jw.stageId)}</td>
                           <td className="px-8 py-4 text-right">
                              <div className="inline-flex flex-col items-end">
                                 <span className="font-black text-slate-900">{jw.qtyGiven} Pcs</span>
                                 <span className={`text-[8px] font-black uppercase ${jw.paymentId ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {jw.paymentId ? 'Fully Paid' : 'Pending Payment'}
                                 </span>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="space-y-8 no-print">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Production Audit</h4>
                 <div className="space-y-6">
                    <div>
                       <p className="text-3xl font-black text-white tracking-tighter mb-1">{stats.floorBalance} PCS</p>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Balance With Workers</p>
                    </div>
                    <div className="h-[1px] bg-white/10 w-full"></div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">System is tracking all balance pieces automatically. Unpaid work will appear in the next settlement run.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit, icon, color }: any) => {
  const colorMap: any = {
    indigo: 'bg-white border-indigo-100',
    amber: 'bg-white border-amber-100',
    sky: 'bg-white border-sky-100',
    emerald: 'bg-white border-emerald-100',
  };

  return (
    <div className={`p-8 rounded-[2rem] border-2 transition-all hover:-translate-y-1 shadow-sm ${colorMap[color]}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${color === 'indigo' ? 'bg-indigo-50' : color === 'amber' ? 'bg-amber-50' : color === 'sky' ? 'bg-sky-50' : 'bg-emerald-50'}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
          {unit && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
