
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardCheck, 
  Layers, 
  Box,
  Save,
  Clock,
  AlertCircle,
  Hash,
  Printer,
  CheckCircle2,
  X,
  Search,
  Calendar,
  Fingerprint,
  ArrowRightLeft,
  Banknote,
  Hourglass,
  Split
} from 'lucide-react';
import { db } from '../db';
import { Worker, Lot, JobWork, LotStatus } from '../types';

const JobWorkEntry: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [history, setHistory] = useState<JobWork[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastIssued, setLastIssued] = useState<JobWork | null>(null);

  // Entry Form State
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [qtyGiven, setQtyGiven] = useState(0);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setWorkers(db.getWorkers().filter(w => w.isActive));
    setLots(db.getLots().filter(l => l.status === LotStatus.RUNNING));
    setHistory(db.getJobWorks().sort((a, b) => b.createdAt - a.createdAt));
  };

  const selectedLot = useMemo(() => {
    return lots.find(l => l.id === selectedLotId);
  }, [lots, selectedLotId]);

  const availableStages = useMemo(() => {
    return selectedLot?.stageRates || [];
  }, [selectedLot]);

  // Helper to generate a sequential human-readable ID
  const generateNextJobId = () => {
    const allJobs = db.getJobWorks();
    if (allJobs.length === 0) return 'JW-1001';
    
    const ids = allJobs
      .map(j => {
        const match = j.id.match(/JW-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => !isNaN(n));
      
    const maxId = ids.length > 0 ? Math.max(...ids) : 1000;
    return `JW-${maxId + 1}`;
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !selectedLotId || !selectedStageId) return;

    const worker = workers.find(w => w.id === selectedWorkerId);
    const lot = lots.find(l => l.id === selectedLotId);
    const stage = availableStages.find(s => s.id === selectedStageId);
    
    if (!worker || !lot || !stage) {
      alert("Error: Selection context lost. Please re-select.");
      return;
    }

    const rate = worker.rates[stage.id] || stage.rate;
    const uniqueId = generateNextJobId();

    const newJob: JobWork = {
      id: uniqueId,
      workerId: selectedWorkerId,
      lotId: selectedLotId,
      stageId: selectedStageId,
      date: entryDate,
      qtyGiven,
      qtyCompleted: 0, 
      rateAtTime: rate,
      createdAt: Date.now()
    };

    db.addJobWork(newJob);
    refreshData();
    setLastIssued(newJob);
    
    // Reset inputs
    setQtyGiven(0);
  };

  const getWorkerName = (id: string) => workers.find(w => w.id === id)?.name || 'Unknown';
  const getLotNo = (id: string) => {
    const lot = db.getLots().find(l => l.id === id);
    return lot ? lot.lotNumber : '???';
  };
  const getStageName = (lotId: string, stageId: string) => {
    const lot = db.getLots().find(l => l.id === lotId);
    const stage = lot?.stageRates?.find(s => s.id === stageId);
    return stage ? stage.name : 'Unknown';
  };

  const filteredHistory = history.filter(item => {
    const workerName = getWorkerName(item.workerId).toLowerCase();
    const lotNo = getLotNo(item.lotId).toLowerCase();
    const jobId = item.id.toLowerCase();
    const s = searchTerm.toLowerCase();
    return workerName.includes(s) || lotNo.includes(s) || item.date.includes(s) || jobId.includes(s);
  });

  return (
    <div className="space-y-8">
      {/* Print Overlay for last issued */}
      {lastIssued && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 no-print shadow-sm">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                <CheckCircle2 size={24} />
             </div>
             <div>
                <h4 className="font-black text-emerald-900 text-lg">Record Finalized: {lastIssued.id}</h4>
                <p className="text-sm text-emerald-700 font-medium">Issued {lastIssued.qtyGiven} pcs to {getWorkerName(lastIssued.workerId)}</p>
             </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => window.print()} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md">
                <Printer size={16} /> Print Token
             </button>
             <button onClick={() => setLastIssued(null)} className="p-2.5 text-emerald-400 hover:text-emerald-900 transition-colors">
                <X size={20} />
             </button>
          </div>
          
          <div id={`print-token-${lastIssued.id}`} className="print-container">
             <div className="p-12 border-[8px] border-black max-w-sm mx-auto text-center space-y-8 bg-white text-black font-sans">
                <div className="space-y-1">
                  <h1 className="text-4xl font-black uppercase tracking-tighter">RBS TEXTILE</h1>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Stitching Production Slip</p>
                </div>
                <div className="h-[4px] bg-black w-full"></div>
                <div className="text-left space-y-4 py-6 border-y-2 border-black border-dashed">
                   <div className="flex justify-between items-baseline"><span className="text-[10px] font-black uppercase text-gray-400">Token ID:</span> <span className="font-black text-sm">{lastIssued.id}</span></div>
                   <div className="flex justify-between items-baseline"><span className="text-[10px] font-black uppercase text-gray-400">Date:</span> <span className="font-black text-sm">{lastIssued.date}</span></div>
                   <div className="flex justify-between items-baseline"><span className="text-[10px] font-black uppercase text-gray-400">Worker:</span> <span className="font-black uppercase text-sm">{getWorkerName(lastIssued.workerId)}</span></div>
                   <div className="flex justify-between items-baseline"><span className="text-[10px] font-black uppercase text-gray-400">Lot:</span> <span className="font-black text-sm">#{getLotNo(lastIssued.lotId)}</span></div>
                   <div className="flex justify-between items-baseline"><span className="text-[10px] font-black uppercase text-gray-400">Stage:</span> <span className="font-black uppercase text-sm">{getStageName(lastIssued.lotId, lastIssued.stageId)}</span></div>
                   <div className="pt-6 flex justify-between items-end border-t border-gray-200">
                      <span className="text-[10px] font-black uppercase">Quantity</span>
                      <span className="text-5xl font-black tracking-tighter">{lastIssued.qtyGiven} <span className="text-xs">PCS</span></span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Entry Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden no-print">
            <div className="bg-slate-900 text-white px-8 py-5 flex items-center gap-3 border-b border-slate-800">
              <ClipboardCheck size={18} className="text-indigo-400" />
              <h3 className="font-black text-xs tracking-widest uppercase">Job Issuance</h3>
            </div>
            <form onSubmit={handleSaveEntry} className="p-8 space-y-6 bg-slate-50/30">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Worker</label>
                  <select required className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg outline-none text-xs font-black text-slate-700" value={selectedWorkerId} onChange={e => setSelectedWorkerId(e.target.value)}>
                    <option value="">Select...</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.name.toUpperCase()}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Running Lot</label>
                  <select required className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg outline-none text-xs font-black text-slate-700" value={selectedLotId} onChange={e => setSelectedLotId(e.target.value)}>
                    <option value="">Select...</option>
                    {lots.map(l => <option key={l.id} value={l.id}>LOT {l.lotNumber} ({l.design})</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Stage</label>
                  <select required className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg outline-none text-xs font-black text-slate-700" value={selectedStageId} onChange={e => setSelectedStageId(e.target.value)}>
                    <option value="">Select...</option>
                    {availableStages.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.rate})</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Pieces Issued</label>
                  <input type="number" required className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg outline-none text-sm font-black text-slate-900" value={qtyGiven || ''} onChange={e => setQtyGiven(parseInt(e.target.value) || 0)} placeholder="0" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                  <input type="date" required className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none text-[10px] font-black text-slate-600" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                </div>
              </div>
              
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3">
                <Save size={18} /> Record Issuance
              </button>
            </form>
          </div>
        </div>

        {/* Audit Log */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden no-print">
             <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3">
                 <Clock size={18} className="text-slate-400" />
                 <h3 className="font-black text-slate-800 tracking-tight uppercase text-sm">Industrial Production Journal</h3>
               </div>
               <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Filter by Job ID, Lot or Worker..." 
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-black uppercase focus:border-indigo-400 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto max-h-[650px] custom-scrollbar">
               <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-slate-100 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-slate-200 z-10">
                   <tr>
                     <th className="px-8 py-4">Job Info</th>
                     <th className="px-8 py-4">Production Audit</th>
                     <th className="px-8 py-4 text-center">Settle Status</th>
                     <th className="px-8 py-4 text-right">Quantity Logic</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredHistory.map(item => {
                      const isBalance = item.id.includes('-BAL');
                      const isPaid = !!item.paymentId;
                      // Extract parent job ID if it's a balance record
                      const sourceId = isBalance ? item.id.split('-BAL-')[0] : null;
                      
                      return (
                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors relative ${isBalance ? 'bg-indigo-50/20 border-l-4 border-indigo-500' : ''}`}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs mb-1">
                               {isBalance ? <Split size={12} className="rotate-90" /> : <Fingerprint size={12} />}
                               {item.id}
                               {isBalance && (
                                 <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-sm">Bal Carry</span>
                               )}
                            </div>
                            <div className="flex flex-col gap-0.5">
                               <div className="text-[10px] text-slate-400 font-bold uppercase">{item.date}</div>
                               {sourceId && (
                                  <div className="text-[8px] text-indigo-400 font-black uppercase tracking-tighter">Derived From: {sourceId}</div>
                               )}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-xs font-black text-slate-900 uppercase">{getWorkerName(item.workerId)}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-2">
                               <Layers size={10} className="text-slate-300" /> Lot {getLotNo(item.lotId)} — {getStageName(item.lotId, item.stageId)}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            {isPaid ? (
                              <div className="inline-flex flex-col items-center">
                                 <span className="px-2.5 py-1 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Banknote size={10} /> Fully Paid
                                 </span>
                                 <span className="text-[8px] text-slate-300 font-bold">Ref: {item.paymentId}</span>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-center">
                                 <span className={`px-2.5 py-1 border rounded text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 ${
                                    isBalance ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-amber-100 text-amber-600 border-amber-200'
                                 }`}>
                                    <Hourglass size={10} /> {isBalance ? 'Bal. Owed' : 'Unpaid Log'}
                                 </span>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex flex-col items-end">
                                <span className={`text-sm font-black ${isBalance ? 'text-indigo-600' : 'text-slate-900'}`}>{item.qtyGiven} Pcs</span>
                                <span className={`text-[8px] font-black uppercase tracking-wider ${
                                   isPaid ? 'text-emerald-500' : isBalance ? 'text-indigo-400' : 'text-slate-400'
                                }`}>
                                   {isPaid ? 'Calculated' : isBalance ? 'Bal. Pieces' : 'Original Iss.'}
                                </span>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredHistory.length === 0 && (
                      <tr><td colSpan={4} className="py-24 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">No production journal entries found</td></tr>
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobWorkEntry;
