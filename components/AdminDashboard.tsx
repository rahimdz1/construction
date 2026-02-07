
import React, { useState, useMemo } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, LayoutGrid, Settings as SettingsIcon, 
  AlertTriangle, Send, QrCode, MapPin, Clock, Edit2, Trash2, 
  Plus, Save, Building, Shield, Layers, Scan,
  LocateFixed, Database, Cpu, CheckCircle2, Image as ImageIcon, Download, 
  Briefcase, Check, Search, ExternalLink, Globe, Palette, X
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
  const [configForm, setConfigForm] = useState(companyConfig);
  
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({ 
    departmentId: departments[0]?.id || 'dept_1', 
    userRole: UserRole.WORKER,
    joinedAt: new Date().toISOString().split('T')[0]
  });
  const [newDept, setNewDept] = useState<Partial<Department>>({ name: '', color: '#3b82f6' });

  const filteredReports = useMemo(() => {
    let list = [...reports];
    if (reportFilter.dept !== 'all') list = list.filter(r => r.departmentId === reportFilter.dept);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reports, reportFilter]);

  const filteredMessages = useMemo(() => {
    if (chatFilterDept === 'all') return chatMessages;
    return chatMessages.filter(m => m.departmentId === chatFilterDept || m.departmentId === 'all');
  }, [chatMessages, chatFilterDept]);

  const handleQRScan = (scannedData: string) => {
    try {
        let id = scannedData;
        if (scannedData.includes('{')) {
           const parsed = JSON.parse(decodeURIComponent(scannedData));
           id = parsed.id;
        }
        const emp = employees.find(e => e.id === id);
        if (emp) {
            setEditingEmployee(emp);
            setShowQRScanner(false);
        } else {
            alert('لم يتم العثور على الموظف في النظام');
        }
    } catch (e) {
        alert('رمز غير صالح');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-['Cairo']" dir="rtl">
      {/* Sidebar - القائمة الجانبية */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-50">
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
             <LogOut size={18} /> <span className="text-[10px] font-black hidden md:block uppercase">تسجيل خروج</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
             <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-[0.2em]">{activeTab} Panel</h2>
             <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live Connection Active
             </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowQRScanner(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md">
                <Scan size={14} /> ماسح QR
             </button>
          </div>
        </header>

        <div className="p-8 flex-1">
          {/* محتوى الرئيسية */}
          {activeTab === 'overview' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   {[
                      { l: 'إجمالي الكادر', v: employees.length, i: Users, c: 'blue' },
                      { l: 'أقسام المؤسسة', v: departments.length, i: Layers, c: 'purple' },
                      { l: 'حاضرون حالياً', v: logs.filter(l => l.type === 'IN').length, i: UserCheck, c: 'emerald' },
                      { l: 'التقارير المرفوعة', v: reports.length, i: FileText, c: 'amber' }
                   ].map((s, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-sm border flex items-center gap-4 border-slate-100">
                         <div className={`p-4 bg-${s.c}-50 text-${s.c}-600 rounded-2xl`}><s.i size={24}/></div>
                         <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.l}</p><p className="text-2xl font-black">{s.v}</p></div>
                      </div>
                   ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white rounded-[3rem] border shadow-sm p-8 border-slate-100">
                      <h3 className="font-black mb-6 flex items-center gap-2 uppercase text-[10px] tracking-widest text-slate-400"><Clock size={18} className="text-blue-600"/> آخر الحركات الميدانية</h3>
                      <div className="space-y-4">
                         {logs.slice(0, 8).map(log => (
                            <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-transparent hover:border-blue-100">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm"><img src={log.photo} className="w-full h-full object-cover" /></div>
                                  <div><p className="text-xs font-bold text-slate-800">{log.name}</p><p className="text-[9px] text-slate-400 uppercase font-black">{log.timestamp} • {log.type === 'IN' ? 'دخول' : 'خروج'}</p></div>
                               </div>
                               <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${log.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{log.status}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                   <div className="bg-white rounded-[3rem] border shadow-sm p-8 border-slate-100">
                      <h3 className="font-black mb-6 flex items-center gap-2 uppercase text-[10px] tracking-widest text-slate-400"><FileText size={18} className="text-amber-600"/> التنبيهات والتقارير العاجلة</h3>
                      <div className="space-y-4">
                        {reports.slice(0, 5).map(r => (
                           <div key={r.id} className="p-5 bg-slate-50 rounded-2xl border-r-4 border-amber-500">
                              <div className="flex justify-between items-start mb-2">
                                 <span className="text-[9px] font-black uppercase text-amber-600">{r.employeeName}</span>
                                 <span className="text-[8px] text-slate-400 font-bold">{new Date(r.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 leading-relaxed truncate">{r.content}</p>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* محتوى الخريطة */}
          {activeTab === 'map' && (
             <div className="h-[75vh] animate-in fade-in space-y-6">
                <div className="h-full rounded-[3.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-white">
                   <MapView logs={logs} />
                </div>
             </div>
          )}

          {/* محتوى الموظفين */}
          {activeTab === 'employees' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800">إدارة الكادر البشري</h3>
                      <p className="text-xs text-slate-400 font-bold">تسجيل وتعديل بيانات الموظفين والعمال الميدانيين</p>
                   </div>
                   <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-[10px] flex items-center gap-2 uppercase shadow-xl hover:bg-blue-700 transition-all active:scale-95">
                      <Plus size={18}/> إضافة موظف جديد
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                   {employees.map(emp => (
                      <div key={emp.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm group hover:border-blue-400 transition-all relative">
                         <div className="flex justify-between mb-6">
                            <img src={emp.avatar || 'https://i.pravatar.cc/150'} className="w-20 h-20 rounded-[2rem] object-cover border-4 border-slate-50 shadow-md" />
                            <div className="flex gap-2 h-fit">
                               <button onClick={() => setEditingEmployee(emp)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                               <button onClick={() => { if(confirm('هل أنت متأكد من حذف الموظف؟')) onUpdateEmployees(employees.filter(e => e.id !== emp.id)) }} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </div>
                         </div>
                         <h4 className="font-bold text-lg text-slate-800">{emp.name}</h4>
                         <p className="text-[10px] text-blue-600 font-black uppercase mb-6 tracking-widest">{emp.role}</p>
                         <div className="space-y-3 pt-4 border-t border-slate-50">
                            <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">رقم الهاتف:</span><span className="text-slate-700">{emp.phone}</span></div>
                            <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">القسم:</span><span className="text-slate-700">{emp.departmentId}</span></div>
                            <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">الوردية:</span><span className="text-slate-700">{emp.shiftStart || '08:00'} - {emp.shiftEnd || '16:00'}</span></div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* محتوى الأقسام */}
          {activeTab === 'departments' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800">هيكلية الأقسام</h3>
                      <p className="text-xs text-slate-400 font-bold">إدارة وتوزيع الفرق والمسؤوليات</p>
                   </div>
                   <button onClick={() => setIsAddDeptModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-[10px] flex items-center gap-2 uppercase shadow-xl hover:bg-blue-700 transition-all">
                      <Plus size={18}/> إضافة قسم
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {departments.map(dept => (
                      <div key={dept.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: dept.color }} />
                         <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl" style={{ backgroundColor: `${dept.color}20`, color: dept.color }}><Layers size={24}/></div>
                            <div><h4 className="font-bold text-slate-800">{dept.name}</h4><p className="text-[9px] text-slate-400 font-black uppercase">{dept.id}</p></div>
                         </div>
                         <div className="flex justify-between items-center mt-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase">الموظفون: {employees.filter(e => e.departmentId === dept.id).length}</span>
                            <button onClick={() => { if(confirm('حذف القسم؟')) onUpdateDepartments(departments.filter(d => d.id !== dept.id)) }} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* محتوى التقارير */}
          {activeTab === 'reports' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-slate-800">الأرشيف الميداني</h3>
                   <select className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none" value={reportFilter.dept} onChange={e => setReportFilter({dept: e.target.value})}>
                      <option value="all">كل الأقسام</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                </div>
                <div className="space-y-4">
                   {filteredReports.map(r => (
                      <div key={r.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 hover:border-blue-200 transition-all">
                         {r.attachmentUrl && <div className="w-full md:w-48 h-32 rounded-3xl overflow-hidden border border-slate-100 shrink-0"><img src={r.attachmentUrl} className="w-full h-full object-cover" /></div>}
                         <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                               <div><h4 className="font-bold text-slate-800">{r.employeeName}</h4><p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{r.departmentId}</p></div>
                               <span className="text-[10px] text-slate-400 font-bold">{new Date(r.timestamp).toLocaleString('ar-EG')}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-600 leading-relaxed">{r.content}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* محتوى الدردشة */}
          {activeTab === 'chat' && (
             <div className="h-[75vh] flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><MessageSquare size={20}/></div>
                      <div><h3 className="font-black text-sm uppercase tracking-widest">غرفة العمليات المركزية</h3><p className="text-[9px] text-slate-400 font-black uppercase">Live System Active</p></div>
                   </div>
                   <select className="bg-white/10 text-white border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none" value={chatFilterDept} onChange={e => setChatFilterDept(e.target.value)}>
                      <option value="all">الكل</option>
                      {departments.map(d => <option key={d.id} value={d.id} className="text-slate-900">{d.name}</option>)}
                   </select>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                   {filteredMessages.map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                         <div className="flex items-center gap-2 mb-1 px-2">
                            <span className="text-[8px] font-black uppercase text-slate-400">{msg.senderName}</span>
                            <span className="text-[8px] font-black uppercase text-blue-600">{msg.departmentId}</span>
                         </div>
                         <div className={`max-w-[70%] p-5 rounded-[2rem] shadow-sm ${msg.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none text-slate-700'}`}>
                            <p className="text-xs font-bold leading-relaxed">{msg.text}</p>
                         </div>
                         <span className="text-[7px] text-slate-300 mt-1 font-black px-2 uppercase">{msg.timestamp}</span>
                      </div>
                   ))}
                </div>
                <div className="p-6 border-t bg-white flex gap-4 shrink-0">
                   <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && chatInput.trim() && (onSendMessage({id: Date.now().toString(), senderId: 'ADMIN', senderName: 'الإدارة', text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: 'all'}), setChatInput(''))} className="flex-1 bg-slate-100 border-none rounded-2xl px-6 py-4 text-xs font-bold shadow-inner focus:ring-2 focus:ring-blue-100 outline-none" placeholder="اكتب تعليمات جديدة هنا..." />
                   <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Date.now().toString(), senderId: 'ADMIN', senderName: 'الإدارة', text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: 'all'}); setChatInput(''); }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all"><Send size={24}/></button>
                </div>
             </div>
          )}

          {/* محتوى الإعدادات */}
          {activeTab === 'settings' && (
             <div className="max-w-2xl animate-in fade-in space-y-8">
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                   <div className="flex items-center gap-4 border-b pb-6">
                      <div className="p-4 bg-slate-900 text-white rounded-2xl"><SettingsIcon size={28}/></div>
                      <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">إعدادات الهوية</h3><p className="text-xs text-slate-400 font-bold">تخصيص واجهة الشركة واللوغو</p></div>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم المنشأة / الشركة</label>
                         <input value={configForm.name} onChange={e => setConfigForm({...configForm, name: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-bold border-none shadow-inner outline-none focus:ring-2 focus:ring-blue-100" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رابط شعار الشركة (Logo URL)</label>
                         <input value={configForm.logo} onChange={e => setConfigForm({...configForm, logo: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-bold border-none shadow-inner outline-none focus:ring-2 focus:ring-blue-100" />
                      </div>
                      <div className="pt-6">
                         <button onClick={async () => { await onUpdateCompanyConfig(configForm); alert('تم حفظ التغييرات بنجاح'); }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                            <Save size={20}/> حفظ التغييرات
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* Modals & Popups */}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} lang={lang} />}
      
      {(editingEmployee || isAddModalOpen) && (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 font-['Cairo']">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 space-y-6 overflow-y-auto max-h-[90vh] relative animate-in zoom-in-95">
              <button onClick={() => { setEditingEmployee(null); setIsAddModalOpen(false); }} className="absolute top-8 left-8 p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
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
                 <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase pr-4">القسم</label>
                    <select value={editingEmployee?.departmentId || newEmp.departmentId} onChange={e => editingEmployee ? setEditingEmployee({...editingEmployee, departmentId: e.target.value}) : setNewEmp({...newEmp, departmentId: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold shadow-inner border-none outline-none focus:ring-2 focus:ring-blue-100">
                       {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                 </div>
              </div>
              <div className="flex gap-4 pt-6">
                 <button onClick={() => {
                    if (editingEmployee) {
                       onUpdateEmployees(employees.map(e => e.id === editingEmployee.id ? editingEmployee : e));
                    } else if (newEmp.name && newEmp.phone) {
                       const finalEmp: Employee = {
                          ...newEmp as Employee,
                          id: `emp_${Date.now()}`,
                          avatar: `https://i.pravatar.cc/150?u=${newEmp.phone}`,
                          isShiftRequired: true,
                          isRegistered: false,
                          password: '123',
                          joinedAt: new Date().toISOString().split('T')[0]
                       };
                       onUpdateEmployees([...employees, finalEmp]);
                    }
                    setEditingEmployee(null);
                    setIsAddModalOpen(false);
                 }} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl uppercase hover:bg-blue-700 transition-all">إتمام العملية وحفظ البيانات</button>
              </div>
           </div>
        </div>
      )}

      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 font-['Cairo']">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-10 space-y-6 relative animate-in zoom-in-95">
              <button onClick={() => setIsAddDeptModalOpen(false)} className="absolute top-8 left-8 p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
              <h3 className="text-xl font-black text-center text-slate-800">إضافة قسم جديد</h3>
              <div className="space-y-4">
                 <input placeholder="اسم القسم" className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold shadow-inner border-none outline-none focus:ring-2 focus:ring-blue-100" onChange={e => setNewDept({...newDept, name: e.target.value})} />
                 <div className="flex items-center gap-4">
                    <label className="text-xs font-bold text-slate-400">لون التعريف:</label>
                    <input type="color" className="w-12 h-12 rounded-xl border-none p-0 cursor-pointer overflow-hidden" value={newDept.color} onChange={e => setNewDept({...newDept, color: e.target.value})} />
                 </div>
              </div>
              <button onClick={() => {
                 if (newDept.name) {
                    onUpdateDepartments([...departments, { ...newDept, id: `dept_${Date.now()}`, nameEn: newDept.name } as Department]);
                    setIsAddDeptModalOpen(false);
                    setNewDept({ name: '', color: '#3b82f6' });
                 }
              }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase">حفظ القسم</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
