
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ClipboardList, ShieldCheck, ChevronRight, Building2, Send, ArrowLeft,
  LayoutDashboard, Plus, X, Camera, CalendarDays, FileBarChart, 
  Printer, Edit3, Languages, Loader2, CheckCircle2, Box, ChevronLeft,
  Info, Wrench, Activity, LogOut, ShoppingCart, Trash2, Minus, PlusCircle, 
  Mail, Share2, Download, Lock, Settings, QrCode
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- TYPES & INTERFACES ---
type Priority = 'Low' | 'Medium' | 'High';
type WorkOrderStatus = 'PENDING' | 'IN PROGRESS' | 'COMPLETED';

interface UsedMaterial {
  itemId: string;
  name: string;
  quantity: number;
}

interface WorkOrder {
  id: string;
  title: string;
  location: string;
  system: string;
  priority: Priority;
  status: WorkOrderStatus;
  date: string;
  dueDate: string;
  image?: string | null;
  resolution?: string;
  viewed?: boolean;
  usedMaterials?: UsedMaterial[];
}

interface PMTask {
  id: string;
  title: string;
  location: string;
  system: string;
  frequency: string;
  dueDate: string;
  status: 'Upcoming' | 'Scheduled' | 'Completed';
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

// --- CONSTANTS ---
const LOCATIONS = [
  "Men's Bathroom", "Woman Bathroom", "Administrative Office", "Foyer", 
  "Ballroom", "Mid Room", "Main Entrance", "North Entrance", "Portico", 
  "Patio", "Parking Lot", "Dumpster", "Room 1", "Room 2", "Room 3", 
  "Room 4", "Room 5", "Room 6", "Room 7", "Room 8", "Room 9", "Room 10", 
  "Room 11", "Housekeeping"
];
const SYSTEMS = ["Plumbing", "HVAC", "Electrical", "Carpentry/Finishes", "Flooring", "Restrooms", "Life Safety", "Pest Control", "Housekeeping Support", "Exterior/Structural", "Interior walls repair/painting", "Ceiling", "Washer", "Dryer", "Other"];
const PROPERTY_MANAGER = "Carlos Velez";
const MASTER_PASSCODE = "0612";

const toISODate = (date: Date) => date.toISOString().split('T')[0];

// --- SUB-COMPONENTS ---

const LandingPage = ({ 
  setView, unreadCount, lowStockCount 
}: { 
  setView: (v: any) => void, unreadCount: number, lowStockCount: number 
}) => (
  <div className="h-full bg-[#0B1120] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden transition-all duration-300">
    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
      <div className="absolute top-[10%] left-[-10%] w-64 h-64 bg-blue-600 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-64 h-64 bg-emerald-600 rounded-full blur-[100px]"></div>
    </div>
    <div className="relative z-10 flex flex-col items-center gap-12 max-w-sm w-full animate-in fade-in zoom-in duration-500 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-blue-600/20 p-5 rounded-[2.5rem] border border-blue-500/30 shadow-2xl backdrop-blur-sm"><Building2 className="w-14 h-14 text-blue-500" /></div>
        <div><h1 className="text-5xl font-serif tracking-[0.1em] uppercase mb-1">Bella Cosa</h1><p className="text-[10px] font-black tracking-[0.4em] uppercase text-blue-400 opacity-80">Facility Operations Hub</p></div>
      </div>
      <div className="w-full space-y-4">
        <button onClick={() => setView('staff')} className="w-full bg-[#3B82F6] active:scale-[0.97] transition-all rounded-[2rem] p-7 flex items-center justify-between group shadow-xl border border-blue-400/20">
          <div className="flex items-center gap-5"><div className="bg-white/10 p-3 rounded-2xl"><ClipboardList className="w-8 h-8 text-white" /></div><div className="text-left"><h3 className="text-xl font-black uppercase tracking-tight">Staff Portal</h3><p className="text-[9px] text-blue-100 opacity-60 uppercase tracking-widest mt-1">Report Incident Fast</p></div></div>
          <ChevronRight className="w-6 h-6 text-white/40" />
        </button>
        <button onClick={() => setView('passcode')} className="w-full bg-slate-800/40 active:scale-[0.97] transition-all rounded-[2rem] p-7 flex items-center justify-between border border-slate-700/50 backdrop-blur-md relative">
          <div className="flex items-center gap-5"><div className="bg-emerald-500/10 p-3 rounded-2xl"><ShieldCheck className="w-8 h-8 text-emerald-500" /></div><div className="text-left"><h3 className="text-xl font-black uppercase tracking-tight text-white/90">Manager</h3><p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Control Center</p></div></div>
          <div className="flex items-center gap-3">
            {(unreadCount > 0 || lowStockCount > 0) && <span className="flex h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse"></span>}
            <ChevronRight className="w-6 h-6 text-slate-700" />
          </div>
        </button>
      </div>
    </div>
  </div>
);

const PasscodePage = ({ 
  passcode, passcodeError, handlePasscodeEntry, setView, setPasscode 
}: { 
  passcode: string, passcodeError: boolean, handlePasscodeEntry: (s: string) => void, setView: (v: any) => void, setPasscode: (s: string) => void 
}) => (
  <div className="h-full bg-[#0B1120] flex flex-col items-center justify-center p-8 text-white animate-in fade-in duration-300">
    <div className="flex flex-col items-center gap-6 mb-12">
      <div className="bg-emerald-500/10 p-6 rounded-full border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]"><Lock className="w-12 h-12 text-emerald-500" /></div>
      <div className="text-center"><h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">Security Access</h2><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-4">Enter Manager Passcode</p></div>
    </div>
    <div className={`flex gap-5 mb-16 transition-transform ${passcodeError ? 'animate-bounce' : ''}`}>
      {[0, 1, 2, 3].map((idx) => (
        <div key={idx} className={`w-16 h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${passcode.length > idx ? (passcodeError ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]') : 'bg-slate-800/50 border-slate-700'}`}><div className={`w-4 h-4 rounded-full transition-all duration-300 ${passcode.length > idx ? 'bg-white scale-125' : 'bg-slate-700 scale-100'}`}></div></div>
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5 max-w-xs w-full">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (<button key={num} onClick={() => handlePasscodeEntry(num)} className="h-24 bg-slate-800/40 hover:bg-slate-700 active:bg-slate-600 rounded-3xl text-3xl font-black active:scale-90 transition-all border border-slate-700/50 shadow-lg">{num}</button>))}
      <button onClick={() => setView('landing')} className="h-24 flex items-center justify-center text-slate-500 active:scale-90 transition-all"><ArrowLeft className="w-10 h-10" /></button>
      <button onClick={() => handlePasscodeEntry('0')} className="h-24 bg-slate-800/40 hover:bg-slate-700 active:bg-slate-600 rounded-3xl text-3xl font-black active:scale-90 transition-all border border-slate-700/50 shadow-lg">0</button>
      <button onClick={() => setPasscode(passcode.slice(0, -1))} className="h-24 flex items-center justify-center text-slate-500 active:scale-90 transition-all"><X className="w-10 h-10" /></button>
    </div>
  </div>
);

const StaffPortal = ({ setView, onAddReport }: { setView: (v: any) => void, onAddReport: (d: Partial<WorkOrder>) => void }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [system, setSystem] = useState(SYSTEMS[0]);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    onAddReport({ title, location, system, image });
    setTitle('');
    setLocation(LOCATIONS[0]);
    setSystem(SYSTEMS[0]);
    setImage(null);
    setView('landing');
  };

  return (
    <div className="h-full bg-slate-50 p-6 flex flex-col max-w-lg mx-auto font-sans overflow-hidden animate-in slide-in-from-right duration-500">
      <button onClick={() => setView('landing')} className="flex items-center gap-2 text-slate-400 mb-8 hover:text-blue-600 transition-colors shrink-0"><ArrowLeft className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">Back to Hub</span></button>
      <div className="mb-10 shrink-0"><h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-slate-900">New Incident</h2><p className="text-slate-500 font-medium text-sm mt-3 italic">Reporting to Carlos Velez.</p></div>
      <div className="space-y-6 flex-1 pb-6 overflow-y-auto no-scrollbar">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Describe the Problem</label>
          <textarea rows={6} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Room 4 AC is blowing warm air..." className="w-full p-6 rounded-[2rem] border-2 border-slate-100 bg-white text-base font-bold outline-none shadow-sm focus:border-blue-500 transition-all resize-none leading-relaxed" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Exact Location</label><select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white text-sm font-bold outline-none shadow-sm">{LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select></div>
          <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Relevant System</label><select value={system} onChange={(e) => setSystem(e.target.value)} className="w-full p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white text-sm font-bold outline-none shadow-sm">{SYSTEMS.map(sys => <option key={sys} value={sys}>{sys}</option>)}</select></div>
        </div>
        <div onClick={() => fileInputRef.current?.click()} className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 active:bg-slate-50 transition-all relative overflow-hidden min-h-[220px] cursor-pointer shadow-sm">
          {image ? <img src={image} className="absolute inset-0 w-full h-full object-cover" /> : <><div className="bg-slate-50 p-6 rounded-full text-slate-300 shadow-inner"><Camera className="w-10 h-10" /></div><p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Snapshot for Evidence</p></>}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => setImage(r.result as string); r.readAsDataURL(f); }}} />
        </div>
      </div>
      <button onClick={handleSubmit} disabled={!title} className="w-full p-7 rounded-[2rem] bg-blue-600 text-white font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/30 active:scale-95 disabled:opacity-40 transition-all shrink-0">Submit Report</button>
    </div>
  );
};

// --- MODALS ---

const ManageInventoryModal = ({ item, onClose, onUpdate }: { item: InventoryItem, onClose: () => void, onUpdate: (id: string, d: Partial<InventoryItem>) => void }) => {
  const [form, setForm] = useState({ name: item.name, category: item.category, stock: item.stock, minStock: item.minStock, unit: item.unit });
  return (
    <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-[#0B1120]/95 backdrop-blur-xl p-4 animate-in slide-in-from-bottom duration-300 print:hidden">
      <div className="bg-white rounded-[3rem] lg:rounded-[4rem] w-full max-w-xl shadow-2xl p-10 lg:p-16 mb-4 border border-slate-100">
        <div className="flex justify-between items-start mb-12 shrink-0"><div><h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Edit Material</h2></div><button onClick={onClose} className="p-4 bg-slate-50 rounded-2xl active:scale-90"><X className="w-7 h-7" /></button></div>
        <div className="space-y-8 pb-8">
          <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Item Name</label><input className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-base font-bold outline-none focus:border-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Stock Level</label><input type="number" className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})} /></div>
            <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Min Stock Alert</label><input type="number" className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none" value={form.minStock} onChange={e => setForm({...form, minStock: parseInt(e.target.value) || 0})} /></div>
          </div>
          <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Category</label><select className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <button onClick={() => onUpdate(item.id, form)} className="w-full py-7 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] bg-blue-600 text-white shadow-2xl active:scale-95 mt-4">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

// --- FIX: ADDED MISSING MODAL COMPONENTS ---

const CreateWorkOrderModal = ({ onClose, onSubmit }: { onClose: () => void, onSubmit: (d: Partial<WorkOrder>) => void }) => {
  const [formData, setFormData] = useState({ title: '', location: LOCATIONS[0], system: SYSTEMS[0], priority: 'Medium' as Priority, dueDate: toISODate(new Date()), image: null as string | null });
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0B1120]/95 backdrop-blur-xl p-4 font-sans text-slate-900">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl p-10 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between mb-8"><div><h2 className="text-3xl font-black uppercase">New Work Order</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Maintenance Hub</p></div><button onClick={onClose} className="p-3 bg-slate-50 rounded-xl"><X /></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">What's wrong?</label><input className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold outline-none focus:border-blue-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Incident summary..." /></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Area</label><select className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>{LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">System</label><select className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold outline-none" value={formData.system} onChange={e => setFormData({...formData, system: e.target.value})}>{SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Due Date</label><input type="date" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Priority</label><div className="grid grid-cols-3 gap-2">{['Low', 'Medium', 'High'].map(p => (<button key={p} onClick={() => setFormData({...formData, priority: p as Priority})} className={`py-3 text-[9px] font-black rounded-xl border transition-all ${formData.priority === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>{p}</button>))}</div></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Evidence</label><div onClick={() => fileRef.current?.click()} className="h-24 border-2 border-dashed rounded-2xl flex items-center justify-center bg-slate-50 cursor-pointer overflow-hidden">{formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}</div><input type="file" className="hidden" ref={fileRef} onChange={e => {const f = e.target.files?.[0]; if(f){const r=new FileReader(); r.onloadend=()=>setFormData({...formData, image: r.result as string}); r.readAsDataURL(f);}}} /></div>
          </div>
        </div>
        <button onClick={() => onSubmit(formData)} disabled={!formData.title} className="w-full py-5 rounded-2xl font-black text-[10px] uppercase bg-blue-600 text-white mt-10 shadow-xl">Create Work Order</button>
      </div>
    </div>
  );
};

const CreatePMModal = ({ onClose, onSubmit }: { onClose: () => void, onSubmit: (d: any) => void }) => {
  const [formData, setFormData] = useState({ title: '', location: LOCATIONS[0], system: SYSTEMS[0], frequency: 'Monthly', dueDate: toISODate(new Date()) });
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0B1120]/95 backdrop-blur-xl p-4 font-sans text-slate-900">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl p-10 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between mb-8"><div><h2 className="text-3xl font-black uppercase">New PM Task</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Preventive Maintenance</p></div><button onClick={onClose} className="p-3 bg-slate-50 rounded-xl"><X /></button></div>
        <div className="space-y-6">
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Task Name</label><input className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold outline-none focus:border-blue-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Filter Change" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Area</label><select className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>{LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Frequency</label><select className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold outline-none" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}><option>Monthly</option><option>Quarterly</option><option>Bi-Annual</option><option>Annual</option></select></div>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Due Date</label><input type="date" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
        </div>
        <button onClick={() => onSubmit(formData)} disabled={!formData.title} className="w-full py-5 rounded-2xl font-black text-[10px] uppercase bg-blue-600 text-white mt-10 shadow-xl">Schedule Task</button>
      </div>
    </div>
  );
};

const AddInventoryModal = ({ onClose, onSubmit }: { onClose: () => void, onSubmit: (d: any) => void }) => {
  const [formData, setFormData] = useState({ name: '', category: SYSTEMS[0], stock: 0, unit: 'pcs' });
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0B1120]/95 backdrop-blur-xl p-4 font-sans text-slate-900">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl p-10 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between mb-8"><div><h2 className="text-3xl font-black uppercase">Add Material</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inventory Management</p></div><button onClick={onClose} className="p-3 bg-slate-50 rounded-xl"><X /></button></div>
        <div className="space-y-6">
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Item Name</label><input className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold outline-none focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Flush Valve" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Category</label><select className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
             <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Unit</label><input className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="pcs, units, etc" /></div>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Initial Stock</label><input type="number" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-semibold" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} /></div>
        </div>
        <button onClick={() => onSubmit(formData)} disabled={!formData.name} className="w-full py-5 rounded-2xl font-black text-[10px] uppercase bg-blue-600 text-white mt-10 shadow-xl">Add to Stock</button>
      </div>
    </div>
  );
};

const ShareReportModal = ({ currentDate, onClose }: { currentDate: Date, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
        <div className="bg-blue-50 p-6 rounded-full text-blue-600 mb-6"><Share2 className="w-10 h-10" /></div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">Ready to Send</h3>
        <p className="text-xs text-slate-500 font-medium mb-8">The Operations Review for {currentDate.toLocaleString('default', { month: 'long' })} is ready for distribution.</p>
        <div className="grid grid-cols-2 gap-4 w-full">
           <button onClick={() => { window.print(); onClose(); }} className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col items-center gap-2 transition-all active:scale-95"><Printer className="w-6 h-6" /><span className="text-[9px] font-black uppercase">Print PDF</span></button>
           <button onClick={() => { navigator.clipboard.writeText(window.location.href); onClose(); alert('Link copied to clipboard!'); }} className="p-5 rounded-2xl bg-blue-600 text-white flex flex-col items-center gap-2 transition-all active:scale-95"><Download className="w-6 h-6" /><span className="text-[9px] font-black uppercase">Copy Link</span></button>
        </div>
        <button onClick={onClose} className="mt-8 text-[9px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-900">Close</button>
      </div>
    </div>
  );
};

const ManageOrderModal = ({ 
  order, onClose, onUpdate, onTranslate, isTranslating, inventoryItems 
}: { 
  order: WorkOrder, onClose: () => void, onUpdate: (id: string, d: Partial<WorkOrder>) => void, onTranslate: (t: string, c: any) => Promise<void>, isTranslating: boolean, inventoryItems: InventoryItem[] 
}) => {
  const [status, setStatus] = useState<WorkOrderStatus>(order.status);
  const [resNote, setResNote] = useState(order.resolution || '');
  const [usedMaterials, setUsedMaterials] = useState<UsedMaterial[]>(order.usedMaterials || []);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState('');

  const addMaterialUsage = () => {
    if (!selectedItemToAdd) return;
    const item = inventoryItems.find((i: InventoryItem) => i.id === selectedItemToAdd);
    if (!item || usedMaterials.some(m => m.itemId === item.id)) return;
    setUsedMaterials(prev => [...prev, { itemId: item.id, name: item.name, quantity: 1 }]);
    setSelectedItemToAdd('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-[#0B1120]/95 backdrop-blur-xl p-4 animate-in slide-in-from-bottom duration-300 print:hidden">
      <div className="bg-white rounded-[3rem] lg:rounded-[4rem] w-full max-w-3xl shadow-2xl p-10 lg:p-16 overflow-y-auto no-scrollbar max-h-[95vh] border border-slate-100">
        <div className="flex justify-between items-start mb-12 shrink-0"><div className="flex-1 min-w-0"><h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-tight whitespace-normal">{order.title}</h2></div><button onClick={onClose} className="p-4 bg-slate-50 rounded-2xl active:scale-90"><X className="w-8 h-8" /></button></div>
        <div className="space-y-10 lg:space-y-14">
          {order.image && (<div className="space-y-4 shrink-0"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Incident Evidence</label><div className="w-full aspect-video max-h-56 lg:max-h-80 rounded-[3rem] overflow-hidden bg-slate-100 flex items-center justify-center"><img src={order.image} className="w-full h-full object-contain" /></div></div>)}
          <div className="space-y-5 shrink-0"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Life-cycle Control</label><div className="grid grid-cols-3 gap-4">{['PENDING', 'IN PROGRESS', 'COMPLETED'].map(s => (<button key={s} onClick={() => setStatus(s as WorkOrderStatus)} className={`py-6 rounded-[2rem] text-[10px] lg:text-[12px] font-black border-4 transition-all active:scale-95 ${status === s ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-slate-300 border-slate-50'}`}>{s.split(' ')[0]}</button>))}</div></div>
          <div className="space-y-5 shrink-0">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Material Deduction</label>
            <div className="bg-slate-50 p-8 rounded-[3rem] space-y-6">
              <div className="flex gap-3"><select className="flex-1 p-5 rounded-[1.5rem] bg-white text-xs font-black uppercase outline-none shadow-sm" value={selectedItemToAdd} onChange={(e) => setSelectedItemToAdd(e.target.value)}><option value="">Select Resource...</option>{inventoryItems.map((item: InventoryItem) => (<option key={item.id} value={item.id}>{item.name}</option>))}</select><button onClick={addMaterialUsage} className="bg-blue-600 text-white px-6 rounded-2xl"><PlusCircle className="w-7 h-7" /></button></div>
              <div className="space-y-3">
                {usedMaterials.map((mat) => (
                  <div key={mat.itemId} className="flex items-center justify-between bg-white p-5 rounded-[1.5rem] shadow-sm">
                    <div className="flex flex-col"><span className="text-sm font-black text-slate-900 uppercase">{mat.name}</span></div>
                    <div className="flex items-center gap-5 ml-4"><button onClick={() => setUsedMaterials(prev => prev.filter(m => m.itemId !== mat.itemId))} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-6 h-6" /></button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-5 shrink-0"><div className="flex justify-between items-end"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Notes</label><button onClick={() => onTranslate(resNote, setResNote)} disabled={isTranslating} className="text-[9px] font-black text-blue-600 bg-blue-50 px-5 py-2.5 rounded-2xl flex items-center gap-2">{isTranslating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Languages className="w-5 h-5" />} AI</button></div><textarea rows={4} className="w-full p-8 rounded-[2.5rem] bg-slate-50 text-base font-semibold outline-none focus:bg-white transition-all shadow-inner" value={resNote} onChange={e => setResNote(e.target.value)} /></div>
          <button onClick={() => onUpdate(order.id, { status, resolution: resNote, usedMaterials })} className="w-full py-8 lg:py-10 rounded-[3rem] font-black text-[14px] uppercase tracking-[0.5em] bg-blue-600 text-white shadow-2xl hover:bg-blue-500 active:scale-[0.98] transition-all mb-10">Synchronize Operational Profile</button>
        </div>
      </div>
    </div>
  );
};

// --- FIX: ADDED MISSING VIEW COMPONENTS ---

const WorkOrdersView = ({ reports, handleEditOrder }: { reports: WorkOrder[], handleEditOrder: (r: WorkOrder) => void }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
    <table className="w-full text-left">
      <thead className="bg-slate-50/50 border-b text-[9px] font-black uppercase text-slate-400 tracking-widest"><tr><th className="px-8 py-5">ID / Title</th><th className="px-8 py-5">Area</th><th className="px-8 py-5">System</th><th className="px-8 py-5">Due Date</th><th className="px-8 py-5">Status</th><th className="px-8 py-5"></th></tr></thead>
      <tbody className="divide-y divide-slate-50">
        {reports.filter(r => r.status !== 'COMPLETED').map(r => (
          <tr key={r.id} onClick={() => handleEditOrder(r)} className="hover:bg-blue-50/30 transition-all cursor-pointer group">
            <td className="px-8 py-5"><div className="flex flex-col"><span className={`text-[9px] font-black ${!r.viewed ? 'text-rose-500' : 'text-blue-500'}`}>{r.id} {!r.viewed && '• NEW'}</span><span className="text-sm font-black uppercase text-slate-900">{r.title}</span></div></td>
            <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase">{r.location}</td>
            <td className="px-8 py-5"><span className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-[8px] font-black border border-slate-100 uppercase">{r.system}</span></td>
            <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase">{r.dueDate}</td>
            <td className="px-8 py-5"><span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase ${r.status === 'IN PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{r.status}</span></td>
            <td className="px-8 py-5 text-right"><div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"><Edit3 className="w-4 h-4 text-blue-600" /></div></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const InventoryView = ({ inventoryItems, onEdit }: { inventoryItems: InventoryItem[], onEdit: (i: InventoryItem) => void }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
     <table className="w-full text-left"><thead className="bg-slate-50/50 border-b text-[9px] font-black uppercase text-slate-400"><tr><th className="px-8 py-5 uppercase tracking-widest">Item</th><th className="px-8 py-5">Category</th><th className="px-8 py-5">Stock</th><th className="px-8 py-5">Status</th></tr></thead>
       <tbody>{inventoryItems.map(i => (<tr key={i.id} onClick={() => onEdit(i)} className="border-b text-slate-900 font-sans hover:bg-slate-50/50 cursor-pointer transition-all"><td className="px-8 py-6 font-black uppercase text-sm">{i.name}</td><td className="px-8 py-6 text-[10px] font-bold uppercase text-slate-500">{i.category}</td><td className="px-8 py-6 text-[10px] font-bold uppercase">{i.stock} {i.unit}</td><td className="px-8 py-6"><span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${i.status === 'Low Stock' ? 'bg-rose-50 text-rose-600' : i.status === 'Out of Stock' ? 'bg-rose-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>{i.status}</span></td></tr>))}</tbody>
     </table>
  </div>
);

const PMPlannerView = ({ pmTasks }: { pmTasks: PMTask[] }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
    <table className="w-full text-left">
      <thead className="bg-slate-50/50 border-b text-[9px] font-black uppercase text-slate-400 tracking-widest"><tr><th className="px-8 py-5">Scheduled Task</th><th className="px-8 py-5">Area</th><th className="px-8 py-5">Due Date</th><th className="px-8 py-5">Frequency</th><th className="px-8 py-5">Status</th></tr></thead>
      <tbody>{pmTasks.map(t => (<tr key={t.id} className="border-b text-slate-900 hover:bg-slate-50 transition-all"><td className="px-8 py-6 font-black uppercase text-sm">{t.title}</td><td className="px-8 py-6 text-[10px] font-bold uppercase text-slate-500">{t.location}</td><td className="px-8 py-6 text-[10px] font-bold uppercase">{t.dueDate}</td><td className="px-8 py-6 text-[8px] font-black uppercase text-slate-400">{t.frequency}</td><td className="px-8 py-6"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">{t.status}</span></td></tr>))}</tbody>
    </table>
  </div>
);

const CalendarView = ({ currentDate, setCurrentDate, noWeddingDays, reports, pmTasks, setSelectedDateAction }: any) => {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const renderDays = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="h-28 sm:h-32 bg-slate-50/20 border-r border-b border-slate-100"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isNoWedding = noWeddingDays.includes(dateStr);
      const dayPMs = pmTasks.filter((p: PMTask) => p.dueDate === dateStr);
      const dayOrders = reports.filter((r: WorkOrder) => r.dueDate === dateStr && r.status !== 'COMPLETED');
      cells.push(
        <div key={d} onClick={() => setSelectedDateAction(dateStr)} className="h-28 sm:h-32 border-r border-b border-slate-100 p-2 hover:bg-blue-50/30 cursor-pointer relative group text-slate-900 overflow-hidden transition-all">
          <span className={`text-[10px] font-black ${d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-lg' : 'text-slate-300'}`}>{d}</span>
          <div className="mt-1 space-y-0.5">
            {isNoWedding && <div className="bg-emerald-500 text-white text-[6px] lg:text-[7px] font-black p-1 rounded uppercase flex items-center gap-0.5"><CheckCircle2 className="w-2 h-2" /> NO WEDDING</div>}
            {dayPMs.map((p: any, i: number) => <div key={i} className="bg-amber-100 text-amber-700 text-[6px] lg:text-[7px] font-black p-1 rounded uppercase truncate">PM: {p.system}</div>)}
            {dayOrders.map((o: any, i: number) => <div key={i} className="bg-rose-100 text-rose-700 text-[6px] lg:text-[7px] font-black p-1 rounded uppercase truncate">WO: {o.id}</div>)}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full animate-in fade-in duration-500 text-slate-900">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4"><h3 className="text-xl font-black uppercase tracking-tighter">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3><div className="flex bg-slate-50 rounded-xl p-1"><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronLeft className="w-4 h-4 text-slate-400" /></button><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronRight className="w-4 h-4 text-slate-400" /></button></div></div>
      </div>
      <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100 text-center shrink-0">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} className="py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{day}</div>)}</div>
      <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-7 border-l border-slate-100">{renderDays()}</div>
    </div>
  );
};

const GMReportView = ({ reports, currentDate, onOpenShare }: any) => {
  const completed = reports.filter((r: WorkOrder) => r.status === 'COMPLETED');
  const monthYear = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 font-sans text-slate-900">
      <div className="bg-[#0B1120] text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden print:rounded-none">
        <div className="absolute top-0 right-0 p-8 opacity-5"><FileBarChart className="w-48 h-48" /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="space-y-2">
              <div className="bg-blue-600 px-3 py-1 rounded-full inline-block mb-2"><span className="text-[9px] font-black uppercase tracking-[0.2em]">Monthly Operations Review</span></div>
              <h1 className="text-4xl lg:text-5xl font-serif text-white leading-tight">Property Performance</h1>
              <p className="text-blue-400 font-bold uppercase tracking-[0.4em] text-[10px]">{monthYear}</p>
            </div>
            <div className="hidden md:block w-px h-24 bg-white/10"></div>
            <div className="flex flex-col"><p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-2">Facility Manager</p><p className="text-2xl font-black uppercase tracking-tighter text-white">{PROPERTY_MANAGER}</p></div>
          </div>
          <button onClick={onOpenShare} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white transition-all print:hidden"><Printer className="w-6 h-6" /></button>
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden text-slate-900 print:border-none print:shadow-none">
        <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center"><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Accomplishments Log</h3><span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{completed.length} Maintenance Tasks Resolved</span></div>
        <div className="divide-y divide-slate-50">
          {completed.length > 0 ? completed.map((t: WorkOrder) => (
            <div key={t.id} className="p-8 hover:bg-slate-50/20 transition-all flex flex-col md:flex-row gap-8 items-start">
              <div className="md:w-32 shrink-0 mt-1"><p className="text-base font-black text-slate-900">{t.date}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Order #{t.id}</p></div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2"><h4 className="text-lg font-black uppercase tracking-tight text-slate-900">{t.title}</h4><span className="text-[8px] font-black border border-slate-100 px-2 py-0.5 rounded bg-slate-50 uppercase text-slate-500">{t.system}</span></div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-4"><Building2 className="w-3 h-3 opacity-50" /> {t.location}</div>
                <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-blue-500/20 text-slate-700 text-[15px] font-medium italic leading-relaxed shadow-inner">"{t.resolution || "Protocol maintenance performed. System functionality verified."}"</div>
              </div>
            </div>
          )) : <div className="p-20 text-center space-y-4"><div className="bg-slate-50 p-6 rounded-full w-fit mx-auto text-slate-200"><Activity className="w-12 h-12" /></div><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No completed tasks to display for this period.</p></div>}
        </div>
      </div>
    </div>
  );
};

const ShoppingListView = ({ inventoryItems }: { inventoryItems: InventoryItem[] }) => {
  const lowStockItems = inventoryItems.filter(i => i.status !== 'In Stock');
  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2rem] flex items-center gap-6"><div className="bg-amber-100 p-4 rounded-2xl text-amber-600"><ShoppingCart className="w-8 h-8" /></div><div><h3 className="text-xl font-black uppercase tracking-tight text-amber-900">Purchase Required</h3><p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mt-1">{lowStockItems.length} items below minimum operational levels</p></div></div>
       <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-slate-50/50 border-b text-[9px] font-black uppercase text-slate-400"><tr><th className="px-8 py-5">Item Name</th><th className="px-8 py-5">Current Stock</th><th className="px-8 py-5">Min Level</th><th className="px-8 py-5">Priority</th></tr></thead>
             <tbody className="divide-y divide-slate-50">
                {lowStockItems.map(item => (
                   <tr key={item.id} className="group"><td className="px-8 py-6 font-black uppercase text-sm text-slate-900">{item.name}</td><td className="px-8 py-6 text-sm font-bold text-rose-500">{item.stock} {item.unit}</td><td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase">{item.minStock} {item.unit}</td><td className="px-8 py-6"><span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase ${item.stock === 0 ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-700'}`}>{item.stock === 0 ? 'URGENT' : 'REPLENISH'}</span></td></tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

const SettingsView = ({ onShare }: { onShare: () => void }) => (
  <div className="max-w-2xl mx-auto space-y-4">
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 space-y-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4"><div className="bg-slate-100 p-3 rounded-xl text-slate-500"><Settings className="w-6 h-6" /></div><h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">System Preferences</h3></div>
      <div className="space-y-3">
        <button onClick={onShare} className="w-full p-6 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between transition-all group border border-slate-100"><div className="flex items-center gap-4"><Share2 className="w-5 h-5 text-emerald-500" /><div className="text-left"><p className="text-xs font-black uppercase text-slate-900">Share with Team</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Allow staff to report incidents</p></div></div><ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600" /></button>
        <button className="w-full p-6 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between transition-all group border border-slate-100"><div className="flex items-center gap-4"><QrCode className="w-5 h-5 text-blue-500" /><div className="text-left"><p className="text-xs font-black uppercase text-slate-900">Portal QR Code</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Physical posting for reporting</p></div></div><ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600" /></button>
        <button className="w-full p-6 bg-rose-50 hover:bg-rose-100 rounded-2xl flex items-center justify-between transition-all group border border-rose-100"><div className="flex items-center gap-4"><Trash2 className="w-5 h-5 text-rose-500" /><div className="text-left"><p className="text-xs font-black uppercase text-rose-600">Flush Cache</p><p className="text-[9px] font-bold text-rose-400 uppercase mt-0.5">Reset all local storage data</p></div></div><ChevronRight className="w-5 h-5 text-rose-300 group-hover:text-rose-600" /></button>
      </div>
    </div>
    <div className="text-center py-6"><p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.4em]">Facility Management v2.4.0 • Synchronized</p></div>
  </div>
);

// --- MAIN APP ---

export const App = () => {
  // --- UI STATE ---
  const [view, setView] = useState<'landing' | 'staff' | 'manager' | 'passcode'>('landing');
  const [activeTab, setActiveTab] = useState('Work Orders');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  
  // --- MODALS ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPMModalOpen, setIsPMModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedDateAction, setSelectedDateAction] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // --- DATA STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [reports, setReports] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('bc_reports');
    return saved ? JSON.parse(saved) : [
      { id: '24001', title: 'HVAC Unit Leak', location: 'Ballroom', system: 'HVAC', priority: 'High', status: 'IN PROGRESS', date: '2024-03-01', dueDate: '2024-03-05', resolution: '', image: null, viewed: true, usedMaterials: [] },
      { id: '24002', title: 'Lighting failure', location: 'Ballroom', system: 'Electrical', priority: 'Medium', status: 'PENDING', date: '2024-03-02', dueDate: '2024-03-10', resolution: '', image: null, viewed: true, usedMaterials: [] }
    ];
  });

  const [pmTasks, setPmTasks] = useState<PMTask[]>(() => {
    const saved = localStorage.getItem('bc_pmtasks');
    return saved ? JSON.parse(saved) : [
      { id: 'PM-2401', title: 'Quarterly HVAC Filter Change', location: 'Administrative Office', system: 'HVAC Unit 1', frequency: 'Quarterly', dueDate: '2024-03-15', status: 'Upcoming' }
    ];
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('bc_inventory');
    return saved ? JSON.parse(saved) : [
      { id: 'INV-001', name: 'Flush Valve Kit', category: 'Plumbing', stock: 12, minStock: 5, unit: 'pcs', status: 'In Stock' },
      { id: 'INV-002', name: 'LED Bulb 4000K', category: 'Electrical', stock: 5, minStock: 10, unit: 'pcs', status: 'Low Stock' }
    ];
  });

  const [noWeddingDays, setNoWeddingDays] = useState<string[]>(() => {
    const saved = localStorage.getItem('bc_noweddings');
    return saved ? JSON.parse(saved) : ['2024-03-10', '2024-03-11'];
  });

  // LocalStorage Persistence
  useEffect(() => { localStorage.setItem('bc_reports', JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem('bc_pmtasks', JSON.stringify(pmTasks)); }, [pmTasks]);
  useEffect(() => { localStorage.setItem('bc_inventory', JSON.stringify(inventoryItems)); }, [inventoryItems]);
  useEffect(() => { localStorage.setItem('bc_noweddings', JSON.stringify(noWeddingDays)); }, [noWeddingDays]);

  const unreadCount = useMemo(() => reports.filter(r => !r.viewed).length, [reports]);
  const lowStockCount = useMemo(() => inventoryItems.filter(i => i.status !== 'In Stock').length, [inventoryItems]);

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleTranslate = async (text: string, callback: (translated: string) => void) => {
    if (!text || text.trim().length < 2) return;
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env.API_KEY as string) });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate this maintenance note from Spanish to professional English: "${text}"`,
        config: { temperature: 0.1 }
      });
      const translated = response.text;
      if (translated) callback(translated.trim());
    } catch (e) { console.error(e); } finally { setIsTranslating(false); }
  };

  const handleAddReport = (data: Partial<WorkOrder>) => {
    const newReport: WorkOrder = {
      id: `${24000 + reports.length + 1}`,
      title: data.title || 'Untitled',
      location: data.location || 'Unknown',
      system: data.system || 'Other',
      priority: (data.priority as Priority) || 'Medium',
      status: 'PENDING',
      date: toISODate(new Date()),
      dueDate: data.dueDate || toISODate(new Date()),
      image: data.image || null,
      resolution: '',
      viewed: view === 'manager', 
      usedMaterials: []
    };
    setReports(prev => [newReport, ...prev]);
    triggerSuccess();
    setIsCreateModalOpen(false);
  };

  const handleUpdateReport = (id: string, updatedFields: Partial<WorkOrder>) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    triggerSuccess();
    setEditingOrder(null);
  };

  const handleUpdateInventory = (id: string, updatedFields: Partial<InventoryItem>) => {
    setInventoryItems(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updatedFields };
        const stock = newItem.stock;
        const min = newItem.minStock;
        newItem.status = stock === 0 ? 'Out of Stock' : (stock <= min ? 'Low Stock' : 'In Stock');
        return newItem;
      }
      return item;
    }));
    triggerSuccess();
    setEditingInventoryItem(null);
  };

  const handlePasscodeEntry = (num: string) => {
    if (passcode.length >= 4) return;
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

  const handleShareApp = async () => {
    const shareData = {
      title: 'Bella Cosa Operations Hub',
      text: 'Accede al sistema de reportes de mantenimiento de Bella Cosa.',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard! Share it with your team.');
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="h-full bg-slate-50 transition-all duration-300">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-printable, #report-printable * { visibility: visible; }
          #report-printable { position: absolute; left: 0; top: 0; width: 100%; background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
      
      {view === 'landing' && <LandingPage setView={setView} unreadCount={unreadCount} lowStockCount={lowStockCount} />}
      
      {view === 'staff' && <StaffPortal setView={setView} onAddReport={handleAddReport} />}
      
      {view === 'passcode' && (
        <PasscodePage 
          passcode={passcode} 
          passcodeError={passcodeError} 
          handlePasscodeEntry={handlePasscodeEntry} 
          setView={setView} 
          setPasscode={setPasscode} 
        />
      )}
      
      {view === 'manager' && (
        <ManagerConsoleView 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          unreadCount={unreadCount} 
          lowStockCount={lowStockCount} 
          handleShareApp={handleShareApp} 
          setView={setView}
          reports={reports}
          setReports={setReports}
          pmTasks={pmTasks}
          setPmTasks={setPmTasks}
          inventoryItems={inventoryItems}
          setInventoryItems={setInventoryItems}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          noWeddingDays={noWeddingDays}
          setNoWeddingDays={setNoWeddingDays}
          setEditingOrder={setEditingOrder}
          setEditingInventoryItem={setEditingInventoryItem}
          setIsShareModalOpen={setIsShareModalOpen}
          setIsCreateModalOpen={setIsCreateModalOpen}
          setIsPMModalOpen={setIsPMModalOpen}
          setIsInventoryModalOpen={setIsInventoryModalOpen}
          setSelectedDateAction={setSelectedDateAction}
        />
      )}
      
      {isCreateModalOpen && <CreateWorkOrderModal onClose={() => setIsCreateModalOpen(false)} onSubmit={handleAddReport} />}
      {isPMModalOpen && <CreatePMModal onClose={() => setIsPMModalOpen(false)} onSubmit={(data: any) => { setPmTasks(prev => [...prev, { ...data, id: `PM-${pmTasks.length + 2401}`, status: 'Upcoming' }]); triggerSuccess(); setIsPMModalOpen(false); }} />}
      {isInventoryModalOpen && <AddInventoryModal onClose={() => setIsInventoryModalOpen(false)} onSubmit={(data: any) => { setInventoryItems(prev => [...prev, { ...data, id: `INV-${inventoryItems.length + 1}`, status: 'In Stock', minStock: 5, unit: 'pcs' }]); triggerSuccess(); setIsInventoryModalOpen(false); }} />}
      {editingOrder && <ManageOrderModal order={editingOrder} onClose={() => setEditingOrder(null)} onUpdate={handleUpdateReport} onTranslate={handleTranslate} isTranslating={isTranslating} inventoryItems={inventoryItems} />}
      {editingInventoryItem && <ManageInventoryModal item={editingInventoryItem} onClose={() => setEditingInventoryItem(null)} onUpdate={handleUpdateInventory} />}
      {isShareModalOpen && <ShareReportModal currentDate={currentDate} onClose={() => setIsShareModalOpen(false)} />}
      
      {selectedDateAction && (
        <DaySchedulerModal 
          selectedDateAction={selectedDateAction} 
          noWeddingDays={noWeddingDays} 
          setNoWeddingDays={setNoWeddingDays} 
          onClose={() => setSelectedDateAction(null)} 
        />
      )}

      {showSuccess && <SuccessToast />}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const ManagerConsoleView = ({ 
  activeTab, setActiveTab, unreadCount, lowStockCount, handleShareApp, setView,
  reports, pmTasks, inventoryItems, currentDate, setCurrentDate, noWeddingDays,
  setEditingOrder, setEditingInventoryItem, setIsShareModalOpen,
  setIsCreateModalOpen, setIsPMModalOpen, setIsInventoryModalOpen, setSelectedDateAction
}: any) => (
  <div className="h-full flex flex-col lg:flex-row bg-slate-50 overflow-hidden relative">
    <aside className="hidden lg:flex w-80 bg-[#0B1120] text-white flex-col p-8 gap-8 shrink-0 relative z-30 shadow-2xl border-r border-slate-800 overflow-y-auto no-scrollbar print:hidden">
      <div className="flex flex-col gap-4 py-4 border-b border-slate-800 w-full shrink-0">
        <div className="bg-blue-600 p-3 rounded-2xl w-fit shadow-lg shadow-blue-500/20"><Building2 className="w-8 h-8 text-white" /></div>
        <div><h1 className="text-2xl font-serif tracking-[0.1em] uppercase leading-none">Bella Cosa</h1><p className="text-[8px] text-blue-400 font-black tracking-[0.5em] uppercase mt-2 opacity-80">Ops Console</p></div>
      </div>
      <nav className="flex-1 space-y-2">
        {[{ icon: LayoutDashboard, label: 'Work Orders', count: unreadCount, color: 'bg-rose-500' },
          { icon: Wrench, label: 'PM Planner' },
          { icon: Box, label: 'Inventory' },
          { icon: ShoppingCart, label: 'Shopping List', count: lowStockCount, color: 'bg-amber-500' },
          { icon: CalendarDays, label: 'Calendar' },
          { icon: FileBarChart, label: 'GM Report' },
          { icon: Settings, label: 'Settings' }].map((item) => (
          <button key={item.label} onClick={() => setActiveTab(item.label)} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === item.label ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <div className="flex items-center gap-4"><item.icon className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span></div>
            {item.count && item.count > 0 && <span className={`${item.color} text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-lg`}>{item.count}</span>}
          </button>
        ))}
      </nav>
      <div className="space-y-3">
        <button onClick={handleShareApp} className="flex items-center gap-4 p-4 text-emerald-400 hover:bg-emerald-500/10 rounded-2xl transition-all w-full border border-emerald-500/20"><Share2 className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">Share with Staff</span></button>
        <button onClick={() => setView('landing')} className="flex items-center gap-4 p-4 text-slate-500 hover:text-rose-400 transition-all w-full border-t border-slate-800 shrink-0"><LogOut className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">Logout</span></button>
      </div>
    </aside>

    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <header className="bg-white border-b border-slate-200 px-6 py-6 lg:px-10 lg:py-8 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0 print:hidden">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">{activeTab}</h2>
          <div className="flex items-center gap-2 mt-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em]">System Online</span></div>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          {activeTab === 'GM Report' && <button onClick={() => setIsShareModalOpen(true)} className="bg-[#0B1120] hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all active:scale-95"><Share2 className="w-4 h-4" /> Finalize & Send</button>}
          {!['Calendar', 'Shopping List', 'GM Report', 'Settings'].includes(activeTab) && <button onClick={() => activeTab === 'Inventory' ? setIsInventoryModalOpen(true) : activeTab === 'PM Planner' ? setIsPMModalOpen(true) : setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-95"><Plus className="w-5 h-5" /> Add Resource</button>}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 lg:p-10 bg-slate-50/50 no-scrollbar pb-[140px] lg:pb-10 print:bg-white print:p-0">
        {activeTab === 'Work Orders' && <WorkOrdersView reports={reports} handleEditOrder={(r: WorkOrder) => setEditingOrder(r)} />}
        {activeTab === 'Inventory' && <InventoryView inventoryItems={inventoryItems} onEdit={(item: InventoryItem) => setEditingInventoryItem(item)} />}
        {activeTab === 'PM Planner' && <PMPlannerView pmTasks={pmTasks} />}
        {activeTab === 'Calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} noWeddingDays={noWeddingDays} reports={reports} pmTasks={pmTasks} setSelectedDateAction={setSelectedDateAction} />}
        {activeTab === 'GM Report' && <div id="report-printable"><GMReportView reports={reports} currentDate={currentDate} onOpenShare={() => setIsShareModalOpen(true)} /></div>}
        {activeTab === 'Shopping List' && <ShoppingListView inventoryItems={inventoryItems} />}
        {activeTab === 'Settings' && <SettingsView onShare={handleShareApp} />}
      </main>
    </div>

    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[100] flex justify-around items-center p-4 pb-[calc(16px+env(safe-area-inset-bottom))] print:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      {[{ icon: LayoutDashboard, label: 'Orders', tab: 'Work Orders' }, { icon: Box, label: 'Stock', tab: 'Inventory' }, { icon: CalendarDays, label: 'Calendar', tab: 'Calendar' }, { icon: Settings, label: 'More', tab: 'Settings' }].map((item) => (
        <button key={item.label} onClick={() => setActiveTab(item.tab)} className="flex flex-col items-center gap-1.5 transition-all relative px-3">
          <div className="relative"><item.icon className={`w-6 h-6 ${activeTab === item.tab ? 'text-blue-600' : 'text-slate-400'}`} />{item.tab === 'Work Orders' && unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>}</div>
          <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === item.tab ? 'text-blue-600' : 'text-slate-400'}`}>{item.label}</span>
        </button>
      ))}
      <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white p-4 rounded-[1.5rem] -mt-12 shadow-2xl shadow-blue-500/40 active:scale-90 border-4 border-slate-50"><Plus className="w-8 h-8" /></button>
    </nav>
  </div>
);

const DaySchedulerModal = ({ 
  selectedDateAction, noWeddingDays, setNoWeddingDays, onClose 
}: { 
  selectedDateAction: string, noWeddingDays: string[], setNoWeddingDays: (d: any) => void, onClose: () => void 
}) => (
  <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-[#0B1120]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
    <div className="bg-white rounded-[2.5rem] lg:rounded-[3.5rem] w-full max-w-lg shadow-2xl p-8 border border-slate-100 mb-20 lg:mb-0 max-h-[90vh] overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-6"><h4 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">Day Scheduler</h4><button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl bg-slate-50"><X className="w-6 h-6" /></button></div>
      <div className="space-y-6">
        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Selected Operations Date</p><p className="text-lg font-black text-blue-600 uppercase">{selectedDateAction}</p></div>
        <div className="flex items-center justify-between p-6 bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${noWeddingDays.includes(selectedDateAction) ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}><CheckCircle2 className="w-6 h-6" /></div><div><p className="text-xs font-black uppercase text-slate-900">No Wedding</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Facility Window Open</p></div></div>
          <button onClick={() => setNoWeddingDays((prev: string[]) => prev.includes(selectedDateAction) ? prev.filter(d => d !== selectedDateAction) : [...prev, selectedDateAction])} className={`w-14 h-8 rounded-full relative transition-all ${noWeddingDays.includes(selectedDateAction) ? 'bg-emerald-500' : 'bg-slate-200'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${noWeddingDays.includes(selectedDateAction) ? 'left-[26px]' : 'left-1'}`}></div></button>
        </div>
        <button onClick={onClose} className="w-full py-6 rounded-[1.8rem] bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-xl transition-all">Update Calendar</button>
      </div>
    </div>
  </div>
);

const SuccessToast = () => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in zoom-in duration-300">
    <div className="bg-white rounded-[3.5rem] p-12 flex flex-col items-center gap-6 shadow-2xl border border-white/50 animate-bounce">
      <div className="bg-emerald-500 p-6 rounded-full text-white shadow-xl shadow-emerald-500/20"><CheckCircle2 className="w-14 h-14" /></div>
      <div className="text-center"><h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Profile Updated</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Hub Synchronized</p></div>
    </div>
  </div>
);
