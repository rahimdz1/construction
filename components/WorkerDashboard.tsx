
import React, { useState, useEffect } from 'react';
import { 
  LogOut, Clock, ShieldCheck, Navigation, Camera, Zap, 
  MessageSquare, FileText, Inbox, User, Loader2, Check, Activity, Cpu, AlertCircle 
} from 'lucide-react';
import { 
  Employee, AttendanceStatus, LogEntry, ReportEntry, ChatMessage, 
  FileEntry, Language, CompanyConfig, Announcement 
} from '../types';
import CameraView from './CameraView';

interface WorkerDashboardProps {
  employee: Employee;
  chatMessages: ChatMessage[];
  departmentFiles: FileEntry[];
  announcements: Announcement[];
  companyConfig: CompanyConfig;
  lang: Language;
  onSetLang: (l: Language) => void;
  onSendMessage: (m: ChatMessage) => Promise<void>;
  onLogout: () => void;
  onNewLog: (l: LogEntry) => Promise<void>;
  onNewReport: (r: ReportEntry) => Promise<void>;
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  employee, chatMessages = [], departmentFiles = [], companyConfig,
  onSendMessage, onLogout, onNewLog, onNewReport
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'id' | 'reports' | 'chat' | 'documents'>('attendance');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'attendance' | 'report'>('attendance');
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [chatInput, setChatInput] = useState('');

  // حالة الحضور
  const [currentStatus, setCurrentStatus] = useState<'IN' | 'OUT'>(() => {
    return (localStorage.getItem(`status_v12_${employee.id}`) as 'IN' | 'OUT') || 'OUT';
  });

  const handleAttendanceClick = (type: 'IN' | 'OUT') => {
    setIsCapturing(type);
    setCameraMode('attendance');
    setShowCamera(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32 overflow-x-hidden font-['Cairo']" dir="rtl">
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-2xl flex flex-col items-center justify-center text-white p-8 text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl animate-pulse">
            <Activity size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-black mb-4 uppercase tracking-widest">توثيق البيانات</h2>
          <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-xs">يرجى الانتظار، نقوم الآن بربط إحداثيات الموقع مع صورتك لضمان توثيق الحضور بشكل قانوني...</p>
          <Loader2 className="animate-spin text-blue-500 mt-10" size={32} />
        </div>
      )}

      <header className="bg-white border-b px-6 py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={28} />}
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-[11px] uppercase tracking-widest leading-none">{companyConfig.name}</h1>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter mt-1">Smart Field Bridge</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-4 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-90"><LogOut size={22} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-slate-900 p-10 rounded-[4rem] shadow-2xl border-4 border-slate-800 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 blur-[80px] rounded-full" />
               <div className="flex justify-between items-center mb-10 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${currentStatus === 'IN' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">{currentStatus === 'IN' ? 'أنت في الموقع' : 'أنت خارج الدوام'}</span>
                  </div>
                  <Cpu className="text-slate-700" size={24} />
               </div>

               <div className="grid grid-cols-1 gap-6 relative z-10">
                  <button 
                    onClick={() => handleAttendanceClick('IN')}
                    disabled={currentStatus === 'IN'}
                    className={`p-10 rounded-[3rem] flex items-center justify-between transition-all active:scale-95 ${currentStatus === 'IN' ? 'bg-slate-800/50 opacity-30 cursor-not-allowed grayscale' : 'bg-emerald-600 hover:bg-emerald-500 shadow-2xl shadow-emerald-900/20 text-white'}`}
                  >
                     <div className="text-right">
                        <span className="text-[8px] font-black opacity-60 uppercase tracking-widest block mb-1">Shift Start</span>
                        <span className="text-2xl font-black">تسجيل دخول</span>
                     </div>
                     <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md"><Zap size={32}/></div>
                  </button>

                  <button 
                    onClick={() => handleAttendanceClick('OUT')}
                    disabled={currentStatus === 'OUT'}
                    className={`p-10 rounded-[3rem] flex items-center justify-between transition-all active:scale-95 ${currentStatus === 'OUT' ? 'bg-slate-800/50 opacity-30 cursor-not-allowed grayscale' : 'bg-red-600 hover:bg-red-500 shadow-2xl shadow-red-900/20 text-white'}`}
                  >
                     <div className="text-right">
                        <span className="text-[8px] font-black opacity-60 uppercase tracking-widest block mb-1">Shift End</span>
                        <span className="text-2xl font-black">تسجيل انصراف</span>
                     </div>
                     <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md"><LogOut size={32}/></div>
                  </button>
               </div>

               <div className="mt-10 flex justify-center items-center gap-8 text-slate-500 relative z-10">
                  <div className="flex items-center gap-2"><Clock size={16} /><span className="text-[10px] font-black">{new Date().toLocaleTimeString('ar-EG')}</span></div>
                  <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                  <div className="flex items-center gap-2"><Activity size={16} /><span className="text-[10px] font-black uppercase">GPS Lock Active</span></div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">الوردية المحددة</p>
                <div className="text-xs font-black text-slate-800">{employee.shiftStart || '08:00'} - {employee.shiftEnd || '16:00'}</div>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">موقع العمل</p>
                <div className="text-xs font-black text-blue-600 truncate">{employee.workplace || 'الموقع العام'}</div>
              </div>
            </div>
          </div>
        )}

        {/* باقي التبويبات كـ Placeholder */}
        {activeTab !== 'attendance' && (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Loader2 className="animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase">جاري التحميل...</p>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t p-5 flex justify-around items-center z-40 pb-12 rounded-t-[4rem] shadow-[0_-20px_60px_rgba(0,0,0,0.05)]">
        {[
          { id: 'attendance', icon: Clock, label: 'الرئيسية' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'id', icon: User, label: 'هويتي' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${activeTab === item.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {showCamera && <CameraView onCapture={async (photo) => {
         setShowCamera(false);
         if (cameraMode === 'attendance') {
            setIsProcessing(true);
            
            const geoOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
            
            navigator.geolocation.getCurrentPosition(async (pos) => {
               const newLog: LogEntry = { 
                 id: `log_${Date.now()}`,
                 employeeId: employee.id,
                 name: employee.name,
                 timestamp: new Date().toLocaleTimeString('ar-EG'),
                 type: isCapturing!,
                 photo,
                 location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                 status: AttendanceStatus.PRESENT,
                 departmentId: employee.departmentId 
               };
               
               await onNewLog(newLog);
               setCurrentStatus(isCapturing!);
               localStorage.setItem(`status_v12_${employee.id}`, isCapturing!);
               setIsProcessing(false);
               setIsCapturing(null);
               alert('تم توثيق حضورك بنجاح!');
            }, (err) => {
               setIsProcessing(false);
               setIsCapturing(null);
               alert('فشل جلب الموقع الجغرافي. يرجى تفعيل الـ GPS وإعطاء الإذن للمتصفح.');
            }, geoOptions);
         }
      }} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}
    </div>
  );
};

export default WorkerDashboard;
