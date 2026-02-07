
import React, { useState, useMemo } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, LayoutGrid, Settings as SettingsIcon, 
  AlertTriangle, Send, QrCode, MapPin, Clock, Edit2, Trash2, 
  Plus, Save, Building, Shield, Layers, Scan,
  LocateFixed, Database, Cpu, CheckCircle2, Image as ImageIcon, Download, 
  Briefcase, Check, Search, ExternalLink, Globe
} from 'lucide-react';
import { 
  LogEntry, Employee, AttendanceStatus, ReportEntry, ChatMessage, 
  Department, Language, CompanyConfig, UserRole, Announcement, FileEntry
} from '../types';
import { TRANSLATIONS } from '../constants';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'departments' | 'reports' | 'chat' | 'settings'>('overview');
  const [reportFilter, setReportFilter] = useState({ dept: 'all' });
  const [chatFilterDept, setChatFilterDept] = useState<string>('all');
  const [chatInput, setChatInput] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({ 
    departmentId: departments[0]?.id || 'dept_1', 
    userRole: UserRole.WORKER,
    joinedAt: new Date().toISOString().split('T')[0]
  });
  const [newDept, setNewDept] = useState<Partial<Department>>({ color: '#3b82f6' });

  const filteredReports = useMemo(() => {
    let list = [...reports];
    if (reportFilter.dept !== 'all') list = list.filter(r => r.departmentId === reportFilter.dept);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reports, reportFilter]);

  const handleQRScan = (scannedId: string) => {
    try {
        const data = JSON.parse(decodeURIComponent(scannedId));
        const emp = employees.find(e => e.id === data.id);
        if (emp) {
            setEditingEmployee(emp);
            setShowQRScanner(false);
        } else {
            alert('لم يتم العثور على هذا الموظف في النظام');
        }
    } catch (e) {
        // إذا لم يكن JSON، ابحث بالمعرف مباشرة
        const emp = employees.find(e => e.id === scannedId);
        if (emp) {
            setEditingEmployee(emp);
            setShowQRScanner(false);
        } else {
            alert('رمز غير صالح');
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-['Cairo']" dir="rtl">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-50 transition-all">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-black text-[10px] uppercase hidden md:block tracking-widest truncate">{companyConfig.name}</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {[
            { id: 'overview', icon: LayoutGrid, label: 'الرئيسية' },
            { id: 'map', icon: MapIcon, label: 'الخريطة' },
            { id: 'employees', icon: Users, label: 'الموظفون' },
            { id: 'departments', icon: Layers, label: 'الأقسام' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
            { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
            { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={18} /> 
              <span className="text-[10px] font-black hidden md:block uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors">
             <LogOut size={18} /> <span className="text-[10px] font-black hidden md:block uppercase">خروج</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0">
          <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-[0.2em]">{activeTab} Panel</h2>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowQRScanner(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                <Scan size={14} /> مسح بطاقة عامل
             </button>
             <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100">
                <Shield size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Construction Admin</span>
             </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          {activeTab === 'map' && (
             <div className="h-[75vh] animate-in fade-in space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border shadow-sm">
                   <div>
                      <h3 className="text-xl font-black">الرادار الميداني</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">تتبع مواقع العمال في الوقت الفعلي</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> داخل النطاق</div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-red-600 bg-red-50 px-4 py-2 rounded-full"><div className="w-2 h-2 bg-red-500 rounded-full"/> خارج النطاق</div>
                   </div>
                </div>
                <div className="h-full rounded-[3.5rem] overflow-hidden border-4 border-white shadow-2xl relative">
                   <MapView logs={logs} />
                </div>
             </div>
          )}

          {activeTab === 'employees' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black">إدارة الكادر البشري</h3>
                   <div className="flex gap-4">
                      <button onClick={() => setShowQRScanner(true)} className="bg-slate-100 text-slate-700 px-8 py-4 rounded-2xl font-bold text-[10px] flex items-center gap-2 uppercase border hover:bg-slate-200 transition-all"><Scan size={18}/> مسح بطاقة</button>
                      <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-[10px] flex items-center gap-2 uppercase shadow-xl hover:bg-blue-700 transition-all"><Plus size={18}/> إضافة موظف</button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {employees.map(emp => (
                      <div key={emp.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm group hover:border-blue-400 transition-all relative">
                         <div className="flex justify-between mb-6">
                            <div className="relative group/avatar">
                               <img src={emp.avatar || 'https://i.pravatar.cc/150'} className="w-24 h-24 rounded-[2.5rem] object-cover border-4 border-slate-50 shadow-md group-hover/avatar:brightness-75 transition-all" />
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => setEditingEmployee(emp)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                               <button onClick={() => { if(confirm('حذف الموظف؟')) onUpdateEmployees(employees.filter(e => e.id !== emp.id)) }} className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </div>
                         </div>
                         <h4 className="font-bold text-lg">{emp.name}</h4>
                         <p className="text-[10px] text-blue-600 font-black uppercase mb-6 tracking-widest">{emp.role}</p>
                         <div className="border-t pt-4 space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">الهاتف:</span><span>{emp.phone}</span></div>
                            <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">القسم:</span><span>{emp.departmentId}</span></div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'overview' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   {[
                      { l: 'إجمالي الكادر', v: employees.length, i: Users, c: 'blue' },
                      { l: 'أقسام المؤسسة', v: departments.length, i: Layers, c: 'purple' },
                      { l: 'حاضرون حالياً', v: logs.filter(l => l.type === 'IN').length, i: UserCheck, c: 'emerald' },
                      { l: 'تقارير اليوم', v: reports.length, i: FileText, c: 'amber' }
                   ].map((s, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-sm border flex items-center gap-4">
                         <div className={`p-4 bg-${s.c}-50 text-${s.c}-600 rounded-2xl`}><s.i size={24}/></div>
                         <div><p className="text-[9px] font-black text-slate-400 uppercase">{s.l}</p><p className="text-2xl font-black">{s.v}</p></div>
                      </div>
                   ))}
                </div>
                <div className="bg-white rounded-[3.5rem] border shadow-sm p-8">
                   <h3 className="font-black mb-6 flex items-center gap-2 uppercase text-[10px] tracking-widest text-slate-400"><Clock size={18} className="text-blue-600"/> آخر الحركات الميدانية</h3>
                   <div className="space-y-4">
                      {logs.slice(0,10).map(log => (
                         <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                            <div className="flex items-center gap-4">
                               <img src={log.photo} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                               <div><p className="text-xs font-bold">{log.name}</p><p className="text-[9px] text-slate-400 uppercase font-black">{log.timestamp} • {log.type === 'IN' ? 'دخول' : 'خروج'}</p></div>
                            </div>
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${log.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{log.status}</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* نوافذ فرعية (Modals) */}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} lang={lang} />}
      
      {(editingEmployee || isAddModalOpen) && (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 font-['Cairo']">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 space-y-6 overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black text-center mb-6 text-slate-800">{isAddModalOpen ? 'تسجيل عامل ميداني' : 'تعديل بيانات العامل'}</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase pr-4">الاسم الكامل</label>
                    <input defaultValue={editingEmployee?.name} onChange={e => editingEmployee ? setEditingEmployee({...editingEmployee, name: e.target.value}) : setNewEmp({...newEmp, name: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold shadow-inner border-none outline-none focus:ring-2 focus:ring-blue-100" placeholder="الاسم الرباعي" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase pr-4">رقم الهاتف</label>
                    <input defaultValue={editingEmployee?.phone} onChange={e => editingEmployee ? setEditingEmployee({...editingEmployee, phone: e.target.value}) : setNewEmp({...newEmp, phone: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold shadow-inner border-none outline-none focus:ring-2 focus:ring-blue-100" placeholder="05XXXXXXXX" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase pr-4">المسمى الوظيفي</label>
                    <input defaultValue={editingEmployee?.role} onChange={e => editingEmployee ? setEditingEmployee({...editingEmployee, role: e.target.value}) : setNewEmp({...newEmp, role: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold shadow-inner border-none outline-none focus:ring-2 focus:ring-blue-100" placeholder="عامل، مهندس..." />
                 </div>
              </div>
              <div className="flex gap-4 pt-6">
                 <button onClick={() => { setEditingEmployee(null); setIsAddModalOpen(false); }} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500 hover:bg-slate-200 transition-all">إلغاء</button>
                 <button onClick={() => {
                    if (editingEmployee) {
                       onUpdateEmployees(employees.map(e => e.id === editingEmployee.id ? editingEmployee : e));
                    } else if (newEmp.name && newEmp.phone) {
                       const finalEmp: Employee = {
                          ...newEmp as Employee,
                          id: `emp_${Date.now()}`,
                          avatar: newEmp.avatar || `https://i.pravatar.cc/150?u=${newEmp.phone}`,
                          isShiftRequired: true,
                          isRegistered: false,
                          password: '123'
                       };
                       onUpdateEmployees([...employees, finalEmp]);
                    }
                    setEditingEmployee(null);
                    setIsAddModalOpen(false);
                 }} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl uppercase hover:bg-blue-700 transition-all">حفظ البيانات</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
