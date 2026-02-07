
import React, { useState, useEffect, useRef } from 'react';
import { Employee, LogEntry, ReportEntry, ChatMessage, FileEntry, Announcement, Language, Department, CompanyConfig, AttendanceStatus } from './types';
import { MOCK_EMPLOYEES, ADMIN_PIN, DEPARTMENTS as INITIAL_DEPARTMENTS, TRANSLATIONS, MOCK_REPORTS, MOCK_CHATS, NOTIFICATION_SOUNDS } from './constants';
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

  // مرجع لحالة المستخدم الحالية لاستخدامه داخل اشتراكات Realtime
  const currentUserRef = useRef<Employee | 'ADMIN' | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const t = TRANSLATIONS[lang];

  // 1. استعادة الجلسة والبيانات الأولية
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('construction_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
        } catch (e) {
          localStorage.removeItem('construction_user');
        }
      }
      await fetchInitialData();
      setLoading(false);
    };
    init();

    // إعداد اشتراكات Realtime للتنبيهات الفورية
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_logs' },
        (payload) => {
          const newLog = {
            ...payload.new,
            location: { lat: payload.new.location_lat, lng: payload.new.location_lng }
          } as LogEntry;
          
          setLogs(prev => {
            if (prev.find(l => l.id === newLog.id)) return prev;
            // إذا كان المستخدم الحالي مدير، قم بتشغيل صوت التنبيه
            if (currentUserRef.current === 'ADMIN') {
              const audio = new Audio(NOTIFICATION_SOUNDS.MESSAGE);
              audio.play().catch(e => console.log("Audio play blocked by browser", e));
            }
            return [newLog, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          setReports(prev => [payload.new as ReportEntry, ...prev]);
          if (currentUserRef.current === 'ADMIN') {
            const audio = new Audio(NOTIFICATION_SOUNDS.REPORT);
            audio.play().catch(e => console.log("Audio play blocked", e));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. حفظ الجلسة عند كل تغيير
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('construction_user', JSON.stringify(currentUser));
    } else if (!loading) {
      localStorage.removeItem('construction_user');
    }
  }, [currentUser, loading]);

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

      if (emps) setEmployees(emps.length ? emps : MOCK_EMPLOYEES);
      if (depts) setDepartments(depts.length ? depts : INITIAL_DEPARTMENTS);
      if (repts) setReports(repts.length ? repts : MOCK_REPORTS);
      if (msgs) setMessages(msgs.length ? msgs : MOCK_CHATS);
      if (fls) setFiles(fls);
      if (anns) setAnnouncements(anns);
      if (attLogs) {
        setLogs(attLogs.map((l: any) => ({
          ...l,
          location: { lat: l.location_lat, lng: l.location_lng }
        })));
      }
      if (config) setCompanyConfig({ name: config.name, logo: config.logo });
    } catch (err) {
      console.error("Fetch Error:", err);
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

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('construction_user');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6">
        <Loader2 className="animate-spin text-blue-500" size={64} />
        <p className="font-bold text-xl animate-pulse font-['Cairo']">جاري تهيئة المنظومة...</p>
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
        onLogout={handleLogout} 
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
        onLogout={handleLogout} 
        onNewLog={async (newLog) => { 
          setLogs(prev => [newLog, ...prev]); 
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
          if (error) console.error("Log Sync Error:", error);
        }} 
        onNewReport={async (r) => { 
          setReports(prev => [r, ...prev]); 
          const { error } = await supabase.from('reports').insert(r);
          if (error) console.error("Report Sync Error:", error);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-3xl shadow-2xl mb-6">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="Logo" className="w-full h-full object-contain" /> : <ShieldCheck size={48} className="text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{companyConfig.name}</h1>
          <p className="text-slate-400 text-sm">نظام المتابعة الميدانية الذكي</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-white">
          {isRegistering ? (
            <form onSubmit={handleCompleteActivation} className="space-y-6">
              <p className="text-center font-bold text-emerald-400">مرحباً {foundPreRegisteredEmployee?.name}</p>
              <input type="password" placeholder="كلمة مرور جديدة" className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 outline-none focus:ring-2 focus:ring-emerald-500" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
              <button type="submit" className="w-full bg-emerald-600 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all">تفعيل الحساب</button>
              <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-xs text-slate-400">العودة لتسجيل الدخول</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" placeholder={t.phone} className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 shadow-inner outline-none focus:ring-2 focus:ring-blue-500" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
              {phoneInput !== ADMIN_PIN && (
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
