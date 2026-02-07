
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, Sparkles, RefreshCw, LayoutGrid, 
  Settings as SettingsIcon, AlertTriangle, Loader2, Send, 
  QrCode, MapPin, Clock, Edit2, Trash2, Plus, Save,
  Building, Shield, Download, Printer, Filter, Calendar, Camera,
  UserPlus, CheckCircle2, Image
} from 'lucide-react';
import { 
  LogEntry, Employee, AttendanceStatus, ReportEntry, ChatMessage, 
  Department, Language, CompanyConfig, UserRole, Announcement, FileEntry
} from '../types';
import { TRANSLATIONS, NOTIFICATION_SOUNDS } from '../constants';
import MapView from './MapView';
import { analyzeAttendance } from '../geminiService';

// Fix: Added missing props to the interface to resolve assignment errors in App.tsx
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
  logs, reports, chatMessages, employees, departments,
  companyConfig, lang, onLogout, onSendMessage, onUpdateEmployees, onUpdateCompanyConfig
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'employees' | 'reports' | 'chat' | 'settings'>('overview');
  const [reportFilter, setReportFilter] = useState({ dept: 'all', period: 'all' });
  const [chatFilterDept, setChatFilterDept] = useState<string>('all');
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({ departmentId: 'dept_1', userRole: UserRole.WORKER });

  const t = TRANSLATIONS[lang];

  // فلترة التقارير
  const filteredReports = useMemo(() => {
    let list = [...reports];
    if (reportFilter.dept !== 'all') list = list.filter(r => r.departmentId === reportFilter.dept);
    const now = new Date();
    if (reportFilter.period === 'day') list = list.filter(r => new Date(r.timestamp).toDateString() === now.toDateString());
    if (reportFilter.period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter(r => new Date(r.timestamp) >= weekAgo);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reports, reportFilter]);

  const exportToCSV = () => {
    const headers = ["الموظف", "القسم", "المحتوى", "التاريخ"];
    const rows = filteredReports.map(r => [r.employeeName, r.departmentId, r.content.replace(/,/g, ' '), new Date(r.timestamp).toLocaleString()]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reports_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateCompanyConfig({ ...companyConfig, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEmployeeLocation = (empId: string, lat: number, lng: number) => {
    const updated = employees.map(e => e.id === empId ? { ...e, workplaceLat: lat, workplaceLng: lng } : e);
    onUpdateEmployees(updated);
    alert('تم تحديث موقع العمل للعامل بنجاح');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={24} />}
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
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={18} /> 
              <span className="text-[10px] font-bold hidden md:block uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="p-8 text-red-400 flex items-center gap-3 hover:text-red-300 transition-colors"><LogOut size={18}/> <span className="hidden md:block text-xs font-bold">خروج</span></button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm print:hidden">
          <h2 className="font-bold text-slate-800 text-xs uppercase tracking-widest">{activeTab} Panel</h2>
          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
             <UserCheck size={16} />
             <span className="text-[10px] font-bold">المسؤول الرئيسي</span>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">إجمالي العمال</p>
                      <p className="text-3xl font-bold text-slate-800">{employees.length}</p>
                   </div>
                   <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase mb-2">حضور اليوم</p>
                      <p className="text-3xl font-bold text-emerald-600">{logs.filter(l => l.type === 'IN').length}</p>
                   </div>
                   <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                      <p className="text-[10px] font-bold text-amber-400 uppercase mb-2">تنبيهات الموقع</p>
                      <p className="text-3xl font-bold text-amber-600">{logs.filter(l => l.status === AttendanceStatus.OUT_OF_BOUNDS).length}</p>
                   </div>
                   <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                      <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">التقارير الجديدة</p>
                      <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
                   </div>
                </div>

                <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden">
                   <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-sm flex items-center gap-2"><Clock size={18} className="text-blue-600" /> سجل الحضور المباشر</h3>
                      <button className="text-[10px] font-bold text-blue-600 hover:underline">عرض الكل</button>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-right">
                         <thead>
                            <tr className="text-[10px] text-slate-400 uppercase border-b bg-slate-50/50">
                               <th className="px-6 py-4">العامل</th>
                               <th className="px-6 py-4">القسم</th>
                               <th className="px-6 py-4">النوع</th>
                               <th className="px-6 py-4">الوقت</th>
                               <th className="px-6 py-4">الحالة</th>
                            </tr>
                         </thead>
                         <tbody className="text-[11px] font-bold text-slate-700">
                            {logs.slice(0, 10).map(log => (
                               <tr key={log.id} className="border-b hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 flex items-center gap-3">
                                     <img src={log.photo} className="w-8 h-8 rounded-lg object-cover" />
                                     <span>{log.name}</span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-400">{log.departmentId}</td>
                                  <td className="px-6 py-4">{log.type === 'IN' ? 'دخول' : 'خروج'}</td>
                                  <td className="px-6 py-4">{log.timestamp}</td>
                                  <td className="px-6 py-4">
                                     <span className={`px-2 py-1 rounded-full text-[9px] ${log.status === AttendanceStatus.PRESENT ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{log.status}</span>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border shadow-sm print:hidden">
                  <div className="flex gap-4">
                     <select value={reportFilter.dept} onChange={e => setReportFilter({...reportFilter, dept: e.target.value})} className="bg-slate-50 border-none rounded-xl text-[10px] font-bold px-4 py-3 outline-none ring-1 ring-slate-200">
                        <option value="all">كل الأقسام</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                     </select>
                     <select value={reportFilter.period} onChange={e => setReportFilter({...reportFilter, period: e.target.value})} className="bg-slate-50 border-none rounded-xl text-[10px] font-bold px-4 py-3 outline-none ring-1 ring-slate-200">
                        <option value="all">كل الأوقات</option>
                        <option value="day">اليوم</option>
                        <option value="week">هذا الأسبوع</option>
                        <option value="month">هذا الشهر</option>
                     </select>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => window.print()} className="bg-white border-2 border-slate-200 text-slate-600 font-bold px-6 py-3 rounded-xl text-[10px] flex items-center gap-2 hover:bg-slate-50"><Printer size={16}/> طباعة</button>
                     <button onClick={exportToCSV} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-[10px] flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100"><Download size={16}/> تحميل CSV</button>
                  </div>
               </div>

               <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 print:hidden">
                  <AlertTriangle size={18} />
                  <p className="text-[10px] font-bold">تنبيه: يتم أرشفة وحذف التقارير تلقائياً كل 30 يوماً لضمان سرعة النظام وتوفير مساحة التخزين.</p>
               </div>

               <div className="bg-white rounded-[3rem] border shadow-xl overflow-hidden print:shadow-none print:border-none">
                  <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                     <h3 className="font-bold text-lg">سجل التقارير الميدانية</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">{filteredReports.length} تقرير متاح</p>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-right border-collapse">
                        <thead>
                           <tr className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase">
                              <th className="px-8 py-5 border-b">الموظف</th>
                              <th className="px-8 py-5 border-b">القسم</th>
                              <th className="px-8 py-5 border-b">محتوى التقرير</th>
                              <th className="px-8 py-5 border-b">التاريخ والوقت</th>
                           </tr>
                        </thead>
                        <tbody className="text-[11px] font-bold text-slate-700">
                           {filteredReports.map(r => (
                              <tr key={r.id} className="border-b hover:bg-slate-50 transition-colors">
                                 <td className="px-8 py-6">{r.employeeName}</td>
                                 <td className="px-8 py-6 text-blue-600">{r.departmentId}</td>
                                 <td className="px-8 py-6 max-w-md truncate">{r.content}</td>
                                 <td className="px-8 py-6 text-slate-400">{new Date(r.timestamp).toLocaleString('ar-EG')}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'employees' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-bold flex items-center gap-3"><Users className="text-blue-600"/> إدارة القوى العاملة</h3>
                   <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-[10px] flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 uppercase tracking-widest"><UserPlus size={18}/> إضافة عامل جديد</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {employees.map(emp => (
                      <div key={emp.id} className="bg-white p-8 rounded-[3rem] border shadow-sm group hover:border-blue-400 transition-all relative overflow-hidden">
                         <div className="flex items-start justify-between mb-6">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform"><img src={emp.avatar} className="w-full h-full object-cover" /></div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => setEditingEmployee(emp)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                               <button onClick={() => { if(confirm('حذف العامل؟')) onUpdateEmployees(employees.filter(e => e.id !== emp.id)) }} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </div>
                         </div>
                         <h4 className="font-bold text-lg text-slate-800">{emp.name}</h4>
                         <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-4">{emp.role}</p>
                         <div className="space-y-2 border-t pt-4">
                            <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400 uppercase">القسم:</span><span>{emp.departmentId}</span></div>
                            <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400 uppercase">انضم في:</span><span>{emp.joinedAt || '2024/01/01'}</span></div>
                            <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400 uppercase">الموقع:</span><span className="truncate max-w-[120px]">{emp.workplace || 'غير محدد'}</span></div>
                         </div>
                         <div className="mt-6 flex gap-2">
                            <button onClick={() => {
                               const lat = prompt('خط العرض (Latitude):', '24.7136');
                               const lng = prompt('خط الطول (Longitude):', '46.6753');
                               if(lat && lng) handleSaveEmployeeLocation(emp.id, parseFloat(lat), parseFloat(lng));
                            }} className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors">تحديد الموقع</button>
                            {emp.userRole !== UserRole.DEPT_HEAD && (
                               <button onClick={() => onUpdateEmployees(employees.map(e => e.id === emp.id ? {...e, userRole: UserRole.DEPT_HEAD} : e))} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors">تعيين رئيس</button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-3xl space-y-8 animate-in fade-in">
                <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-8">
                   <h3 className="text-xl font-bold flex items-center gap-3"><Building size={22} className="text-blue-600" /> إعدادات الشركة الرئيسية</h3>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">اسم المنظمة</label>
                         <input value={companyConfig.name} onChange={e => onUpdateCompanyConfig({...companyConfig, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold shadow-inner outline-none ring-1 ring-slate-100" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">شعار الشركة (Logo)</label>
                         <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                               {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-contain" /> : <Image size={32} className="text-slate-300"/>}
                            </div>
                            <label className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-[10px] cursor-pointer hover:bg-blue-700 transition-colors uppercase tracking-widest">
                               <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                               تحميل شعار جديد
                            </label>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm space-y-6">
                   <h3 className="text-xl font-bold flex items-center gap-3"><Shield size={22} className="text-emerald-600" /> سياسات النظام</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem]">
                         <div>
                            <p className="text-sm font-bold text-slate-800">الأرشفة التلقائية</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">حذف السجلات الأقدم من 30 يوماً</p>
                         </div>
                         <div className="w-12 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div></div>
                      </div>
                      <div className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem]">
                         <div>
                            <p className="text-sm font-bold text-slate-800">تحقق GPS الصارم</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">منع الحضور خارج نطاق العمل</p>
                         </div>
                         <div className="w-12 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div></div>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 space-y-6">
              <h3 className="text-2xl font-bold text-center mb-6">تعديل بيانات العامل</h3>
              <div className="space-y-4">
                 <input defaultValue={editingEmployee.name} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" placeholder="الاسم" id="edit_name" />
                 <input defaultValue={editingEmployee.joinedAt || '2024/01/01'} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" placeholder="تاريخ الالتحاق" id="edit_joined" />
                 <input defaultValue={editingEmployee.role} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" placeholder="المسمى الوظيفي" id="edit_role" />
                 <select defaultValue={editingEmployee.departmentId} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" id="edit_dept">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                 </select>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setEditingEmployee(null)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-bold">إلغاء</button>
                 <button onClick={() => {
                    const name = (document.getElementById('edit_name') as HTMLInputElement).value;
                    const role = (document.getElementById('edit_role') as HTMLInputElement).value;
                    const joinedAt = (document.getElementById('edit_joined') as HTMLInputElement).value;
                    const departmentId = (document.getElementById('edit_dept') as HTMLSelectElement).value;
                    onUpdateEmployees(employees.map(e => e.id === editingEmployee.id ? {...e, name, role, joinedAt, departmentId} : e));
                    setEditingEmployee(null);
                 }} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-xl">حفظ التغييرات</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 space-y-6">
              <h3 className="text-2xl font-bold text-center mb-6">إضافة عضو جديد للفريق</h3>
              <div className="grid grid-cols-2 gap-4">
                 <input placeholder="الاسم الكامل" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="col-span-2 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" />
                 <input placeholder="رقم الهاتف" value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" />
                 <input placeholder="تاريخ الالتحاق" value={newEmp.joinedAt} onChange={e => setNewEmp({...newEmp, joinedAt: e.target.value})} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" />
                 <input placeholder="الموقع" value={newEmp.workplace} onChange={e => setNewEmp({...newEmp, workplace: e.target.value})} className="col-span-2 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner" />
                 <select value={newEmp.departmentId} onChange={e => setNewEmp({...newEmp, departmentId: e.target.value})} className="col-span-2 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                 </select>
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-bold">إلغاء</button>
                 <button onClick={() => {
                    if(!newEmp.name || !newEmp.phone) return;
                    const emp: Employee = {
                       id: Math.random().toString(36).substr(2, 9),
                       name: newEmp.name!,
                       phone: newEmp.phone!,
                       role: 'موظف',
                       joinedAt: newEmp.joinedAt || new Date().toISOString().split('T')[0],
                       userRole: UserRole.WORKER,
                       departmentId: newEmp.departmentId || 'dept_1',
                       avatar: `https://i.pravatar.cc/150?u=${newEmp.phone}`,
                       isShiftRequired: true,
                       shiftStart: '08:00',
                       shiftEnd: '16:00',
                       workplace: newEmp.workplace || 'الموقع الرئيسي',
                       isRegistered: true,
                       password: '123'
                    };
                    onUpdateEmployees([...employees, emp]);
                    setIsAddModalOpen(false);
                    setNewEmp({ departmentId: 'dept_1', userRole: UserRole.WORKER });
                 }} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100">تأكيد الإضافة</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
