
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  LogOut, Clock, CheckCircle2, User, MessageSquare, Send, FileText, 
  Briefcase, QrCode, ShieldCheck, MapPin, Map as MapIcon, Upload, 
  Link as LinkIcon, Paperclip, ChevronRight, Info, Mic, Play, Square
} from 'lucide-react';
import { 
  Employee, AttendanceStatus, LogEntry, ReportEntry, ChatMessage, 
  FileEntry, Language, CompanyConfig, Announcement 
} from '../types';
import { TRANSLATIONS, NOTIFICATION_SOUNDS } from '../constants';
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
  employee, chatMessages, companyConfig,
  lang, onSendMessage, onLogout, onNewLog, onNewReport
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'id' | 'reports' | 'chat' | 'map'>('attendance');
  const [showCamera, setShowCamera] = useState(false);
  const [reportType, setReportType] = useState<'text' | 'link' | 'file'>('text');
  const [reportContent, setReportContent] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (activeTab === 'map' && employee.workplaceLat && employee.workplaceLng) {
      const L = (window as any).L;
      if (!L) return;
      const timer = setTimeout(() => {
        if (mapContainerRef.current) {
          const map = L.map(mapContainerRef.current).setView([employee.workplaceLat, employee.workplaceLng], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.marker([employee.workplaceLat, employee.workplaceLng]).addTo(map).bindPopup(employee.workplace || "موقع العمل").openPopup();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, employee]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendMessage({
            id: Date.now().toString(),
            senderId: employee.id,
            senderName: employee.name,
            audioUrl: base64Audio,
            timestamp: new Date().toLocaleTimeString(),
            type: 'group',
            departmentId: employee.departmentId
          });
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert('تعذر الوصول للميكروفون');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32" dir="rtl">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={24} />}
          </div>
          <h1 className="font-bold text-slate-800 text-xs truncate max-w-[150px] uppercase tracking-widest">{companyConfig.name}</h1>
        </div>
        <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-emerald-500" />
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner"><Clock size={32} /></div>
              <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">بوابة الحضور</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setIsCapturing('IN'); setShowCamera(true); }} className="bg-emerald-600 text-white py-6 rounded-[2rem] font-black flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all text-xs uppercase"><CheckCircle2 size={24} /> {t.checkIn}</button>
                <button onClick={() => { setIsCapturing('OUT'); setShowCamera(true); }} className="bg-red-600 text-white py-6 rounded-[2rem] font-black flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all text-xs uppercase"><LogOut size={24} /> {t.checkOut}</button>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white space-y-6">
               <h3 className="font-bold text-[10px] text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={16}/> التكليف الميداني</h3>
               <div className="space-y-4">
                  <div className="bg-white/5 p-5 rounded-2xl flex items-center gap-4 border border-white/5">
                     <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Briefcase size={20}/></div>
                     <div><p className="text-[8px] font-bold text-slate-400 uppercase">موقع العمل المخصص</p><p className="text-xs font-bold">{employee.workplace || 'لم يتم التحديد'}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">بداية الوردية</p><p className="text-xs font-bold text-emerald-400">{employee.shiftStart || '08:00'}</p></div>
                     <div className="bg-white/5 p-5 rounded-2xl border border-white/5"><p className="text-[8px] font-bold text-slate-400 uppercase mb-1">نهاية الوردية</p><p className="text-xs font-bold text-red-400">{employee.shiftEnd || '16:00'}</p></div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 animate-in zoom-in perspective-1000">
            <div 
              className={`relative w-full max-w-[340px] aspect-[1.6/1] transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-8 text-white rounded-[2.5rem] shadow-2xl flex flex-col justify-between border border-white/10">
                   <div className="flex justify-between items-start"><ShieldCheck className="text-blue-400" size={32} /><p className="text-[8px] font-black opacity-40 uppercase tracking-widest">{companyConfig.name}</p></div>
                   <div className="flex gap-5 items-center">
                      <div className="w-20 h-20 rounded-2xl border-4 border-white/10 p-1 bg-white/5 shadow-inner"><img src={employee.avatar} className="w-full h-full rounded-xl object-cover" /></div>
                      <div><h2 className="text-lg font-black tracking-tight">{employee.name}</h2><p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{employee.role}</p></div>
                   </div>
                   <div className="flex justify-between items-end"><p className="text-[8px] font-bold opacity-40">EMP-ID: {employee.id.slice(0,8).toUpperCase()}</p><div className="bg-white p-1 rounded-xl w-14 h-14 shadow-lg"><QrCode size={48} className="w-full h-full text-slate-900"/></div></div>
                </div>

                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white p-8 text-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col border-4 border-blue-600/10">
                   <div className="flex-1 space-y-4">
                      <h3 className="font-black text-xs text-blue-600 uppercase border-b pb-3">تفاصيل الملف الوظيفي</h3>
                      <div className="space-y-3">
                         <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold uppercase">تاريخ الالتحاق:</span><span className="text-slate-900 font-black">{employee.joinedAt || '2024/01/01'}</span></div>
                         <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold uppercase">القسم:</span><span className="text-slate-900 font-black">{employee.departmentId}</span></div>
                         <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold uppercase">نطاق العمل:</span><span className="text-slate-900 font-black truncate max-w-[150px]">{employee.workplace}</span></div>
                      </div>
                   </div>
                   <p className="text-[8px] text-slate-300 font-bold text-center mt-6 uppercase tracking-widest">تستخدم هذه البطاقة للمرور الميداني فقط</p>
                </div>
            </div>
            <p className="text-slate-400 text-[9px] font-bold uppercase flex items-center gap-2"><Info size={14}/> انقر على البطاقة لعرض التفاصيل</p>
          </div>
        )}

        {activeTab === 'chat' && (
           <div className="flex flex-col h-[68vh] bg-white rounded-[3rem] border shadow-xl overflow-hidden animate-in slide-in-from-bottom-6">
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <h3 className="font-bold text-[10px] uppercase tracking-widest">غرفة دردشة القسم</h3>
                 </div>
                 <MessageSquare size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                 {chatMessages.map(msg => (
                   <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                         <p className="text-[8px] font-black mb-1 uppercase opacity-50">{msg.senderName}</p>
                         {msg.audioUrl ? (
                            <audio controls src={msg.audioUrl} className="max-w-[180px] h-8" />
                         ) : (
                            <p className="text-xs font-bold leading-relaxed">{msg.text}</p>
                         )}
                      </div>
                      <span className="text-[8px] text-slate-300 mt-1 font-bold px-2">{msg.timestamp}</span>
                   </div>
                 ))}
              </div>
              <div className="p-4 border-t flex gap-3 items-center bg-white">
                 <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`p-4 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white scale-125 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title="سجل صوتك">
                    {isRecording ? <Square size={20}/> : <Mic size={20} />}
                 </button>
                 <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold outline-none ring-1 ring-slate-100" placeholder="اكتب رسالة..." />
                 <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Date.now().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all"><Send size={20} /></button>
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t px-2 py-4 flex justify-around items-center z-40 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[3.5rem]">
        {[
          { id: 'attendance', icon: Clock, label: 'البوابة' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'id', icon: User, label: 'الهوية' },
          { id: 'map', icon: MapIcon, label: 'الموقع' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-2 transition-all p-3 rounded-2xl ${activeTab === item.id ? 'text-blue-600 scale-110 bg-blue-50/50' : 'text-slate-300 hover:text-slate-400'}`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {showCamera && <CameraView onCapture={async (photo) => {
         navigator.geolocation.getCurrentPosition(async (pos) => {
            const newLog: LogEntry = {
               id: Math.random().toString(36).substr(2, 9),
               employeeId: employee.id,
               name: employee.name,
               timestamp: new Date().toLocaleTimeString(),
               type: isCapturing!,
               photo,
               location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
               status: AttendanceStatus.PRESENT,
               departmentId: employee.departmentId
            };
            await onNewLog(newLog);
            setIsCapturing(null);
            setShowCamera(false);
         });
      }} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}
      <style>{`
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .transform-style-3d { transform-style: preserve-3d; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};

export default WorkerDashboard;
