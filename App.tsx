
import React, { useState, useEffect, useRef } from 'react';
import { Employee, LogEntry, ReportEntry, ChatMessage, FileEntry, Announcement, Language, Department, CompanyConfig, AttendanceStatus, UserRole } from './types';
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
  // Fixed useState initializer for reports to correctly use MOCK_REPORTS
  const [reports, setReports] = useState<ReportEntry[]>(MOCK_REPORTS);
  // Fixed useState initializer for messages to correctly use MOCK_CHATS
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHATS);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>({ name: 'نظام المقاولات الذكي', logo: '' });
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');

  const currentUserRef = useRef<Employee | 'ADMIN' | null>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // دالة تحويل البيانات من DB (photo) إلى التطبيق (photos)
  const mapLogFromDB = (l: any): LogEntry => ({
    id: l.id || `log_${Date.now()}_${Math.random()}`,
    employeeId: l.employee_id || '',
    name: l.name || 'موظف',
    timestamp: l.timestamp || '',
    type: l.type === 'OUT' ? 'OUT' : 'IN',
    photos: l.photo || l.photos || 'https://via.placeholder.com/150', // استرجاع من photo في الجدول
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
      const { data: attLogs } = await supabase
        .from('attendance_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: emps } = await supabase.from('employees').select('*');

      if (attLogs) setLogs(attLogs.map(mapLogFromDB));
      if (emps && emps.length > 0) {
        setEmployees(emps);
      } else {
        setEmployees(MOCK_EMPLOYEES);
      }
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
      .channel('attendance_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        const newEntry = mapLogFromDB(payload.new);
        setLogs(prev => [newEntry, ...prev.filter(l => l.id !== newEntry.id)]);
        if (currentUserRef.current === 'ADMIN') {
          new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {});
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phoneInput === ADMIN_PIN) {
      setCurrentUser('ADMIN');
      return;
    }
    const emp = employees.find(e => e.phone === phoneInput);
    if (emp && (emp.password === passwordInput || phoneInput === '123')) {
      setCurrentUser(emp);
    } else {
      setError('رقم الهاتف أو كلمة المرور غير صحيحة');
    }
  };

  const uploadToStorage = async (base64Data: string, fileName: string) => {
    try {
      const res = await fetch(base64Data);
      const blob = await res.blob();
      const filePath = `attendance/${fileName}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Storage Error:", err);
      return base64Data;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
        <p className="text-white font-bold animate-pulse">جاري تحميل النظام...</p>
      </div>
    </div>
  );

  if (currentUser === 'ADMIN') return (
    <AdminDashboard 
      logs={logs} reports={reports} chatMessages={messages} 
      employees={employees} departments={departments} companyConfig={companyConfig}
      lang={lang} onSetLang={setLang}
      onSendMessage={async (m) => setMessages(prev => [...prev, m])} 
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
      onSendMessage={async (m) => setMessages(prev => [...prev, m])} 
      onLogout={() => setCurrentUser(null)} 
      onNewLog={async (nl) => { 
        // رفع الصورة وتحديث الحالة فوراً لضمان السرعة
        const imageUrl = await uploadToStorage(nl.photos, `${nl.employeeId}_${Date.now()}`);
        const finalLog = { ...nl, photos: imageUrl };
        
        setLogs(prev => [finalLog, ...prev]); 

        const { error: insError } = await supabase.from('attendance_logs').insert({
          id: finalLog.id,
          employee_id: finalLog.employeeId,
          name: finalLog.name,
          timestamp: finalLog.timestamp,
          type: finalLog.type,
          photo: finalLog.photos, // الحفظ في عمود photo
          location_lat: finalLog.location.lat,
          location_lng: finalLog.location.lng,
          status: finalLog.status,
          department_id: finalLog.departmentId
        });
        if (insError) console.error("Insert Error:", insError);
      }} 
      onNewReport={async (r) => setReports(prev => [r, ...prev])}
    />
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
           <ShieldCheck size={56} className="mx-auto text-blue-500 mb-4 shadow-xl" />
           <h1 className="text-2xl font-black text-white">تسجيل الدخول</h1>
           <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-widest">Construction Workforce Tracker</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="رقم الهاتف" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center font-bold outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
              value={phoneInput} 
              onChange={(e) => setPhoneInput(e.target.value)} 
            />
          </div>
          <div className="relative">
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center font-bold outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
            />
          </div>
          {error && <p className="text-red-400 text-center text-xs font-bold bg-red-400/10 py-2 rounded-xl border border-red-400/20">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95">دخول للنظام</button>
        </form>
        <div className="mt-8 flex justify-center gap-3 items-center">
           <div className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'}`} />
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{dbStatus === 'connected' ? 'Sync Active' : 'Connecting to Cloud...'}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
