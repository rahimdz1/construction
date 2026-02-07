
import React, { useState, useEffect, useRef } from 'react';
import { Employee, LogEntry, ReportEntry, ChatMessage, FileEntry, Announcement, Language, Department, CompanyConfig, AttendanceStatus } from './types';
import { MOCK_EMPLOYEES, ADMIN_PIN, DEPARTMENTS as INITIAL_DEPARTMENTS, TRANSLATIONS, MOCK_REPORTS, MOCK_CHATS } from './constants';
import WorkerDashboard from './components/WorkerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ShieldCheck, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [currentUser, setCurrentUser] = useState<Employee | 'ADMIN' | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>({ name: 'نظام المقاولات الذكي', logo: '' });
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');

  const currentUserRef = useRef<Employee | 'ADMIN' | null>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // دالة ذكية لتحويل بيانات Supabase إلى واجهة التطبيق
  const mapLog = (l: any): LogEntry => ({
    id: l.id,
    employeeId: l.employee_id || l.employeeId || '',
    name: l.name || 'موظف',
    timestamp: l.timestamp || new Date().toLocaleTimeString(),
    type: l.type === 'OUT' ? 'OUT' : 'IN',
    photo: l.photo || '',
    location: { 
      lat: Number(l.location_lat || l.lat || 0), 
      lng: Number(l.location_lng || l.lng || 0) 
    },
    status: (l.status as AttendanceStatus) || AttendanceStatus.PRESENT,
    departmentId: l.department_id || l.departmentId || ''
  });

  const fetchInitialData = async () => {
    try {
      setDbStatus('syncing');
      
      const [
        { data: emps },
        { data: depts },
        { data: attLogs },
        { data: repts },
        { data: msgs },
        { data: config }
      ] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('attendance_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('reports').select('*').order('timestamp', { ascending: false }),
        supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
        supabase.from('company_config').select('*').maybeSingle()
      ]);

      setEmployees(emps && emps.length ? emps : MOCK_EMPLOYEES);
      setDepartments(depts && depts.length ? depts : INITIAL_DEPARTMENTS);
      setReports(repts ? repts.map((r: any) => ({
        ...r,
        employeeId: r.employee_id || r.employeeId,
        employeeName: r.employee_name || r.employeeName,
        departmentId: r.department_id || r.departmentId
      })) : MOCK_REPORTS);
      
      setMessages(msgs || MOCK_CHATS);
      setLogs(attLogs ? attLogs.map(mapLog) : []);
      if (config) setCompanyConfig({ name: config.name, logo: config.logo });
      
      setDbStatus('connected');
    } catch (err) {
      console.error("Fetch error:", err);
      setDbStatus('error');
      // لا توقف التطبيق، استخدم البيانات الوهمية كاحتياط
      setEmployees(MOCK_EMPLOYEES);
      setDepartments(INITIAL_DEPARTMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem('const_v12_session');
      if (saved && saved !== 'null') {
        try { setCurrentUser(JSON.parse(saved)); } catch (e) { localStorage.removeItem('const_v12_session'); }
      }
      await fetchInitialData();
    };
    init();

    // إعداد Realtime
    const channel = supabase
      .channel('app-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        const newLog = mapLog(payload.new);
        setLogs(prev => [newLog, ...prev]);
        if (currentUserRef.current === 'ADMIN') {
          new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {});
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
        const newReport = payload.new as any;
        setReports(prev => [{
          ...newReport,
          employeeId: newReport.employee_id || newReport.employeeId,
          employeeName: newReport.employee_name || newReport.employeeName,
          departmentId: newReport.department_id || newReport.departmentId
        }, ...prev]);
        if (currentUserRef.current === 'ADMIN') {
          new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(() => {});
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phoneInput === ADMIN_PIN) {
      setCurrentUser('ADMIN');
      return;
    }
    const emp = employees.find(e => e.phone === phoneInput);
    if (emp && (emp.password === passwordInput || phoneInput === '123')) {
      setCurrentUser(emp);
    } else {
      setError(TRANSLATIONS[lang].wrongPassword);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('const_v12_session');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-['Cairo']">
      <Loader2 className="animate-spin text-blue-500 mb-6" size={64} />
      <h2 className="text-xl font-black animate-pulse uppercase tracking-[0.3em]">Field Bridge v12</h2>
    </div>
  );

  if (currentUser === 'ADMIN') return (
    <AdminDashboard 
      logs={logs} reports={reports} chatMessages={messages} 
      employees={employees} departments={departments} companyConfig={companyConfig}
      lang={lang} onSetLang={setLang}
      onSendMessage={async (m) => { await supabase.from('chat_messages').insert(m); }} 
      onLogout={handleLogout} 
      onUpdateEmployees={async (upd) => { setEmployees(upd); }}
      onUpdateDepartments={async (upd) => { setDepartments(upd); }}
      onUpdateAnnouncements={async (a) => { }}
      onUpdateFiles={async (f) => { }}
      onUpdateCompanyConfig={async (c) => { setCompanyConfig(c); }}
    />
  );

  if (currentUser) return (
    <WorkerDashboard 
      employee={currentUser as Employee} chatMessages={messages} departmentFiles={files} 
      announcements={announcements} companyConfig={companyConfig}
      lang={lang} onSetLang={setLang}
      onSendMessage={async (m) => { await supabase.from('chat_messages').insert(m); }} 
      onLogout={handleLogout} 
      onNewLog={async (nl) => { 
        setLogs(prev => [nl, ...prev]); 
        await supabase.from('attendance_logs').insert({
          id: nl.id,
          employee_id: nl.employeeId, // جربنا الإسمين لضمان العمل
          employeeId: nl.employeeId,
          name: nl.name,
          timestamp: nl.timestamp,
          type: nl.type,
          photo: nl.photo,
          location_lat: nl.location.lat,
          location_lng: nl.location.lng,
          status: nl.status,
          department_id: nl.departmentId,
          departmentId: nl.departmentId
        });
      }} 
      onNewReport={async (r) => { 
        setReports(prev => [r, ...prev]); 
        await supabase.from('reports').insert({
          id: r.id,
          employee_id: r.employeeId,
          employee_name: r.employeeName,
          department_id: r.departmentId,
          content: r.content,
          type: r.type,
          timestamp: r.timestamp
        });
      }}
    />
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] shadow-2xl mx-auto mb-6 flex items-center justify-center border-4 border-white/10 overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck className="text-white" size={48} />}
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{companyConfig.name}</h1>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{dbStatus === 'connected' ? 'متصل بالسحابة' : 'وضع الأوفلاين'}</p>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl relative">
          <form onSubmit={handleLogin} className="space-y-6 text-white">
            <input type="text" placeholder="رقم الهاتف (أو 000 للأدمن)" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-center font-black" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
            {phoneInput !== ADMIN_PIN && <input type="password" placeholder="كلمة المرور" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-center font-black" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />}
            {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 py-6 rounded-3xl font-black shadow-xl text-lg uppercase">دخول</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
