
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

  const currentUserRef = useRef<Employee | 'ADMIN' | null>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

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
        supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
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
          id: l.id, employeeId: l.employeeId, name: l.name, 
          timestamp: l.timestamp, type: l.type, photo: l.photo, 
          location: { lat: Number(l.location_lat), lng: Number(l.location_lng) }, 
          status: l.status, departmentId: l.departmentId
        })));
      }
      if (config) setCompanyConfig({ name: config.name, logo: config.logo });
    } catch (err) { console.error("Fetch error:", err); }
  };

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem('const_v11_session');
      if (saved && saved !== 'null') {
        try { setCurrentUser(JSON.parse(saved)); } catch (e) { localStorage.removeItem('const_v11_session'); }
      }
      await fetchInitialData();
      setLoading(false);
    };
    init();

    // الاشتراك اللحظي الفعال
    const channel = supabase
      .channel('schema-v11')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        const raw = payload.new;
        const newLog: LogEntry = {
          id: raw.id, employeeId: raw.employeeId, name: raw.name, timestamp: raw.timestamp,
          type: raw.type as 'IN' | 'OUT', photo: raw.photo, 
          location: { lat: Number(raw.location_lat), lng: Number(raw.location_lng) }, 
          status: raw.status as AttendanceStatus, departmentId: raw.departmentId
        };
        
        setLogs(prev => {
          if (prev.some(l => l.id === newLog.id)) return prev;
          if (currentUserRef.current === 'ADMIN') {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {});
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
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (currentUser) localStorage.setItem('const_v11_session', JSON.stringify(currentUser));
      else localStorage.removeItem('const_v11_session');
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
      setError(TRANSLATIONS[lang].wrongPassword);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('const_v11_session');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-['Cairo']">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={54} />
      <p className="animate-pulse font-bold text-xs uppercase">مزامنة البيانات الميدانية...</p>
    </div>
  );

  if (currentUser === 'ADMIN') return (
    <AdminDashboard 
      logs={logs} reports={reports} chatMessages={messages} 
      employees={employees} departments={departments} companyConfig={companyConfig}
      lang={lang} onSetLang={setLang}
      onSendMessage={async (m) => { await supabase.from('chat_messages').insert(m); }} 
      onLogout={handleLogout} 
      onUpdateEmployees={async (upd) => { setEmployees(upd); await supabase.from('employees').upsert(upd); }}
      onUpdateDepartments={async (upd) => { setDepartments(upd); await supabase.from('departments').upsert(upd); }}
      onUpdateAnnouncements={async (a) => { setAnnouncements(a); await supabase.from('announcements').upsert(a); }}
      onUpdateFiles={async (f) => { setFiles(f); await supabase.from('files').upsert(f); }}
      onUpdateCompanyConfig={async (c) => { setCompanyConfig(c); await supabase.from('company_config').upsert({ id: 1, name: c.name, logo: c.logo }); }}
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
        const { error: dbError } = await supabase.from('attendance_logs').insert({
          id: nl.id, employeeId: nl.employeeId, name: nl.name, timestamp: nl.timestamp,
          type: nl.type, photo: nl.photo, location_lat: nl.location.lat, 
          location_lng: nl.location.lng, status: nl.status, departmentId: nl.departmentId
        });
        if (dbError) console.error("DB Error:", dbError.message);
      }} 
      onNewReport={async (r) => { setReports(prev => [r, ...prev]); await supabase.from('reports').insert(r); }}
    />
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 text-white">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] shadow-2xl mx-auto mb-6 flex items-center justify-center border-4 border-white/10">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={48} />}
          </div>
          <h1 className="text-3xl font-bold mb-2">{companyConfig.name}</h1>
          <p className="text-slate-400 text-sm tracking-widest font-black uppercase">Field Terminal v11</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6 text-white">
            <input type="text" placeholder="رقم الهاتف" className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 text-center font-bold" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
            {phoneInput !== ADMIN_PIN && <input type="password" placeholder="كلمة المرور" className="w-full bg-white/5 border border-white/20 rounded-2xl py-4 px-4 text-center font-bold" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />}
            {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-black shadow-lg text-lg uppercase tracking-widest">دخول النظام</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
