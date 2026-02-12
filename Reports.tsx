
import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Layers,
  Users,
  LucideProps,
  FileSpreadsheet,
  FileJson,
  TableProperties
} from 'lucide-react';
import { db } from '../db';
import { LotStatus } from '../types';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<'PRODUCTION' | 'LABOUR' | 'ADVANCE'>('PRODUCTION');
  const [subType, setSubType] = useState<'LOT' | 'STAGE'>('LOT');

  const workers = db.getWorkers();
  const lots = db.getLots();
  const stages = db.getStages();
  const jobWorks = db.getJobWorks();
  const payments = db.getPayments();

  // Global Statistics for Top Bar
  const stats = useMemo(() => {
    const totalIssued = jobWorks.reduce((sum, jw) => sum + jw.qtyGiven, 0);
    const totalFinished = jobWorks.reduce((sum, jw) => sum + jw.qtyCompleted, 0);
    const pending = totalIssued - totalFinished;
    const completionRate = totalIssued > 0 ? Math.round((totalFinished / totalIssued) * 100) : 0;
    const totalWages = payments.reduce((sum, p) => sum + p.totalAmount, 0);

    return { totalIssued, totalFinished, pending, completionRate, totalWages };
  }, [jobWorks, payments]);

  // Production Data: Lot-wise Progress
  const lotReportData = useMemo(() => {
    return lots.map(lot => {
      const lotWork = jobWorks.filter(jw => jw.lotId === lot.id);
      const totalStagesCount = lot.stageRates?.length || 1;
      
      const potentialWork = lot.totalQuantity * totalStagesCount;
      const completedWork = lotWork.reduce((sum, jw) => sum + jw.qtyCompleted, 0);
      const givenWork = lotWork.reduce((sum, jw) => sum + jw.qtyGiven, 0);
      
      const progress = potentialWork > 0 ? Math.round((completedWork / potentialWork) * 100) : 0;
      const status = lot.status === LotStatus.COMPLETED ? 'DONE' : (progress > 90 ? 'FINISHING' : 'IN_PROGRESS');

      return {
        id: lot.id,
        lotNumber: lot.lotNumber,
        design: lot.design,
        totalQty: lot.totalQuantity,
        completedWork,
        givenWork,
        progress,
        status
      };
    });
  }, [lots, jobWorks]);

  // Production Data: Stage-wise Summary
  const stageReportData = useMemo(() => {
    return stages.map(stage => {
      const stageWork = jobWorks.filter(jw => jw.stageId === stage.id);
      const totalGiven = stageWork.reduce((sum, jw) => sum + jw.qtyGiven, 0);
      const totalCompleted = stageWork.reduce((sum, jw) => sum + jw.qtyCompleted, 0);
      const pending = totalGiven - totalCompleted;
      const efficiency = totalGiven > 0 ? Math.round((totalCompleted / totalGiven) * 100) : 0;

      return {
        name: stage.name,
        totalGiven,
        totalCompleted,
        pending,
        efficiency
      };
    });
  }, [stages, jobWorks]);

  // Labour Data
  const labourReportData = useMemo(() => {
    return workers.filter(w => w.isActive).map(worker => {
      const workerPayments = payments.filter(p => p.workerId === worker.id);
      const totalPaid = workerPayments.reduce((sum, p) => sum + p.netPayable, 0);
      const workerWork = jobWorks.filter(jw => jw.workerId === worker.id);
      const piecesCount = workerWork.reduce((sum, jw) => sum + jw.qtyCompleted, 0);
      return { 
        name: worker.name, 
        skill: worker.skill,
        totalPaid, 
        piecesCount, 
        advance: worker.advanceBalance 
      };
    });
  }, [workers, jobWorks, payments]);

  // CSV Export Logic
  const handleExportCSV = () => {
    let dataToExport: any[] = [];
    let headers: string[] = [];
    let fileName = `RBS_Report_${reportType}`;

    if (reportType === 'PRODUCTION') {
      if (subType === 'LOT') {
        fileName += '_By_Lot';
        headers = ['Lot Number', 'Design', 'Total Qty', 'Completed Ops', 'Issued Ops', 'Progress %', 'Status'];
        dataToExport = lotReportData.map(l => [l.lotNumber, l.design, l.totalQty, l.completedWork, l.givenWork, l.progress, l.status]);
      } else {
        fileName += '_By_Stage';
        headers = ['Stage Name', 'Total Issued', 'Total Completed', 'Pending', 'Efficiency %'];
        dataToExport = stageReportData.map(s => [s.name, s.totalGiven, s.totalCompleted, s.pending, s.efficiency]);
      }
    } else if (reportType === 'LABOUR') {
      fileName += '_Labour_Earnings';
      headers = ['Worker Name', 'Skill', 'Pieces Finished', 'Advance Balance', 'Total Paid (INR)'];
      dataToExport = labourReportData.map(w => [w.name, w.skill, w.piecesCount, w.advance, w.totalPaid]);
    }

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => row.map((val: any) => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <SummaryCard 
          icon={<TrendingUp size={20} />} 
          label="Cumulative Yield" 
          value={`${stats.completionRate}%`} 
          subValue={`${stats.totalFinished} Finished / ${stats.totalIssued} Issued`}
          color="indigo"
        />
        <SummaryCard 
          icon={<Clock size={20} />} 
          label="Total Floor Pending" 
          value={stats.pending.toLocaleString()} 
          subValue="Pieces across all stages"
          color="amber"
        />
        <SummaryCard 
          icon={<CheckCircle2 size={20} />} 
          label="Factory Output" 
          value={stats.totalFinished.toLocaleString()} 
          subValue="Completed stitching operations"
          color="emerald"
        />
        <SummaryCard 
          icon={<FileText size={20} />} 
          label="Total Wages Logged" 
          value={`₹${stats.totalWages.toLocaleString()}`} 
          subValue="Excluding recoveries"
          color="slate"
        />
      </div>

      {/* Main Report Interface */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Navigation & Controls */}
        <div className="px-10 py-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setReportType('PRODUCTION')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  reportType === 'PRODUCTION' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Production Floor
              </button>
              <button 
                onClick={() => setReportType('LABOUR')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  reportType === 'LABOUR' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Labour Earnings
              </button>
           </div>

           <div className="flex items-center gap-4">
              {reportType === 'PRODUCTION' && (
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1">
                   <button 
                    onClick={() => setSubType('LOT')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${subType === 'LOT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
                   >
                     By Lot
                   </button>
                   <button 
                    onClick={() => setSubType('STAGE')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${subType === 'STAGE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
                   >
                     By Stage
                   </button>
                </div>
              )}
              
              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
              
              {/* Export Actions Suite */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportCSV} 
                  title="Export Current View to CSV"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
                >
                  <FileSpreadsheet size={14} /> CSV Report
                </button>
                
                <button 
                  onClick={() => db.backup()} 
                  title="Export Full System Backup (JSON)"
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"
                >
                  <FileJson size={14} /> System JSON
                </button>

                <button 
                  onClick={() => window.print()} 
                  title="Print Report"
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                >
                  <Printer size={16} />
                </button>
              </div>
           </div>
        </div>

        {/* Data Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {reportType === 'PRODUCTION' && subType === 'LOT' ? (
              <>
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Design Lot</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Batch Size</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress Map</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Yield Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lotReportData.map(lot => (
                    <tr key={lot.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-10 py-6">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">#{lot.lotNumber}</div>
                            <div>
                               <p className="font-black text-slate-900 uppercase">{lot.design}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {lot.id.slice(-8)}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <span className="text-base font-black text-slate-700">{lot.totalQty}</span>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Pieces</p>
                      </td>
                      <td className="px-10 py-6 min-w-[300px]">
                         <div className="space-y-2">
                            <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{lot.progress}% Complete</span>
                               <span className="text-[9px] text-slate-400 font-bold uppercase">{lot.completedWork} / {lot.givenWork} ops done</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                               <div className="h-full bg-indigo-600" style={{ width: `${lot.progress}%` }}></div>
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            lot.status === 'DONE' ? 'bg-emerald-100 text-emerald-600' : 
                            lot.status === 'FINISHING' ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'
                         }`}>
                           {lot.status.replace('_', ' ')}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : reportType === 'PRODUCTION' && subType === 'STAGE' ? (
              <>
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Operation Stage</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">In Stock (In)</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Processed (Out)</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Work Pending</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Clearance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {stageReportData.map((stage, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                              <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{stage.name}</p>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-center font-bold text-slate-400">{stage.totalGiven}</td>
                        <td className="px-10 py-6 text-center font-black text-emerald-600">{stage.totalCompleted}</td>
                        <td className="px-10 py-6 text-center">
                           <span className={`font-black ${stage.pending > 100 ? 'text-rose-500' : 'text-slate-600'}`}>
                             {stage.pending}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <div className="flex items-center justify-end gap-3">
                              <div className="text-right">
                                 <p className="text-sm font-black text-slate-900">{stage.efficiency}%</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Efficiency</p>
                              </div>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                 stage.efficiency > 80 ? 'bg-emerald-50 text-emerald-500' : 
                                 stage.efficiency > 40 ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
                              }`}>
                                 {stage.efficiency > 40 ? <TrendingUp size={18} /> : <AlertTriangle size={18} />}
                              </div>
                           </div>
                        </td>
                      </tr>
                   ))}
                </tbody>
              </>
            ) : (
              <>
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Worker</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Output</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Advance Bal.</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Gross Lifetime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {labourReportData.map((worker, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold uppercase">{worker.name.charAt(0)}</div>
                           <div>
                              <p className="font-black text-slate-900 uppercase">{worker.name}</p>
                              <p className="text-[10px] text-indigo-500 font-bold uppercase">{worker.skill}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <p className="text-base font-black text-slate-800">{worker.piecesCount}</p>
                         <p className="text-[9px] text-slate-400 font-bold uppercase">Pieces Finished</p>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <span className={`text-sm font-black ${worker.advance > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                           ₹{worker.advance.toLocaleString()}
                         </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <p className="text-lg font-black text-slate-900">₹{worker.totalPaid.toLocaleString()}</p>
                         <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-600 font-black uppercase">
                            <TrendingUp size={10} /> Active Earner
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
          {((reportType === 'PRODUCTION' && lotReportData.length === 0) || (reportType === 'LABOUR' && labourReportData.length === 0)) && (
            <div className="py-32 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <BarChart3 className="text-slate-200" size={32} />
               </div>
               <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">No matching data for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, label, value, subValue, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-600 text-white shadow-indigo-200',
    amber: 'bg-amber-500 text-white shadow-amber-100',
    emerald: 'bg-emerald-600 text-white shadow-emerald-100',
    slate: 'bg-slate-900 text-white shadow-slate-100'
  };

  return (
    <div className={`${colors[color]} p-8 rounded-[2rem] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
         {React.cloneElement(icon as React.ReactElement<LucideProps>, { size: 120 })}
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between">
         <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6">
            {icon}
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">{label}</p>
            <h3 className="text-3xl font-black tracking-tighter mb-2">{value}</h3>
            <p className="text-[11px] font-bold opacity-60 leading-tight">{subValue}</p>
         </div>
      </div>
    </div>
  );
};

export default Reports;
