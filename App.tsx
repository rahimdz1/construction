
import React, { useState, useEffect, useRef } from 'react';
import { Employee, LogEntry, ReportEntry, ChatMessage, FileEntry, Announcement, Language, Department, CompanyConfig, AttendanceStatus } from './types';
import { MOCK_EMPLOYEES, ADMIN_PIN, DEPARTMENTS as INITIAL_DEPARTMENTS, TRANSLATIONS, MOCK_REPORTS, MOCK_CHATS } from './constants';
import WorkerDashboard from './components/WorkerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
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

  const fetchInitialData = async () => {
    try {
      setDbStatus('syncing');
      const [
        { data: emps, error: err1 },
        { data: depts, error: err2 },
        { data: attLogs, error: err3 },
        { data: repts, error: err4 },
        { data: msgs, error: err5 },
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

      if (err1 || err2 || err3) {
        console.warn("Some data could not be fetched from Supabase, using mock data as fallback.");
        setDbStatus('error');
      } else {
        setDbStatus('connected');
      }

      setEmployees(emps && emps.length ? emps : MOCK_EMPLOYEES);
      setDepartments(depts && depts.length ? depts : INITIAL_DEPARTMENTS);
      setReports(repts && repts.length ? repts : MOCK_REPORTS);
      setMessages(msgs && msgs.length ? msgs : MOCK_CHATS);
      setFiles(fls || []);
      setAnnouncements(anns || []);
      
      if (attLogs) {
        const formattedLogs: LogEntry[] = attLogs.map((l: any) => ({
          id: l.id,
          employeeId: l.employeeId || '',
          name: l.name || 'موظف غير معروف',
          timestamp: l.timestamp || '',
          type: (l.type === 'IN' || l.type === 'OUT') ? l.type : 'IN',
          photo: l.photo || 'https://via.placeholder.com/150',
          location: { 
            lat: l.location_lat ? Number(l.location_lat) : 0, 
            lng: l.location_lng ? Number(l.location_lng) : 0 
          },
          status: l.status as AttendanceStatus || AttendanceStatus.PRESENT,
          departmentId: l.departmentId || ''
        }));
        setLogs(formattedLogs);
      }
      
      if (config) setCompanyConfig({ name: config.name, logo: config.logo });
    } catch (err) {
      console.error("Critical fetch error:", err);
      setDbStatus('error');
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

    // إعداد قنوات البث اللحظي (Realtime)
    const channel = supabase
      .channel('public-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        console.log("New Attendance Log Detected:", payload.new);
        const raw = payload.new;
        const newLog: LogEntry = {
          id: raw.id,
          employeeId: raw.employeeId,
          name: raw.name,
          timestamp: raw.timestamp,
          type: raw.type as 'IN' | 'OUT',
          photo: raw.photo,
          location: { lat: Number(raw.location_lat), lng: Number(raw.location_lng) },
          status: raw.status as AttendanceStatus,
          departmentId: raw.departmentId
        };
        
        setLogs(prev => {
          if (prev.find(p => p.id === newLog.id)) return prev;
          if (currentUserRef.current === 'ADMIN') {
             // تنبيه فوري للمدير
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
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (currentUser) localStorage.setItem('const_v12_session', JSON.stringify(currentUser));
      else localStorage.removeItem('const_v12_session');
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
    localStorage.removeItem('const_v12_session');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-['Cairo']">
      <Loader2 className="animate-spin text-blue-500 mb-6" size={64} />
      <h2 className="text-xl font-black animate-pulse uppercase tracking-[0.3em]">Field Bridge v12</h2>
      <p className="text-slate-500 text-[10px] mt-4 font-black uppercase tracking-widest">مزامنة البيانات السحابية...</p>
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
        // تحديث محلي سريع
        setLogs(prev => [nl, ...prev]); 
        // إرسال للسيرفر
        const { error } = await supabase.from('attendance_logs').insert({
          id: nl.id,
          employeeId: nl.employeeId,
          name: nl.name,
          timestamp: nl.timestamp,
          type: nl.type,
          photo: nl.photo,
          location_lat: nl.location.lat,
          location_lng: nl.location.lng,
          status: nl.status,
          departmentId: nl.departmentId
        });
        if (error) {
          console.error("Error inserting log:", error);
          alert("خطأ في الاتصال بالسيرفر، ولكن تم الحفظ محلياً.");
        }
      }} 
      onNewReport={async (r) => { 
        setReports(prev => [r, ...prev]); 
        await supabase.from('reports').insert(r); 
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
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{dbStatus === 'connected' ? 'Cloud Connected' : 'Sync Error'}</p>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
          <form onSubmit={handleLogin} className="space-y-6 text-white relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4">رقم الهاتف</label>
              <input type="text" placeholder="123" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-center font-black text-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
            </div>
            {phoneInput !== ADMIN_PIN && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4">كلمة المرور</label>
                <input type="password" placeholder="••••" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-center font-black text-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
              </div>
            )}
            {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold"><AlertTriangle size={16}/> {error}</div>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-3xl font-black shadow-xl text-lg uppercase tracking-widest transition-all active:scale-95">دخول النظام</button>
          </form>
        </div>
        <p className="text-center text-slate-600 text-[8px] font-black mt-8 uppercase tracking-[0.4em]">Powered by Construction Intelligence v12</p>
      </div>
    </div>
  );
};

export default App;
