
import React, { useState, useMemo } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, LayoutGrid, Settings as SettingsIcon, 
  Plus, Save, Layers, Scan, Clock, Edit2, Trash2, Send, X, Palette,
  UserPlus, UserMinus, Crown, Check, ChevronLeft
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
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'departments' | 'reports' | 'chat' | 'settings'>('overview');
  const [reportFilter, setReportFilter] = useState('all');
  const [chatInput, setChatInput] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Modals state
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isAddEmpModal, setIsAddEmpModal] = useState(false);
  const [isAddDeptModal, setIsAddDeptModal] = useState(false);
  const [manageDept, setManageDept] = useState<Department | null>(null);
  const [configForm, setConfigForm] = useState(companyConfig);

  const filteredReports = useMemo(() => {
    let list = [...reports];
    if (reportFilter !== 'all') list = list.filter(r => r.departmentId === reportFilter);
    return list;
  }, [reports, reportFilter]);

  const handleQRScan = (data: string) => {
    try {
      const id = data.includes('{') ? JSON.parse(decodeURIComponent(data)).id : data;
      const emp = employees.find(e => e.id === id);
      if (emp) { setEditingEmp(emp); setShowQRScanner(false); }
      else alert('عامل غير مسجل');
    } catch (e) {
      alert('رمز QR غير صالح');
    }
  };

  // Helper to get employees of a department
  const getDeptEmployees = (deptId: string) => employees.filter(e => e.departmentId === deptId);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-['Cairo']" dir="rtl">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-50 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={24} />}
          </div>
          <span className="font-bold text-xs hidden md:block truncate uppercase tracking-widest">{companyConfig.name}</span>
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
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={18} /> <span className="text-xs font-bold hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
           <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors">
             <LogOut size={18} /> <span className="text-xs font-bold hidden md:block tracking-widest uppercase">خروج</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-slate-50 relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <h2 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em]">{activeTab} Panel</h2>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowQRScanner(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                <Scan size={14} /> مسح البطاقة (QR)
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
                  { label: 'المتواجدون حالياً', val: logs.filter(l => l.type === 'IN').length, icon: UserCheck, color: 'emerald' },
                  { label: 'التقارير المرفوعة', val: reports.length, icon: FileText, color: 'amber' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className={`p-4 bg-${s.color}-50 text-${s.color}-600 rounded-2xl shadow-inner`}><s.icon size={24}/></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p><p className="text-2xl font-black text-slate-800">{s.val}</p></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-[3rem] border shadow-sm p-8 border-slate-100">
                <h3 className="font-black text-[11px] text-slate-400 uppercase mb-8 flex items-center gap-3 tracking-[0.2em]"><Clock size={18} className="text-blue-600"/> سجل الحركات الميدانية المباشر</h3>
                <div className="space-y-4">
                  {logs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-5 bg-slate-50/50 border border-transparent hover:border-blue-100 rounded-3xl hover:bg-white transition-all shadow-sm group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                          <img src={log.photo} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{log.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">{log.timestamp} • {log.type === 'IN' ? 'تسجيل دخول' : 'تسجيل انصراف'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${log.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">لا توجد حركات مسجلة اليوم</p>}
                </div>
              </div>
            </div>
          )}

          {/* 2. Map View */}
          {activeTab === 'map' && (
            <div className="h-[75vh] bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white animate-in zoom-in-95">
              <MapView logs={logs} />
            </div>
          )}

          {/* 3. Employees Management */}
          {activeTab === 'employees' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex justify-between items-center bg-white/50 p-6 rounded-[2.5rem] backdrop-blur-sm border border-white">
                <div>
                   <h3 className="text-2xl font-black text-slate-800">إدارة الموارد البشرية</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">عرض وتعديل بيانات الطاقم الميداني</p>
                </div>
                <button onClick={() => setIsAddEmpModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] flex items-center gap-2 uppercase shadow-xl hover:bg-blue-700 transition-all active:scale-95">
                   <Plus size={18}/> إضافة موظف جديد
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {employees.map(e => (
                  <div key={e.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm group hover:border-blue-400 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: departments.find(d => d.id === e.departmentId)?.color || '#ccc' }} />
                    <div className="flex justify-between mb-6">
                      <div className="w-20 h-20 rounded-[2rem] overflow-hidden shadow-lg border-4 border-slate-50 group-hover:scale-105 transition-transform">
                        <img src={e.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-2 h-fit">
                        <button onClick={() => setEditingEmp(e)} className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                        <button onClick={() => confirm(`هل أنت متأكد من حذف ${e.name}؟`) && onUpdateEmployees(employees.filter(em => em.id !== e.id))} className="p-3.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <h4 className="font-bold text-lg text-slate-800">{e.name}</h4>
                    <p className="text-[10px] text-blue-600 font-black uppercase mb-6 tracking-widest">{e.role}</p>
                    <div className="pt-6 border-t border-slate-50 space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">الهاتف:</span><span className="text-slate-700">{e.phone}</span></div>
                      <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">القسم:</span><span className="text-slate-700 font-bold" style={{ color: departments.find(d => d.id === e.departmentId)?.color }}>{departments.find(d => d.id === e.departmentId)?.name || 'غير محدد'}</span></div>
                      <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">تاريخ الانضمام:</span><span className="text-slate-700">{e.joinedAt || '-'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Departments Management (Revamped) */}
          {activeTab === 'departments' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center bg-white/50 p-6 rounded-[2.5rem] backdrop-blur-sm border border-white">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">هيكلية الأقسام</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تعديل المسميات، تعيين المسؤولين، وإدارة الفرق</p>
                </div>
                <button onClick={() => setIsAddDeptModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] flex items-center gap-2 uppercase shadow-xl hover:bg-blue-700 transition-all">
                  <Plus size={18}/> إضافة قسم جديد
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {departments.map(d => {
                  const deptWorkers = getDeptEmployees(d.id);
                  const head = employees.find(e => e.id === d.headId);
                  return (
                    <div key={d.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
                      <div className="absolute top-0 right-0 w-3 h-full" style={{ backgroundColor: d.color }} />
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <div className="p-4 rounded-2xl shadow-inner" style={{ backgroundColor: `${d.color}15`, color: d.color }}><Layers size={28}/></div>
                           <div>
                             <h4 className="font-black text-lg text-slate-800">{d.name}</h4>
                             <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{d.id}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => setManageDept(d)} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit2 size={16}/></button>
                           <button onClick={() => confirm(`حذف قسم ${d.name}؟ سيبقى العمال بدون قسم.`) && onUpdateDepartments(departments.filter(dep => dep.id !== d.id))} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Crown size={12} className="text-amber-500"/> مسؤول القسم (Head)</p>
                           {head ? (
                             <div className="flex items-center gap-3">
                               <img src={head.avatar} className="w-8 h-8 rounded-lg object-cover border" />
                               <span className="text-xs font-bold text-slate-800">{head.name}</span>
                             </div>
                           ) : (
                             <p className="text-[10px] font-bold text-slate-400 italic">لم يتم تعيين مسؤول</p>
                           )}
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span className="text-slate-400">عدد العمال:</span>
                          <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-700">{deptWorkers.length}</span>
                        </div>

                        <div className="flex -space-x-2 rtl:space-x-reverse overflow-hidden">
                          {deptWorkers.slice(0, 5).map(e => (
                             <img key={e.id} src={e.avatar} className="w-8 h-8 rounded-full border-2 border-white object-cover" title={e.name} />
                          ))}
                          {deptWorkers.length > 5 && (
                             <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">+{deptWorkers.length - 5}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Reports Archive */}
          {activeTab === 'reports' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border shadow-sm">
                <div>
                   <h3 className="text-2xl font-black text-slate-800">الأرشيف الميداني</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">سجلات التقارير والصور المرفوعة من العمال</p>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تصفية:</span>
                   <select className="bg-slate-50 border-none rounded-2xl px-6 py-3 text-xs font-bold outline-none shadow-inner focus:ring-2 focus:ring-blue-100" value={reportFilter} onChange={e => setReportFilter(e.target.value)}>
                      <option value="all">كافة الأقسام</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                </div>
              </div>
              <div className="space-y-6">
                {filteredReports.map(r => (
                  <div key={r.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 hover:border-blue-200 transition-all group">
                    {r.attachmentUrl && (
                      <div className="w-full md:w-56 h-40 rounded-[2.5rem] overflow-hidden shrink-0 border-4 border-slate-50 shadow-md">
                        <img src={r.attachmentUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-between py-2">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-slate-800">{r.employeeName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full text-white" style={{ backgroundColor: departments.find(d => d.id === r.departmentId)?.color }}>{departments.find(d => d.id === r.departmentId)?.name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(r.timestamp).toLocaleDateString('ar-EG')}</p>
                             <p className="text-[10px] text-slate-300 font-black">{new Date(r.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] text-sm font-bold text-slate-600 leading-relaxed border border-slate-100">
                           {r.content}
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end gap-3">
                         <button className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1"><Check size={14}/> تم الاطلاع</button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredReports.length === 0 && (
                   <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                      <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">لا توجد تقارير لهذا القسم حالياً</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {/* 6. Central Chat */}
          {activeTab === 'chat' && (
            <div className="h-[75vh] bg-white rounded-[3.5rem] border shadow-2xl flex flex-col overflow-hidden animate-in fade-in">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg relative z-10">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20"><MessageSquare size={28}/></div>
                   <div>
                      <h3 className="font-black text-lg uppercase tracking-widest">غرفة العمليات المركزية</h3>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Global Broadcast System</p>
                   </div>
                </div>
                <div className="hidden md:flex items-center gap-3">
                   <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Sync Active</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50/50 scroll-smooth">
                {chatMessages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-4">
                       <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{m.senderName}</span>
                       <span className="text-[8px] font-black uppercase text-blue-400">[{m.departmentId === 'all' ? 'الكل' : m.departmentId}]</span>
                    </div>
                    <div className={`max-w-[75%] p-6 rounded-[2.5rem] text-sm font-bold shadow-sm leading-relaxed transition-all hover:shadow-md ${m.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none text-slate-700'}`}>
                       {m.text}
                    </div>
                    <span className="text-[8px] text-slate-300 mt-2 font-black px-4 uppercase tracking-tighter">{m.timestamp}</span>
                  </div>
                ))}
              </div>
              <div className="p-8 border-t bg-white flex gap-5 shrink-0 items-center">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && chatInput.trim() && (onSendMessage({ id: Date.now().toString(), senderId: 'ADMIN', senderName: 'الإدارة العليا', text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: 'all' }), setChatInput(''))} className="flex-1 bg-slate-50 border-none rounded-3xl px-8 py-5 text-sm font-bold shadow-inner focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-300 transition-all" placeholder="اكتب تعليمات جديدة لجميع الأقسام..." />
                <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({ id: Date.now().toString(), senderId: 'ADMIN', senderName: 'الإدارة العليا', text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: 'all' }); setChatInput(''); }} className="p-5 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-90 transition-all"><Send size={24}/></button>
              </div>
            </div>
          )}

          {/* 7. Settings */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl animate-in fade-in space-y-8">
              <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl space-y-10">
                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                  <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-lg"><SettingsIcon size={32}/></div>
                  <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">إعدادات المنظومة</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">تخصيص الهوية والتحكم بالصلاحيات</p></div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">اسم المنشأة الرسمية</label>
                    <input value={configForm.name} onChange={e => setConfigForm({...configForm, name: e.target.value})} className="w-full bg-slate-50 rounded-3xl p-6 text-sm font-bold border-none shadow-inner outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mr-4">رابط الشعار (URL)</label>
                    <input value={configForm.logo} onChange={e => setConfigForm({...configForm, logo: e.target.value})} className="w-full bg-slate-50 rounded-3xl p-6 text-sm font-bold border-none shadow-inner outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                  </div>
                  <div className="pt-6">
                    <button onClick={async () => { await onUpdateCompanyConfig(configForm); alert('تم حفظ الإعدادات الجديدة بنجاح'); }} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xs uppercase shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                      <Save size={24}/> حفظ كافة التغييرات
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}
      
      {/* 1. QR Scanner Modal */}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} lang={lang} />}
      
      {/* 2. Employee Modal (Add/Edit) */}
      {(editingEmp || isAddEmpModal) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 font-['Cairo']">
          <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-2xl p-12 space-y-8 overflow-y-auto max-h-[90vh] relative animate-in zoom-in-95">
            <button onClick={() => { setIsAddEmpModal(false); setEditingEmp(null); }} className="absolute top-10 left-10 p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={28}/></button>
            <h3 className="text-2xl font-black text-center text-slate-800 uppercase tracking-tight">{isAddEmpModal ? 'تسجيل موظف جديد' : 'تحديث ملف الموظف'}</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">الاسم الكامل</label>
                <input id="mod_emp_name" placeholder="الاسم الرباعي" defaultValue={editingEmp?.name} className="w-full bg-slate-50 p-5 rounded-3xl border-none text-sm font-bold shadow-inner focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">رقم الهاتف</label>
                  <input id="mod_emp_phone" placeholder="05XXXXXXXX" defaultValue={editingEmp?.phone} className="w-full bg-slate-50 p-5 rounded-3xl border-none text-sm font-bold shadow-inner focus:ring-2 focus:ring-blue-100 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">المسمى الوظيفي</label>
                  <input id="mod_emp_role" placeholder="عامل صيانة، مهندس..." defaultValue={editingEmp?.role} className="w-full bg-slate-50 p-5 rounded-3xl border-none text-sm font-bold shadow-inner focus:ring-2 focus:ring-blue-100 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">القسم الميداني</label>
                <select id="mod_emp_dept" defaultValue={editingEmp?.departmentId} className="w-full bg-slate-50 p-5 rounded-3xl border-none text-sm font-bold shadow-inner focus:ring-2 focus:ring-blue-100 outline-none">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <button onClick={() => { setIsAddEmpModal(false); setEditingEmp(null); }} className="flex-1 py-5 bg-slate-100 rounded-3xl font-black text-xs uppercase text-slate-500 hover:bg-slate-200 transition-all">إلغاء</button>
              <button onClick={() => {
                const name = (document.getElementById('mod_emp_name') as HTMLInputElement).value;
                const phone = (document.getElementById('mod_emp_phone') as HTMLInputElement).value;
                const role = (document.getElementById('mod_emp_role') as HTMLInputElement).value;
                const deptId = (document.getElementById('mod_emp_dept') as HTMLSelectElement).value;
                if (!name || !phone) { alert('يرجى ملء كافة البيانات'); return; }
                
                if (editingEmp) {
                  onUpdateEmployees(employees.map(e => e.id === editingEmp.id ? { ...e, name, phone, role, departmentId: deptId } : e));
                } else {
                  onUpdateEmployees([...employees, { 
                    id: `emp_${Date.now()}`, name, phone, role, departmentId: deptId, 
                    avatar: `https://i.pravatar.cc/150?u=${phone}`, userRole: UserRole.WORKER, isShiftRequired: true, joinedAt: new Date().toISOString().split('T')[0] 
                  }]);
                }
                setIsAddEmpModal(false); setEditingEmp(null);
              }} className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase shadow-2xl hover:bg-blue-700 transition-all active:scale-95">حفظ البيانات</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manage Department Modal (Comprehensive) */}
      {manageDept && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 font-['Cairo']">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl p-12 space-y-10 overflow-y-auto max-h-[90vh] relative animate-in slide-in-from-bottom-10">
            <button onClick={() => setManageDept(null)} className="absolute top-10 left-10 p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={28}/></button>
            
            <div className="flex items-center gap-5 border-b pb-8">
               <div className="p-5 rounded-3xl shadow-inner" style={{ backgroundColor: `${manageDept.color}15`, color: manageDept.color }}><Layers size={36}/></div>
               <div>
                 <h3 className="text-2xl font-black text-slate-800">إعدادات {manageDept.name}</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تخصيص الهوية والمسؤولين وفريق العمل</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* القسم الأيمن: الخصائص */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">اسم القسم</label>
                  <input value={manageDept.name} onChange={e => setManageDept({...manageDept, name: e.target.value})} className="w-full bg-slate-50 p-5 rounded-3xl border-none text-sm font-bold shadow-inner focus:ring-2 focus:ring-blue-100 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">لون التمييز</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-3xl shadow-inner border border-slate-100">
                    <input type="color" value={manageDept.color} onChange={e => setManageDept({...manageDept, color: e.target.value})} className="w-14 h-14 rounded-2xl border-none p-0 cursor-pointer overflow-hidden bg-transparent" />
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase">{manageDept.color}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">رئيس القسم (Supervisor)</label>
                  <select value={manageDept.headId || ''} onChange={e => setManageDept({...manageDept, headId: e.target.value})} className="w-full bg-slate-50 p-5 rounded-3xl border-none text-sm font-bold shadow-inner focus:ring-2 focus:ring-blue-100 outline-none">
                    <option value="">-- تعيين مسؤول --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                  </select>
                </div>
              </div>

              {/* القسم الأيسر: إدارة العمال */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">طاقم القسم الحالي ({getDeptEmployees(manageDept.id).length})</p>
                </div>
                <div className="bg-slate-50 rounded-[2.5rem] p-6 max-h-[300px] overflow-y-auto space-y-3 shadow-inner border border-slate-100">
                   {getDeptEmployees(manageDept.id).map(e => (
                     <div key={e.id} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-slate-50 group/item">
                        <div className="flex items-center gap-3">
                           <img src={e.avatar} className="w-8 h-8 rounded-lg object-cover" />
                           <span className="text-xs font-bold text-slate-700">{e.name}</span>
                        </div>
                        <button onClick={() => {
                           if(confirm(`إخراج ${e.name} من هذا القسم؟`)) {
                              onUpdateEmployees(employees.map(emp => emp.id === e.id ? { ...emp, departmentId: 'all' } : emp));
                           }
                        }} className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover/item:opacity-100 transition-opacity"><UserMinus size={16}/></button>
                     </div>
                   ))}
                   {getDeptEmployees(manageDept.id).length === 0 && <p className="text-center py-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">لا يوجد عمال في هذا القسم</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">إضافة عامل للقسم</label>
                  <select onChange={e => {
                     const val = e.target.value;
                     if(val) {
                        onUpdateEmployees(employees.map(emp => emp.id === val ? { ...emp, departmentId: manageDept.id } : emp));
                        e.target.value = '';
                     }
                  }} className="w-full bg-slate-100 p-5 rounded-3xl border-none text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">-- اختر عاملاً لنقله هنا --</option>
                    {employees.filter(e => e.departmentId !== manageDept.id).map(e => <option key={e.id} value={e.id}>{e.name} ({e.departmentId})</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-10 border-t border-slate-50">
               <button onClick={() => setManageDept(null)} className="flex-1 py-5 bg-slate-100 rounded-[2.5rem] font-black text-xs uppercase text-slate-500 hover:bg-slate-200 transition-all">إغلاق</button>
               <button onClick={async () => {
                  await onUpdateDepartments(departments.map(d => d.id === manageDept.id ? manageDept : d));
                  setManageDept(null);
                  alert('تم تحديث بيانات القسم بنجاح');
               }} className="flex-1 py-5 bg-blue-600 text-white rounded-[2.5rem] font-black text-xs uppercase shadow-2xl hover:bg-blue-700 transition-all shadow-blue-500/30">حفظ الإعدادات النهائية</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Department Modal */}
      {isAddDeptModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 font-['Cairo']">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-12 space-y-8 relative animate-in zoom-in-95">
              <button onClick={() => setIsAddDeptModal(false)} className="absolute top-8 left-8 p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
              <h3 className="text-xl font-black text-center text-slate-800 uppercase tracking-tight">إضافة قسم جديد</h3>
              <div className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">اسم القسم</label>
                    <input id="new_dept_name" placeholder="مثلاً: قسم النجارة" className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-bold shadow-inner border-none outline-none focus:ring-2 focus:ring-blue-100" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">لون التعريف</label>
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border">
                       <input id="new_dept_color" type="color" defaultValue="#3b82f6" className="w-12 h-12 rounded-xl border-none p-0 cursor-pointer" />
                       <span className="text-[10px] font-black text-slate-400">اختر لوناً مميزاً</span>
                    </div>
                 </div>
              </div>
              <button onClick={async () => {
                 const name = (document.getElementById('new_dept_name') as HTMLInputElement).value;
                 const color = (document.getElementById('new_dept_color') as HTMLInputElement).value;
                 if(!name) { alert('يرجى كتابة اسم القسم'); return; }
                 
                 const newD: Department = { id: `dept_${Date.now()}`, name, nameEn: name, color };
                 await onUpdateDepartments([...departments, newD]);
                 setIsAddDeptModal(false);
              }} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl hover:bg-blue-700 transition-all active:scale-95">إضافة القسم للمنظومة</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
