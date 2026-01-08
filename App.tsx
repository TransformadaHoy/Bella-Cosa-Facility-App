import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ClipboardList, ShieldCheck, ChevronRight, Building2, Send, ArrowLeft,
  LayoutDashboard, Plus, X, Camera, CalendarDays, FileBarChart, 
  Printer, Edit3, Languages, Loader2, CheckCircle2, Box, ChevronLeft,
  LogOut, Lock, Settings, Delete, AlertCircle, Sparkles, Activity, RefreshCcw
} from 'lucide-react';
import { translateNote, generateBriefing } from './services/geminiService';
import { Priority, WorkOrderStatus, WorkOrder, InventoryItem } from './types';

// --- CONSTANTS ---
const LOCATIONS = [
  "Men's Bathroom", "Woman Bathroom", "Administrative Office", "Foyer", 
  "Ballroom", "Mid Room", "Main Entrance", "North Entrance", "Portico", 
  "Patio", "Parking Lot", "Dumpster", "Room 1", "Room 2", "Room 3", 
  "Room 4", "Room 5", "Room 6", "Room 7", "Room 8", "Room 9", "Room 10", 
  "Room 11", "Housekeeping"
];

const SYSTEMS = [
  "Plumbing", "HVAC", "Electrical", "Carpentry/Finishes", "Flooring", 
  "Restrooms", "Life Safety", "Pest Control", "Housekeeping Support", 
  "Exterior/Structural", "Interior walls repair/painting", "Ceiling", 
  "Washer", "Dryer", "Lights", "Lamp", "Ceiling Fan", "Door Lock", 
  "Window", "Vertical Blinds", "Shower", "Sink", "Toilet", "Sofa Bed", 
  "Caulking", "Other"
];

const MASTER_PASSCODE = "0612";
const toISODate = (date: Date) => date.toISOString().split('T')[0];

