
import React, { useState, useMemo } from 'react';
import { 
  Users, Map as MapIcon, FileText, LogOut, MessageSquare, 
  ShieldCheck, UserCheck, LayoutGrid, Settings as SettingsIcon, 
  Plus, Save, Layers, Scan, Clock, Edit2, Trash2, Send, X, Palette
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
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isAddEmpModal, setIsAddEmpModal] = useState(false);
  const [isAddDeptModal, setIsAddDeptModal] = useState(false);
  const [configForm, setConfigForm] = useState(companyConfig);
  const [newDept, setNewDept] = useState({ name: '', color: '#3b82f6' });

  const filteredReports = useMemo(() => {
    let list = [...reports];
    if (reportFilter !== 'all') list = list.filter(r => r.departmentId === reportFilter);
    return list;
  }, [reports, reportFilter]);

  const handleQRScan = (data: string) => {
    const id = data.includes('{') ? JSON.parse(decodeURIComponent(data)).id : data;
    const emp = employees.find(e => e.id === id);
    if (emp) { setEditingEmp(emp); setShowQRScanner(false); }
    else alert('عامل غير مسجل');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-['Cairo']" dir="rtl">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 shrink-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center overflow-hidden">
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
             <LogOut size={18} /> <span className="text-xs font-bold hidden md:block">خروج</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-slate-50">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <h2 className="font-bold text-slate-800 text-xs uppercase tracking-widest">{activeTab} Dashboard</h2>
          <button onClick={() => setShowQRScanner(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 transition-all shadow-md">
            <Scan size={16} /> مسح QR
          </button>
        </header>

        <div className="p-8">
          {/* الرئيسية */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'الموظفون', val: employees.length, icon: Users, color: 'blue' },
                  { label: 'الأقسام', val: departments.length, icon: Layers, color: 'purple' },
                  { label: 'حاضرون حالياً', val: logs.filter(l => l.type === 'IN').length, icon: UserCheck, color: 'emerald' },
                  { label: 'التقارير المرفوعة', val: reports.length, icon: FileText, color: 'amber' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className={`p-4 bg-${s.color}-50 text-${s.color}-600 rounded-2xl`}><s.icon size={24}/></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase">{s.label}</p><p className="text-2xl font-black">{s.val}</p></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-[2.5rem] border shadow-sm p-8">
                <h3 className="font-black text-xs text-slate-400 uppercase mb-6 flex items-center gap-2"><Clock size={16} className="text-blue-600"/> سجل الحركات اللحظي</h3>
                <div className="space-y-4">
                  {logs.slice(0, 8).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                      <div className="flex items-center gap-4">
                        <img src={log.photo} className="w-10 h-10 rounded-xl object-cover shadow-sm border" />
                        <div><p className="text-xs font-bold">{log.name}</p><p className="text-[9px] text-slate-400 uppercase font-black">{log.timestamp} • {log.type === 'IN' ? 'دخول' : 'خروج'}</p></div>
                      </div>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full ${log.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{log.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* الخريطة */}
          {activeTab === 'map' && <div className="h-[75vh] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white"><MapView logs={logs} /></div>}

          {/* الموظفين */}
          {activeTab === 'employees' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">إدارة الكادر</h3>
                <button onClick={() => setIsAddEmpModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg"><Plus size={18}/> إضافة موظف</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(e => (
                  <div key={e.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm group hover:border-blue-400 transition-all">
                    <div className="flex justify-between mb-4">
                      <img src={e.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-md" />
                      <div className="flex gap-1">
                        <button onClick={() => setEditingEmp(e)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={14}/></button>
                        <button onClick={() => confirm('حذف الموظف؟') && onUpdateEmployees(employees.filter(em => em.id !== e.id))} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800">{e.name}</h4>
                    <p className="text-[10px] text-blue-600 font-black uppercase mb-4">{e.role}</p>
                    <div className="pt-4 border-t text-[10px] font-bold text-slate-400 flex justify-between"><span>الهاتف: {e.phone}</span><span>القسم: {e.departmentId}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الأقسام */}
          {activeTab === 'departments' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">هيكلية الأقسام</h3>
                <button onClick={() => setIsAddDeptModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg"><Plus size={18}/> إضافة قسم</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {departments.map(d => (
                  <div key={d.id} className="bg-white p-6 rounded-3xl border relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: d.color }} />
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl" style={{ backgroundColor: `${d.color}20`, color: d.color }}><Layers size={20}/></div>
                      <h4 className="font-bold text-sm">{d.name}</h4>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase">الموظفون: {employees.filter(e => e.departmentId === d.id).length}</span>
                      <button onClick={() => confirm('حذف القسم؟') && onUpdateDepartments(departments.filter(dep => dep.id !== d.id))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* التقارير */}
          {activeTab === 'reports' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">الأرشيف الميداني</h3>
                <select className="bg-white border rounded-xl px-4 py-2 text-xs font-bold outline-none" value={reportFilter} onChange={e => setReportFilter(e.target.value)}>
                  <option value="all">كل الأقسام</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                {filteredReports.map(r => (
                  <div key={r.id} className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col md:flex-row gap-6">
                    {r.attachmentUrl && <div className="w-full md:w-40 h-24 rounded-2xl overflow-hidden shrink-0"><img src={r.attachmentUrl} className="w-full h-full object-cover" /></div>}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800">{r.employeeName} <span className="text-[10px] text-blue-600 ml-2">[{r.departmentId}]</span></h4>
                        <span className="text-[9px] text-slate-400 font-bold">{new Date(r.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">{r.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الدردشة */}
          {activeTab === 'chat' && (
            <div className="h-[70vh] bg-white rounded-[2.5rem] border shadow-xl flex flex-col overflow-hidden animate-in fade-in">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3"><MessageSquare size={20}/><h3 className="font-bold text-sm uppercase tracking-widest">غرفة العمليات المركزية</h3></div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {chatMessages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.senderId === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] p-4 rounded-2xl text-xs font-bold shadow-sm ${m.senderId === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>{m.text}</div>
                    <span className="text-[8px] text-slate-400 mt-1 uppercase px-2">{m.senderName} • {m.timestamp}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t flex gap-3">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && chatInput.trim() && (onSendMessage({ id: Date.now().toString(), senderId: 'ADMIN', senderName: 'الإدارة', text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group' }), setChatInput(''))} className="flex-1 bg-slate-100 rounded-xl px-5 py-3 text-xs font-bold outline-none" placeholder="اكتب تعليماتك هنا..." />
                <button onClick={() => chatInput.trim() && (onSendMessage({ id: Date.now().toString(), senderId: 'ADMIN', senderName: 'الإدارة', text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group' }), setChatInput(''))} className="p-3 bg-blue-600 text-white rounded-xl active:scale-95 transition-all"><Send size={20}/></button>
              </div>
            </div>
          )}

          {/* الإعدادات */}
          {activeTab === 'settings' && (
            <div className="max-w-xl animate-in fade-in">
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-8">
                <h3 className="text-xl font-black flex items-center gap-3"><SettingsIcon className="text-blue-600"/> إعدادات المنظومة</h3>
                <div className="space-y-4">
                  <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">اسم الشركة</label><input value={configForm.name} onChange={e => setConfigForm({...configForm, name: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-xs font-bold border-none" /></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">رابط الشعار</label><input value={configForm.logo} onChange={e => setConfigForm({...configForm, logo: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-xs font-bold border-none" /></div>
                  <button onClick={() => onUpdateCompanyConfig(configForm).then(() => alert('تم الحفظ'))} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-xs uppercase shadow-lg">حفظ التغييرات</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} lang={lang} />}
      
      {(editingEmp || isAddEmpModal) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-center">{isAddEmpModal ? 'إضافة موظف' : 'تعديل موظف'}</h3>
            <div className="space-y-3">
              <input placeholder="الاسم" defaultValue={editingEmp?.name} className="w-full bg-slate-50 p-3 rounded-xl border-none text-xs font-bold" id="emp_name" />
              <input placeholder="الهاتف" defaultValue={editingEmp?.phone} className="w-full bg-slate-50 p-3 rounded-xl border-none text-xs font-bold" id="emp_phone" />
              <select className="w-full bg-slate-50 p-3 rounded-xl border-none text-xs font-bold" id="emp_dept">
                {departments.map(d => <option key={d.id} value={d.id} selected={editingEmp?.departmentId === d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setIsAddEmpModal(false); setEditingEmp(null); }} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-xs">إلغاء</button>
              <button onClick={() => {
                const n = (document.getElementById('emp_name') as HTMLInputElement).value;
                const p = (document.getElementById('emp_phone') as HTMLInputElement).value;
                const d = (document.getElementById('emp_dept') as HTMLSelectElement).value;
                if (editingEmp) onUpdateEmployees(employees.map(e => e.id === editingEmp.id ? { ...e, name: n, phone: p, departmentId: d } : e));
                else onUpdateEmployees([...employees, { id: `e_${Date.now()}`, name: n, phone: p, departmentId: d, avatar: 'https://i.pravatar.cc/150', role: 'موظف', userRole: UserRole.WORKER, isShiftRequired: true }]);
                setIsAddEmpModal(false); setEditingEmp(null);
              }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs">حفظ</button>
            </div>
          </div>
        </div>
      )}

      {isAddDeptModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-center">إضافة قسم</h3>
            <input placeholder="اسم القسم" className="w-full bg-slate-50 p-4 rounded-xl text-xs font-bold" onChange={e => setNewDept({...newDept, name: e.target.value})} />
            <input type="color" className="w-full h-10 rounded-xl border-none" value={newDept.color} onChange={e => setNewDept({...newDept, color: e.target.value})} />
            <button onClick={() => {
              if (newDept.name) onUpdateDepartments([...departments, { id: `d_${Date.now()}`, name: newDept.name, nameEn: newDept.name, color: newDept.color }]);
              setIsAddDeptModal(false);
            }} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xs">حفظ</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
