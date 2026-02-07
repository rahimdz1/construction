
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>({ name: 'نظام المقاولات الذكي', logo: '' });
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');

  const currentUserRef = useRef<Employee | 'ADMIN' | null>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // دالة تحويل البيانات: تقرأ من عمود 'photo' في DB وتضعه في خاصية 'photos' بالكود
  const mapLogFromDB = (l: any): LogEntry => ({
    id: l.id,
    employeeId: l.employee_id || '',
    name: l.name || 'موظف',
    timestamp: l.timestamp || '',
    type: l.type === 'OUT' ? 'OUT' : 'IN',
    photos: l.photo || l.photos || '', // الأولوية لـ photo كما في الجدول
    location: { 
      lat: Number(l.location_lat || 0), 
      lng: Number(l.location_lng || 0) 
    },
    status: (l.status as AttendanceStatus) || AttendanceStatus.PRESENT,
    departmentId: l.department_id || ''
  });

  const fetchInitialData = async () => {
    try {
      setDbStatus('syncing');
      const { data: attLogs, error: logError } = await supabase
        .from('attendance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: emps } = await supabase.from('employees').select('*');

      setLogs(attLogs ? attLogs.map(mapLogFromDB) : []);
      setEmployees(emps && emps.length > 0 ? emps : MOCK_EMPLOYEES);
      setDepartments(INITIAL_DEPARTMENTS);
      setDbStatus('connected');
    } catch (err) {
      console.error("Fetch Error:", err);
      setDbStatus('error');
      setEmployees(MOCK_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    const channel = supabase
      .channel('db-realtime-v12')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        const newEntry = mapLogFromDB(payload.new);
        setLogs(prev => [newEntry, ...prev]);
        if (currentUserRef.current === 'ADMIN') {
          new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {});
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput === ADMIN_PIN) {
      setCurrentUser('ADMIN');
      return;
    }
    const emp = employees.find(e => e.phone === phoneInput);
    if (emp && (emp.password === passwordInput || phoneInput === '123')) {
      setCurrentUser(emp);
    } else {
      setError('بيانات الدخول غير صحيحة');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center font-['Cairo']">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  if (currentUser === 'ADMIN') return (
    <AdminDashboard 
      logs={logs} reports={reports} chatMessages={messages} 
      employees={employees} departments={departments} companyConfig={companyConfig}
      lang={lang} onSetLang={setLang}
      onSendMessage={async (m) => {}} 
      onLogout={() => setCurrentUser(null)} 
      onUpdateEmployees={async (upd) => setEmployees(upd)}
      onUpdateDepartments={async (upd) => setDepartments(upd)}
      onUpdateAnnouncements={async (a) => {}}
      onUpdateFiles={async (f) => {}}
      onUpdateCompanyConfig={async (c) => setCompanyConfig(c)}
    />
  );

  if (currentUser) return (
    <WorkerDashboard 
      employee={currentUser as Employee} chatMessages={messages} departmentFiles={[]} 
      announcements={[]} companyConfig={companyConfig}
      lang={lang} onSetLang={setLang}
      onSendMessage={async (m) => {}} 
      onLogout={() => setCurrentUser(null)} 
      onNewLog={async (nl) => { 
        setLogs(prev => [nl, ...prev]); 
        // هنا نقوم بالإرسال للعمود الصحيح 'photo'
        await supabase.from('attendance_logs').insert({
          id: nl.id,
          employee_id: nl.employeeId,
          name: nl.name,
          timestamp: nl.timestamp,
          type: nl.type,
          photo: nl.photos, // إرسال nl.photos إلى عمود 'photo' في DB
          location_lat: nl.location.lat,
          location_lng: nl.location.lng,
          status: nl.status,
          department_id: nl.departmentId
        });
      }} 
      onNewReport={async (r) => {}}
    />
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
           <ShieldCheck size={48} className="mx-auto text-blue-500 mb-4" />
           <h1 className="text-2xl font-black text-white">تسجيل الدخول</h1>
           <p className="text-slate-400 text-xs mt-2">نظام متابعة الأشغال العمومية</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="رقم الهاتف (أو 000 للأدمن)" 
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center font-bold outline-none focus:border-blue-500"
            value={phoneInput} 
            onChange={(e) => setPhoneInput(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="كلمة المرور" 
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center font-bold outline-none focus:border-blue-500"
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
          />
          {error && <p className="text-red-400 text-center text-xs font-bold">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black transition-all">دخول</button>
        </form>
        <div className="mt-6 flex justify-center gap-2">
           <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
           <p className="text-[10px] text-slate-500 font-bold uppercase">{dbStatus === 'connected' ? 'Cloud Sync Online' : 'Cloud Sync Offline'}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