export const App = () => {
  const [view, setView] = useState<'landing' | 'staff' | 'manager' | 'passcode'>('landing');
  const [activeTab, setActiveTab] = useState('Work Orders');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  
  // --- LOCAL STATE ---
  const [reports, setReports] = useState<WorkOrder[]>([
    { id: '24001', title: 'HVAC Unit Leak', location: 'Housekeeping', system: 'HVAC', priority: 'High', status: 'IN PROGRESS', date: '2024-01-03', dueDate: '2024-01-05', resolution: '' },
    { id: '24002', title: 'Lighting failure', location: 'Ballroom', system: 'Electrical', priority: 'Medium', status: 'PENDING', date: '2024-01-03', dueDate: '2024-01-10', resolution: '' },
    { id: '24003', title: 'Broken Window Latch', location: 'Room 7', system: 'Carpentry/Finishes', priority: 'Low', status: 'COMPLETED', date: '2024-01-02', dueDate: '2024-01-02', resolution: 'Hardware replaced and frame re-aligned.' },
  ]);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    { id: 'INV-001', name: 'Flush Valves', category: 'Plumbing', stock: 12, unit: 'pcs', status: 'In Stock' },
    { id: 'INV-002', name: 'LED Bulbs 40W', category: 'Electrical', stock: 5, unit: 'boxes', status: 'Low Stock' }
  ]);

  const [noWeddingDays, setNoWeddingDays] = useState<string[]>(['2024-01-15', '2024-01-20']);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const briefing = await generateBriefing(reports);
      setAiBriefing(briefing);
    } catch (e) {
      setAiBriefing("AI Assistant momentarily offline. Ensure API keys are active.");
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleAddReport = (data: Partial<WorkOrder>) => {
    const newId = `${24000 + reports.length + 1}`;
    const newReport: WorkOrder = {
      id: newId,
      title: data.title || 'Untitled',
      location: data.location || LOCATIONS[0],
      system: data.system || SYSTEMS[0],
      priority: data.priority || 'Medium',
      status: 'PENDING',
      date: toISODate(new Date()),
      dueDate: data.dueDate || toISODate(new Date()),
      resolution: ''
    };
    setReports(prev => [newReport, ...prev]);
    triggerSuccess();
  };

  const handleUpdateReport = (id: string, updatedFields: Partial<WorkOrder>) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    triggerSuccess();
    setEditingOrder(null);
  };

  const handlePasscodeEntry = (num: string) => {
    const newPass = passcode + num;
    setPasscode(newPass);
    if (newPass.length === 4) {
      if (newPass === MASTER_PASSCODE) {
        setView('manager');
        setPasscode('');
      } else {
        setPasscodeError(true);
        setTimeout(() => { setPasscode(''); setPasscodeError(false); }, 800);
      }
    }
  };

  // --- VIEWS ---
  if (view === 'landing') {
    return (
      <div className="h-full bg-[#0B1120] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-sm text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-600/10 p-5 rounded-[2.5rem] border border-blue-500/20 shadow-2xl"><Building2 className="w-16 h-16 text-blue-500" /></div>
            <h1 className="text-5xl font-serif uppercase tracking-widest leading-none">Bella Cosa</h1>
            <p className="text-[10px] font-black tracking-[0.4em] uppercase text-blue-400/60">Standalone Ops Hub</p>
          </div>
          <div className="w-full space-y-4">
            <button onClick={() => setView('staff')} className="w-full bg-blue-600 rounded-[2rem] p-7 flex items-center justify-between group shadow-xl active:scale-95 transition-all">
              <div className="flex items-center gap-4"><div className="bg-white/10 p-3 rounded-2xl"><ClipboardList className="w-8 h-8 text-white" /></div><div className="text-left"><h3 className="text-xl font-black uppercase">Staff</h3><p className="text-[9px] text-blue-100 opacity-60 uppercase">Report Incident</p></div></div>
              <ChevronRight className="w-6 h-6 text-white/40" />
            </button>
            <button onClick={() => setView('passcode')} className="w-full bg-slate-800/40 rounded-[2rem] p-7 flex items-center justify-between border border-slate-700/50 backdrop-blur-md active:scale-95 transition-all">
              <div className="flex items-center gap-4"><div className="bg-emerald-500/10 p-3 rounded-2xl"><ShieldCheck className="w-8 h-8 text-emerald-500" /></div><div className="text-left"><h3 className="text-xl font-black uppercase text-white/90">Manager</h3><p className="text-[9px] text-slate-400 uppercase">Management Portal</p></div></div>
              <ChevronRight className="w-6 h-6 text-slate-700" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'staff') {
    return (
      <div className="h-full bg-slate-50 p-6 flex flex-col max-w-lg mx-auto">
        <button onClick={() => setView('landing')} className="flex items-center gap-2 text-slate-400 mb-8 font-black text-[10px] uppercase"><ArrowLeft className="w-5 h-5" /> Hub</button>
        <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-10">New Incident</h2>
        <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</label><textarea id="st-desc" rows={4} className="w-full p-6 rounded-[2rem] border-2 border-slate-100 bg-white font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors" placeholder="What needs attention?" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</label><select id="st-loc" className="w-full p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white font-bold text-slate-600 outline-none">{LOCATIONS.map(l => <option key={l}>{l}</option>)}</select></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System</label><select id="st-sys" className="w-full p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white font-bold text-slate-600 outline-none">{SYSTEMS.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <button onClick={() => {
          const title = (document.getElementById('st-desc') as HTMLTextAreaElement).value;
          if(!title) return;
          handleAddReport({
            title,
            location: (document.getElementById('st-loc') as HTMLSelectElement).value,
            system: (document.getElementById('st-sys') as HTMLSelectElement).value
          });
          setView('landing');
        }} className="w-full p-7 rounded-[2rem] bg-blue-600 text-white font-black text-xl shadow-2xl active:scale-95 transition-all mt-6 shadow-blue-500/20">Submit Report</button>
      </div>
    );
  }

  if (view === 'passcode') {
    return (
      <div className="h-full bg-[#0B1120] flex flex-col items-center justify-center p-8 text-white">
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="bg-emerald-500/10 p-6 rounded-full border border-emerald-500/20"><Lock className="w-12 h-12 text-emerald-500" /></div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Security Check</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Passcode: 0612</p>
        </div>
        <div className={`flex gap-5 mb-16 ${passcodeError ? 'animate-shake' : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-16 h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${passcode.length > i ? 'bg-emerald-500 border-emerald-500 scale-110' : 'bg-slate-800 border-slate-700'}`}>
              <div className={`w-3 h-3 rounded-full ${passcode.length > i ? 'bg-white' : 'bg-slate-700'}`}></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-5 max-w-xs w-full">
          {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => handlePasscodeEntry(n.toString())} className="h-20 bg-slate-800/40 rounded-2xl text-2xl font-black border border-slate-700/50 active:scale-90">{n}</button>)}
          <button onClick={() => setView('landing')} className="h-20 flex items-center justify-center text-slate-500"><ArrowLeft className="w-8 h-8" /></button>
          <button onClick={() => handlePasscodeEntry('0')} className="h-20 bg-slate-800/40 rounded-2xl text-2xl font-black border border-slate-700/50 active:scale-90">0</button>
          <button onClick={() => setPasscode(passcode.slice(0, -1))} className="h-20 flex items-center justify-center text-slate-500"><Delete className="w-8 h-8" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-slate-50">
      <aside className="hidden lg:flex w-80 bg-[#0B1120] text-white flex-col p-8 gap-8 shrink-0 relative z-30 shadow-2xl">
        <div className="flex flex-col gap-4 py-4 border-b border-slate-800">
          <div className="bg-blue-600 p-3 rounded-2xl w-fit"><Building2 className="w-8 h-8 text-white" /></div>
          <h1 className="text-2xl font-serif uppercase tracking-widest">Bella Cosa</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {[{ icon: LayoutDashboard, label: 'Work Orders' }, { icon: Box, label: 'Inventory' }, { icon: CalendarDays, label: 'Calendar' }].map(item => (
            <button key={item.label} onClick={() => setActiveTab(item.label)} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === item.label ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              <div className="flex items-center gap-4"><item.icon className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span></div>
            </button>
          ))}
        </nav>
        <button onClick={() => setView('landing')} className="p-4 text-slate-500 hover:text-rose-400 flex items-center gap-4 mt-auto border-t border-slate-800 font-black text-[10px] uppercase transition-colors"><LogOut className="w-5 h-5" /> Logout</button>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-10 py-8 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{activeTab}</h2>
          <div className="flex gap-4">
            <button onClick={handleBriefing} disabled={isGeneratingBriefing} className="bg-slate-50 text-slate-900 px-6 py-4 rounded-2xl font-black text-[10px] uppercase border border-slate-200 flex items-center gap-2 hover:bg-white transition-all">
              {isGeneratingBriefing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-500" />} AI Briefing
            </button>
            <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> Add Task
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50 no-scrollbar space-y-8">
          {aiBriefing && (
            <div className="bg-white border border-blue-100 rounded-[2.5rem] p-8 shadow-sm flex gap-6 animate-in slide-in-from-top duration-500">
              <div className="bg-blue-50 p-4 rounded-3xl h-fit shrink-0"><Sparkles className="w-8 h-8 text-blue-500" /></div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Operations Coach</p>
                <p className="text-slate-700 font-medium leading-relaxed italic text-lg">"{aiBriefing}"</p>
                <button onClick={() => setAiBriefing(null)} className="text-[9px] font-black text-slate-300 uppercase hover:text-slate-500 transition-colors mt-2">Dismiss Briefing</button>
              </div>
            </div>
          )}

          {activeTab === 'Work Orders' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b text-[9px] font-black uppercase text-slate-400 tracking-widest"><tr><th className="px-8 py-5">Issue</th><th className="px-8 py-5">Location</th><th className="px-8 py-5">Status</th><th className="px-8 py-5"></th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {reports.map(r => (
                    <tr key={r.id} onClick={() => setEditingOrder(r)} className="hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <td className="px-8 py-6"><div className="flex flex-col"><span className="text-[10px] font-black text-blue-500">{r.id}</span><span className="text-sm font-black uppercase text-slate-800">{r.title}</span></div></td>
                      <td className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase">{r.location}</td>
                      <td className="px-8 py-6"><span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase ${r.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : r.status === 'IN PROGRESS' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{r.status}</span></td>
                      <td className="px-8 py-6 text-right"><Edit3 className="w-4 h-4 text-slate-200 group-hover:text-blue-600 transition-all" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Inventory' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b text-[9px] font-black uppercase text-slate-400 tracking-widest"><tr><th className="px-8 py-5">Item</th><th className="px-8 py-5">Stock</th><th className="px-8 py-5">Category</th><th className="px-8 py-5">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {inventoryItems.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6 font-black uppercase text-sm">{i.name}</td>
                      <td className="px-8 py-6 font-bold text-slate-500">{i.stock} {i.unit}</td>
                      <td className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{i.category}</td>
                      <td className="px-8 py-6"><span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase ${i.status === 'In Stock' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{i.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Calendar' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter">January 2024</h3>
                <div className="flex gap-2">
                  <button className="p-2 bg-slate-50 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
                  <button className="p-2 bg-slate-50 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-300 py-4 uppercase">{d}</div>)}
                {Array.from({length: 31}).map((_, i) => (
                  <div key={i} className={`h-24 border border-slate-50 rounded-2xl p-2 relative ${noWeddingDays.includes(`2024-01-${i+1 < 10 ? '0' : ''}${i+1}`) ? 'bg-emerald-50 border-emerald-100' : ''}`}>
                    <span className="text-[10px] font-black text-slate-300">{i+1}</span>
                    {noWeddingDays.includes(`2024-01-${i+1 < 10 ? '0' : ''}${i+1}`) && <div className="absolute bottom-2 right-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 overflow-y-auto max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-start mb-10">
              <div><span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Resolution Console</span><h2 className="text-3xl font-black uppercase tracking-tighter mt-1 text-slate-900">{editingOrder.title}</h2></div>
              <button onClick={() => setEditingOrder(null)} className="p-3 bg-slate-50 rounded-2xl"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-3">{['PENDING', 'IN PROGRESS', 'COMPLETED'].map(s => (<button key={s} onClick={() => handleUpdateReport(editingOrder.id, { status: s as WorkOrderStatus })} className={`py-6 rounded-[1.5rem] text-[10px] font-black border-4 transition-all ${editingOrder.status === s ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-slate-200 border-slate-50 hover:border-slate-100'}`}>{s}</button>))}</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-slate-400">Resolution Note</label><button onClick={async () => { const text = (document.getElementById('res-note') as HTMLTextAreaElement).value; setIsTranslating(true); const t = await translateNote(text); (document.getElementById('res-note') as HTMLTextAreaElement).value = t; setIsTranslating(false); }} className="text-[9px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-colors">{isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />} AI Translate</button></div>
                <textarea id="res-note" defaultValue={editingOrder.resolution} rows={4} className="w-full p-6 bg-slate-50 rounded-[2rem] outline-none font-medium h-40 text-slate-700" placeholder="Describe what was fixed..." />
              </div>
              <button onClick={() => handleUpdateReport(editingOrder.id, { resolution: (document.getElementById('res-note') as HTMLTextAreaElement).value })} className="w-full py-7 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Sync Changes</button>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black uppercase tracking-tighter">Quick Add</h2><button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl"><X className="w-6 h-6" /></button></div>
            <div className="space-y-6">
              <input id="qa-title" placeholder="Description of issue..." className="w-full p-6 bg-slate-50 rounded-[1.5rem] border-2 border-slate-50 outline-none font-bold text-slate-700 focus:bg-white focus:border-blue-100 transition-all shadow-inner" />
              <button onClick={() => { const title = (document.getElementById('qa-title') as HTMLInputElement).value; if(!title) return; handleAddReport({ title }); setIsCreateModalOpen(false); }} className="w-full py-7 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">Create Order</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-md animate-in zoom-in duration-300">
          <div className="bg-white rounded-[4rem] p-16 flex flex-col items-center gap-6 shadow-2xl animate-bounce border-8 border-emerald-50">
            <CheckCircle2 className="w-20 h-20 text-emerald-500" />
            <h3 className="text-2xl font-black uppercase tracking-[0.3em] text-slate-900">Synchronized</h3>
          </div>
        </div>
      )}
    </div>
  );
};
