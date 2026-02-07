
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, LayoutGrid, Settings as SettingsIcon, 
  Plus, Save, Layers, Scan, Clock, History, Bell, ChevronLeft
} from 'lucide-react';
import { 
  LogEntry, Employee, AttendanceStatus, ReportEntry, ChatMessage, 
  Department, Language, CompanyConfig, UserRole, Announcement, FileEntry
} from '../types';
import MapView from './MapView';
import QRScanner from './QRScanner';

interface AdminDashboardProps {
  logs: LogEntry[];
  reports: ReportEntry[];
  chatMessages: ChatMessage[];
  employees: Employee[];
  departments: Department[];
  companyConfig: CompanyConfig;
  lang: Language;
  onSetLang: (l: Language) => void;
  onSendMessage: (m: ChatMessage) => Promise<void>;
  onLogout: () => void;
  onUpdateEmployees: (e: Employee[]) => Promise<void>;
  onUpdateDepartments: (d: Department[]) => Promise<void>;
  onUpdateAnnouncements: (a: Announcement[]) => Promise<void>;
  onUpdateFiles: (f: FileEntry[]) => Promise<void>;
  onUpdateCompanyConfig: (c: CompanyConfig) => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  logs = [], reports = [], chatMessages = [], employees = [], departments = [],
  companyConfig, lang, onLogout, onSendMessage, onUpdateEmployees, onUpdateDepartments, onUpdateCompanyConfig
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'attendance_logs' | 'reports' | 'chat' | 'settings'>('overview');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // تحديث التنبيهات عند وصول سجلات جديدة
  useEffect(() => {
    if (logs.length > 0 && activeTab !== 'attendance_logs') {
      setUnreadNotifications(prev => prev + 1);
    }
  }, [logs.length]);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-['Cairo']" dir="rtl">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-black text-[10px] hidden md:block truncate uppercase tracking-widest">{companyConfig.name}</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {[
            { id: 'overview', icon: LayoutGrid, label: 'الرئيسية' },
            { id: 'attendance_logs', icon: History, label: 'سجل الحضور' },
            { id: 'map', icon: MapIcon, label: 'الخريطة' },
            { id: 'employees', icon: Users, label: 'الموظفون' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
            { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
            { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' }
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); if(item.id === 'attendance_logs') setUnreadNotifications(0); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={18} /> 
              <span className="text-[10px] font-black hidden md:block uppercase tracking-wider">{item.label}</span>
              {item.id === 'attendance_logs' && unreadNotifications > 0 && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadNotifications}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors font-black text-[10px] uppercase">
             <LogOut size={18} /> <span className="hidden md:block">خروج</span>
           </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <h2 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em]">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-6">
             <div className="relative cursor-pointer p-2" onClick={() => setActiveTab('attendance_logs')}>
                <Bell size={20} className={unreadNotifications > 0 ? 'text-blue-600 animate-pulse' : 'text-slate-400'} />
                {unreadNotifications > 0 && <span className="absolute top-1 right-1 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"></span>}
             </div>
             <button onClick={() => setShowQRScanner(true)} className="bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 transition-all shadow-lg">
                <Scan size={14} className="inline ml-2" /> مسح QR
             </button>
          </div>
        </header>

        <div className="p-8 pb-32">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
               {[
                  { label: 'إجمالي الموظفين', val: employees.length, icon: Users, color: 'blue' },
                  { label: 'أقسام الشركة', val: departments.length, icon: Layers, color: 'purple' },
                  { label: 'حاضرون حالياً', val: logs.filter(l => l.type === 'IN').length, icon: UserCheck, color: 'emerald' },
                  { label: 'التقارير المرفوعة', val: reports.length, icon: FileText, color: 'amber' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className={`p-4 bg-${s.color}-50 text-${s.color}-600 rounded-2xl`}><s.icon size={24}/></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p><p className="text-2xl font-black text-slate-800">{s.val}</p></div>
                  </div>
                ))}
                <div className="col-span-full bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm mt-4">
                   <h3 className="font-black text-[10px] text-slate-400 uppercase mb-8 tracking-[0.2em]">آخر النشاطات</h3>
                   <div className="space-y-4">
                      {logs.slice(0, 5).map(log => (
                        <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-transparent hover:border-blue-100 transition-all">
                           <div className="flex items-center gap-4">
                              <img src={log.photo} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                              <div>
                                 <p className="font-bold text-xs text-slate-800">{log.name}</p>
                                 <p className="text-[9px] text-slate-400 font-black uppercase">{log.timestamp} - {log.type === 'IN' ? 'دخول' : 'خروج'}</p>
                              </div>
                           </div>
                           <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${log.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{log.status}</span>
                        </div>
                      ))}
                   </div>
                </div>
            </div>
          )}

          {activeTab === 'attendance_logs' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
               <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm border-slate-100">
                  <h3 className="text-2xl font-black text-slate-800 mb-2">سجل الحركات الميدانية</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">جميع عمليات تسجيل الحضور والإنصراف موثقة بالصور والموقع</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {logs.map(log => (
                        <div key={log.id} className="bg-white border-2 border-slate-50 rounded-[3rem] p-6 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all">
                           <div className="relative h-56 rounded-[2.5rem] overflow-hidden mb-6 shadow-lg">
                              <img src={log.photo} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                              <div className={`absolute top-4 right-4 px-4 py-2 rounded-2xl text-[8px] font-black uppercase text-white shadow-xl ${log.type === 'IN' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                 {log.type === 'IN' ? 'دخول' : 'خروج'}
                              </div>
                           </div>
                           <div className="space-y-4 px-2">
                              <div className="flex justify-between items-center">
                                 <h4 className="font-black text-slate-800 text-sm">{log.name}</h4>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">{log.timestamp}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-4 py-1.5 rounded-xl">
                                 <MapIcon size={12}/> {log.location.lat.toFixed(5)}, {log.location.lng.toFixed(5)}
                              </div>
                              <div className={`text-[9px] font-black uppercase tracking-widest ${log.status === AttendanceStatus.PRESENT ? 'text-emerald-500' : 'text-red-500'}`}>{log.status}</div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'map' && <div className="h-[75vh] bg-white rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white animate-in zoom-in-95"><MapView logs={logs} /></div>}
        </div>
      </main>

      {showQRScanner && <QRScanner onScan={() => {}} onClose={() => setShowQRScanner(false)} lang={lang} />}
    </div>
  );
};

export default AdminDashboard;
