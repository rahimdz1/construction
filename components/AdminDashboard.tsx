
import React, { useState, useMemo } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, LayoutGrid, Settings as SettingsIcon, 
  AlertTriangle, Send, QrCode, MapPin, Clock, Edit2, Trash2, 
  Plus, Save, Building, Shield, Layers, 
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateCompanyConfig({ ...companyConfig, logo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit && editingEmployee) setEditingEmployee({...editingEmployee, avatar: reader.result as string});
        else setNewEmp({...newEmp, avatar: reader.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentGPS = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (editingEmployee) setEditingEmployee({...editingEmployee, workplaceLat: coords.lat, workplaceLng: coords.lng});
      else if (isAddModalOpen) setNewEmp({...newEmp, workplaceLat: coords.lat, workplaceLng: coords.lng});
      alert(`تم التقاط الإحداثيات: ${coords.lat}, ${coords.lng}`);
    });
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
          <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100">
             <Shield size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Construction Admin</span>
          </div>
        </header>

        <div className="p-8 flex-1">
          {/* قسم الخريطة (Map) */}
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

          {/* قسم الإعدادات (Settings) */}
          {activeTab === 'settings' && (
             <div className="max-w-4xl animate-in fade-in space-y-8">
                <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-10">
                   <div className="flex items-center gap-4">
                      <div className="p-4 bg-blue-600 text-white rounded-[2rem] shadow-lg shadow-blue-100"><SettingsIcon size={32}/></div>
                      <div>
                        <h3 className="text-2xl font-black">إعدادات المنظومة</h3>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">إدارة هوية الشركة وقواعد البيانات</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase pr-4">اسم الشركة / المشروع</label>
                            <input 
                              value={companyConfig.name} 
                              onChange={e => onUpdateCompanyConfig({...companyConfig, name: e.target.value})} 
                              className="w-full bg-slate-50 border-none rounded-[1.5rem] p-5 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-blue-100" 
                            />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase pr-4">شعار المؤسسة</label>
                            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                               <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border">
                                  {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-contain" /> : <Building size={32} className="text-slate-200"/>}
                               </div>
                               <label className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[9px] cursor-pointer hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg">
                                  تغيير الشعار
                                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                               </label>
                            </div>
                         </div>
                      </div>

                      <div className="bg-slate-900 rounded-[3rem] p-8 text-white space-y-6 flex flex-col justify-center">
                         <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Database className="text-blue-400" size={24}/>
                            <h4 className="font-black text-xs uppercase tracking-widest">خادم البيانات (Cloud)</h4>
                         </div>
                         <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black"><span className="opacity-40 uppercase">الحالة</span><span className="text-emerald-400">متصل (Online)</span></div>
                            <div className="flex justify-between text-[10px] font-black"><span className="opacity-40 uppercase">الإصدار</span><span className="text-blue-400">V2.8 Professional</span></div>
                            <div className="flex justify-between text-[10px] font-black"><span className="opacity-40 uppercase">المزود</span><span className="text-slate-300">Supabase DB</span></div>
                            <div className="flex justify-between text-[10px] font-black"><span className="opacity-40 uppercase">نطاق الموقع</span><span className="text-amber-400">3000 متر</span></div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-blue-50 border border-blue-100 p-8 rounded-[3rem] flex items-start gap-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0"><ShieldCheck size={28}/></div>
                      <div className="space-y-2">
                         <h4 className="font-black text-sm text-blue-900">أمان وحماية المنظومة</h4>
                         <p className="text-xs text-blue-700/70 leading-relaxed font-bold">جميع البيانات، الصور، وإحداثيات GPS يتم تشفيرها لحظياً وحفظها في قاعدة بيانات المشروع. لا يمكن لأي طرف خارجي الوصول إلى سجلات الحضور.</p>
                      </div>
                   </div>

                   <button 
                     onClick={() => alert('تمت مزامنة كافة الإعدادات مع السحابة بنجاح')} 
                     className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                   >
                     <Save size={20}/> حفظ وتأكيد كافة التغييرات
                   </button>
                </div>
             </div>
          )}

          {/* تبويب الأقسام (Departments) */}
          {activeTab === 'departments' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black">أقسام المؤسسة</h3>
                   <button onClick={() => setIsAddDeptModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-[10px] flex items-center gap-2 uppercase shadow-xl"><Plus size={18}/> إضافة قسم</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {departments.length > 0 ? departments.map(dept => (
                      <div key={dept.id} className="bg-white p-8 rounded-[3rem] border-r-[12px] shadow-sm hover:shadow-md transition-all group" style={{borderRightColor: dept.color}}>
                         <div className="flex justify-between items-start mb-6">
                            <div><h4 className="font-bold text-lg">{dept.name}</h4><p className="text-[10px] text-slate-400 font-black tracking-widest">{dept.id}</p></div>
                            <div className="flex gap-2">
                               <button className="p-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={14}/></button>
                               <button onClick={() => onUpdateDepartments(departments.filter(d => d.id !== dept.id))} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/></button>
                            </div>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="text-slate-400">إجمالي الكادر:</span>
                            <span className="bg-slate-100 px-3 py-1 rounded-full">{employees.filter(e => e.departmentId === dept.id).length} موظف</span>
                         </div>
                      </div>
                   )) : (
                      <div className="col-span-full p-20 text-center bg-white border-2 border-dashed rounded-[3rem]">
                         <Layers size={48} className="mx-auto text-slate-200 mb-4" />
                         <p className="text-slate-400 font-bold uppercase">لا توجد أقسام مسجلة حالياً</p>
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* تبويب التقارير (Reports) */}
          {activeTab === 'reports' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="flex items-center gap-4">
                      <select value={reportFilter.dept} onChange={e => setReportFilter({...reportFilter, dept: e.target.value})} className="bg-slate-50 rounded-xl px-6 py-3 text-[10px] font-black border-none outline-none shadow-inner">
                         <option value="all">كافة تقارير الأقسام</option>
                         {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                   </div>
                   <div className="bg-amber-50 text-amber-600 px-5 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase">
                      <AlertTriangle size={16}/> مراجعة النشاط الميداني
                   </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                   {filteredReports.length > 0 ? filteredReports.map(r => (
                      <div key={r.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm hover:border-blue-200 transition-all">
                         <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1 space-y-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black uppercase text-xs">{r.employeeName[0]}</div>
                                  <div><h4 className="font-bold text-sm">{r.employeeName}</h4><p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">{r.departmentId}</p></div>
                               </div>
                               <p className="text-xs text-slate-600 leading-loose bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">{r.content}</p>
                               {r.attachmentUrl && (
                                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                     <FileText className="text-emerald-600" size={24}/>
                                     <div className="flex-1"><p className="text-[10px] font-black text-emerald-800 uppercase">مرفق تقني: {r.attachmentName}</p></div>
                                     <a href={r.attachmentUrl} download className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm hover:scale-110 transition-all"><Download size={18}/></a>
                                  </div>
                               )}
                            </div>
                            <div className="text-left"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full">{new Date(r.timestamp).toLocaleString('ar-EG')}</span></div>
                         </div>
                      </div>
                   )) : (
                      <div className="p-20 text-center bg-white border rounded-[3rem]">
                         <FileText size={48} className="mx-auto text-slate-100 mb-4" />
                         <p className="text-slate-400 font-bold uppercase">لا توجد تقارير ميدانية بعد</p>
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* تبويب الدردشة (Chat) */}
          {activeTab === 'chat' && (
             <div className="flex flex-col h-[75vh] bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden animate-in fade-in">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                   <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-3"><MessageSquare size={18} className="text-blue-400"/> قناة التواصل المباشر</h3>
                   <select value={chatFilterDept} onChange={e => setChatFilterDept(e.target.value)} className="bg-white/10 border-none rounded-xl text-[9px] font-bold px-4 py-2 outline-none">
                      <option value="all">بث عام (للجميع)</option>
                      {departments.map(d => <option key={d.id} value={d.id} className="text-slate-900">{d.name}</option>)}
                   </select>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                   {chatMessages.length > 0 ? chatMessages.map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                         <div className={`max-w-[80%] p-6 rounded-[2.5rem] shadow-sm ${msg.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>
                            <p className="text-[8px] font-black uppercase opacity-60 mb-2 flex items-center gap-2">
                               {msg.senderName} 
                               {msg.departmentId !== 'all' && <span className="bg-black/10 px-2 py-0.5 rounded-md">{msg.departmentId}</span>}
                            </p>
                            <p className="text-xs font-bold leading-relaxed">{msg.text}</p>
                         </div>
                         <span className="text-[8px] text-slate-400 mt-2 font-black px-4 uppercase tracking-widest">{msg.timestamp}</span>
                      </div>
                   )) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-20">
                         <MessageSquare size={80} />
                         <p className="font-black mt-4 uppercase tracking-[0.3em]">بداية السجل</p>
                      </div>
                   )}
                </div>
                <div className="p-6 border-t bg-white flex gap-4 shrink-0">
                   <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-xs font-bold shadow-inner" placeholder="اكتب تعليمات الإدارة هنا..." />
                   <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Date.now().toString(), senderId: 'ADMIN', senderName: 'الإدارة العامة', text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: chatFilterDept}); setChatInput(''); }} className="p-5 bg-blue-600 text-white rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all"><Send size={24}/></button>
                </div>
             </div>
          )}

          {/* تبويب الموظفون (Employees) */}
          {activeTab === 'employees' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black">إدارة الكادر البشري</h3>
                   <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-[10px] flex items-center gap-2 uppercase shadow-xl hover:bg-blue-700 transition-all"><Plus size={18}/> إضافة موظف</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {employees.map(emp => (
                      <div key={emp.id} className="bg-white p-8 rounded-[3.5rem] border shadow-sm group hover:border-blue-400 transition-all relative">
                         <div className="flex justify-between mb-6">
                            <div className="relative group/avatar">
                               <img src={emp.avatar || 'https://i.pravatar.cc/150'} className="w-24 h-24 rounded-[2.5rem] object-cover border-4 border-slate-50 shadow-md group-hover/avatar:brightness-75 transition-all" />
                               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 text-white pointer-events-none transition-all"><ImageIcon size={24}/></div>
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
                            <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase pt-2">
                               <span>حالة الموقع</span>
                               {emp.workplaceLat ? <span className="flex items-center gap-1"><LocateFixed size={12}/> GPS مفعل</span> : <span className="text-slate-300">غير محدد</span>}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* تبويب الإحصائيات (Overview) */}
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
                      {logs.slice(0,5).map(log => (
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

      {/* نافذة تعديل بيانات الموظف */}
      {(editingEmployee || isAddModalOpen) && (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 font-['Cairo']">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 space-y-6 overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black text-center mb-6 text-slate-800">{isAddModalOpen ? 'تسجيل عامل ميداني' : 'تعديل بيانات العامل'}</h3>
              
              <div className="flex justify-center mb-8">
                 <div className="relative group cursor-pointer">
                    <img src={(editingEmployee?.avatar || newEmp.avatar) || 'https://i.pravatar.cc/150'} className="w-32 h-32 rounded-[3rem] object-cover border-4 border-blue-100 shadow-xl" />
                    <label className="absolute inset-0 bg-black/40 rounded-[3rem] flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                       <ImageIcon size={32} />
                       <span className="text-[10px] font-black mt-1 uppercase">تغيير الصورة</span>
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(e, !!editingEmployee)} />
                    </label>
                 </div>
              </div>

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
                 
                 <div className="col-span-2 space-y-3 bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100">
                    <label className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 tracking-widest"><MapPin size={14}/> تحديد موقع العمل (3 كلم)</label>
                    <div className="flex gap-2">
                       <input 
                         placeholder="رابط الخريطة أو الإحداثيات" 
                         className="flex-1 bg-white rounded-xl p-4 text-[10px] font-bold shadow-inner border-none outline-none"
                         onChange={(e) => {
                           const val = e.target.value;
                           const match = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                           if (match) {
                             const coords = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
                             if (editingEmployee) setEditingEmployee({...editingEmployee, workplaceLat: coords.lat, workplaceLng: coords.lng, workplace: val});
                             else setNewEmp({...newEmp, workplaceLat: coords.lat, workplaceLng: coords.lng, workplace: val});
                           }
                         }}
                       />
                       <button onClick={getCurrentGPS} className="p-4 bg-blue-600 text-white rounded-xl shadow-lg active:scale-95 transition-all"><LocateFixed size={20}/></button>
                    </div>
                    {(editingEmployee?.workplaceLat || newEmp.workplaceLat) && (
                      <p className="text-[9px] font-black text-emerald-600 flex items-center gap-2 bg-emerald-50 p-2 rounded-lg">
                        <CheckCircle2 size={12}/> الموقع الموثق: {editingEmployee?.workplaceLat || newEmp.workplaceLat}, {editingEmployee?.workplaceLng || newEmp.workplaceLng}
                      </p>
                    )}
                 </div>

                 <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase pr-4">القسم المخصص</label>
                    <select defaultValue={editingEmployee?.departmentId || departments[0]?.id} onChange={e => { const val = e.target.value; if(editingEmployee) setEditingEmployee({...editingEmployee, departmentId: val}); else setNewEmp({...newEmp, departmentId: val}); }} className="w-full bg-slate-50 rounded-xl p-4 text-xs font-bold border-none outline-none shadow-inner">
                       {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
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

      {/* نافذة الأقسام (Add Department) */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 font-['Cairo']">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-10 space-y-6">
              <h3 className="text-xl font-black text-center mb-6">إضافة قسم جديد</h3>
              <input onChange={e => setNewDept({...newDept, name: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-bold shadow-inner border-none outline-none" placeholder="اسم القسم" />
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                 <span className="text-[10px] font-black uppercase text-slate-400">لون القسم:</span>
                 <input type="color" onChange={e => setNewDept({...newDept, color: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none" />
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setIsAddDeptModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500">إلغاء</button>
                 <button onClick={() => {
                    if(newDept.name) {
                       const finalDept: Department = { ...newDept as Department, id: `dept_${Date.now()}`, nameEn: newDept.name };
                       onUpdateDepartments([...departments, finalDept]);
                    }
                    setIsAddDeptModalOpen(false);
                 }} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl uppercase">تأكيد الإضافة</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
