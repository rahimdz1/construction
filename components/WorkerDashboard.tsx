
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { LogOut, Clock, CheckCircle2, User, MessageSquare, Send, FileText, Briefcase, QrCode, ShieldCheck, MapPin, Map as MapIcon, Upload } from 'lucide-react';
import { Employee, AttendanceStatus, LogEntry, ReportEntry, ChatMessage, FileEntry, Language, CompanyConfig, Announcement } from '../types';
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
  employee, chatMessages, companyConfig,
  lang, onSendMessage, onLogout, onNewLog, onNewReport
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'id' | 'reports' | 'chat' | 'map'>('attendance');
  const [showCamera, setShowCamera] = useState(false);
  const [reportType, setReportType] = useState<'text' | 'link' | 'file'>('text');
  const [reportContent, setReportContent] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

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
    if (!reportContent.trim()) return;
    const report: ReportEntry = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      employeeName: employee.name,
      content: reportContent,
      type: reportType,
      timestamp: new Date().toISOString(),
      departmentId: employee.departmentId
    };
    await onNewReport(report);
    setReportContent('');
    alert('تم إرسال التقرير');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-contain" /> : <ShieldCheck size={24} />}
          </div>
          <h1 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{companyConfig.name}</h1>
        </div>
        <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in">
            {/* أزرار الحضور */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner"><Clock size={32} /></div>
              <h2 className="text-xl font-bold text-slate-800 mb-6">{t.attendance}</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setIsCapturing('IN'); setShowCamera(true); }} className="bg-emerald-600 text-white py-5 rounded-3xl font-bold flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"><CheckCircle2 size={24} /> {t.checkIn}</button>
                <button onClick={() => { setIsCapturing('OUT'); setShowCamera(true); }} className="bg-red-600 text-white py-5 rounded-3xl font-bold flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all"><LogOut size={24} /> {t.checkOut}</button>
              </div>
            </div>

            {/* معلومات الوردية والموقع - جديد */}
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
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 animate-in zoom-in">
            <div className="relative w-full max-w-[340px] aspect-[1.6/1] shadow-2xl rounded-[2rem] overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 text-white flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <ShieldCheck className="text-blue-400" size={32} />
                    <p className="text-[9px] font-bold opacity-50 uppercase tracking-[0.2em]">{companyConfig.name}</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <img src={employee.avatar} className="w-16 h-16 rounded-2xl border-2 border-white/20 object-cover" />
                    <div>
                      <h2 className="text-sm font-bold truncate">{employee.name}</h2>
                      <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">{employee.role}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] opacity-40">DEPT: {employee.departmentId}</span>
                    <div className="w-14 h-14 bg-white rounded-xl p-1"><img src={qrCodeUrl} className="w-full h-full" /></div>
                  </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><FileText size={20} className="text-blue-600" /> تقرير ميداني</h2>
            <textarea value={reportContent} onChange={e => setReportContent(e.target.value)} className="w-full h-40 bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-600 mb-4 outline-none resize-none shadow-inner" placeholder="صف سير الأعمال أو المشاكل هنا..." />
            <button onClick={handleSendReport} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-lg active:scale-95 transition-all"><Send size={18} /> إرسال التقرير</button>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[65vh] bg-white rounded-[2rem] border shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
             <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-slate-800 text-[11px]">دردشة القسم</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] shadow-sm ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                      <p className="text-[8px] font-bold opacity-60 mb-1">{msg.senderName}</p>
                      {msg.text}
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-4 border-t flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-xl px-4 text-xs outline-none shadow-inner" placeholder="رسالة..." />
                <button onClick={() => { if(!chatInput.trim()) return; onSendMessage({id: Date.now().toString(), senderId: employee.id, senderName: employee.name, text: chatInput, timestamp: new Date().toLocaleTimeString(), type: 'group', departmentId: employee.departmentId}); setChatInput(''); }} className="p-3 bg-blue-600 text-white rounded-xl shadow-md"><Send size={16} /></button>
             </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[50vh] bg-white rounded-[2.5rem] border shadow-sm overflow-hidden animate-in fade-in p-2">
            <div ref={mapContainerRef} className="w-full h-full rounded-3xl" />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t px-2 py-3 flex justify-around items-center z-40 pb-7 shadow-lg rounded-t-[2.5rem]">
        {[
          { id: 'attendance', icon: Clock, label: 'الرئيسية' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'id', icon: User, label: 'الهوية' },
          { id: 'map', icon: MapIcon, label: 'الموقع' }
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} /><span className="text-[9px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {showCamera && <CameraView onCapture={handleAttendance} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}
    </div>
  );
};

export default WorkerDashboard;
