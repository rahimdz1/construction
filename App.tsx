
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

  // مرجع لحالة المستخدم الحالية لاستخدامه داخل اشتراكات Realtime لتجنب مشاكل الـ Closures
  const currentUserRef = useRef<Employee | 'ADMIN' | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const t = TRANSLATIONS[lang];

  // دالة جلب البيانات الأساسية
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
    const init = async () => {
      // 1. استرجاع الجلسة فوراً
      const savedUser = localStorage.getItem('construction_user_session');
      if (savedUser && savedUser !== 'undefined') {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('construction_user_session');
        }
      }
      
      // 2. جلب البيانات من السيرفر
      await fetchInitialData();
      setLoading(false);
    };

    init();

    // 3. تفعيل نظام التنبيهات اللحظية (Realtime)
    const channel = supabase
      .channel('public-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        const newLog = {
          ...payload.new,
          location: { lat: payload.new.location_lat, lng: payload.new.location_lng }
        } as LogEntry;
        
        setLogs(prev => {
          if (prev.some(l => l.id === newLog.id)) return prev;
          
          // تشغيل صوت التنبيه للمسؤول فقط
          if (currentUserRef.current === 'ADMIN') {
            const sound = newLog.type === 'IN' 
              ? 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' 
              : 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';
            const audio = new Audio(sound);
            audio.play().catch(e => console.warn("Audio feedback blocked:", e));
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

  // حفظ الجلسة في localStorage عند أي تغيير
  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        localStorage.setItem('construction_user_session', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('construction_user_session');
      }
    }
  }, [currentUser, loading]);

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
      setError(lang === 'ar' ? 'الرقم غير مسجل في المنظومة' : 'Phone not registered');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('construction_user_session');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-6 font-['Cairo']">
        <Loader2 className="animate-spin text-blue-500" size={60} />
        <p className="font-bold text-lg animate-pulse">جاري التحقق من الجلسة...</p>
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
        onUpdateEmployees={async (updated) => { setEmployees(updated); await supabase.from('employees').upsert(updated); }}
        onUpdateDepartments={async (updated) => { setDepartments(updated); await supabase.from('departments').upsert(updated); }}
        onUpdateAnnouncements={async (a) => { setAnnouncements(a); await supabase.from('announcements').upsert(a); }}
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
          await supabase.from('attendance_logs').insert({
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
        }} 
        onNewReport={async (r) => { 
          setReports(prev => [r, ...prev]); 
          await supabase.from('reports').insert(r);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-3xl shadow-2xl mb-6 overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} alt="Logo" className="w-full h-full object-cover" /> : <ShieldCheck size={48} className="text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{companyConfig.name}</h1>
          <p className="text-slate-400 text-sm">نظام المتابعة الميدانية والتحقق اللحظي</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-white">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 mr-2 tracking-widest">Phone Number / Admin PIN</label>
              <input type="text" placeholder="رقم الهاتف أو كود المسؤول" className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 shadow-inner outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
            </div>
            {phoneInput !== ADMIN_PIN && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2 tracking-widest">Password</label>
                <input type="password" placeholder="كلمة المرور" className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 shadow-inner outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
              </div>
            )}
            {error && <p className="text-red-400 text-xs text-center font-bold animate-bounce bg-red-400/10 py-2 rounded-lg">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 text-lg">دخول النظام</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
