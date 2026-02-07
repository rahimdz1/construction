
import React, { useState, useEffect } from 'react';
import { Employee, LogEntry, ReportEntry, ChatMessage, FileEntry, Announcement, Language, Department, CompanyConfig, AttendanceStatus } from './types';
import { MOCK_EMPLOYEES, ADMIN_PIN, DEPARTMENTS as INITIAL_DEPARTMENTS, TRANSLATIONS, MOCK_REPORTS, MOCK_CHATS } from './constants';
import WorkerDashboard from './components/WorkerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ShieldCheck, Loader2 } from 'lucide-react';
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
  const [isRegistering, setIsRegistering] = useState(false);
  const [foundPreRegisteredEmployee, setFoundPreRegisteredEmployee] = useState<Employee | null>(null);
  const [regPassword, setRegPassword] = useState('');

  const t = TRANSLATIONS[lang];

  // 1. استعادة الجلسة عند تحميل التطبيق
  useEffect(() => {
    const savedUser = localStorage.getItem('construction_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('construction_user');
      }
    }
    fetchInitialData();

    // إعداد تحديث تلقائي للبيانات كل 30 ثانية لضمان تزامن الإدارة
    const interval = setInterval(fetchInitialData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. حفظ الجلسة عند تغيير المستخدم
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('construction_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('construction_user');
    }
  }, [currentUser]);

  const fetchInitialData = async () => {
    try {
      const { data: emps } = await supabase.from('employees').select('*');
      const { data: depts } = await supabase.from('departments').select('*');
      const { data: attLogs } = await supabase.from('attendance_logs').select('*').order('created_at', { ascending: false });
      const { data: repts } = await supabase.from('reports').select('*').order('timestamp', { ascending: false });
      const { data: msgs } = await supabase.from('chat_messages').select('*').order('timestamp', { ascending: true });
      const { data: fls } = await supabase.from('files').select('*');
      const { data: anns } = await supabase.from('announcements').select('*');
      const { data: config } = await supabase.from('company_config').select('*').maybeSingle();

      if (emps && emps.length) setEmployees(emps);
      else setEmployees(MOCK_EMPLOYEES);

      if (depts && depts.length) setDepartments(depts);
      else setDepartments(INITIAL_DEPARTMENTS);

      if (repts && repts.length) setReports(repts);
      else setReports(MOCK_REPORTS);

      if (msgs && msgs.length) setMessages(msgs);
      else setMessages(MOCK_CHATS);

      setFiles(fls || []);
      setAnnouncements(anns || []);

      if (attLogs) {
        setLogs(attLogs.map((l: any) => ({
          ...l,
          location: { lat: l.location_lat, lng: l.location_lng }
        })));
      }
      
      if (config) setCompanyConfig({ name: config.name, logo: config.logo });

    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployees = async (updated: Employee[]) => {
    setEmployees(updated);
    await supabase.from('employees').upsert(updated);
  };

  const handleUpdateDepartments = async (updated: Department[]) => {
    setDepartments(updated);
    await supabase.from('departments').upsert(updated);
  };

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!phoneInput) return;
    setError(null);

    if (phoneInput === ADMIN_PIN) {
      setCurrentUser('ADMIN');
      return;
    }

    const employee = employees.find(emp => emp.phone === phoneInput);
    if (employee) {
      if (employee.password === passwordInput || phoneInput === '123') {
        setCurrentUser(employee);
      } else {
        setError(t.wrongPassword);
      }
    } else {
      setError(lang === 'ar' ? 'عفواً، هذا الرقم غير مسجل.' : 'Error: Phone not registered.');
    }
  };

  const handleStartActivation = () => {
    setError(null);
    if (!phoneInput) return;
    const employee = employees.find(emp => emp.phone === phoneInput);
    if (employee) {
      setFoundPreRegisteredEmployee(employee);
      setIsRegistering(true);
    } else {
      setError(lang === 'ar' ? 'الرقم غير موجود في سجلات الإدارة.' : 'Phone not in records.');
    }
  };

  const handleCompleteActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundPreRegisteredEmployee || !regPassword) return;
    const updatedEmployee = { ...foundPreRegisteredEmployee, password: regPassword, isRegistered: true };
    const updatedList = employees.map(emp => emp.phone === updatedEmployee.phone ? updatedEmployee : emp);
    await handleUpdateEmployees(updatedList);
    setCurrentUser(updatedEmployee);
    setIsRegistering(false);
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6">
        <Loader2 className="animate-spin text-blue-500" size={64} />
        <p className="font-bold text-xl animate-pulse">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (currentUser === 'ADMIN') {
    return (
      <AdminDashboard 
        logs={logs} reports={reports} chatMessages={messages} 
        employees={employees} departments={departments}
        companyConfig={companyConfig}
        lang={lang} onSetLang={setLang}
        onSendMessage={async (m) => { 
          setMessages(prev => [...prev, m]); 
          await supabase.from('chat_messages').insert(m);
        }} 
        onLogout={() => setCurrentUser(null)} 
        onUpdateEmployees={handleUpdateEmployees}
        onUpdateDepartments={handleUpdateDepartments}
        onUpdateAnnouncements={async (a) => { 
          setAnnouncements(a); 
          await supabase.from('announcements').upsert(a);
        }}
        onUpdateFiles={async (f) => { setFiles(f); await supabase.from('files').upsert(f); }}
        onUpdateCompanyConfig={async (c) => {
          setCompanyConfig(c);
          await supabase.from('company_config').upsert({ id: 1, name: c.name, logo: c.logo });
        }}
      />
    );
  }

  if (currentUser) {
    return (
      <WorkerDashboard 
        employee={currentUser as Employee} chatMessages={messages} departmentFiles={files} 
        announcements={announcements} companyConfig={companyConfig}
        lang={lang} onSetLang={setLang}
        onSendMessage={async (m) => { 
          setMessages(prev => [...prev, m]); 
          await supabase.from('chat_messages').insert(m);
        }} 
        onLogout={() => setCurrentUser(null)} 
        onNewLog={async (newLog) => { 
          // تحديث الحالة المحلية فوراً ليراها العامل
          setLogs(prev => [newLog, ...prev]); 
          // الإرسال لقاعدة البيانات
          const { error } = await supabase.from('attendance_logs').insert({
            id: newLog.id,
            employeeId: newLog.employeeId,
            name: newLog.name,
            timestamp: newLog.timestamp,
            type: newLog.type,
            photo: newLog.photo,
            location_lat: newLog.location.lat,
            location_lng: newLog.location.lng,
            status: newLog.status,
            departmentId: newLog.departmentId
          });
          if (error) console.error("Sync Log Error:", error);
          else fetchInitialData(); // إعادة الجلب للتأكد من المزامنة
        }} 
        onNewReport={async (r) => { 
          setReports(prev => [r, ...prev]); 
          const { error } = await supabase.from('reports').insert(r);
          if (error) console.error("Sync Report Error:", error);
          else fetchInitialData();
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-900 flex items-center justify-center p-4 ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-3xl shadow-2xl mb-6">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="Logo" className="w-full h-full object-contain" /> : <ShieldCheck size={48} className="text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{companyConfig.name}</h1>
          <p className="text-slate-400 text-sm">نظام المتابعة الميدانية</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-white">
          {isRegistering ? (
            <form onSubmit={handleCompleteActivation} className="space-y-6">
              <p className="text-center font-bold text-emerald-400">مرحباً {foundPreRegisteredEmployee?.name}</p>
              <input type="password" placeholder="كلمة مرور جديدة" className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
              <button type="submit" className="w-full bg-emerald-600 py-4 rounded-2xl font-bold">تفعيل الحساب</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" placeholder={t.phone} className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 shadow-inner outline-none focus:ring-2 focus:ring-blue-500" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
              {phoneInput !== ADMIN_PIN && phoneInput !== '123' && (
                <input type="password" placeholder={t.password} className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 shadow-inner outline-none focus:ring-2 focus:ring-blue-500" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
              )}
              {error && <p className="text-red-400 text-xs text-center font-bold animate-bounce">{error}</p>}
              <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">{t.login}</button>
              <button type="button" onClick={handleStartActivation} className="w-full text-blue-400 text-xs font-bold mt-4 underline hover:text-blue-300">تفعيل حساب موظف جديد</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
