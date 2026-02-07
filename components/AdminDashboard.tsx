
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, LayoutGrid, Settings as SettingsIcon, 
  Plus, Save, Layers, Scan, Clock, Edit2, Trash2, Send, X, Palette,
  UserPlus, UserMinus, Crown, Check, ChevronLeft, Bell, History
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
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'departments' | 'reports' | 'chat' | 'settings' | 'attendance_logs'>('overview');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [chatInput, setChatInput] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isAddEmpModal, setIsAddEmpModal] = useState(false);
  const [isAddDeptModal, setIsAddDeptModal] = useState(false);
  const [manageDept, setManageDept] = useState<Department | null>(null);
  const [configForm, setConfigForm] = useState(companyConfig);

  // مراقبة سجل الحضور لزيادة الإشعارات
  useEffect(() => {
    if (logs.length > 0 && activeTab !== 'attendance_logs') {
      setUnreadNotifications(prev => prev + 1);
    }
  }, [logs.length]);

  const filteredReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reports]);

  const handleQRScan = (data: string) => {
    try {
      const id = data.includes('{') ? JSON.parse(decodeURIComponent(data)).id : data;
      const emp = employees.find(e => e.id === id);
      if (emp) { setEditingEmp(emp); setShowQRScanner(false); }
      else alert('عامل غير مسجل');
    } catch (e) { alert('رمز QR غير صالح'); }
  };

  const getDeptEmployees = (deptId: string) => employees.filter(e => e.departmentId === deptId);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-['Cairo']" dir="rtl">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-50 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shrink-0">
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
            { id: 'departments', icon: Layers, label: 'الأقسام' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
            { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
            { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' }
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); if(item.id === 'attendance_logs') setUnreadNotifications(0); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
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
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors">
             <LogOut size={18} /> <span className="text-[10px] font-black hidden md:block uppercase tracking-widest">خروج</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-slate-50 relative">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <h2 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em]">{activeTab} TERMINAL</h2>
          <div className="flex items-center gap-6">
             {/* Notification Bell */}
             <div className="relative cursor-pointer" onClick={() => setActiveTab('attendance_logs')}>
                <Bell size={20} className={unreadNotifications > 0 ? 'text-blue-600 animate-swing' : 'text-slate-400'} />
                {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border-2 border-white"></span>}
             </div>
             <button onClick={() => setShowQRScanner(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                <Scan size={14} /> مسح QR
             </button>
          </div>
        </header>

        <div className="p-8 pb-32">
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'إجمالي الموظفين', val: employees.length, icon: Users, color: 'blue' },
                  { label: 'أقسام الشركة', val: departments.length, icon: Layers, color: 'purple' },
                  { label: 'حاضرون حالياً', val: logs.filter(l => l.type === 'IN').length, icon: UserCheck, color: 'emerald' },
                  { label: 'التقارير المرفوعة', val: reports.length, icon: FileText, color: 'amber' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className={`p-4 bg-${s.color}-50 text-${s.color}-600 rounded-2xl shadow-inner`}><s.icon size={24}/></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p><p className="text-2xl font-black text-slate-800">{s.val}</p></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-[3rem] border shadow-sm p-8 border-slate-100">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="font-black text-[10px] text-slate-400 uppercase flex items-center gap-3 tracking-[0.2em]"><Clock size={18} className="text-blue-600"/> آخر الحركات الميدانية</h3>
                   <button onClick={() => setActiveTab('attendance_logs')} className="text-[10px] font-black text-blue-600 uppercase">عرض الكل</button>
                </div>
                <div className="space-y-4">
                  {logs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-5 bg-slate-50/50 border border-transparent hover:border-blue-100 rounded-3xl transition-all group shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border-2 border-white">
                          <img src={log.photo} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{log.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">{log.timestamp} • {log.type === 'IN' ? 'دخول' : 'خروج'}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${log.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest italic">في انتظار تسجيلات العمال...</p>}
                </div>
              </div>
            </div>
          )}

          {/* 2. Full Attendance Logs (NEW TAB) */}
          {activeTab === 'attendance_logs' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <div className="bg-white p-8 rounded-[3rem] border shadow-sm border-slate-100">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800">سجل الحضور والإنصراف</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تتبع دقيق لجميع تحركات العمال بالصور والموقع</p>
                   </div>
                   <div className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">مجموع السجلات: {logs.length}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {logs.map(log => (
                    <div key={log.id} className="bg-white border rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col gap-5 group">
                       <div className="relative h-48 rounded-3xl overflow-hidden shadow-lg border-2 border-slate-50">
                          <img src={log.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase text-white shadow-xl ${log.type === 'IN' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                            {log.type === 'IN' ? 'تسجيل دخول' : 'تسجيل انصراف'}
                          </div>
                       </div>
                       <div className="space-y-3 px-2">
                          <div className="flex justify-between items-start">
                             <h4 className="font-black text-slate-800 text-sm">{log.name}</h4>
                             <span className="text-[9px] font-bold text-slate-400 uppercase">{log.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-lg">
                             <MapIcon size={12}/> {log.location.lat.toFixed(4)}, {log.location.lng.toFixed(4)}
                          </div>
                          <div className={`text-[9px] font-black uppercase tracking-widest ${log.status === AttendanceStatus.PRESENT ? 'text-emerald-500' : 'text-red-500'}`}>{log.status}</div>
                       </div>
                    </div>
                  ))}
                  {logs.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase">لا توجد سجلات حالياً</div>}
                </div>
              </div>
            </div>
          )}

          {/* Map, Employees, Departments, Reports, Chat, Settings tabs continue... */}
          {activeTab === 'map' && <div className="h-[75vh] bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white animate-in zoom-in-95"><MapView logs={logs} /></div>}
          
          {/* Placeholder for other tabs (Employees, Depts, etc.) - Keep them as they were in the previous logic */}
          {activeTab === 'employees' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
               <div className="flex justify-between items-center bg-white/50 p-6 rounded-[2.5rem] backdrop-blur-sm border border-white">
                  <h3 className="text-2xl font-black text-slate-800">إدارة الكادر البشري</h3>
                  <button onClick={() => setIsAddEmpModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-blue-700 transition-all"><Plus size={18}/> إضافة موظف</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {employees.map(e => (
                    <div key={e.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm group hover:border-blue-400 transition-all">
                       <img src={e.avatar} className="w-20 h-20 rounded-[2rem] shadow-lg mb-6 object-cover" />
                       <h4 className="font-bold text-lg text-slate-800">{e.name}</h4>
                       <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{e.role}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}
          {/* ... and so on for other tabs ... */}
        </div>
      </main>

      {/* --- MODALS --- */}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} lang={lang} />}
      {/* ... Add/Edit Modals ... */}

      <style>{`
        @keyframes swing {
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-swing { animation: swing 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
