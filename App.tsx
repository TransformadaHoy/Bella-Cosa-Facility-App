
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ClipboardList, ShieldCheck, ChevronRight, Building2, Send, ArrowLeft,
  LayoutDashboard, Plus, X, Camera, CalendarDays, FileBarChart, 
  Printer, Edit3, Languages, Loader2, CheckCircle2, Box, ChevronLeft,
  Info, AlertCircle, Wrench, Activity, LogOut, Menu, Eye, AlertCircle as AlertIcon,
  ShoppingCart, Trash2, Minus, PlusCircle, ShoppingBag, Bell, Mail, Share2, Download,
  ArrowRight, Lock, Delete, Settings, QrCode, Copy, Share
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        alert('Link copiado al portapapeles. ¡Envíalo por WhatsApp!');
      }
    } catch (err) { console.error(err); }
  };

  // --- VIEWS ---

  const LandingPage = () => (
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
        <div className="pt-8 border-t border-white/5 w-full"><p className="text-slate-500 text-[9px] uppercase tracking-[0.3em] font-black opacity-40 italic">Venetian Bay Maintenance System</p></div>
      </div>
    </div>
  );

  const PasscodePage = () => (
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
        <button onClick={() => setPasscode(passcode.slice(0, -1))} className="h-24 flex items-center justify-center text-slate-500 active:scale-90 transition-all"><Delete className="w-10 h-10" /></button>
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">System Management</h3>
        <div className="space-y-4">
          <button onClick={handleShareApp} className="w-full p-6 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-between group active:scale-98 transition-all">
            <div className="flex items-center gap-4"><div className="bg-white/20 p-3 rounded-xl"><Share2 className="w-6 h-6" /></div><div className="text-left"><p className="text-sm font-black uppercase">Share App Link</p><p className="text-[10px] opacity-70">Send this URL to Staff members</p></div></div>
            <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4"><div className="bg-white p-3 rounded-xl shadow-sm text-slate-400"><Lock className="w-6 h-6" /></div><div><p className="text-sm font-black uppercase">Manager Passcode</p><p className="text-[10px] text-slate-400 uppercase tracking-widest">{MASTER_PASSCODE}</p></div></div>
            <Info className="w-5 h-5 text-slate-300" />
          </div>
          <button onClick={() => { if(confirm('¿Borrar todos los reportes y ajustes?')) { localStorage.clear(); window.location.reload(); } }} className="w-full p-6 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-between group active:scale-98 transition-all border border-rose-100 mt-8">
            <div className="flex items-center gap-4"><div className="bg-rose-100 p-3 rounded-xl"><Trash2 className="w-6 h-6" /></div><div className="text-left"><p className="text-sm font-black uppercase">Clear Local Cache</p><p className="text-[10px] opacity-70">Reset all data on this device</p></div></div>
          </button>
        </div>
      </div>
      <div className="bg-[#0B1120] text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <QrCode className="absolute -bottom-10 -right-10 w-48 h-48 opacity-5" />
        <h4 className="text-lg font-serif italic mb-2">Cloud Sync Deployment</h4>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md">Currently using Local Storage. For multi-device real-time sync across all staff phones, connect to a Firebase/Supabase backend. Contact support for full deployment.</p>
      </div>
    </div>
  );

  const ManagerConsole = () => (
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
          {activeTab === 'Work Orders' && <WorkOrdersView reports={reports} handleEditOrder={(r: WorkOrder) => { setReports(prev => prev.map(order => order.id === r.id ? { ...order, viewed: true } : order)); setEditingOrder(r); }} />}
          {activeTab === 'Inventory' && <InventoryView inventoryItems={inventoryItems} />}
          {activeTab === 'PM Planner' && <PMPlannerView pmTasks={pmTasks} />}
          {activeTab === 'Calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} noWeddingDays={noWeddingDays} reports={reports} pmTasks={pmTasks} setSelectedDateAction={setSelectedDateAction} />}
          {activeTab === 'GM Report' && <div id="report-printable"><GMReportView reports={reports} currentDate={currentDate} onOpenShare={() => setIsShareModalOpen(true)} /></div>}
          {activeTab === 'Shopping List' && <ShoppingListView inventoryItems={inventoryItems} />}
          {activeTab === 'Settings' && <SettingsView />}
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

  const StaffPortal = () => {
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [system, setSystem] = useState(SYSTEMS[0]);
    const [image, setImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
      <div className="h-full bg-slate-50 p-6 flex flex-col max-w-lg mx-auto font-sans overflow-hidden animate-in slide-in-from-right duration-500">
        <button onClick={() => setView('landing')} className="flex items-center gap-2 text-slate-400 mb-8 hover:text-blue-600 transition-colors shrink-0"><ArrowLeft className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">Back to Hub</span></button>
        <div className="mb-10 shrink-0"><h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-slate-900">New Incident</h2><p className="text-slate-500 font-medium text-sm mt-3 italic">Reporting to Carlos Velez.</p></div>
        <div className="space-y-6 flex-1 pb-6 overflow-y-auto no-scrollbar">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Describe the Problem</label>
            <textarea rows={6} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Room 4 AC is blowing warm air or Sink is leaking in Men's Bathroom..." className="w-full p-6 rounded-[2rem] border-2 border-slate-100 bg-white text-base font-bold outline-none shadow-sm focus:border-blue-500 transition-all resize-none leading-relaxed" />
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
        <button onClick={() => { handleAddReport({ title, location, system, image }); setView('landing'); }} disabled={!title} className="w-full p-7 rounded-[2rem] bg-blue-600 text-white font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/30 active:scale-95 disabled:opacity-40 transition-all shrink-0">Submit to Ops Centre</button>
      </div>
    );
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
      {view === 'landing' && <LandingPage />}
      {view === 'staff' && <StaffPortal />}
      {view === 'passcode' && <PasscodePage />}
      {view === 'manager' && <ManagerConsole />}
      
      {isCreateModalOpen && <CreateWorkOrderModal onClose={() => setIsCreateModalOpen(false)} onSubmit={handleAddReport} />}
      {isPMModalOpen && <CreatePMModal onClose={() => setIsPMModalOpen(false)} onSubmit={(data: any) => { setPmTasks(prev => [...prev, { ...data, id: `PM-${pmTasks.length + 2401}`, status: 'Upcoming' }]); triggerSuccess(); setIsPMModalOpen(false); }} />}
      {isInventoryModalOpen && <AddInventoryModal onClose={() => setIsInventoryModalOpen(false)} onSubmit={(data: any) => { setInventoryItems(prev => [...prev, { ...data, id: `INV-${inventoryItems.length + 1}`, status: 'In Stock', minStock: 5 }]); triggerSuccess(); setIsInventoryModalOpen(false); }} />}
      {editingOrder && <ManageOrderModal order={editingOrder} onClose={() => setEditingOrder(null)} onUpdate={handleUpdateReport} onTranslate={handleTranslate} isTranslating={isTranslating} inventoryItems={inventoryItems} />}
      {isShareModalOpen && <ShareReportModal currentDate={currentDate} onClose={() => setIsShareModalOpen(false)} />}
      
      {selectedDateAction && (
        <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-[#0B1120]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] lg:rounded-[3.5rem] w-full max-w-lg shadow-2xl p-8 border border-slate-100 mb-20 lg:mb-0 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6"><h4 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">Day Scheduler</h4><button onClick={() => setSelectedDateAction(null)} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl bg-slate-50"><X className="w-6 h-6" /></button></div>
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Selected Operations Date</p><p className="text-lg font-black text-blue-600 uppercase">{selectedDateAction}</p></div>
              <div className="flex items-center justify-between p-6 bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${noWeddingDays.includes(selectedDateAction) ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}><CheckCircle2 className="w-6 h-6" /></div><div><p className="text-xs font-black uppercase text-slate-900">No Wedding</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Facility Window Open</p></div></div>
                <button onClick={() => setNoWeddingDays(prev => prev.includes(selectedDateAction!) ? prev.filter(d => d !== selectedDateAction) : [...prev, selectedDateAction!])} className={`w-14 h-8 rounded-full relative transition-all ${noWeddingDays.includes(selectedDateAction) ? 'bg-emerald-500' : 'bg-slate-200'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${noWeddingDays.includes(selectedDateAction) ? 'left-[26px]' : 'left-1'}`}></div></button>
              </div>
              <button onClick={() => setSelectedDateAction(null)} className="w-full py-6 rounded-[1.8rem] bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-xl transition-all">Update Calendar</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in zoom-in duration-300"><div className="bg-white rounded-[3.5rem] p-12 flex flex-col items-center gap-6 shadow-2xl border border-white/50 animate-bounce"><div className="bg-emerald-500 p-6 rounded-full text-white shadow-xl shadow-emerald-500/20"><CheckCircle2 className="w-14 h-14" /></div><div className="text-center"><h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Profile Updated</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Hub Synchronized</p></div></div></div>}
    </div>
  );
};

// --- SUB-COMPONENTS (Operational parts) ---

const ShareReportModal = ({ currentDate, onClose }: { currentDate: Date, onClose: () => void }) => {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const emailSubject = `Facility Operations Review - ${monthName}`;
  const emailBody = `Hi Shelby, \n\nAttached is the ${monthName} facility operations report for Bella Cosa. All maintenance requirements have been documented.\n\nBest,\nCarlos Velez\nProperty Manager`;

  return (
    <div className="fixed inset-0 z-[250] flex items-end lg:items-center justify-center bg-[#0B1120]/90 backdrop-blur-xl p-4 animate-in fade-in duration-300 print:hidden">
      <div className="bg-white rounded-[2.5rem] lg:rounded-[3.5rem] w-full max-w-2xl shadow-2xl p-8 lg:p-14 border border-slate-100 mb-4 lg:mb-0">
        <div className="flex justify-between items-start mb-10"><div><h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Share Insight</h2><p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mt-3">Executive Summary</p></div><button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl transition-all hover:bg-slate-100"><X className="w-6 h-6 lg:w-8 lg:h-8" /></button></div>
        <div className="space-y-8">
          <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 ${!hasDownloaded ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-50' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
            <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><div className={`p-3 rounded-xl ${!hasDownloaded ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-300 text-white'}`}><Download className="w-6 h-6" /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Step 1</p><p className="text-sm font-bold text-slate-900 leading-none mt-1">Export Executive PDF</p></div></div><button onClick={() => { window.print(); setHasDownloaded(true); }} className={`px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${!hasDownloaded ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>{hasDownloaded ? 'Exported' : 'Generate Now'}</button></div>
          </div>
          <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 ${hasDownloaded ? 'bg-emerald-50 border-emerald-200 ring-4 ring-emerald-50' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
            <div className="flex flex-col gap-6"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><div className={`p-3 rounded-xl ${hasDownloaded ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-300 text-white'}`}><Mail className="w-6 h-6" /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Step 2</p><p className="text-sm font-bold text-slate-900 leading-none mt-1">Submit to Director</p></div></div><button onClick={() => window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`} disabled={!hasDownloaded} className={`px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${hasDownloaded ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Send to Shelby</button></div>
              {hasDownloaded && <div className="bg-white/60 p-5 rounded-2xl border border-emerald-100 animate-in slide-in-from-top duration-500 flex items-start gap-4"><Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /><div><p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Final Sync</p><p className="text-xs text-slate-600 font-medium italic">"Open your email client, attach the PDF from your downloads, and hit send."</p></div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkOrdersView = ({ reports, handleEditOrder }: any) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'IN PROGRESS'>('ALL');
  const filtered = reports.filter((r: WorkOrder) => {
    if (r.status === 'COMPLETED') return false; 
    if (activeFilter === 'ALL') return true;
    return r.status === activeFilter;
  });

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {['ALL', 'PENDING', 'IN PROGRESS'].map((f) => (
          <button key={f} onClick={() => setActiveFilter(f as any)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${activeFilter === f ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{f === 'ALL' ? 'Everything Active' : f}</button>
        ))}
      </div>
      <div className="hidden lg:block bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left table-fixed">
          <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]"><tr><th className="px-10 py-7 w-[45%]">Incident / ID</th><th className="px-10 py-7 w-[20%]">Zone</th><th className="px-10 py-7 w-[20%]">Asset</th><th className="px-10 py-7 w-[15%] text-right">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((r: WorkOrder) => (
              <tr key={r.id} onClick={() => handleEditOrder(r)} className={`hover:bg-blue-50/50 transition-all cursor-pointer group relative ${!r.viewed ? 'bg-rose-50/5' : ''}`}>
                <td className="px-10 py-7"><div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 shrink-0 bg-slate-50 flex items-center justify-center shadow-inner">{r.image ? <img src={r.image} className="w-full h-full object-cover" /> : <Activity className="w-6 h-6 text-slate-300" />}</div><div className="flex flex-col gap-1 min-w-0"><div className="flex items-center gap-3"><span className="text-[10px] font-black text-blue-500">REQ-{r.id}</span>{!r.viewed && <span className="bg-rose-500 w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>}</div><span className="text-[16px] font-black uppercase text-slate-900 truncate tracking-tight">{r.title}</span></div></div></td>
                <td className="px-10 py-7 text-xs font-bold text-slate-500 uppercase tracking-widest">{r.location}</td>
                <td className="px-10 py-7"><span className="bg-white text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black border border-slate-100 uppercase shadow-sm">{r.system}</span></td>
                <td className="px-10 py-7 text-right"><span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase shadow-sm ${r.status === 'IN PROGRESS' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden space-y-4">
        {filtered.map((r: WorkOrder) => (
          <div key={r.id} onClick={() => handleEditOrder(r)} className={`bg-white p-5 rounded-[2.5rem] border ${!r.viewed ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'} shadow-sm active:bg-blue-50 transition-all flex items-center gap-5 relative overflow-hidden`}>
            {!r.viewed && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 shadow-lg"></div>}
            <div className="w-16 h-16 rounded-3xl overflow-hidden border border-slate-100 shrink-0 bg-slate-50 flex items-center justify-center shadow-inner">{r.image ? <img src={r.image} className="w-full h-full object-cover" /> : <Wrench className="w-7 h-7 text-slate-300" />}</div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3"><span className="text-[9px] font-black text-blue-500 uppercase">REQ-{r.id}</span>{r.status === 'IN PROGRESS' && <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-blue-100">ON GOING</span>}</div>
              <h4 className="text-[15px] font-black uppercase tracking-tight text-slate-900 truncate leading-tight">{r.title}</h4>
              <div className="flex items-center gap-2 pt-1 flex-wrap"><span className="text-[9px] font-black uppercase text-slate-400 border border-slate-100 px-2 py-1 rounded-lg bg-slate-50">{r.location}</span></div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-200 shrink-0" />
          </div>
        ))}
        {filtered.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase text-[11px] tracking-[0.3em] border-2 border-dashed border-slate-200 rounded-[3rem]">No Active Orders documented</div>}
      </div>
    </div>
  );
};

const InventoryView = ({ inventoryItems }: any) => (
  <div className="w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
    <div className="hidden lg:block bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
       <table className="w-full text-left table-fixed">
         <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]"><tr><th className="px-10 py-7 w-[40%]">Asset / Item</th><th className="px-10 py-7 w-[20%]">Category</th><th className="px-10 py-7 w-[20%] text-center">Available Stock</th><th className="px-10 py-7 w-[20%] text-right">Health Status</th></tr></thead>
         <tbody>
           {inventoryItems.map((i: any) => (
             <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all"><td className="px-10 py-7 font-black uppercase text-sm tracking-tight">{i.name}</td><td className="px-10 py-7 text-[10px] font-bold uppercase text-slate-500 tracking-widest">{i.category}</td><td className="px-10 py-7 text-center"><span className="text-xl font-black">{i.stock}</span> <span className="text-[10px] font-bold uppercase text-slate-400">{i.unit}</span></td><td className="px-10 py-7 text-right"><span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase shadow-sm ${i.status === 'Low Stock' ? 'bg-amber-50 text-amber-600 border border-amber-100' : (i.status === 'Out of Stock' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100')}`}>{i.status}</span></td></tr>
           ))}
         </tbody>
       </table>
    </div>
    <div className="lg:hidden space-y-4">
      {inventoryItems.map((item: any) => (
        <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex justify-between items-center"><div className="space-y-1.5 min-w-0"><h4 className="text-sm font-black uppercase text-slate-900 tracking-tight">{item.name}</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.category}</p><p className="text-[14px] font-black text-slate-900 pt-1 leading-none">{item.stock} {item.unit}</p></div><span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase shrink-0 shadow-sm ${item.status === 'Low Stock' ? 'bg-amber-50 text-amber-600' : (item.status === 'Out of Stock' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')}`}>{item.status}</span></div>
      ))}
    </div>
  </div>
);

const ShoppingListView = ({ inventoryItems }: { inventoryItems: InventoryItem[] }) => {
  const shopList = inventoryItems.filter(i => i.status !== 'In Stock');
  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-amber-600 text-white rounded-[3rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden border border-amber-500">
         <div className="absolute top-0 right-0 p-10 opacity-10"><ShoppingCart className="w-56 h-56" /></div>
         <div className="relative z-10"><div className="bg-white/20 px-4 py-1.5 rounded-xl inline-block mb-4 backdrop-blur-sm"><span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Replenishment List</span></div><h1 className="text-4xl lg:text-6xl font-serif italic text-white leading-tight">Procurement Dashboard</h1><p className="text-amber-100 font-bold uppercase tracking-[0.3em] text-[12px] mt-6 leading-none">{shopList.length} Operational materials require immediate restock</p></div>
      </div>
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        {shopList.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]"><tr><th className="px-10 py-7">Resource Description</th><th className="px-10 py-7 text-center">Procurement Status</th><th className="px-10 py-7 text-right">Warehouse Units</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {shopList.map(item => (<tr key={item.id} className="hover:bg-amber-50/30 transition-all"><td className="px-10 py-8"><div className="flex flex-col gap-1"><span className="text-lg font-black uppercase text-slate-900 tracking-tight">{item.name}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span></div></td><td className="px-10 py-8 text-center"><span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase shadow-sm ${item.status === 'Out of Stock' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span></td><td className="px-10 py-8 text-right"><span className="text-2xl font-black text-slate-900 leading-none">{item.stock}</span> <span className="text-[10px] font-bold uppercase text-slate-400">{item.unit}</span></td></tr>))}
            </tbody>
          </table>
        ) : <div className="p-32 text-center space-y-6"><div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner"><CheckCircle2 className="w-12 h-12" /></div><h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Inventory Optimized</h3><p className="text-slate-400 text-sm font-medium italic">All facility resources are currently at their target performance thresholds.</p></div>}
      </div>
    </div>
  );
};

const PMPlannerView = ({ pmTasks }: { pmTasks: PMTask[] }) => (
  <div className="w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
    <div className="hidden lg:block bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
          <tr><th className="px-10 py-7">Preventive Protocol</th><th className="px-10 py-7">Target System</th><th className="px-10 py-7">Scheduled Execution</th><th className="px-10 py-7 text-right">Phase</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {pmTasks.map(t => (
            <tr key={t.id} className="hover:bg-slate-50 transition-all">
              <td className="px-10 py-8 font-black uppercase text-[15px] tracking-tight">{t.title}</td>
              <td className="px-10 py-8 text-[11px] font-bold uppercase text-slate-500 tracking-widest">{t.system}</td>
              <td className="px-10 py-8 text-sm font-black text-blue-600">{t.dueDate}</td>
              <td className="px-10 py-8 text-right"><span className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-full text-[10px] font-black uppercase shadow-sm">{t.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="lg:hidden space-y-4">
      {pmTasks.map(t => (
        <div key={t.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm flex justify-between items-center">
          <div className="space-y-1.5"><h4 className="text-sm font-black uppercase text-slate-900 tracking-tight leading-none">{t.title}</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{t.system}</p><p className="text-xs font-black text-blue-600 pt-1 leading-none">{t.dueDate}</p></div>
          <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[9px] font-black uppercase shrink-0 border border-blue-100">{t.status}</span>
        </div>
      ))}
    </div>
  </div>
);

const CalendarView = ({ currentDate, setCurrentDate, noWeddingDays, reports, pmTasks, setSelectedDateAction }: any) => {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const renderDays = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="h-32 sm:h-40 bg-slate-50/10 border-r border-b border-slate-100"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isNoWedding = noWeddingDays.includes(dateStr);
      const dayPMs = pmTasks.filter((p: any) => p.dueDate === dateStr);
      const dayOrders = reports.filter((r: any) => r.dueDate === dateStr && r.status !== 'COMPLETED');
      const isToday = d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

      cells.push(
        <div key={d} onClick={() => setSelectedDateAction(dateStr)} className="h-32 sm:h-40 border-r border-b border-slate-100 p-4 hover:bg-blue-50/30 cursor-pointer relative transition-all text-slate-900 overflow-hidden group">
          <span className={`text-sm font-black ${isToday ? 'bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-full shadow-lg shadow-blue-200' : 'text-slate-300'}`}>{d}</span>
          <div className="mt-3 space-y-1.5">
            {isNoWedding && <div className="bg-emerald-500 text-white text-[9px] font-black p-2 rounded-xl uppercase flex items-center gap-1.5 shadow-md"><CheckCircle2 className="w-3 h-3" /> AVAILABLE</div>}
            {dayPMs.map((p: any, i: number) => <div key={i} className="bg-amber-100 text-amber-700 text-[8px] font-black p-2 rounded-lg uppercase truncate border border-amber-200/50">PM: {p.system}</div>)}
            {dayOrders.map((o: any, i: number) => <div key={i} className="bg-blue-50 text-blue-700 text-[8px] font-black p-2 rounded-lg uppercase truncate border border-blue-200/50">WO: {o.id}</div>)}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col h-full animate-in fade-in duration-500 text-slate-900 overflow-hidden">
      <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{monthNames[currentDate.getMonth()]} <span className="text-blue-600 font-serif italic text-2xl lowercase">{currentDate.getFullYear()}</span></h3>
          <div className="flex bg-slate-50 rounded-[1.5rem] p-1.5 border border-slate-100 shadow-inner">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-600 shadow-sm"><ChevronLeft className="w-6 h-6" /></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-600 shadow-sm"><ChevronRight className="w-6 h-6" /></button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-100 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} className="py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{day}</div>)}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-7 border-l border-slate-100 shadow-inner">{renderDays()}</div>
    </div>
  );
};

const GMReportView = ({ reports, currentDate, onOpenShare }: any) => {
  const completed = reports.filter((r: WorkOrder) => r.status === 'COMPLETED');
  const monthYear = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-24 font-sans text-slate-900">
      <div className="bg-[#0B1120] text-white rounded-[3rem] p-12 lg:p-16 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-10 opacity-5"><FileBarChart className="w-56 h-56" /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
            <div className="space-y-4">
              <div className="bg-blue-600 px-4 py-1.5 rounded-xl inline-block shadow-lg shadow-blue-500/20"><span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Operations Performance</span></div>
              <h1 className="text-5xl lg:text-6xl font-serif italic text-white leading-tight">Strategic Summary</h1>
              <p className="text-blue-400 font-black uppercase tracking-[0.5em] text-[12px] opacity-80">{monthYear}</p>
            </div>
            <div className="hidden md:block w-px h-28 bg-slate-800"></div>
            <div className="flex flex-col">
              <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] mb-3 leading-none">Property Manager</p>
              <p className="text-3xl font-black uppercase tracking-tighter text-white leading-none">{PROPERTY_MANAGER}</p>
            </div>
          </div>
          <button onClick={onOpenShare} className="bg-white/10 hover:bg-white/20 p-5 rounded-[1.8rem] border border-white/10 transition-all active:scale-95 shadow-xl backdrop-blur-md print:hidden group"><Share2 className="w-7 h-7 text-white group-hover:scale-110 transition-transform" /></button>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-[4rem] shadow-2xl overflow-hidden">
        <div className="px-12 py-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 leading-none">Maintenance Documented</h3>
          <span className="bg-emerald-100 text-emerald-700 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">{completed.length} Successes</span>
        </div>
        <div className="divide-y divide-slate-100">
          {completed.length > 0 ? completed.map((t: WorkOrder) => (
            <div key={t.id} className="p-10 lg:p-14 hover:bg-slate-50/30 transition-all flex flex-col md:flex-row gap-12 items-start print:break-inside-avoid">
              <div className="md:w-40 shrink-0 mt-1">
                <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{t.date}</p>
                <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mt-4 leading-none">ID: REQ-{t.id}</p>
              </div>
              <div className="flex-1 space-y-6">
                <div className="flex flex-wrap items-center gap-5">
                  <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">{t.title}</h4>
                  <span className="text-[10px] font-black border border-slate-100 px-4 py-2 rounded-xl bg-white uppercase text-slate-500 tracking-widest shadow-sm">{t.system}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  <Building2 className="w-4 h-4 opacity-50" /> {t.location}
                </div>
                {t.resolution && (
                  <div className="bg-slate-50/80 px-8 py-6 rounded-[2rem] border-l-4 border-blue-500/20 text-slate-700 text-base font-semibold italic leading-relaxed shadow-inner">
                    "{t.resolution}"
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="p-32 text-center space-y-6">
              <div className="bg-slate-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-inner"><ClipboardList className="w-14 h-14" /></div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Archive Clear</h3>
              <p className="text-slate-400 text-sm font-medium italic">No finalized deployments documented for the current reporting phase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateWorkOrderModal = ({ onClose, onSubmit }: any) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [system, setSystem] = useState(SYSTEMS[0]);
  return (
    <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-[#0B1120]/95 backdrop-blur-xl p-4 animate-in slide-in-from-bottom duration-300 print:hidden">
      <div className="bg-white rounded-[3rem] lg:rounded-[4rem] w-full max-w-lg shadow-2xl p-10 lg:p-16 mb-4 border border-slate-100 overflow-y-auto no-scrollbar max-h-[90vh]">
        <div className="flex justify-between items-start mb-10 shrink-0"><div><h2 className="text-4xl font-black uppercase tracking-tighter leading-none text-slate-900">Ad-hoc Order</h2><p className="text-slate-500 font-medium text-sm mt-3 italic">Deploy a direct maintenance task.</p></div><button onClick={onClose} className="p-4 bg-slate-50 rounded-2xl transition-all hover:bg-slate-100 active:scale-90"><X className="w-7 h-7" /></button></div>
        <div className="space-y-6 pb-6">
          <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Summary of Task</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" className="w-full p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white text-base font-bold outline-none shadow-sm focus:border-blue-500 transition-all" /></div>
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Venue Location</label><select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white text-sm font-bold outline-none shadow-sm">{LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select></div>
            <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Infrastructure Type</label><select value={system} onChange={(e) => setSystem(e.target.value)} className="w-full p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white text-sm font-bold outline-none shadow-sm">{SYSTEMS.map(sys => <option key={sys} value={sys}>{sys}</option>)}</select></div>
          </div>
          <button onClick={() => onSubmit({ title, location, system })} disabled={!title} className="w-full p-7 rounded-[1.8rem] bg-blue-600 text-white font-black text-lg shadow-2xl shadow-blue-500/30 active:scale-95 disabled:opacity-40 transition-all mt-6 uppercase tracking-widest">Activate Order</button>
        </div>
      </div>
    </div>
  );
};

const CreatePMModal = ({ onClose, onSubmit }: any) => {
  const [form, setForm] = useState({ title: '', location: LOCATIONS[0], system: SYSTEMS[0], frequency: 'Quarterly', dueDate: toISODate(new Date()) });
  return (
    <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-[#0B1120]/95 backdrop-blur-xl p-4 animate-in slide-in-from-bottom duration-300 print:hidden">
      <div className="bg-white rounded-[3rem] lg:rounded-[4rem] w-full max-w-2xl shadow-2xl p-10 lg:p-16 mb-4 border border-slate-100 overflow-y-auto no-scrollbar max-h-[90vh]">
        <div className="flex justify-between items-start mb-12 shrink-0"><div><h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none tracking-tight">PM Schedule</h2><p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mt-4">Preventive Maintenance Log</p></div><button onClick={onClose} className="p-4 bg-slate-50 rounded-2xl transition-all hover:bg-slate-100 active:scale-90"><X className="w-7 h-7" /></button></div>
        <div className="space-y-8 pb-8">
          <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Protocol Name</label><input className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-base font-bold outline-none focus:border-blue-500 shadow-inner" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., HVAC Unit 2 Deep Cleaning" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Resource Area</label><select className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none" value={form.location} onChange={e => setForm({...form, location: e.target.value})}>{LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Asset Class</label><select className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none" value={form.system} onChange={e => setForm({...form, system: e.target.value})}>{SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Target Date</label><input type="date" className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
            <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Cycle Frequency</label><select className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="Annual">Annual</option></select></div>
          </div>
          <button onClick={() => onSubmit(form)} disabled={!form.title} className="w-full py-7 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] bg-blue-600 text-white shadow-2xl shadow-blue-500/30 transition-all active:scale-95 mt-4">Program Protocol</button>
        </div>
      </div>
    </div>
  );
};

const AddInventoryModal = ({ onClose, onSubmit }: any) => {
  const [form, setForm] = useState({ name: '', category: SYSTEMS[0], stock: 0, minStock: 5, unit: 'pcs' });
  return (
    <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-[#0B1120]/95 backdrop-blur-xl p-4 animate-in slide-in-from-bottom duration-300 print:hidden">
      <div className="bg-white rounded-[3rem] lg:rounded-[4rem] w-full max-w-xl shadow-2xl p-10 lg:p-16 mb-4 border border-slate-100 overflow-y-auto no-scrollbar max-h-[90vh]">
        <div className="flex justify-between items-start mb-12 shrink-0"><div><h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">New Resource</h2><p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mt-4">Supply & Logistics Log</p></div><button onClick={onClose} className="p-4 bg-slate-50 rounded-2xl transition-all hover:bg-slate-100 active:scale-90"><X className="w-7 h-7" /></button></div>
        <div className="space-y-8 pb-8">
          <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Item Description</label><input className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-base font-bold outline-none focus:border-blue-500 shadow-inner" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., LED Light Fixture Type-C" /></div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Base Stock</label><input type="number" className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})} /></div>
            <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Unit Type</label><select className="w-full p-6 rounded-[1.8rem] bg-slate-50 border-2 border-slate-100 text-sm font-bold outline-none" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}><option value="pcs">pcs</option><option value="boxes">boxes</option><option value="gallons">gallons</option><option value="units">units</option></select></div>
          </div>
          <button onClick={() => onSubmit(form)} disabled={!form.name} className="w-full py-7 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] bg-blue-600 text-white shadow-2xl shadow-blue-500/30 active:scale-95 transition-all mt-4 uppercase">Initialize Asset</button>
        </div>
      </div>
    </div>
  );
};

const ManageOrderModal = ({ order, onClose, onUpdate, onTranslate, isTranslating, inventoryItems }: any) => {
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
        <div className="flex justify-between items-start mb-12 shrink-0"><div className="flex-1 min-w-0"><span className="text-[10px] lg:text-[12px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl uppercase mb-4 inline-block tracking-[0.4em]">Operations Sync</span><h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-tight whitespace-normal">{order.title}</h2></div><button onClick={onClose} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shrink-0 ml-6 active:scale-90"><X className="w-8 h-8" /></button></div>
        <div className="space-y-10 lg:space-y-14">
          {order.image && (<div className="space-y-4 shrink-0"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Incident Evidence</label><div className="w-full aspect-video max-h-56 lg:max-h-80 rounded-[3rem] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 flex items-center justify-center"><img src={order.image} className="w-full h-full object-contain" /></div></div>)}
          <div className="space-y-5 shrink-0"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Life-cycle Control</label><div className="grid grid-cols-3 gap-4">{['PENDING', 'IN PROGRESS', 'COMPLETED'].map(s => (<button key={s} onClick={() => setStatus(s as WorkOrderStatus)} className={`py-6 lg:py-8 rounded-[2rem] lg:rounded-[2.5rem] text-[10px] lg:text-[12px] font-black border-4 transition-all active:scale-95 shadow-sm ${status === s ? (s === 'COMPLETED' ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20' : 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20') : 'bg-white text-slate-300 border-slate-50 hover:border-slate-100'}`}>{s.split(' ')[0]}</button>))}</div></div>
          <div className="space-y-5 shrink-0">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Material Deduction</label>
            <div className="bg-slate-50 p-8 rounded-[3rem] space-y-6 shadow-inner border border-slate-100">
              <div className="flex gap-3"><select className="flex-1 p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white text-xs font-black uppercase outline-none focus:border-blue-500 shadow-sm" value={selectedItemToAdd} onChange={(e) => setSelectedItemToAdd(e.target.value)}><option value="">Select Resource...</option>{inventoryItems.map((item: InventoryItem) => (<option key={item.id} value={item.id} disabled={item.stock === 0 || usedMaterials.some(m => m.itemId === item.id)}>{item.name} ({item.stock} avail)</option>))}</select><button onClick={addMaterialUsage} className="bg-blue-600 text-white px-6 rounded-2xl active:scale-90 transition-all shadow-lg shadow-blue-500/20"><PlusCircle className="w-7 h-7" /></button></div>
              <div className="space-y-3">
                {usedMaterials.map((mat) => (
                  <div key={mat.itemId} className="flex items-center justify-between bg-white p-5 rounded-[1.5rem] border-2 border-white shadow-sm animate-in fade-in slide-in-from-top duration-300">
                    <div className="flex flex-col"><span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{mat.name}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resource ID: {mat.itemId}</span></div>
                    <div className="flex items-center gap-5 ml-4 shrink-0"><div className="flex items-center bg-slate-50 rounded-xl p-2 border border-slate-100"><button onClick={() => setUsedMaterials(prev => prev.map(m => m.itemId === mat.itemId ? { ...m, quantity: Math.max(1, m.quantity - 1) } : m))} className="p-1 text-slate-400 hover:text-blue-600"><Minus className="w-5 h-5" /></button><span className="w-10 text-center text-base font-black text-slate-900">{mat.quantity}</span><button onClick={() => setUsedMaterials(prev => prev.map(m => m.itemId === mat.itemId ? { ...m, quantity: m.quantity + 1 } : m))} className="p-1 text-slate-400 hover:text-blue-600"><Plus className="w-5 h-5" /></button></div><button onClick={() => setUsedMaterials(prev => prev.filter(m => m.itemId !== mat.itemId))} className="text-rose-400 hover:text-rose-600 active:scale-90"><Trash2 className="w-6 h-6" /></button></div>
                  </div>
                ))}
                {usedMaterials.length === 0 && <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-[2rem]"><p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Archive Null — No Materials</p></div>}
              </div>
            </div>
          </div>
          <div className="space-y-5 shrink-0"><div className="flex justify-between items-end"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Technician Notes</label><button onClick={() => onTranslate(resNote, setResNote)} disabled={isTranslating} className="text-[9px] font-black text-blue-600 flex items-center gap-2 bg-blue-50 px-5 py-2.5 rounded-2xl hover:bg-blue-100 active:scale-95 disabled:opacity-50 shadow-sm border border-blue-100 transition-all uppercase tracking-widest">{isTranslating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Languages className="w-5 h-5" />} Audit AI</button></div><textarea rows={4} className="w-full p-8 rounded-[2.5rem] bg-slate-50 border-4 border-slate-50 text-base font-semibold outline-none focus:bg-white focus:border-blue-500/20 transition-all shadow-inner resize-none leading-relaxed" value={resNote} onChange={e => setResNote(e.target.value)} placeholder="Finalize resolution details for executive review..." /></div>
          <button onClick={() => onUpdate(order.id, { status, resolution: resNote, usedMaterials })} className="w-full py-8 lg:py-10 rounded-[2.5rem] lg:rounded-[3rem] font-black text-[14px] uppercase tracking-[0.5em] bg-blue-600 text-white shadow-2xl shadow-blue-500/30 hover:bg-blue-500 active:scale-[0.98] transition-all mb-10">Synchronize Operational Profile</button>
        </div>
      </div>
    </div>
  );
};
