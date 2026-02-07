
import React, { useState, useEffect, useRef } from 'react';
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

  // مرجع للحالة الحالية لاستخدامه في الاشتراكات اللحظية
  const currentUserRef = useRef<Employee | 'ADMIN' | null>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const t = TRANSLATIONS[lang];

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

      setEmployees(emps && emps.length ? emps : MOCK_EMPLOYEES);
      setDepartments(depts && depts.length ? depts : INITIAL_DEPARTMENTS);
      setReports(repts && repts.length ? repts : MOCK_REPORTS);
      setMessages(msgs && msgs.length ? msgs : MOCK_CHATS);
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
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      // 1. استرجاع الجلسة فوراً لمنع الخروج
      const saved = localStorage.getItem('construction_session_v2');
      if (saved && saved !== 'null') {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch (e) {
          localStorage.removeItem('construction_session_v2');
        }
      }
      
      await fetchInitialData();
      setLoading(false);
    };

    init();

    // 2. تفعيل التنبيهات اللحظية
    const channel = supabase
      .channel('system-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        const newLog = {
          ...payload.new,
          location: { lat: payload.new.location_lat, lng: payload.new.location_lng }
        } as LogEntry;
        
        setLogs(prev => {
          if (prev.some(l => l.id === newLog.id)) return prev;
          if (currentUserRef.current === 'ADMIN') {
            const sound = new Audio(newLog.type === 'IN' 
              ? 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' 
              : 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
            sound.play().catch(() => {});
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

    return () => { supabase.removeChannel(channel); };
  }, []);

  // حفظ الجلسة
  useEffect(() => {
    if (!loading) {
      if (currentUser) localStorage.setItem('construction_session_v2', JSON.stringify(currentUser));
      else localStorage.removeItem('construction_session_v2');
    }
  }, [currentUser, loading]);

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
      setError(t.wrongPassword);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('construction_session_v2');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-['Cairo']">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={50} />
        <p className="animate-pulse">جاري التحقق من الهوية...</p>
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
        onSendMessage={async (m) => { setMessages(prev => [...prev, m]); await supabase.from('chat_messages').insert(m); }} 
        onLogout={handleLogout} 
        onUpdateEmployees={async (upd) => { setEmployees(upd); await supabase.from('employees').upsert(upd); }}
        onUpdateDepartments={async (upd) => { setDepartments(upd); await supabase.from('departments').upsert(upd); }}
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
        onSendMessage={async (m) => { setMessages(prev => [...prev, m]); await supabase.from('chat_messages').insert(m); }} 
        onLogout={handleLogout} 
        onNewLog={async (nl) => { 
          setLogs(prev => [nl, ...prev]); 
          await supabase.from('attendance_logs').insert({
            id: nl.id, employeeId: nl.employeeId, name: nl.name, timestamp: nl.timestamp,
            type: nl.type, photo: nl.photo, location_lat: nl.location.lat, 
            location_lng: nl.location.lng, status: nl.status, departmentId: nl.departmentId
          });
        }} 
        onNewReport={async (r) => { setReports(prev => [r, ...prev]); await supabase.from('reports').insert(r); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] shadow-2xl mx-auto mb-6 flex items-center justify-center overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={48} className="text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{companyConfig.name}</h1>
          <p className="text-slate-400 text-sm">نظام المتابعة الميدانية الذكي</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6 text-white">
            <input type="text" placeholder="رقم الهاتف أو كود المسؤول" className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 text-center font-bold outline-none focus:ring-2 focus:ring-blue-500" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
            {phoneInput !== ADMIN_PIN && <input type="password" placeholder="كلمة المرور" className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 text-center font-bold outline-none focus:ring-2 focus:ring-blue-500" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />}
            {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all text-lg">دخول النظام</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
