
import React, { useState, useEffect } from 'react';
import { 
  LogOut, Clock, ShieldCheck, Navigation, Camera, Zap, 
  MessageSquare, FileText, Inbox, User, Loader2, Check, Activity, Cpu 
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

  // استرجاع حالة الحضور من المتصفح لضمان عدم التكرار
  const [currentStatus, setCurrentStatus] = useState<'IN' | 'OUT'>(() => {
    return (localStorage.getItem(`worker_status_${employee.id}`) as 'IN' | 'OUT') || 'OUT';
  });

  const handleAttendanceClick = (type: 'IN' | 'OUT') => {
    if (type === currentStatus) {
      alert(type === 'IN' ? 'أنت مسجل دخول حالياً.' : 'أنت خارج العمل حالياً.');
      return;
    }
    setIsCapturing(type);
    setCameraMode('attendance');
    setShowCamera(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32 overflow-x-hidden font-['Cairo']" dir="rtl">
      {/* شاشة تحميل الـ GPS */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center text-white p-8 text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl animate-bounce">
            <Navigation size={40} className="text-white" />
          </div>
          <h2 className="text-xl font-black mb-2 animate-pulse">جاري توثيق الموقع الجغرافي (GPS)</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">يتم الآن التحقق من إحداثيات موقع العمل لضمان دقة البيانات الميدانية...</p>
          <Loader2 className="animate-spin text-blue-500 mt-8" size={32} />
        </div>
      )}

      <header className="bg-white border-b px-6 py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={28} />}
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-[11px] uppercase tracking-widest leading-none">{companyConfig.name}</h1>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter mt-1">Smart Field Ops</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-3.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-2xl transition-all"><LogOut size={22} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900 p-10 rounded-[4rem] shadow-2xl border-4 border-slate-800 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
               <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full animate-pulse ${currentStatus === 'IN' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">{currentStatus === 'IN' ? 'أنت في العمل' : 'أنت خارج العمل'}</span>
                  </div>
                  <Cpu className="text-slate-700" size={24} />
               </div>

               <div className="grid grid-cols-1 gap-6">
                  <button 
                    onClick={() => handleAttendanceClick('IN')}
                    disabled={currentStatus === 'IN'}
                    className={`p-8 rounded-[2.5rem] flex items-center justify-between transition-all ${currentStatus === 'IN' ? 'bg-slate-800 opacity-40 cursor-not-allowed' : 'bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600 group'}`}
                  >
                     <div className="text-right">
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Punch In</span>
                        <span className="text-white text-xl font-black">تسجيل دخول</span>
                     </div>
                     <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl"><Zap size={32}/></div>
                  </button>

                  <button 
                    onClick={() => handleAttendanceClick('OUT')}
                    disabled={currentStatus === 'OUT'}
                    className={`p-8 rounded-[2.5rem] flex items-center justify-between transition-all ${currentStatus === 'OUT' ? 'bg-slate-800 opacity-40 cursor-not-allowed' : 'bg-red-600/10 border border-red-500/30 hover:bg-red-600 group'}`}
                  >
                     <div className="text-right">
                        <span className="text-[8px] font-black text-red-400 uppercase tracking-widest block mb-1">Punch Out</span>
                        <span className="text-white text-xl font-black">تسجيل انصراف</span>
                     </div>
                     <div className="w-16 h-16 bg-red-500 rounded-3xl flex items-center justify-center text-white shadow-xl"><LogOut size={32}/></div>
                  </button>
               </div>

               <div className="mt-10 flex justify-center items-center gap-8 text-slate-600">
                  <div className="flex items-center gap-2"><Clock size={16} /><span className="text-[10px] font-black">{new Date().toLocaleTimeString()}</span></div>
                  <div className="flex items-center gap-2"><Activity size={16} /><span className="text-[10px] font-black uppercase">GPS Lock Active</span></div>
               </div>
            </div>
          </div>
        )}

        {/* Other Tabs Placeholder */}
        {activeTab === 'chat' && (
           <div className="h-[60vh] bg-white rounded-[3rem] border flex flex-col overflow-hidden animate-in fade-in">
              <div className="p-5 bg-slate-900 text-white font-black text-[10px] uppercase">غرفة الدردشة</div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 {chatMessages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                       <div className={`p-4 rounded-2xl text-xs font-bold ${m.senderId === employee.id ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{m.text}</div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-around items-center z-40 pb-10 rounded-t-[3.5rem] shadow-2xl">
        {[
          { id: 'attendance', icon: Clock, label: 'الرئيسية' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'id', icon: User, label: 'هويتي' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {showCamera && <CameraView onCapture={async (photo) => {
         setShowCamera(false);
         if (cameraMode === 'attendance') {
            setIsProcessing(true);
            navigator.geolocation.getCurrentPosition(async (pos) => {
               const newLog: LogEntry = { 
                 id: `log_${Date.now()}`, employeeId: employee.id, name: employee.name, 
                 timestamp: new Date().toLocaleTimeString('ar-EG'), type: isCapturing!, photo, 
                 location: { lat: pos.coords.latitude, lng: pos.coords.longitude }, 
                 status: AttendanceStatus.PRESENT, departmentId: employee.departmentId 
               };
               await onNewLog(newLog);
               setCurrentStatus(isCapturing!);
               localStorage.setItem(`worker_status_${employee.id}`, isCapturing!);
               setIsCapturing(null);
               setIsProcessing(false);
               alert('تم التوثيق بنجاح');
            }, (err) => {
               setIsProcessing(false);
               alert('فشل جلب الموقع، يرجى تفعيل الـ GPS.');
               setIsCapturing(null);
            }, { enableHighAccuracy: true });
         }
      }} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}
    </div>
  );
};

export default WorkerDashboard;
