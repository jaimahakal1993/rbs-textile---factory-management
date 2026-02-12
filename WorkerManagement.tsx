
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../db';
import { Worker, PaymentMethod, JobWork, Lot } from '../types';
import { 
  Search, 
  UserPlus, 
  CreditCard, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  QrCode, 
  Smartphone, 
  Wallet, 
  Camera, 
  Image as ImageIcon,
  History,
  Calendar,
  Layers,
  // Added Printer import to fix "Cannot find name 'Printer'" error
  Printer
} from 'lucide-react';

const WorkerManagement: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Advance Form state
  const [advAmount, setAdvAmount] = useState(0);
  const [advNote, setAdvNote] = useState('');

  // Worker Form state
  const [workerName, setWorkerName] = useState('');
  const [workerMobile, setWorkerMobile] = useState('');
  const [workerSkill, setWorkerSkill] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [upiId, setUpiId] = useState('');
  const [qrCode, setQrCode] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setWorkers(db.getWorkers());
  }, []);

  const handleSaveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || advAmount <= 0) return;

    db.addAdvanceTransaction({
      id: `ADV-${Date.now()}`,
      workerId: selectedWorker.id,
      amount: advAmount,
      date: new Date().toISOString().split('T')[0],
      type: 'GIVEN',
      note: advNote,
      createdAt: Date.now()
    });

    setWorkers(db.getWorkers());
    setShowAdvanceModal(false);
    setAdvAmount(0);
    setAdvNote('');
  };

  const handleOpenWorkerModal = (worker: Worker | null = null) => {
    if (worker) {
      setSelectedWorker(worker);
      setWorkerName(worker.name);
      setWorkerMobile(worker.mobile);
      setWorkerSkill(worker.skill);
      setPaymentMethod(worker.paymentMethod || PaymentMethod.CASH);
      setUpiId(worker.upiId || '');
      setQrCode(worker.qrCode);
    } else {
      setSelectedWorker(null);
      setWorkerName('');
      setWorkerMobile('');
      setWorkerSkill('');
      setPaymentMethod(PaymentMethod.CASH);
      setUpiId('');
      setQrCode(undefined);
    }
    setShowWorkerModal(true);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCode(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const workerData: Worker = {
      id: selectedWorker?.id || `WKR-${Date.now()}`,
      name: workerName,
      mobile: workerMobile,
      skill: workerSkill,
      rates: selectedWorker?.rates || {},
      advanceBalance: selectedWorker?.advanceBalance || 0,
      paymentMethod: paymentMethod,
      upiId: paymentMethod === PaymentMethod.UPI ? upiId : undefined,
      qrCode: paymentMethod === PaymentMethod.UPI ? qrCode : undefined,
      isActive: true,
      createdAt: selectedWorker?.createdAt || Date.now()
    };

    if (selectedWorker) {
      db.updateWorker(workerData);
    } else {
      db.addWorker(workerData);
    }

    setWorkers(db.getWorkers());
    setShowWorkerModal(false);
  };

  const handleDeleteWorker = (id: string) => {
    if (confirm('Are you sure? This will hide the worker from active lists.')) {
        const worker = workers.find(w => w.id === id);
        if (worker) {
            db.updateWorker({...worker, isActive: false});
            setWorkers(db.getWorkers());
        }
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.isActive && w.name.toUpperCase().includes(searchTerm.toUpperCase())
  );

  const workerHistory = useMemo(() => {
    if (!selectedWorker) return [];
    const allWorks = db.getJobWorks();
    const lots = db.getLots();
    return allWorks.filter(jw => jw.workerId === selectedWorker.id).sort((a,b) => b.createdAt - a.createdAt).map(jw => {
       const lot = lots.find(l => l.id === jw.lotId);
       const stage = lot?.stageRates.find(s => s.id === jw.stageId);
       return { ...jw, lotNo: lot?.lotNumber || '???', stageName: stage?.name || '???' };
    });
  }, [selectedWorker, showHistoryModal]);

  return (
    <div className="space-y-6">
      {/* Search and Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        <div className="relative w-full md:w-96">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
            type="text" 
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black uppercase text-xs tracking-widest"
            placeholder="Search Record by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <button 
          onClick={() => handleOpenWorkerModal()}
          className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 action-button"
        >
          <UserPlus size={18} /> Add New Entry
        </button>
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Worker Profile</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Skill / Role</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Pay Mode</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Adv. Bal.</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.map(w => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black border border-slate-200 group-hover:bg-white transition-colors">
                         {w.name.charAt(0)}
                       </div>
                       <div>
                         <p className="font-black text-slate-900 uppercase tracking-tight">{w.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{w.mobile}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full inline-block">{w.skill || 'Worker'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {w.paymentMethod === PaymentMethod.UPI ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shadow-sm">
                          <Smartphone size={12} />
                          <span className="text-[9px] font-black uppercase tracking-tighter">UPI</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 shadow-sm">
                          <Wallet size={12} />
                          <span className="text-[9px] font-black uppercase tracking-tighter">CASH</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-block">
                       <p className={`text-base font-black ${w.advanceBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                         ₹{w.advanceBalance.toFixed(2)}
                       </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedWorker(w); setShowHistoryModal(true); }} 
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View History"
                        >
                          <History size={18} />
                        </button>
                        <button 
                          onClick={() => { setSelectedWorker(w); setShowAdvanceModal(true); }} 
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Manage Advance"
                        >
                          <CreditCard size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenWorkerModal(w)}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all" 
                          title="Edit Profile"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteWorker(w.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                          title="Archive"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && selectedWorker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm no-print">
           <div className="bg-slate-100 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-slate-200 flex flex-col">
              <div className="p-8 bg-white border-b border-slate-200 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">WORK HISTORY: {selectedWorker.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Complete piece-rate log</p>
                 </div>
                 <button onClick={() => setShowHistoryModal(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400">
                    <X size={20} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <table className="w-full text-left text-xs">
                    <thead className="bg-slate-200/50 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                       <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Lot Context</th>
                          <th className="px-6 py-4">Stitching Stage</th>
                          <th className="px-6 py-4 text-right">Qty</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50">
                       {workerHistory.map(jw => (
                          <tr key={jw.id} className="hover:bg-white transition-colors">
                             <td className="px-6 py-4 font-bold text-slate-400 flex items-center gap-2"><Calendar size={12}/> {jw.date}</td>
                             <td className="px-6 py-4 font-black text-slate-700 uppercase"><Layers size={10} className="inline mr-1"/> Lot {jw.lotNo}</td>
                             <td className="px-6 py-4 font-bold text-slate-500 uppercase">{jw.stageName}</td>
                             <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">{jw.qtyGiven} PCS</td>
                          </tr>
                       ))}
                       {workerHistory.length === 0 && (
                          <tr><td colSpan={4} className="py-20 text-center text-slate-400 italic font-bold">No production logs for this worker yet.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
              <div className="p-8 bg-white border-t border-slate-100 flex justify-end">
                 <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-200">
                   <Printer size={14} /> Print Detailed Log
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Advance Modal - Grey Themed */}
      {showAdvanceModal && selectedWorker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm no-print">
           <div className="bg-slate-100 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
              <div className="p-8 bg-white border-b border-slate-200 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Advance Payout</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recipient: <span className="text-indigo-600">{selectedWorker.name}</span></p>
                 </div>
                 <button onClick={() => setShowAdvanceModal(false)} className="text-slate-300 hover:text-slate-900"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <form onSubmit={handleSaveAdvance} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount (₹)</label>
                       <input 
                        type="number" 
                        required 
                        autoFocus
                        className="w-full px-6 py-4 bg-white border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-2xl text-slate-900 shadow-sm"
                        value={advAmount}
                        onChange={e => setAdvAmount(parseFloat(e.target.value) || 0)}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Memo / Purpose</label>
                       <textarea 
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium h-24 resize-none shadow-sm"
                        value={advNote}
                        onChange={e => setAdvNote(e.target.value)}
                        placeholder="Festival advance, Emergency..."
                       />
                    </div>
                    <div className="flex gap-4 pt-4">
                       <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 action-button">
                          Confirm & Record
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* Worker Modal (Add/Edit) - Grey Themed */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm no-print">
           <div className="bg-slate-100 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
              <div className="p-8 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                        {selectedWorker ? 'Edit Profile' : 'Register New Worker'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Personnel Filing System</p>
                 </div>
                 <button onClick={() => setShowWorkerModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                    <X size={24} />
                 </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar">
                 <form onSubmit={handleSaveWorker} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Worker Full Name</label>
                           <input 
                            type="text" 
                            required 
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 shadow-sm"
                            value={workerName}
                            onChange={e => setWorkerName(e.target.value)}
                            placeholder="Full Name"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Contact</label>
                           <input 
                            type="tel" 
                            required 
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 shadow-sm"
                            value={workerMobile}
                            onChange={e => setWorkerMobile(e.target.value)}
                            placeholder="Contact No."
                           />
                        </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Skill / Role</label>
                       <select 
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 shadow-sm"
                        value={workerSkill}
                        onChange={e => setWorkerSkill(e.target.value)}
                       >
                        <option value="">Select Skill...</option>
                        <option value="TAILOR">Tailor (सिलाई)</option>
                        <option value="HELPER">Helper (हेल्पर)</option>
                        <option value="CHECKER">Checker (चेकर)</option>
                        <option value="PACKER">Packer (पैकिंग)</option>
                        <option value="CUTTER">Cutter (कटिंग)</option>
                       </select>
                    </div>

                    {/* Payment Mode Selection */}
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-nowrap">Payment Settlement Mode</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                type="button"
                                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                                    paymentMethod === PaymentMethod.CASH 
                                    ? 'border-indigo-600 bg-white ring-4 ring-indigo-500/10 shadow-md' 
                                    : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400'
                                }`}
                            >
                                <div className={`p-2 rounded-lg ${paymentMethod === PaymentMethod.CASH ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <p className="font-black text-sm text-slate-900">Cash Payment</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Manual Filing</p>
                                </div>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setPaymentMethod(PaymentMethod.UPI)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                                    paymentMethod === PaymentMethod.UPI 
                                    ? 'border-indigo-600 bg-white ring-4 ring-indigo-500/10 shadow-md' 
                                    : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400'
                                }`}
                            >
                                <div className={`p-2 rounded-lg ${paymentMethod === PaymentMethod.UPI ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <p className="font-black text-sm text-slate-900">Online / UPI</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Instant Settle</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* UPI Specific Fields */}
                    {paymentMethod === PaymentMethod.UPI && (
                        <div className="space-y-6 p-6 bg-white rounded-[2rem] border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UPI ID (VPA)</label>
                                <input 
                                    type="text" 
                                    required={paymentMethod === PaymentMethod.UPI}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900 shadow-inner"
                                    value={upiId}
                                    onChange={e => setUpiId(e.target.value)}
                                    placeholder="worker@upi"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment QR Attachment</label>
                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full md:w-48 h-48 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group overflow-hidden relative"
                                    >
                                        {qrCode ? (
                                            <>
                                                <img src={qrCode} alt="QR Code" className="w-full h-full object-contain p-2" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Camera className="text-white" size={24} />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <QrCode className="text-slate-300 mb-2 group-hover:text-indigo-400" size={40} />
                                                <span className="text-[10px] font-black text-slate-400 uppercase text-center px-4 group-hover:text-indigo-600 tracking-tighter">Attach QR Image</span>
                                            </>
                                        )}
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/*"
                                            className="hidden" 
                                            onChange={handleQrUpload}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                            Scanning worker's physical QR prevents errors during payment settlement. Recommended for digital transfers.
                                        </p>
                                        {qrCode && (
                                            <button 
                                                type="button" 
                                                onClick={() => setQrCode(undefined)}
                                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                                            >
                                                Remove QR
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-6 shrink-0">
                       <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 action-button">
                          <Save size={18} /> {selectedWorker ? 'Update Profile' : 'Save Record'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WorkerManagement;
