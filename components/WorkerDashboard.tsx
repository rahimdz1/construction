
import React, { useState } from 'react';
import { 
  LogOut, Clock, ShieldCheck, Navigation, Camera, Zap, 
  MessageSquare, FileText, User, Loader2, Activity, Cpu, 
  Plus, Send, Image as ImageIcon, CheckCircle2 
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
  employee, companyConfig, onLogout, onNewLog, chatMessages, onSendMessage, onNewReport
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'id' | 'reports' | 'chat'>('attendance');
  const [showCamera, setShowCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState<'IN' | 'OUT' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [chatInput, setChatInput] = useState('');

  const [currentStatus, setCurrentStatus] = useState<'IN' | 'OUT'>(() => {
    return (localStorage.getItem(`status_v12_${employee.id}`) as 'IN' | 'OUT') || 'OUT';
  });

  const handleAttendanceClick = (type: 'IN' | 'OUT') => {
    setIsCapturing(type);
    setShowCamera(true);
  };

  const handleSendReport = async () => {
    if (!reportContent.trim()) return;
    const newReport: ReportEntry = {
      id: `rep_${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      departmentId: employee.departmentId,
      content: reportContent,
      type: 'text',
      timestamp: new Date().toISOString()
    };
    await onNewReport(newReport);
    setReportContent('');
    alert('تم إرسال التقرير بنجاح');
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: employee.id,
      senderName: employee.name,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      type: 'group',
      departmentId: employee.departmentId
    };
    await onSendMessage(newMsg);
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 overflow-x-hidden font-['Cairo']" dir="rtl">
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-2xl flex flex-col items-center justify-center text-white p-8 text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl animate-pulse">
            <Activity size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-black mb-4 uppercase tracking-widest">توثيق البيانات</h2>
          <Loader2 className="animate-spin text-blue-500 mt-10" size={32} />
        </div>
      )}

      <header className="bg-white border-b px-6 py-5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 overflow-hidden">
            {companyConfig.logo ? <img src={companyConfig.logo} className="w-full h-full object-cover" /> : <ShieldCheck size={28} />}
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-[11px] uppercase tracking-widest leading-none truncate max-w-[150px]">{companyConfig.name}</h1>
            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{employee.role}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-4 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-2xl transition-all active:scale-90 shadow-sm"><LogOut size={22} /></button>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl border-4 border-slate-800 relative overflow-hidden">
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
                    className={`p-10 rounded-[3rem] flex items-center justify-between transition-all active:scale-95 ${currentStatus === 'IN' ? 'bg-slate-800/50 opacity-30 cursor-not-allowed grayscale' : 'bg-emerald-600 hover:bg-emerald-500 shadow-2xl text-white'}`}
                  >
                     <span className="text-2xl font-black text-right">تسجيل دخول</span>
                     <Zap size={32}/>
                  </button>

                  <button 
                    onClick={() => handleAttendanceClick('OUT')}
                    disabled={currentStatus === 'OUT'}
                    className={`p-10 rounded-[3rem] flex items-center justify-between transition-all active:scale-95 ${currentStatus === 'OUT' ? 'bg-slate-800/50 opacity-30 cursor-not-allowed grayscale' : 'bg-red-600 hover:bg-red-500 shadow-2xl text-white'}`}
                  >
                     <span className="text-2xl font-black text-right">تسجيل انصراف</span>
                     <LogOut size={32}/>
                  </button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">موقع العمل الحالي</h3>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                    <Navigation className="text-blue-600" size={20} />
                    <p className="text-sm font-bold text-slate-700">{employee.workplace || 'لم يتم تحديد موقع'}</p>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-800 mb-6">تقديم تقرير ميداني</h3>
                <textarea 
                  className="w-full h-40 bg-slate-50 rounded-3xl p-6 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-4 resize-none"
                  placeholder="اكتب تفاصيل التقرير أو حالة الموقع هنا..."
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                />
                <button 
                  onClick={handleSendReport}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send size={18} /> إرسال التقرير
                </button>
             </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[65vh] flex flex-col bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
              <div className="bg-slate-900 p-4 text-white text-center font-black text-xs uppercase tracking-widest">غرفة المحادثة</div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === employee.id ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-bold ${msg.senderId === employee.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none shadow-sm'}`}>
                            <p className="text-[9px] opacity-60 mb-1">{msg.senderName}</p>
                            {msg.text}
                        </div>
                        <span className="text-[8px] text-slate-400 mt-1 font-black">{msg.timestamp}</span>
                    </div>
                  ))}
              </div>
              <div className="p-4 bg-white border-t flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-slate-100 rounded-2xl px-4 text-sm font-bold outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="اكتب رسالة..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  />
                  <button onClick={handleSendChat} className="p-4 bg-blue-600 text-white rounded-2xl shadow-md active:scale-90 transition-all"><Plus size={20}/></button>
              </div>
          </div>
        )}

        {activeTab === 'id' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
             <div className="bg-gradient-to-br from-slate-900 to-blue-900 p-8 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-28 h-28 rounded-[2.5rem] border-4 border-white/20 p-1 mb-6 shadow-xl overflow-hidden">
                        <img src={employee.avatar || `https://i.pravatar.cc/150?u=${employee.id}`} className="w-full h-full object-cover rounded-[2rem]" />
                    </div>
                    <h2 className="text-xl font-black mb-1">{employee.name}</h2>
                    <p className="text-blue-300 font-bold text-xs uppercase tracking-widest mb-6">{employee.role}</p>
                    
                    <div className="w-full space-y-3 bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="text-white/40">المعرف الرقمي</span>
                            <span>{employee.id}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="text-white/40">تاريخ الانضمام</span>
                            <span>{employee.joinedAt || '2024'}</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 w-full flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">بطاقة هوية معتمدة</span>
                    </div>
                </div>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-around items-center z-40 pb-10 rounded-t-[3.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[
          { id: 'attendance', icon: Clock, label: 'الرئيسية' },
          { id: 'reports', icon: FileText, label: 'التقارير' },
          { id: 'chat', icon: MessageSquare, label: 'الدردشة' },
          { id: 'id', icon: User, label: 'هويتي' }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id as any)} 
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeTab === item.id ? 'text-blue-600 bg-blue-50 scale-110 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
          </button>
        ))}
      </nav>

      {showCamera && <CameraView onCapture={async (capturedPhoto) => {
         setShowCamera(false);
         setIsProcessing(true);
         
         navigator.geolocation.getCurrentPosition(async (pos) => {
            const newLog: LogEntry = { 
              id: `log_${Date.now()}_${employee.id}`,
              employeeId: employee.id,
              name: employee.name,
              timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
              type: isCapturing!,
              photos: capturedPhoto, 
              location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
              status: AttendanceStatus.PRESENT,
              departmentId: employee.departmentId 
            };
            
            await onNewLog(newLog);
            setCurrentStatus(isCapturing!);
            localStorage.setItem(`status_v12_${employee.id}`, isCapturing!);
            setIsProcessing(false);
            setIsCapturing(null);
         }, (err) => {
            setIsProcessing(false);
            setIsCapturing(null);
            alert('يرجى تفعيل نظام تحديد المواقع (GPS) للمتابعة');
         }, { enableHighAccuracy: true });
      }} onCancel={() => { setShowCamera(false); setIsCapturing(null); }} />}
    </div>
  );
};

export default WorkerDashboard;
