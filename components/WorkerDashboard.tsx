
import React, { useState, useMemo } from 'react';
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
  const [reportContent, setReportContent] = useState('');
  const [attachment, setAttachment] = useState<{name: string, url: string} | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // لحالة جلب الـ GPS
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);

  // حساب حالة العامل الحالية (داخل أو خارج) لمنع التكرار
  // سنعتمد على التخزين المحلي مؤقتاً أو سجلات الجلسة
  const [currentStatus, setCurrentStatus] = useState<'IN' | 'OUT'>(() => {
    return (localStorage.getItem(`status_${employee.id}`) as 'IN' | 'OUT') || 'OUT';
  });

  const handleAttendanceClick = (type: 'IN' | 'OUT') => {
    if (type === currentStatus) {
      const msg = type === 'IN' ? 'أنت مسجل دخول بالفعل!' : 'أنت مسجل خروج بالفعل!';
      alert(msg);
      return;
    }
    setIsCapturing(type);
    setCameraMode('attendance');
    setShowCamera(true);
  };

  const qrData = encodeURIComponent(JSON.stringify({ id: employee.id, name: employee.name }));
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
  const workerFiles = departmentFiles.filter(f => f.departmentId === employee.departmentId || f.departmentId === 'all');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32 overflow-x-hidden font-['Cairo']" dir="rtl">
      {/* مؤشر معالجة الموقع */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <Loader2 size={64} className="animate-spin text-blue-500 mb-4" />
          <p className="font-bold text-lg animate-pulse">جاري تحديد موقعك الجغرافي الموثق...</p>
          <p className="text-xs text-slate-400 mt-2">يرجى الانتظار قليلاً لضمان الدقة</p>
        </div>
      )}

      <header className="bg-white border-b px-6 py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={28} />}
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-[11px] uppercase tracking-widest leading-none">{companyConfig.name}</h1>
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter mt-1">Smart Worker App</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-3.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-90"><LogOut size={22} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900 p-8 rounded-[4rem] shadow-2xl border-4 border-slate-800 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
               
               <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${currentStatus === 'IN' ? 'bg-emerald-500 shadow-emerald-500' : 'bg-red-500 shadow-red-500'}`} />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">
                       {currentStatus === 'IN' ? 'أنت الآن: في العمل' : 'أنت الآن: خارج العمل'}
                     </span>
                  </div>
                  <Cpu className="text-slate-700" size={24} />
               </div>

               <div className="grid grid-cols-1 gap-5 relative z-10">
                  <button 
                    onClick={() => handleAttendanceClick('IN')} 
                    disabled={currentStatus === 'IN'}
                    className={`group/btn transition-all p-7 rounded-[2.5rem] flex items-center justify-between shadow-lg ${currentStatus === 'IN' ? 'bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600'}`}
                  >
                     <div className="flex flex-col items-start">
                        <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${currentStatus === 'IN' ? 'text-slate-500' : 'text-emerald-400 group-hover/btn:text-white'}`}>Punch In</span>
                        <span className="text-white text-lg font-black">تسجيل دخول</span>
                     </div>
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${currentStatus === 'IN' ? 'bg-slate-700' : 'bg-emerald-500 shadow-emerald-500/20'}`}><Zap size={28} /></div>
                  </button>

                  <button 
                    onClick={() => handleAttendanceClick('OUT')} 
                    disabled={currentStatus === 'OUT'}
                    className={`group/btn transition-all p-7 rounded-[2.5rem] flex items-center justify-between shadow-lg ${currentStatus === 'OUT' ? 'bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-red-600/10 border border-red-500/30 hover:bg-red-600'}`}
                  >
                     <div className="flex flex-col items-start">
                        <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${currentStatus === 'OUT' ? 'text-slate-500' : 'text-red-400 group-hover/btn:text-white'}`}>Punch Out</span>
                        <span className="text-white text-lg font-black">تسجيل انصراف</span>
                     </div>
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${currentStatus === 'OUT' ? 'bg-slate-700' : 'bg-red-500 shadow-red-500/20'}`}><LogOut size={28} /></div>
                  </button>
               </div>

               <div className="mt-8 flex justify-center items-center gap-6 text-slate-600 relative z-10">
                  <div className="flex items-center gap-2"><Clock size={14} /><span className="text-[10px] font-black uppercase">{new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</span></div>
                  <div className="w-1 h-1 bg-slate-700 rounded-full" />
                  <div className="flex items-center gap-2"><Activity size={14} /><span className="text-[10px] font-black uppercase">GPS Secured</span></div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">موقع العمل</p>
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs"><Navigation size={14} /><span className="truncate">{employee.workplace || 'الموقع العام'}</span></div>
               </div>
               <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">الوردية</p>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs"><Clock size={14} /><span>{employee.shiftStart || '08:00'} - {employee.shiftEnd || '16:00'}</span></div>
               </div>
            </div>
          </div>
        )}

        {/* Tab Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-800">المستندات</h3>
                <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-lg"><Inbox size={24} /></div>
             </div>
             <div className="space-y-4">
                {workerFiles.length > 0 ? workerFiles.map(file => (
                  <div key={file.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-slate-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><FileText size={24} /></div>
                        <div>
                           <h4 className="text-sm font-bold text-slate-800">{file.name}</h4>
                           <p className="text-[9px] text-slate-400 font-black uppercase mt-1">{file.type} • {file.uploadDate}</p>
                        </div>
                     </div>
                     <a href={file.url} download className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Clock size={20} /></a>
                  </div>
                )) : <div className="text-center py-20 opacity-30"><p className="text-[10px] font-black uppercase">لا توجد مستندات</p></div>}
             </div>
          </div>
        )}

        {/* باقي التبويبات (ID, Chat, Reports) تبقى كما هي مع التأكد من الأيقونات */}
        {activeTab === 'chat' && (
           <div className="flex flex-col h-[65vh] bg-white rounded-[3rem] border shadow-xl overflow-hidden animate-in fade-in">
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                 <h3 className="font-black text-[10px] uppercase tracking-widest">غرفة الدردشة</h3>
                 <span className="bg-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">{employee.departmentId}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                 {chatMessages.filter(m => m.departmentId === 'all' || m.departmentId === employee.departmentId).map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-sm ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>
                          <p className="text-xs font-bold">{msg.text}</p>
                       </div>
                       <span className="text-[8px] text-slate-400 mt-1 font-black px-2">{msg.timestamp}</span>
                    </div>
                 ))}
              </div>
              <div className="p-4 border-t bg-white flex gap-3">
                 <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold" placeholder="اكتب رسالة..." />
                 <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Date.now().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-3 bg-blue-600 text-white rounded-2xl active:scale-90 transition-all"><Zap size={20}/></button>
              </div>
           </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-5">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-3"><FileText className="text-blue-600" size={24}/> رفع تقرير</h3>
                <textarea placeholder="اكتب تقريرك هنا..." className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-bold min-h-[150px] border-none resize-none" value={reportContent} onChange={e => setReportContent(e.target.value)} />
                <button onClick={async () => { if(!reportContent) return; setIsSendingReport(true); await onNewReport({ id: Date.now().toString(), employeeId: employee.id, employeeName: employee.name, departmentId: employee.departmentId, content: reportContent, type: 'text', timestamp: new Date().toISOString() }); setReportContent(''); setIsSendingReport(false); alert('تم الإرسال'); }} disabled={isSendingReport} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 flex items-center justify-center gap-3">{isSendingReport ? <Loader2 size={20} className="animate-spin" /> : 'إرسال التقرير'}</button>
             </div>
          </div>
        )}

        {activeTab === 'id' && (
           <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in zoom-in-95">
              <div className={`relative w-full max-w-[340px] aspect-[1.58/1] transition-all duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                  <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 to-blue-900 p-8 text-white rounded-[2.5rem] shadow-2xl flex flex-col justify-between border border-white/10">
                     <div className="flex justify-between items-start"><ShieldCheck className="text-blue-400" size={32} /><div className="bg-emerald-500/20 px-3 py-1 rounded-full text-[8px] font-black text-emerald-400 uppercase">Staff Pass</div></div>
                     <div className="flex gap-4 items-center"><img src={employee.avatar} className="w-16 h-16 rounded-2xl border-2 border-white/20 object-cover shadow-xl" /><div><h2 className="text-lg font-black tracking-tight">{employee.name}</h2><p className="text-[10px] text-blue-400 font-black uppercase mt-1">{employee.role}</p></div></div>
                     <div className="flex justify-between items-end"><div><p className="text-[8px] font-black text-slate-400 uppercase">ID No.</p><p className="text-[10px] font-mono font-bold text-slate-200 uppercase">{employee.id.slice(0,8)}</p></div><div className="bg-white p-1 rounded-lg w-12 h-12"><img src={qrImageUrl} className="w-full h-full object-contain" /></div></div>
                  </div>
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white p-6 text-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col border-2 border-slate-200">
                     <div className="border-b pb-2 flex justify-between items-center mb-4"><span className="text-[9px] font-black uppercase">تفاصيل الموظف</span><span className="text-[8px] font-black text-slate-400 uppercase">{companyConfig.name}</span></div>
                     <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                        <div><p className="text-[8px] text-slate-400 uppercase">الموقع</p><p>{employee.workplace || 'الموقع العام'}</p></div>
                        <div><p className="text-[8px] text-slate-400 uppercase">الهاتف</p><p>{employee.phone}</p></div>
                     </div>
                     <div className="mt-auto flex justify-center"><div className="bg-slate-50 p-2 rounded-xl border"><img src={qrImageUrl} className="w-16 h-16" /></div></div>
                  </div>
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t px-2 py-4 flex justify-around items-center z-40 pb-10 shadow-[0_-15px_50px_rgba(0,0,0,0.1)] rounded-t-[3.5rem]">
        {[
          { id: 'attendance', icon: Clock, label: 'الرئيسية' },
          { id: 'documents', icon: Inbox, label: 'المستندات' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'id', icon: User, label: 'البطاقة' }
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1.5 transition-all p-3 rounded-[2rem] min-w-[65px] ${isActive ? 'text-blue-900 bg-blue-50' : 'text-slate-400'}`}>
              <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {showCamera && <CameraView onCapture={async (photo) => {
         setShowCamera(false);
         if (cameraMode === 'attendance') {
            setIsProcessing(true); // بدء حالة التحميل للجلب من الـ GPS
            
            // خيارات GPS دقيقة
            const geoOptions = {
               enableHighAccuracy: true,
               timeout: 10000,
               maximumAge: 0
            };

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
               localStorage.setItem(`status_${employee.id}`, isCapturing!);
               setIsCapturing(null);
               setIsProcessing(false);
               alert(`تم تسجيل ${isCapturing === 'IN' ? 'الحضور' : 'الانصراف'} بنجاح!`);
            }, (err) => {
               setIsProcessing(false);
               let errorMsg = 'فشل تحديد الموقع.';
               if (err.code === 1) errorMsg = 'يرجى إعطاء صلاحية الموقع (GPS) للمتصفح.';
               if (err.code === 3) errorMsg = 'انتهى وقت محاولة تحديد الموقع، يرجى المحاولة مرة أخرى.';
               alert(errorMsg);
               setIsCapturing(null);
            }, geoOptions);
         } else {
            setAttachment({ name: `صورة_ميدانية_${Date.now()}.jpg`, url: photo });
         }
      }} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}
      
      <style>{`.backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .transform-style-3d { transform-style: preserve-3d; }`}</style>
    </div>
  );
};

export default WorkerDashboard;
