
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2,
  Edit2,
  X,
  PlusCircle,
  Save,
  Tag,
  Settings2,
  Printer,
  Calendar,
  Box,
  CheckCircle2
} from 'lucide-react';
import { db } from '../db';
import { Lot, LotStatus, LotStageRate, Stage, LotExtraDetail } from '../types';

const LotManagement: React.FC = () => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [globalStages, setGlobalStages] = useState<Stage[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [printingLot, setPrintingLot] = useState<Lot | null>(null);
  
  // Form state
  const [lotNumber, setLotNumber] = useState('');
  const [design, setDesign] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [lotStages, setLotStages] = useState<LotStageRate[]>([]);
  const [extraDetails, setExtraDetails] = useState<LotExtraDetail[]>([]);

  useEffect(() => {
    const fetchedLots = db.getLots();
    const fetchedStages = db.getStages();
    setLots(fetchedLots);
    setGlobalStages(fetchedStages);
  }, []);

  const suggestLotNumber = (existingLots: Lot[]) => {
    if (existingLots.length === 0) return '1001';
    const numbers = existingLots
      .map(l => parseInt(l.lotNumber))
      .filter(n => !isNaN(n));
    if (numbers.length === 0) return (existingLots.length + 1001).toString();
    return (Math.max(...numbers) + 1).toString();
  };

  const openNewLotModal = () => {
    const currentLots = db.getLots();
    setEditingLot(null);
    setLotNumber(suggestLotNumber(currentLots)); 
    setDesign('');
    setColor('');
    setQuantity(0);
    setLotStages(globalStages.map(s => ({ id: s.id, name: s.name, rate: s.baseRate })));
    setExtraDetails([]);
    setShowModal(true);
  };

  const openEditLotModal = (lot: Lot) => {
    setEditingLot(lot);
    setLotNumber(lot.lotNumber);
    setDesign(lot.design);
    setColor(lot.color);
    setQuantity(lot.totalQuantity);
    setLotStages(lot.stageRates || []);
    setExtraDetails(lot.extraDetails || []);
    setShowModal(true);
  };

  const handlePrint = (lot: Lot) => {
    setPrintingLot(lot);
    setTimeout(() => {
      window.print();
      setPrintingLot(null);
    }, 300);
  };

  const handleSaveLot = (e: React.FormEvent) => {
    e.preventDefault();
    const lotData: Lot = {
      id: editingLot?.id || `LOT-${Date.now()}`,
      lotNumber,
      date: editingLot?.date || new Date().toISOString().split('T')[0],
      design,
      color,
      totalQuantity: quantity,
      status: editingLot?.status || LotStatus.RUNNING,
      stageRates: lotStages,
      extraDetails: extraDetails.filter(d => d.label.trim() !== ''),
      createdAt: editingLot?.createdAt || Date.now()
    };

    if (editingLot) {
      db.updateLot(lotData);
    } else {
      db.addLot(lotData);
    }

    setLots(db.getLots());
    setShowModal(false);
  };

  const toggleStatus = (lot: Lot) => {
    const updated = { ...lot, status: lot.status === LotStatus.RUNNING ? LotStatus.COMPLETED : LotStatus.RUNNING };
    db.updateLot(updated);
    setLots(db.getLots());
  };

  const addCustomStage = () => {
    const newStage: LotStageRate = {
      id: `custom-${Date.now()}`,
      name: '',
      rate: 0
    };
    setLotStages([...lotStages, newStage]);
  };

  const removeStage = (id: string) => {
    setLotStages(lotStages.filter(s => s.id !== id));
  };

  const updateStage = (id: string, field: keyof LotStageRate, value: string | number) => {
    setLotStages(lotStages.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addExtraDetail = () => {
    setExtraDetails([...extraDetails, { id: `detail-${Date.now()}`, label: '', value: '' }]);
  };

  const removeExtraDetail = (id: string) => {
    setExtraDetails(extraDetails.filter(d => d.id !== id));
  };

  const updateExtraDetail = (id: string, field: keyof LotExtraDetail, value: string) => {
    setExtraDetails(extraDetails.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const totalLotRate = useMemo(() => {
    return lotStages.reduce((sum, s) => sum + (Number(s.rate) || 0), 0);
  }, [lotStages]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">T-shirt Design Lots</h2>
          <p className="text-sm text-gray-500">Manage batches, designs, and stage-wise pricing</p>
        </div>
        <button 
          onClick={openNewLotModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md font-semibold"
        >
          <Plus size={20} /> Create New Lot
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 no-print">
        {lots.map(lot => (
          <div key={lot.id} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-300">
            <div className={`h-2 w-full ${lot.status === LotStatus.RUNNING ? 'bg-[#6366f1]' : 'bg-[#10b981]'}`} />
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-2xl font-black text-gray-900 uppercase">Lot {lot.lotNumber}</h4>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePrint(lot)}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Print Job Card"
                  >
                    <Printer size={18} />
                  </button>
                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    lot.status === LotStatus.RUNNING ? 'bg-[#eef2ff] text-[#6366f1]' : 'bg-[#ecfdf5] text-[#10b981]'
                  }`}>
                    {lot.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 font-bold tracking-tight mb-8">{lot.date}</p>

              <div className="space-y-5 flex-1">
                <div className="flex flex-col text-gray-600">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Design</span>
                  <span className="text-base font-bold text-gray-700">{lot.design}</span>
                </div>
                <div className="flex flex-col text-gray-600">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fabric Color</span>
                  <span className="text-base font-bold text-gray-700">{lot.color}</span>
                </div>
                <div className="flex flex-col text-gray-600">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Quantity</span>
                  <span className="text-base font-black text-gray-900">{lot.totalQuantity} Pcs</span>
                </div>
                {lot.extraDetails && lot.extraDetails.length > 0 && (
                   <div className="pt-2 flex flex-wrap gap-2">
                     {lot.extraDetails.map(d => (
                       <span key={d.id} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-400 uppercase">
                         {d.label}: {d.value}
                       </span>
                     ))}
                   </div>
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
                 <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Total Stitching Rate</span>
                 <span className="text-2xl font-black text-[#6366f1]">₹{(lot.stageRates?.reduce((s, r) => s + r.rate, 0) || 0).toFixed(2)}</span>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => openEditLotModal(lot)}
                  className="flex-1 py-3.5 text-xs font-black text-gray-600 bg-gray-50 rounded-[1rem] hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} /> Edit Lot
                </button>
                <button 
                  onClick={() => toggleStatus(lot)}
                  className={`flex-1 py-3.5 text-xs font-black rounded-[1rem] transition-all border-2 ${
                    lot.status === LotStatus.RUNNING 
                      ? 'border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white' 
                      : 'border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1] hover:text-white'
                  }`}
                >
                  {lot.status === LotStatus.RUNNING ? 'Mark Done' : 'Re-open'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lot Creation/Edit Modal - Grey Themed Filing Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-slate-100 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-12 py-10 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {editingLot ? 'Edit Design Lot' : 'Create New Lot'}
                </h3>
                <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-wider">Manual Filing Record</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-50 hover:shadow-md rounded-full transition-all text-slate-300 hover:text-slate-900">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSaveLot} className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
              {/* Standardized 4-Column Header Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Lot No.</label>
                  <input 
                    required 
                    value={lotNumber} 
                    onChange={e => setLotNumber(e.target.value)} 
                    className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-lg placeholder:text-slate-200 transition-all shadow-sm" 
                    placeholder="1001" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Model / Name</label>
                  <input 
                    required 
                    value={design} 
                    onChange={e => setDesign(e.target.value)} 
                    className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold placeholder:text-slate-200 transition-all shadow-sm" 
                    placeholder="e.g. Round Neck" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Color</label>
                  <input 
                    required 
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                    className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold placeholder:text-slate-200 transition-all shadow-sm" 
                    placeholder="e.g. Navy" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Quantity</label>
                  <input 
                    type="number" 
                    required 
                    value={quantity} 
                    onChange={e => setQuantity(parseInt(e.target.value) || 0)} 
                    className="w-full px-5 py-4 bg-white border border-slate-300 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-lg placeholder:text-slate-200 transition-all shadow-sm" 
                    placeholder="500" 
                  />
                </div>
              </div>

              {/* Customize Details Section (Replaced Technical Notes) */}
              <div className="space-y-6">
                 <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                       <Tag size={18} className="text-slate-400" />
                       <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Specifications</h4>
                    </div>
                    <button 
                      type="button" 
                      onClick={addExtraDetail}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-[10px] font-black text-indigo-600 uppercase hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <PlusCircle size={14} /> Add Detail Row
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {extraDetails.map((detail) => (
                       <div key={detail.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
                          <div className="flex-1 space-y-1">
                             <input 
                               placeholder="Label (e.g. GSM)" 
                               className="w-full bg-transparent border-none p-0 focus:ring-0 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                               value={detail.label}
                               onChange={e => updateExtraDetail(detail.id, 'label', e.target.value)}
                             />
                             <input 
                               placeholder="Value (e.g. 180)" 
                               className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-800"
                               value={detail.value}
                               onChange={e => updateExtraDetail(detail.id, 'value', e.target.value)}
                             />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeExtraDetail(detail.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    ))}
                    {extraDetails.length === 0 && (
                      <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                         <Settings2 size={24} className="mb-1 opacity-20" />
                         <p className="text-[10px] font-black uppercase tracking-widest">No custom details added</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Piece Rates Section */}
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                  <div className="flex items-center gap-6">
                    <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase">Piece Rates / Operation</h4>
                    <div className="bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                      SUM: ₹{totalLotRate.toFixed(2)}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={addCustomStage}
                    className="flex items-center gap-2 text-indigo-600 font-black text-sm hover:underline"
                  >
                    <PlusCircle size={20} /> Add Stage
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {lotStages.map((stage) => (
                    <div key={stage.id} className="group relative flex items-center gap-8 p-6 bg-white rounded-[1.5rem] border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Stage Name</label>
                        <input 
                          required
                          value={stage.name}
                          onChange={e => updateStage(stage.id, 'name', e.target.value)}
                          placeholder="e.g. Shoulder"
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-800 font-black text-lg placeholder:text-slate-200"
                        />
                      </div>
                      <div className="w-40 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 text-right block pr-4">Rate (₹)</label>
                        <input 
                          type="number"
                          step="0.1"
                          required
                          value={stage.rate}
                          onChange={e => updateStage(stage.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-indigo-600 font-black text-3xl text-right"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeStage(stage.id)}
                        className="absolute -top-3 -right-3 p-2.5 text-white bg-rose-500 hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-all rounded-full shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-8 pt-12 border-t border-slate-200 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-12 py-5 text-slate-400 font-black hover:text-slate-900 transition-colors uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-16 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3 uppercase text-xs tracking-widest"
                >
                  <Save size={18} /> {editingLot ? 'Update Lot' : 'Register Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Template */}
      {printingLot && (
        <div className="print-container">
          <div className="max-w-4xl mx-auto p-12 bg-white text-slate-900 font-sans border-[12px] border-slate-900">
            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
              <div className="space-y-2">
                <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">RBS Textile</h1>
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">Production Master Job Card</p>
              </div>
              <div className="text-right space-y-2">
                <div className="inline-block bg-slate-900 text-white px-6 py-3 font-black text-2xl tracking-tight rounded-sm">
                   LOT: #{printingLot.lotNumber}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {printingLot.id}</div>
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-12 mb-12">
               <div className="space-y-6">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Design / Model</span>
                     <span className="text-2xl font-black text-slate-900 uppercase">{printingLot.design}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fabric Color</span>
                     <span className="text-xl font-bold text-slate-700 uppercase">{printingLot.color}</span>
                  </div>
               </div>
               <div className="space-y-6 border-l-2 border-slate-100 pl-12">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Date</span>
                     <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                        <Calendar size={18} className="text-slate-300" />
                        {printingLot.date}
                     </div>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Quantity</span>
                     <div className="flex items-center gap-2 text-3xl font-black text-slate-900">
                        <Box size={20} className="text-slate-300" />
                        {printingLot.totalQuantity} <span className="text-xs font-black uppercase text-slate-400 ml-1">Pcs</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Extra Specifications */}
            {printingLot.extraDetails && printingLot.extraDetails.length > 0 && (
              <div className="mb-12 bg-slate-50 p-8 rounded-sm border border-slate-100">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <Settings2 size={14} /> Technical Specifications
                </h4>
                <div className="grid grid-cols-3 gap-y-6 gap-x-12">
                  {printingLot.extraDetails.map(detail => (
                    <div key={detail.id} className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{detail.label}</span>
                       <span className="text-sm font-bold text-slate-800">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Operation Stages Table */}
            <div className="mb-12">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Operation Piece-Rates</h4>
              <table className="w-full text-left border-2 border-slate-900">
                <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-r border-slate-700">Operation / Stage</th>
                    <th className="px-6 py-4 text-right">Stitching Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200">
                  {printingLot.stageRates?.map((stage, idx) => (
                    <tr key={idx} className="font-bold text-slate-800 text-sm">
                      <td className="px-6 py-4 border-r-2 border-slate-100 uppercase">{stage.name}</td>
                      <td className="px-6 py-4 text-right font-mono">₹{stage.rate.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <td className="px-6 py-6 font-black uppercase tracking-widest text-slate-900 border-r-2 border-slate-100">Total Lot Stitching Value</td>
                    <td className="px-6 py-6 text-right text-3xl font-black text-slate-900 tracking-tighter">
                       ₹{(printingLot.stageRates?.reduce((s, r) => s + r.rate, 0) || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Signatures */}
            <div className="mt-20 flex justify-between items-end gap-12">
               <div className="flex-1 space-y-4">
                  <div className="h-20 border-b-2 border-slate-200 w-full"></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Cutting Master Signature</p>
               </div>
               <div className="flex-1 space-y-4">
                  <div className="h-20 border-b-2 border-slate-200 w-full"></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Floor Manager Signature</p>
               </div>
               <div className="flex-1 space-y-4">
                  <div className="h-20 border-b-2 border-slate-200 w-full text-center flex items-center justify-center">
                     <div className="w-24 h-24 border-4 border-slate-100 rounded-full flex items-center justify-center opacity-20">
                        <CheckCircle2 size={40} />
                     </div>
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Authorized Seal</p>
               </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Generated by RBS Textile Industrial ERP</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotManagement;
