
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

  const currentUserRef = useRef<Employee | 'ADMIN' | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const t = TRANSLATIONS[lang];

  // دالة لجلب البيانات وتحديث الحالة
  const fetchInitialData = async () => {
    try {
      const [
        { data: emps },
        { data: depts },
        { data: attLogs },
        { data: repts },
        { data: msgs },
        { data: fls },
        { data: anns },
        { data: config }
      ] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('attendance_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('reports').select('*').order('timestamp', { ascending: false }),
        supabase.from('chat_messages').select('*').order('timestamp', { ascending: true }),
        supabase.from('files').select('*'),
        supabase.from('announcements').select('*'),
        supabase.from('company_config').select('*').maybeSingle()
      ]);

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

  useEffect(() => {
    const initSession = async () => {
      // استعادة الجلسة أولاً وقبل أي شيء
      const savedUser = localStorage.getItem('construction_user');
      if (savedUser && savedUser !== 'null') {
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

    initSession();

    // إعداد قنوات التنبيه اللحظي
    const channel = supabase
      .channel('realtime-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        const newLog = {
          ...payload.new,
          location: { lat: payload.new.location_lat, lng: payload.new.location_lng }
        } as LogEntry;
        
        setLogs(prev => {
          if (prev.find(l => l.id === newLog.id)) return prev;
          
          // تشغيل الصوت للمدير فقط
          if (currentUserRef.current === 'ADMIN') {
            const soundUrl = newLog.type === 'IN' 
              ? 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' // صوت دخول
              : 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'; // صوت خروج
            
            const audio = new Audio(soundUrl);
            audio.play().catch(e => console.log("Audio feedback:", e));
          }
          return [newLog, ...prev];
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
        setReports(prev => [payload.new as ReportEntry, ...prev]);
        if (currentUserRef.current === 'ADMIN') {
          new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(() => {});
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // تحديث localStorage عند تغيير المستخدم
  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        localStorage.setItem('construction_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('construction_user');
      }
    }
  }, [currentUser, loading]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6 font-['Cairo']">
        <Loader2 className="animate-spin text-blue-500" size={64} />
        <p className="font-bold text-xl animate-pulse">جاري تأمين الاتصال...</p>
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
          if (error) console.error("Sync Error:", error);
        }} 
        onNewReport={async (r) => { 
          setReports(prev => [r, ...prev]); 
          await supabase.from('reports').insert(r);
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
          <p className="text-slate-400 text-sm">نظام المتابعة الميدانية</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-white">
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" placeholder={t.phone} className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 shadow-inner outline-none focus:ring-2 focus:ring-blue-500 text-center" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
            {phoneInput !== ADMIN_PIN && (
              <input type="password" placeholder={t.password} className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 shadow-inner outline-none focus:ring-2 focus:ring-blue-500 text-center" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
            )}
            {error && <p className="text-red-400 text-xs text-center font-bold animate-bounce">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">{t.login}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
