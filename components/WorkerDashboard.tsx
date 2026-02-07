
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  LogOut, Clock, CheckCircle2, User, MessageSquare, Send, FileText, 
  Briefcase, QrCode, ShieldCheck, MapPin, Map as MapIcon, Upload, 
  Link as LinkIcon, Paperclip, ChevronRight, Info
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
  const [reportLink, setReportLink] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  // تشغيل صوت عند وصول رسالة جديدة
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.senderId !== employee.id) {
        new Audio(NOTIFICATION_SOUNDS.MESSAGE).play().catch(() => {});
      }
    }
  }, [chatMessages.length]);

  const qrCodeUrl = useMemo(() => {
    const data = JSON.stringify({ id: employee.id, name: employee.name, dept: employee.departmentId });
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=0f172a&margin=1`;
  }, [employee]);

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

  const handleAttendance = async (photo: string) => {
    if (!isCapturing) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: employee.id,
        name: employee.name,
        timestamp: new Date().toLocaleTimeString(),
        type: isCapturing,
        photo,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        status: AttendanceStatus.PRESENT,
        departmentId: employee.departmentId
      };
      await onNewLog(newLog);
      setIsCapturing(null);
      setShowCamera(false);
    });
  };

  const handleSendReport = async () => {
    if (!reportContent.trim() && !reportLink.trim()) return;
    const report: ReportEntry = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      employeeName: employee.name,
      content: reportType === 'link' ? reportLink : reportContent,
      type: reportType,
      timestamp: new Date().toISOString(),
      departmentId: employee.departmentId,
      attachmentUrl: reportType === 'link' ? reportLink : undefined
    };
    await onNewReport(report);
    setReportContent('');
    setReportLink('');
    new Audio(NOTIFICATION_SOUNDS.REPORT).play().catch(() => {});
    alert('تم إرسال التقرير بنجاح');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32" dir="rtl">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <h1 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{companyConfig.name}</h1>
        </div>
        <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner"><Clock size={32} /></div>
              <h2 className="text-xl font-bold text-slate-800 mb-6">{t.attendance}</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setIsCapturing('IN'); setShowCamera(true); }} className="bg-emerald-600 text-white py-5 rounded-3xl font-bold flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"><CheckCircle2 size={24} /> {t.checkIn}</button>
                <button onClick={() => { setIsCapturing('OUT'); setShowCamera(true); }} className="bg-red-600 text-white py-5 rounded-3xl font-bold flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"><LogOut size={24} /> {t.checkOut}</button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-blue-900 p-6 rounded-[2.5rem] shadow-xl text-white space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <Briefcase size={20} className="text-blue-400" />
                <h3 className="font-bold text-xs uppercase tracking-widest">بيانات التكليف الميداني</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                  <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><MapPin size={20} /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">الموقع المخصص:</p>
                    <p className="text-sm font-bold text-white">{employee.workplace || 'لم يتم التحديد'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">بداية الوردية:</p>
                    <p className="text-sm font-bold text-white">{employee.shiftStart || '08:00'}</p>
                  </div>
                  <div className="flex-1 bg-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">نهاية الوردية:</p>
                    <p className="text-sm font-bold text-white">{employee.shiftEnd || '16:00'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 animate-in zoom-in perspective-1000">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Info size={14}/> اضغط على البطاقة لتدويرها</p>
            <div 
              className={`relative w-full max-w-[340px] aspect-[1.6/1] transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 text-white rounded-[2rem] shadow-2xl flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <div className="flex justify-between items-start relative z-10">
                    <ShieldCheck className="text-blue-400" size={32} />
                    <p className="text-[9px] font-bold opacity-50 uppercase tracking-[0.2em]">{companyConfig.name}</p>
                  </div>
                  <div className="flex gap-4 items-center relative z-10">
                    <div className="w-20 h-20 rounded-2xl border-2 border-white/20 p-1 bg-white/5"><img src={employee.avatar} className="w-full h-full rounded-xl object-cover" /></div>
                    <div>
                      <h2 className="text-lg font-bold truncate">{employee.name}</h2>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{employee.role}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <div className="text-[9px] font-bold opacity-60">ID: {employee.id.slice(0,8)}</div>
                    <div className="w-14 h-14 bg-white rounded-xl p-1 shadow-lg"><img src={qrCodeUrl} className="w-full h-full" /></div>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white p-6 text-slate-800 rounded-[2rem] shadow-2xl flex flex-col border-2 border-blue-600/20">
                   <div className="flex-1 space-y-4">
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                         <h3 className="font-bold text-xs text-blue-600 uppercase">تفاصيل الوظيفية</h3>
                         <QrCode size={18} className="text-slate-300" />
                      </div>
                      <div className="space-y-3">
                         <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold">رئيس القسم:</span><span className="text-slate-800 font-bold">م. علي صالح</span></div>
                         <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold">القسم:</span><span className="text-slate-800 font-bold">{employee.departmentId}</span></div>
                         <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold">الموقع الميداني:</span><span className="text-slate-800 font-bold text-left max-w-[150px] truncate">{employee.workplace}</span></div>
                         <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold">تاريخ الالتحاق:</span><span className="text-slate-800 font-bold">2024/01/15</span></div>
                      </div>
                   </div>
                   <div className="pt-4 border-t border-slate-100 text-center">
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">تستخدم هذه البطاقة للأغراض الأمنية والميدانية فقط</p>
                   </div>
                </div>
            </div>
            <style>{`
              .perspective-1000 { perspective: 1000px; }
              .transform-style-3d { transform-style: preserve-3d; }
              .backface-hidden { backface-visibility: hidden; }
              .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-8 rounded-[3rem] border shadow-sm animate-in fade-in space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText size={22} className="text-blue-600" /> تقديم تقرير ميداني</h2>
            
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
               <button onClick={() => setReportType('text')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all ${reportType === 'text' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><FileText size={16}/> نص</button>
               <button onClick={() => setReportType('file')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all ${reportType === 'file' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><Paperclip size={16}/> ملف</button>
               <button onClick={() => setReportType('link')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all ${reportType === 'link' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><LinkIcon size={16}/> رابط</button>
            </div>

            {reportType === 'text' && (
              <textarea value={reportContent} onChange={e => setReportContent(e.target.value)} className="w-full h-40 bg-slate-50 border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none shadow-inner" placeholder="اكتب ملاحظاتك الميدانية هنا..." />
            )}

            {reportType === 'link' && (
              <div className="space-y-4">
                <input value={reportLink} onChange={e => setReportLink(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-blue-600 outline-none shadow-inner" placeholder="أدخل رابط المستند أو التقرير..." />
                <textarea value={reportContent} onChange={e => setReportContent(e.target.value)} className="w-full h-24 bg-slate-50 border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-blue-600 outline-none shadow-inner" placeholder="وصف الرابط..." />
              </div>
            )}

            {reportType === 'file' && (
              <div className="border-4 border-dashed border-slate-100 rounded-3xl p-10 text-center space-y-4 bg-slate-50/50">
                 <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><Upload size={32}/></div>
                 <div>
                    <p className="text-sm font-bold text-slate-800">اختر ملفاً من جهازك</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">PDF, Excel, JPG (Max 10MB)</p>
                 </div>
                 <input type="file" className="hidden" id="fileInput" />
                 <label htmlFor="fileInput" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-700 transition-colors">تصفح الملفات</label>
              </div>
            )}

            <button onClick={handleSendReport} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"><Send size={20} /> إرسال التقرير للمراجعة</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[65vh] bg-white rounded-[2.5rem] border shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
             <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h3 className="font-bold text-[11px] uppercase tracking-widest">غرفة دردشة القسم</h3>
                </div>
                <MessageSquare size={18} className="text-blue-400" />
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] shadow-sm ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                      <p className={`text-[8px] font-bold mb-1 uppercase tracking-tighter ${msg.senderId === employee.id ? 'text-white/60' : 'text-blue-600'}`}>{msg.senderName}</p>
                      <p className="font-bold leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[8px] text-slate-400 mt-1.5 font-bold px-2">{msg.timestamp}</span>
                  </div>
                ))}
             </div>
             <div className="p-4 bg-white border-t flex gap-3 items-center">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold outline-none shadow-inner focus:ring-1 focus:ring-blue-200" placeholder="اكتب رسالتك..." />
                <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Date.now().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all"><Send size={20} /></button>
             </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[55vh] bg-white rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden animate-in fade-in p-2 relative">
             <div className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-slate-100 flex items-center gap-2">
                <MapPin size={16} className="text-red-500" />
                <span className="text-[10px] font-bold text-slate-800">{employee.workplace}</span>
             </div>
            <div ref={mapContainerRef} className="w-full h-full rounded-[2.5rem]" />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t px-2 py-3 flex justify-around items-center z-40 pb-8 shadow-2xl rounded-t-[3rem]">
        {[
          { id: 'attendance', icon: Clock, label: 'الرئيسية' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'id', icon: User, label: 'الهوية' },
          { id: 'map', icon: MapIcon, label: 'الموقع' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1.5 transition-all p-2 rounded-2xl ${activeTab === item.id ? 'text-blue-600 scale-110 bg-blue-50/50' : 'text-slate-300 hover:text-slate-400'}`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {showCamera && <CameraView onCapture={handleAttendance} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}
    </div>
  );
};

export default WorkerDashboard;
