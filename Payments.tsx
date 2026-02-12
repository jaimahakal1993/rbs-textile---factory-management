
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Printer,
  History,
  TrendingUp,
  X,
  Layers,
  IndianRupee,
  Search,
  Download,
  Smartphone,
  Wallet,
  QrCode,
  FileText,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Maximize2,
  Eye
} from 'lucide-react';
import { db } from '../db';
import { Worker, JobWork, Payment, PaymentStatus, Lot, PaymentMethod, UserRole } from '../types';

interface PaymentsProps {
  userRole?: UserRole;
}

const Payments: React.FC<PaymentsProps> = ({ userRole }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobWorks, setJobWorks] = useState<JobWork[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [settlingWorkerId, setSettlingWorkerId] = useState<string | null>(null);
  const [completedQtys, setCompletedQtys] = useState<Record<string, number>>({});
  const [printingPayment, setPrintingPayment] = useState<Payment | null>(null);
  const [previewingPayment, setPreviewingPayment] = useState<Payment | null>(null);
  const [newlyPaidPayment, setNewlyPaidPayment] = useState<Payment | null>(null);
  const [showFullQR, setShowFullQR] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setWorkers(db.getWorkers());
    setJobWorks(db.getJobWorks());
    setLots(db.getLots());
    setPayments(db.getPayments());
  };

  const pendingSettlementsByWorker = useMemo(() => {
    const pendingJobs = jobWorks.filter(jw => !jw.paymentId);
    
    const groups: Record<string, JobWork[]> = {};
    pendingJobs.forEach(jw => {
      if (!groups[jw.workerId]) groups[jw.workerId] = [];
      groups[jw.workerId].push(jw);
    });

    return Object.entries(groups).map(([workerId, works]) => {
      const worker = workers.find(w => w.id === workerId);
      return {
        workerId,
        workerName: worker?.name || 'Unknown',
        advanceBalance: worker?.advanceBalance || 0,
        paymentMethod: worker?.paymentMethod || PaymentMethod.CASH,
        upiId: worker?.upiId,
        qrCode: worker?.qrCode,
        pendingJobs: works
      };
    });
  }, [workers, jobWorks]);

  const activeSettlement = useMemo(() => {
    if (!settlingWorkerId) return null;
    return pendingSettlementsByWorker.find(s => s.workerId === settlingWorkerId);
  }, [settlingWorkerId, pendingSettlementsByWorker]);

  const settlementSummary = useMemo(() => {
    if (!activeSettlement) return { gross: 0, advance: 0, net: 0 };
    
    let gross = 0;
    activeSettlement.pendingJobs.forEach(job => {
      const qty = completedQtys[job.id] || 0;
      gross += qty * job.rateAtTime;
    });

    const advanceToDeduct = Math.min(activeSettlement.advanceBalance, gross);
    return { gross, advance: advanceToDeduct, net: gross - advanceToDeduct };
  }, [activeSettlement, completedQtys]);

  const handlePrint = (payment: Payment) => {
    setPrintingPayment(payment);
    setPreviewingPayment(null); // Close preview if open
    setTimeout(() => { 
      window.print(); 
      setPrintingPayment(null); 
    }, 300);
  };

  const handlePreview = (payment: Payment) => {
    setPreviewingPayment(payment);
  };

  const handleFinalizeSettlement = () => {
    if (!activeSettlement) return;

    const usedJobIds: string[] = [];
    const paymentId = `PAY-${Date.now()}`;

    activeSettlement.pendingJobs.forEach(job => {
      const qtyPaidNow = completedQtys[job.id] || 0;
      
      if (qtyPaidNow > 0) {
        const originalQtyIssued = job.qtyGiven;
        const balanceQty = originalQtyIssued - qtyPaidNow;

        const updatedPaidJob: JobWork = { 
          ...job, 
          qtyGiven: qtyPaidNow, 
          qtyCompleted: qtyPaidNow, 
          paymentId: paymentId 
        };
        db.updateJobWork(updatedPaidJob);
        usedJobIds.push(job.id);

        if (balanceQty > 0) {
          const balanceRecord: JobWork = {
            ...job,
            id: `${job.id}-BAL-${Math.floor(Math.random() * 1000)}`,
            qtyGiven: balanceQty,
            qtyCompleted: 0,
            paymentId: undefined,
            createdAt: Date.now() + 1
          };
          db.addJobWork(balanceRecord);
        }
      }
    });

    if (usedJobIds.length === 0) {
      alert("Please enter at least one finished quantity.");
      return;
    }

    const payment: Payment = {
      id: paymentId,
      workerId: activeSettlement.workerId,
      jobWorkIds: usedJobIds,
      totalAmount: settlementSummary.gross,
      advanceDeducted: settlementSummary.advance,
      netPayable: settlementSummary.net,
      method: activeSettlement.paymentMethod, 
      date: new Date().toISOString().split('T')[0],
      status: PaymentStatus.PAID,
      createdAt: Date.now()
    };

    db.addPayment(payment);

    if (settlementSummary.advance > 0) {
      db.addAdvanceTransaction({
        id: `ADV-REC-${Date.now()}`,
        workerId: activeSettlement.workerId,
        amount: settlementSummary.advance,
        date: new Date().toISOString().split('T')[0],
        type: 'RECOVERED',
        note: `Auto-recovered from settlement ${payment.id}`,
        createdAt: Date.now()
      });
    }

    setNewlyPaidPayment(payment);
    setSettlingWorkerId(null);
    setCompletedQtys({});
    refreshData();
    handlePreview(payment); // Automatically show preview after saving
  };

  const handleDeveloperReset = () => {
    if(confirm("DEVELOPER ALERT: Wipe all factory data from this location?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const getWorkerName = (id: string) => workers.find(w => w.id === id)?.name || 'Unknown';
  const getLotNo = (id: string) => lots.find(l => l.id === id)?.lotNumber || '???';
  const getStageName = (lotId: string, stageId: string) => {
    const lot = lots.find(l => l.id === lotId);
    return lot?.stageRates?.find(s => s.id === stageId)?.name || 'Unknown';
  };

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => getWorkerName(p.workerId).toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [payments, searchTerm, workers]);

  return (
    <div className="space-y-10">
      {/* Success Notification */}
      {newlyPaidPayment && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 no-print shadow-sm">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                <CheckCircle2 size={24} />
             </div>
             <div>
                <h4 className="font-black text-emerald-900 text-lg">Settlement Successful</h4>
                <p className="text-sm text-emerald-700 font-medium">₹{newlyPaidPayment.netPayable.toFixed(2)} recorded in ledger.</p>
             </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => handlePreview(newlyPaidPayment)} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 shadow-md">
                <Eye size={16} /> Preview Receipt
             </button>
             <button onClick={() => setNewlyPaidPayment(null)} className="p-2.5 text-emerald-400 hover:text-emerald-900"><X size={20} /></button>
          </div>
        </div>
      )}

      {/* QR Code Full Preview Modal */}
      {showFullQR && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowFullQR(null)}>
           <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowFullQR(null)} className="absolute -top-4 -right-4 bg-rose-600 text-white p-2 rounded-full shadow-lg"><X size={20}/></button>
              <img src={showFullQR} alt="Worker QR Code" className="max-w-[400px] w-full h-auto rounded-xl" />
              <div className="mt-6 text-center">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Scan to pay with any UPI App</p>
              </div>
           </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {previewingPayment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm no-print">
          <div className="bg-slate-100 rounded-[2.5rem] shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden border border-slate-300">
            <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Voucher Print Preview</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handlePrint(previewingPayment)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                >
                  <Printer size={16} /> Print Now
                </button>
                <button 
                  onClick={() => setPreviewingPayment(null)} 
                  className="p-2.5 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 flex justify-center bg-slate-200/50">
               {/* The actual receipt visualization */}
               <div className="w-full max-w-md bg-white border-[8px] border-slate-900 p-10 text-slate-900 font-sans shadow-2xl self-start">
                  <div className="text-center space-y-2 mb-10">
                     <h1 className="text-4xl font-black tracking-tighter uppercase">RBS Textile</h1>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Labour Settlement Voucher</p>
                  </div>
                  
                  <div className="border-y-2 border-slate-900 border-dashed py-8 mb-10 space-y-4">
                     <div className="flex justify-between text-[11px] font-black uppercase">
                        <span className="text-slate-400">Receipt No:</span>
                        <span className="font-mono">{previewingPayment.id}</span>
                     </div>
                     <div className="flex justify-between text-[11px] font-black uppercase">
                        <span className="text-slate-400">Date Issued:</span>
                        <span>{previewingPayment.date}</span>
                     </div>
                     <div className="flex justify-between text-[11px] font-black uppercase">
                        <span className="text-slate-400">Worker Name:</span>
                        <span>{getWorkerName(previewingPayment.workerId)}</span>
                     </div>
                     <div className="flex justify-between text-[11px] font-black uppercase">
                        <span className="text-slate-400">Mode:</span>
                        <span className="bg-slate-100 px-1.5 rounded">{previewingPayment.method}</span>
                     </div>
                  </div>

                  <div className="space-y-4 mb-10">
                     <div className="flex justify-between text-[11px] font-black uppercase">
                        <span className="text-slate-400">Gross Wages:</span>
                        <span>₹{previewingPayment.totalAmount.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-[11px] font-black uppercase text-rose-600">
                        <span>Advance Deducted:</span>
                        <span>- ₹{previewingPayment.advanceDeducted.toFixed(2)}</span>
                     </div>
                     <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                        <span className="text-[11px] font-black uppercase">Net Payout:</span>
                        <span className="text-5xl font-black tracking-tighter">₹{previewingPayment.netPayable.toFixed(2)}</span>
                     </div>
                  </div>

                  <div className="pt-10 text-center space-y-4">
                     <div className="h-12 w-full border border-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-300 uppercase italic">
                        Authorized Signature
                     </div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Computer Generated Copy</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Workbench Modal */}
      {settlingWorkerId && activeSettlement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-md">
          <div className="bg-slate-100 rounded-[2rem] shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-slate-300">
             <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 border border-slate-700 font-black">
                      {activeSettlement.workerName.charAt(0)}
                   </div>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Worker Settlement Workbench</h3>
                      <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Labourer: <span className="text-indigo-400">{activeSettlement.workerName}</span></p>
                   </div>
                </div>
                <button onClick={() => setSettlingWorkerId(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
             </div>
             
             <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 border-r border-slate-200 custom-scrollbar">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                         <FileText size={16} className="text-slate-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unpaid Operations List</span>
                      </div>
                      {activeSettlement.pendingJobs.map(job => {
                        const entered = completedQtys[job.id] || 0;
                        const balance = job.qtyGiven - entered;
                        
                        return (
                          <div key={job.id} className={`p-5 bg-white rounded-2xl border transition-all ${balance > 0 && entered > 0 ? 'border-amber-200 shadow-amber-50 shadow-lg' : 'border-slate-200 shadow-sm'}`}>
                             <div className="flex items-center gap-6">
                               <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Layers size={14} className="text-indigo-500" />
                                    <span className="text-xs font-black text-slate-800 uppercase">Lot {getLotNo(job.lotId)}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">{getStageName(job.lotId, job.stageId)} — ₹{job.rateAtTime}/pc</p>
                               </div>
                               <div className="w-44 text-right space-y-2">
                                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-1">
                                     <span>Qty Done</span>
                                     <span>Max: {job.qtyGiven}</span>
                                  </div>
                                  <input 
                                    type="number" 
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-black text-slate-900 shadow-inner"
                                    value={completedQtys[job.id] || ''}
                                    onChange={e => {
                                      const val = parseInt(e.target.value) || 0;
                                      setCompletedQtys({...completedQtys, [job.id]: Math.min(val, job.qtyGiven)});
                                    }}
                                    placeholder="0"
                                  />
                               </div>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>

                <div className="w-full md:w-[400px] bg-slate-200/50 p-8 flex flex-col justify-between border-l border-slate-300">
                   <div className="space-y-8">
                      {/* Payment Destination Block */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Info</span>
                            {activeSettlement.paymentMethod === PaymentMethod.UPI ? (
                               <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase"><Smartphone size={10} /> UPI Mode</span>
                            ) : (
                               <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase"><Wallet size={10} /> Cash Mode</span>
                            )}
                         </div>

                         {activeSettlement.paymentMethod === PaymentMethod.UPI && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                               <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group">
                                  <div>
                                     <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">UPI ID</p>
                                     <p className="text-xs font-black text-slate-900">{activeSettlement.upiId || 'Not Set'}</p>
                                  </div>
                                  <Smartphone size={16} className="text-slate-300" />
                               </div>

                               {activeSettlement.qrCode ? (
                                  <div className="relative group cursor-pointer" onClick={() => setShowFullQR(activeSettlement.qrCode || null)}>
                                     <img src={activeSettlement.qrCode} alt="Worker QR" className="w-full h-auto aspect-square object-contain bg-white rounded-xl border border-slate-100 p-2 shadow-inner" />
                                     <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                        <Maximize2 className="text-indigo-600" size={24} />
                                     </div>
                                     <p className="text-[9px] font-black text-center text-slate-400 uppercase mt-2 tracking-widest">Click to enlarge QR</p>
                                  </div>
                               ) : (
                                  <div className="aspect-square bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300 border border-dashed border-slate-200">
                                     <QrCode size={40} className="mb-2 opacity-20" />
                                     <p className="text-[9px] font-black uppercase tracking-widest">No QR Attached</p>
                                  </div>
                               )}
                            </div>
                         )}
                         
                         {activeSettlement.paymentMethod === PaymentMethod.CASH && (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
                               <Wallet size={32} className="opacity-20" />
                               <p className="text-[10px] font-black uppercase tracking-widest">Manual Cash Payout</p>
                            </div>
                         )}
                      </div>

                      <div className="pt-6 border-t border-slate-300 border-dashed">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Final Net Payout</p>
                          <p className="text-5xl font-black text-slate-900 tracking-tighter">₹{settlementSummary.net.toFixed(2)}</p>
                          {settlementSummary.advance > 0 && (
                             <p className="text-[9px] text-rose-500 font-black uppercase mt-2">Deducted ₹{settlementSummary.advance} from advance balance</p>
                          )}
                      </div>
                   </div>

                   <button 
                     onClick={handleFinalizeSettlement}
                     className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                   >
                     <CheckCircle2 size={18} /> Finalize & Preview
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Accounts List Grid */}
      <div className="space-y-4 no-print">
        <div className="flex items-center gap-2 px-1">
          <Clock className="text-indigo-600" size={20} />
          <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Accounts Awaiting Payout</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingSettlementsByWorker.map(item => (
            <div key={item.workerId} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg">{item.workerName.charAt(0)}</div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight">{item.workerName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.pendingJobs.length} Operations in-hand</p>
                  </div>
                </div>
                {item.paymentMethod === PaymentMethod.UPI ? (
                   <Smartphone className="text-emerald-500" size={18} />
                ) : (
                   <Wallet className="text-slate-300" size={18} />
                )}
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adv. Balance</span>
                 <span className={`text-sm font-black ${item.advanceBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>₹{item.advanceBalance}</span>
              </div>

              <button 
                onClick={() => setSettlingWorkerId(item.workerId)}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all"
              >
                Start Settlement <TrendingUp size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Ledger */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="px-10 py-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                 <History size={24} />
              </div>
              <div>
                 <h3 className="font-black text-slate-800 tracking-tight text-lg uppercase">Global Payment Ledger</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Industrial Payroll Archive</p>
              </div>
           </div>
           <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search recipient records..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-black uppercase tracking-widest focus:border-indigo-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-10 py-5">Transaction Ref</th>
                <th className="px-10 py-5">Recipient</th>
                <th className="px-10 py-5">Filing Date</th>
                <th className="px-10 py-5">Method</th>
                <th className="px-10 py-5 text-right">Net Settle</th>
                <th className="px-10 py-5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6 font-mono text-[10px] text-slate-400">{payment.id}</td>
                  <td className="px-10 py-6 font-black text-slate-900 uppercase">{getWorkerName(payment.workerId)}</td>
                  <td className="px-10 py-6 font-bold text-slate-400 text-xs">{payment.date}</td>
                  <td className="px-10 py-6">
                     <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${payment.method === PaymentMethod.UPI ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {payment.method}
                     </span>
                  </td>
                  <td className="px-10 py-6 text-right font-black text-slate-900 text-base">₹{payment.netPayable.toFixed(2)}</td>
                  <td className="px-10 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handlePreview(payment)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Preview Receipt">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handlePrint(payment)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Direct Print">
                        <Printer size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
             <div className="py-24 text-center">
                <FileText size={40} className="text-slate-200 mx-auto mb-4" />
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">No payment records found</p>
             </div>
          )}
        </div>
      </div>

      {/* Developer Tool: Factory Reset - ONLY for DEVELOPER */}
      {userRole === UserRole.DEVELOPER && (
        <div className="pt-12 border-t border-slate-200 no-print flex justify-end">
           <button 
             onClick={handleDeveloperReset}
             className="px-6 py-3 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
           >
             <Trash2 size={14} /> Developer Tool: Factory Reset
           </button>
        </div>
      )}

      {/* HIDDEN PRINT RECEIPT (Only exists in DOM during print trigger) */}
      {printingPayment && (
         <div className="print-container">
            <div className="max-w-md mx-auto p-12 bg-white border-[10px] border-slate-900 text-slate-900 font-sans">
               <div className="text-center space-y-2 mb-10">
                  <h1 className="text-4xl font-black tracking-tighter uppercase">RBS Textile</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Labour Settlement Voucher</p>
               </div>
               
               <div className="border-y-2 border-slate-900 border-dashed py-8 mb-10 space-y-4">
                  <div className="flex justify-between text-[11px] font-black uppercase">
                     <span className="text-slate-400">Receipt No:</span>
                     <span>{printingPayment.id}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase">
                     <span className="text-slate-400">Date Issued:</span>
                     <span>{printingPayment.date}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase">
                     <span className="text-slate-400">Worker Name:</span>
                     <span>{getWorkerName(printingPayment.workerId)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase">
                     <span className="text-slate-400">Mode:</span>
                     <span>{printingPayment.method}</span>
                  </div>
               </div>

               <div className="space-y-4 mb-10">
                  <div className="flex justify-between text-[11px] font-black uppercase">
                     <span className="text-slate-400">Gross Wages:</span>
                     <span>₹{printingPayment.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase text-rose-600">
                     <span>Advance Deducted:</span>
                     <span>- ₹{printingPayment.advanceDeducted.toFixed(2)}</span>
                  </div>
                  <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                     <span className="text-[11px] font-black uppercase">Net Payout:</span>
                     <span className="text-5xl font-black tracking-tighter">₹{printingPayment.netPayable.toFixed(2)}</span>
                  </div>
               </div>

               <div className="pt-10 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Computer Generated Copy</p>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Payments;
