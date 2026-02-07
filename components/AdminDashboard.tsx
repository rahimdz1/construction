
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, Sparkles, RefreshCw, LayoutGrid, 
  Settings as SettingsIcon, AlertTriangle, Loader2, Send, 
  QrCode, MapPin, Clock, Edit2, Trash2, Plus, Save,
  Building, Shield, Database, Bell, Image as ImageIcon
} from 'lucide-react';
import { 
  LogEntry, Employee, AttendanceStatus, ReportEntry, ChatMessage, 
  Department, Language, CompanyConfig, UserRole
} from '../types';
import { TRANSLATIONS, NOTIFICATION_SOUNDS } from '../constants';
import MapView from './MapView';
import QRScanner from './QRScanner';
import { analyzeAttendance } from '../geminiService';

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
  onUpdateAnnouncements: (a: any) => Promise<void>;
  onUpdateFiles: (f: any) => Promise<void>;
  onUpdateCompanyConfig: (c: CompanyConfig) => Promise<void>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  logs, reports, chatMessages, employees, departments,
  companyConfig, lang, onLogout, onSendMessage, onUpdateEmployees, onUpdateCompanyConfig
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'reports' | 'chat' | 'settings'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [reportFilterDept, setReportFilterDept] = useState<string>('all');
  const [chatFilterDept, setChatFilterDept] = useState<string>('all');
  const [chatInput, setChatInput] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // بيانات العامل الجديد
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({
    name: '', role: '', phone: '', workplace: '', departmentId: 'dept_1', userRole: UserRole.WORKER
  });

  const t = TRANSLATIONS[lang];

  // تشغيل صوت عند وصول تقرير جديد
  useEffect(() => {
    if (reports.length > 0) {
      new Audio(NOTIFICATION_SOUNDS.REPORT).play().catch(() => {});
    }
  }, [reports.length]);

  const sortedReports = useMemo(() => {
    return reports
      .filter(r => reportFilterDept === 'all' || r.departmentId === reportFilterDept)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reports, reportFilterDept]);

  const filteredChats = useMemo(() => {
    return chatMessages.filter(m => chatFilterDept === 'all' || m.departmentId === chatFilterDept || m.departmentId === 'all');
  }, [chatMessages, chatFilterDept]);

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeAttendance(logs);
      setAiAnalysis(result);
    } catch {
      setAiAnalysis("فشل تحليل البيانات حالياً.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'ADMIN',
      senderName: 'الإدارة العامة',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString(),
      type: 'group',
      departmentId: chatFilterDept
    };
    await onSendMessage(msg);
    setChatInput('');
  };

  const handleAddEmployee = async () => {
    if (!newEmp.name || !newEmp.phone) return;
    const emp: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      name: newEmp.name!,
      phone: newEmp.phone!,
      role: newEmp.role || 'عامل',
      userRole: newEmp.userRole || UserRole.WORKER,
      departmentId: newEmp.departmentId || 'dept_1',
      avatar: `https://i.pravatar.cc/150?u=${newEmp.phone}`,
      isShiftRequired: true,
      shiftStart: '08:00',
      shiftEnd: '16:00',
      workplace: newEmp.workplace || 'الموقع الرئيسي',
      isRegistered: true,
      password: '123'
    };
    await onUpdateEmployees([...employees, emp]);
    setIsAddModalOpen(false);
    setNewEmp({ name: '', role: '', phone: '', workplace: '', departmentId: 'dept_1' });
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      await onUpdateEmployees(employees.filter(e => e.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-bold text-[10px] uppercase hidden md:block tracking-widest truncate">{companyConfig.name}</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: 'overview', icon: LayoutGrid, label: 'الرئيسية' },
            { id: 'map', icon: MapIcon, label: 'الخريطة' },
            { id: 'employees', icon: Users, label: 'العمال' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
            { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
            { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)} 
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <item.icon size={18} /> 
              <span className="text-[10px] font-bold hidden md:block uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/5 space-y-2">
           <button onClick={() => setShowQRScanner(true)} className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl text-blue-400 hover:bg-white/10 transition-colors">
             <QrCode size={18} /> <span className="text-[9px] font-bold hidden md:block">مسح QR</span>
           </button>
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 transition-colors">
             <LogOut size={18} /> <span className="text-[9px] font-bold hidden md:block">خروج</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <h2 className="font-bold text-slate-800 text-xs uppercase tracking-widest">{activeTab} Panel</h2>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2 rtl:space-x-reverse">
                {employees.slice(0, 3).map(e => <img key={e.id} src={e.avatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />)}
                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">+{employees.length}</div>
             </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'إجمالي الكادر', val: employees.length, icon: Users, color: 'blue' },
                    { label: 'حاضرون الآن', val: logs.filter(l => l.type === 'IN').length, icon: UserCheck, color: 'emerald' },
                    { label: 'تنبيهات الموقع', val: logs.filter(l => l.status === AttendanceStatus.OUT_OF_BOUNDS).length, icon: AlertTriangle, color: 'red' },
                    { label: 'تقارير معلقة', val: sortedReports.length, icon: FileText, color: 'amber' }
                  ].map((s, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center gap-5">
                      <div className={`w-12 h-12 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center shadow-inner`}><s.icon size={22} /></div>
                      <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{s.label}</p><p className="text-2xl font-bold text-slate-800">{s.val}</p></div>
                    </div>
                  ))}
               </div>
               
               <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Sparkles className="text-amber-400" /> الذكاء الاصطناعي (Gemini Core)</h3>
                    <p className="text-sm opacity-70 max-w-xl">حلل سلوك الحضور، تتبع كفاءة العمال، واحصل على توصيات لتحسين سير العمل الميداني فوراً.</p>
                    <button onClick={handleRunAiAnalysis} className="bg-white text-slate-900 font-bold px-8 py-4 rounded-2xl shadow-xl text-[10px] flex items-center gap-2 hover:scale-105 transition-all">
                       {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} توليد تقرير تحليلي
                    </button>
                    {aiAnalysis && <div className="mt-8 p-6 bg-white/10 backdrop-blur-md rounded-3xl text-sm leading-relaxed border border-white/10 shadow-inner">{aiAnalysis}</div>}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl text-slate-800 tracking-tight flex items-center gap-3"><Users className="text-blue-600" /> إدارة الكوادر الميدانية</h3>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:bg-blue-700 text-[10px] flex items-center gap-2 uppercase tracking-widest"><Plus size={18} /> إضافة عامل جديد</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {employees.map(emp => (
                   <div key={emp.id} className="bg-white p-8 rounded-[3rem] border shadow-sm text-center group relative hover:border-blue-400 transition-all overflow-hidden">
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="absolute top-4 left-4 p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                      <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden mx-auto mb-6 border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform"><img src={emp.avatar} className="w-full h-full object-cover" /></div>
                      <h4 className="font-bold text-slate-800 text-lg">{emp.name}</h4>
                      <p className="text-[10px] text-blue-600 font-bold uppercase mb-4 tracking-widest">{emp.role}</p>
                      <div className="pt-4 border-t border-slate-50 text-right space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-slate-400 uppercase">الموقع:</span><span className="text-slate-800 truncate max-w-[120px]">{emp.workplace}</span></div>
                        <div className="flex justify-between items-center text-[10px] font-bold"><span className="text-slate-400 uppercase">الهاتف:</span><span className="text-slate-800 tracking-widest">{emp.phone}</span></div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
             <div className="flex flex-col h-[75vh] bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center shadow-lg">
                   <div className="flex items-center gap-4">
                     <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><MessageSquare size={18} className="text-blue-400" /> مركز اتصالات الإدارة</h3>
                     <select 
                       value={chatFilterDept} 
                       onChange={e => setChatFilterDept(e.target.value)}
                       className="bg-white/10 border-none rounded-xl text-[9px] font-bold px-4 py-2 outline-none"
                     >
                        <option value="all" className="text-slate-900">إرسال للجميع</option>
                        {departments.map(d => <option key={d.id} value={d.id} className="text-slate-900">{d.name}</option>)}
                     </select>
                   </div>
                   <div className="text-[9px] font-bold opacity-50 uppercase tracking-widest">{chatFilterDept === 'all' ? 'Broadcast Mode' : 'Department Specific'}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                   {filteredChats.map(msg => (
                     <div key={msg.id} className={`flex flex-col ${msg.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[75%] p-5 rounded-[2.5rem] text-[11px] shadow-sm ${msg.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'}`}>
                         <p className={`text-[9px] font-bold mb-2 uppercase tracking-widest ${msg.senderId === 'ADMIN' ? 'text-white/60' : 'text-blue-600'}`}>{msg.senderName}</p>
                         <p className="leading-relaxed font-bold">{msg.text}</p>
                       </div>
                       <span className="text-[8px] text-slate-400 mt-2 font-bold px-3">{msg.timestamp}</span>
                     </div>
                   ))}
                </div>
                <div className="p-6 border-t bg-white flex gap-4 items-center">
                   <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-xs font-bold outline-none shadow-inner focus:ring-2 focus:ring-blue-500" placeholder={`اكتب رسالة ${chatFilterDept === 'all' ? 'عامة' : 'للقسم المختص'}...`} />
                   <button onClick={handleSendChat} className="p-5 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all"><Send size={24} /></button>
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in">
               <h3 className="font-bold text-2xl text-slate-800 tracking-tight">إعدادات المنصة الشاملة</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Company Profile */}
                  <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
                     <h4 className="font-bold text-xs uppercase text-blue-600 flex items-center gap-2"><Building size={16}/> الملف التعريفي للشركة</h4>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">اسم الشركة</label>
                           <input value={companyConfig.name} onChange={e => onUpdateCompanyConfig({...companyConfig, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none shadow-inner" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">رابط الشعار (URL)</label>
                           <input value={companyConfig.logo} onChange={e => onUpdateCompanyConfig({...companyConfig, logo: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none shadow-inner" placeholder="https://..." />
                        </div>
                     </div>
                  </div>

                  {/* Security & Access */}
                  <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
                     <h4 className="font-bold text-xs uppercase text-emerald-600 flex items-center gap-2"><Shield size={16}/> الأمان والوصول</h4>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                           <span className="text-[10px] font-bold text-slate-600 uppercase">فرض التحقق من الموقع (GPS)</span>
                           <div className="w-10 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                           <span className="text-[10px] font-bold text-slate-600 uppercase">طلب صورة عند الحضور</span>
                           <div className="w-10 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                        </div>
                     </div>
                  </div>

                  {/* Site Geofencing */}
                  <div className="md:col-span-2 bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
                     <h4 className="font-bold text-xs uppercase text-red-600 flex items-center gap-2"><MapPin size={16}/> حدود الموقع الميداني الرئيسي</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-slate-400 uppercase">خط العرض (Lat)</label>
                           <input defaultValue="24.7136" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none shadow-inner" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-slate-400 uppercase">خط الطول (Lng)</label>
                           <input defaultValue="46.6753" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none shadow-inner" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold text-slate-400 uppercase">نطاق السماح (أمتار)</label>
                           <input defaultValue="500" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none shadow-inner" />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex justify-end pt-8">
                  <button className="bg-slate-900 text-white font-bold px-12 py-5 rounded-[2rem] shadow-2xl flex items-center gap-3 hover:scale-105 transition-all"><Save size={20}/> حفظ جميع الإعدادات</button>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in">
              <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">إضافة عضو جديد للفريق</h3>
              <div className="grid grid-cols-2 gap-4">
                 <input placeholder="اسم الموظف" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="col-span-2 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none" />
                 <input placeholder="رقم الهاتف" value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none" />
                 <input placeholder="المسمى الوظيفي" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none" />
                 <input placeholder="موقع العمل" value={newEmp.workplace} onChange={e => setNewEmp({...newEmp, workplace: e.target.value})} className="col-span-2 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none" />
                 <select value={newEmp.departmentId} onChange={e => setNewEmp({...newEmp, departmentId: e.target.value})} className="col-span-2 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                 </select>
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold">إلغاء</button>
                 <button onClick={handleAddEmployee} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-xl">تأكيد الإضافة</button>
              </div>
           </div>
        </div>
      )}

      {showQRScanner && <QRScanner onScan={(scanned) => {
        const emp = employees.find(e => e.id === scanned || scanned.includes(e.id));
        if (emp) setSelectedEmployee(emp);
        setShowQRScanner(false);
      }} onClose={() => setShowQRScanner(false)} lang={lang} />}

      {selectedEmployee && (
        <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-10 space-y-6 animate-in zoom-in">
              <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden mx-auto border-4 border-slate-50 p-1 shadow-xl bg-white"><img src={selectedEmployee.avatar} className="w-full h-full object-cover rounded-[2rem]" /></div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedEmployee.name}</h3>
              <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">{selectedEmployee.role}</p>
              <div className="bg-slate-50 p-6 rounded-3xl space-y-3 text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">تفاصيل الحساب الميداني</p>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><MapPin size={16} className="text-red-500" /> {selectedEmployee.workplace}</p>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><Clock size={16} className="text-emerald-500" /> {selectedEmployee.shiftStart} - {selectedEmployee.shiftEnd}</p>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl">إغلاق ملف التعريف</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
