
import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, Clock, CheckCircle2, User, MessageSquare, Send, FileText, 
  Briefcase, QrCode, ShieldCheck, MapPin, Map as MapIcon, Info, 
  Paperclip, Image as ImageIcon, Check, Loader2, Download,
  Cpu, Activity, Zap, Navigation, Camera, Inbox
} from 'lucide-react';
import { 
  Employee, AttendanceStatus, LogEntry, ReportEntry, ChatMessage, 
  FileEntry, Language, CompanyConfig, Announcement 
} from '../types';
import { TRANSLATIONS } from '../constants';
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
  lang, onSendMessage, onLogout, onNewLog, onNewReport
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'id' | 'reports' | 'chat' | 'documents'>('attendance');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'attendance' | 'report'>('attendance');
  const [reportContent, setReportContent] = useState('');
  const [attachment, setAttachment] = useState<{name: string, url: string} | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachment({ name: file.name, url: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const qrData = encodeURIComponent(JSON.stringify({
    id: employee.id,
    name: employee.name,
    wp: employee.workplace || "Main Site"
  }));
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  // تصفية الملفات الخاصة بقسم العامل
  const workerFiles = departmentFiles.filter(f => f.departmentId === employee.departmentId || f.departmentId === 'all');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32 overflow-x-hidden font-['Cairo']" dir="rtl">
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
        <button onClick={onLogout} className="p-3.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-2xl shadow-sm transition-all active:scale-90"><LogOut size={22} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900 p-8 rounded-[4rem] shadow-2xl border-4 border-slate-800 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
               <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                     <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active System</span>
                  </div>
                  <Cpu className="text-slate-700" size={24} />
               </div>
               <div className="text-center mb-10 relative z-10">
                  <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Access Terminal</h2>
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">Biometric Auth System</p>
               </div>
               <div className="grid grid-cols-1 gap-5 relative z-10">
                  <button onClick={() => { setIsCapturing('IN'); setCameraMode('attendance'); setShowCamera(true); }} className="group/btn bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600 transition-all p-7 rounded-[2.5rem] flex items-center justify-between shadow-lg">
                     <div className="flex flex-col items-start">
                        <span className="text-emerald-400 group-hover/btn:text-white text-[9px] font-black uppercase tracking-widest mb-1">Punch In</span>
                        <span className="text-white text-lg font-black">تسجيل دخول</span>
                     </div>
                     <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20"><Zap size={28} /></div>
                  </button>
                  <button onClick={() => { setIsCapturing('OUT'); setCameraMode('attendance'); setShowCamera(true); }} className="group/btn bg-red-600/10 border border-red-500/30 hover:bg-red-600 transition-all p-7 rounded-[2.5rem] flex items-center justify-between shadow-lg">
                     <div className="flex flex-col items-start">
                        <span className="text-red-400 group-hover/btn:text-white text-[9px] font-black uppercase tracking-widest mb-1">Punch Out</span>
                        <span className="text-white text-lg font-black">تسجيل انصراف</span>
                     </div>
                     <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-500/20"><LogOut size={28} /></div>
                  </button>
               </div>
               <div className="mt-8 flex justify-center items-center gap-6 text-slate-600 relative z-10">
                  <div className="flex items-center gap-2"><Clock size={14} /><span className="text-[10px] font-black uppercase">{new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'})}</span></div>
                  <div className="w-1 h-1 bg-slate-700 rounded-full" />
                  <div className="flex items-center gap-2"><Activity size={14} /><span className="text-[10px] font-black uppercase">Live Link</span></div>
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

        {/* تبويب المستندات الجديد */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
             <div className="flex items-center justify-between px-2">
                <div>
                   <h3 className="text-2xl font-black text-slate-800">صندوق المستندات</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المستلمة من الإدارة ورؤساء الأقسام</p>
                </div>
                <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-lg shadow-blue-100">
                   <Inbox size={24} />
                </div>
             </div>

             <div className="space-y-4">
                {workerFiles.length > 0 ? workerFiles.map(file => (
                  <div key={file.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm hover:border-blue-200 transition-all flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-slate-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                           <FileText size={24} />
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-slate-800">{file.name}</h4>
                           <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-1">{file.type} • {file.uploadDate}</p>
                        </div>
                     </div>
                     <a href={file.url} download className="p-3.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <Download size={20} />
                     </a>
                  </div>
                )) : (
                  <div className="text-center py-20 opacity-30">
                     <Info size={48} className="mx-auto mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-[0.3em]">لا توجد مستندات مستلمة حالياً</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in zoom-in-95 duration-700 perspective-1000">
            <div className="text-center"><h3 className="text-xl font-black text-slate-800 mb-1">البطاقة التعريفية الرقمية</h3><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">اضغط لقلب البطاقة</p></div>

            <div className={`relative w-full max-w-[360px] aspect-[1.58/1] transition-all duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180 scale-105' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-8 text-white rounded-[2.5rem] shadow-2xl flex flex-col justify-between border border-white/10 overflow-hidden">
                   <div className="flex justify-between items-start relative z-10">
                      <ShieldCheck className="text-blue-400" size={32} />
                      <div className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 text-[8px] font-black text-emerald-400 uppercase tracking-widest">Staff Pass</div>
                   </div>
                   <div className="flex gap-6 items-center relative z-10">
                      <img src={employee.avatar} className="w-20 h-20 rounded-2xl border-2 border-white/20 object-cover shadow-xl" />
                      <div><h2 className="text-lg font-black tracking-tight leading-tight">{employee.name}</h2><p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1">{employee.role}</p></div>
                   </div>
                   <div className="flex justify-between items-end relative z-10">
                      <div><p className="text-[8px] font-black text-slate-400 uppercase">ID No.</p><p className="text-[10px] font-mono font-bold tracking-widest text-slate-200 uppercase">{employee.id.slice(0,10)}</p></div>
                      <div className="bg-white p-1 rounded-xl w-14 h-14 shadow-xl"><img src={qrImageUrl} className="w-full h-full object-contain" /></div>
                   </div>
                </div>

                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white p-5 text-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col border-2 border-slate-200 overflow-hidden">
                   <div className="border-b pb-2 flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5"><QrCode size={16} className="text-blue-600" /><span className="text-[9px] font-black uppercase tracking-widest">بيانات الموظف</span></div>
                      <span className="text-[8px] font-black text-slate-400 uppercase truncate max-w-[150px]">{companyConfig.name}</span>
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                         <div className="flex flex-col"><span className="text-[7px] font-black text-slate-400 uppercase">الموقع</span><p className="text-[10px] font-bold text-blue-600 truncate">{employee.workplace || "الموقع العام"}</p></div>
                         <div className="flex flex-col"><span className="text-[7px] font-black text-slate-400 uppercase">القسم</span><p className="text-[10px] font-bold text-slate-800 truncate">{employee.departmentId}</p></div>
                         <div className="flex flex-col"><span className="text-[7px] font-black text-slate-400 uppercase">الوردية</span><p className="text-[10px] font-bold text-slate-800">{employee.shiftStart} - {employee.shiftEnd}</p></div>
                         <div className="flex flex-col"><span className="text-[7px] font-black text-slate-400 uppercase">الهاتف</span><p className="text-[10px] font-bold text-slate-800">{employee.phone}</p></div>
                      </div>
                   </div>
                   <div className="mt-auto border-t pt-2 flex items-center justify-between">
                      <div className="bg-slate-50 p-1 rounded-lg border border-slate-100 shrink-0"><img src={qrImageUrl} className="w-14 h-14 object-contain" /></div>
                      <div className="flex-1 text-left flex flex-col items-end pr-4">
                         <p className="text-[7px] font-black text-slate-300 uppercase mb-1">ID Signature</p>
                         <div className="w-20 h-6 bg-slate-50 border border-dashed border-slate-200 rounded flex items-center justify-center"><span className="text-[8px] font-mono italic text-slate-400">Verified</span></div>
                      </div>
                   </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[65vh] bg-white rounded-[3rem] border shadow-xl overflow-hidden animate-in fade-in duration-500">
             <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><MessageSquare size={16} className="text-blue-400"/> قناة التواصل</h3>
                <span className="bg-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">{employee.departmentId}</span>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {chatMessages.filter(m => m.departmentId === 'all' || m.departmentId === employee.departmentId).map(msg => (
                   <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-sm ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>
                         <p className="text-xs font-bold leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[8px] text-slate-400 mt-1 font-black px-2 uppercase tracking-tighter">{msg.timestamp}</span>
                   </div>
                ))}
             </div>
             <div className="p-4 border-t bg-white flex gap-3 shrink-0">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold shadow-inner focus:ring-1 focus:ring-blue-100 outline-none" placeholder="اكتب رسالة..." />
                <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Date.now().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all"><Send size={20}/></button>
             </div>
          </div>
        )}

        {activeTab === 'reports' && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border space-y-5">
                 <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight flex items-center gap-3"><FileText className="text-blue-600" size={24}/> رفع تقرير ميداني</h3>
                 <textarea placeholder="صف الإنجاز اليومي أو أي ملاحظة..." className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-bold min-h-[150px] border-none shadow-inner resize-none focus:ring-2 focus:ring-blue-100 outline-none" value={reportContent} onChange={e => setReportContent(e.target.value)} />
                 
                 {/* المعاينة للصورة المرفقة */}
                 {attachment && (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border">
                       <img src={attachment.url} className="w-full h-full object-cover" />
                       <button onClick={() => setAttachment(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-lg">
                          <LogOut size={16} />
                       </button>
                    </div>
                 )}

                 <div className="grid grid-cols-2 gap-3">
                    <label className="bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                       <Paperclip size={20} className="text-slate-500"/>
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">إرفاق ملف</span>
                       <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button onClick={() => { setCameraMode('report'); setShowCamera(true); }} className="bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all">
                       <Camera size={20} className="text-blue-600"/>
                       <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">التقاط صورة</span>
                    </button>
                 </div>

                 <button onClick={async () => { if(!reportContent && !attachment) return; setIsSending(true); await onNewReport({ id: Date.now().toString(), employeeId: employee.id, employeeName: employee.name, departmentId: employee.departmentId, content: reportContent || `مرفق من الجهاز: ${attachment?.name || 'صورة'}`, type: attachment ? 'file' : 'text', attachmentUrl: attachment?.url, attachmentName: attachment?.name || 'صورة ميدانية', timestamp: new Date().toISOString() }); setReportContent(''); setAttachment(null); setIsSending(false); alert('تم تسليم التقرير'); }} disabled={isSending} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">{isSending ? <Loader2 size={20} className="animate-spin" /> : <><Check size={20}/> إرسال التقرير</>}</button>
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
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1.5 transition-all p-3.5 rounded-[2rem] min-w-[65px] ${isActive ? 'text-blue-900 bg-blue-50/50' : 'text-slate-900'}`}>
              <item.icon size={20} strokeWidth={isActive ? 3 : 2} className={isActive ? 'animate-pulse' : 'opacity-60'} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {showCamera && <CameraView onCapture={async (photo) => {
         if (cameraMode === 'attendance') {
            navigator.geolocation.getCurrentPosition(async (pos) => {
               const newLog: LogEntry = { id: Math.random().toString(36).substr(2, 9), employeeId: employee.id, name: employee.name, timestamp: new Date().toLocaleTimeString('ar-EG'), type: isCapturing!, photo, location: { lat: pos.coords.latitude, lng: pos.coords.longitude }, status: AttendanceStatus.PRESENT, departmentId: employee.departmentId };
               await onNewLog(newLog); setIsCapturing(null); setShowCamera(false);
            }, () => alert('يرجى تفعيل الـ GPS'), { enableHighAccuracy: true });
         } else {
            // نمط التقرير - حفظ الصورة كملحق
            setAttachment({ name: `صورة_ميدانية_${Date.now()}.jpg`, url: photo });
            setShowCamera(false);
         }
      }} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}
      <style>{`.backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .transform-style-3d { transform-style: preserve-3d; } .perspective-1000 { perspective: 1000px; }`}</style>
    </div>
  );
};

export default WorkerDashboard;
