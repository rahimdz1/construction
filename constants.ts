
import { Employee, Department, UserRole, ReportEntry, ChatMessage } from './types';

export const ADMIN_PIN = '000';

export const NOTIFICATION_SOUNDS = {
  MESSAGE: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  REPORT: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'
};

export const DEPARTMENTS: Department[] = [
  { id: 'dept_1', name: 'قسم الصيانة', nameEn: 'Maintenance Dept', color: '#3b82f6', headId: '101_id' },
  { id: 'dept_2', name: 'قسم عمال الموقع', nameEn: 'Site Workers Dept', color: '#10b981' },
  { id: 'dept_3', name: 'قسم الكهرباء', nameEn: 'Electrical Dept', color: '#f59e0b' },
  { id: 'dept_4', name: 'قسم الحدادة', nameEn: 'Blacksmith Dept', color: '#ef4444' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { 
    id: '123_id', 
    name: 'موظف تجريبي', 
    role: 'عامل صيانة', 
    userRole: UserRole.WORKER, 
    phone: '123', 
    password: '123', 
    avatar: 'https://i.pravatar.cc/150?u=123', 
    departmentId: 'dept_1', 
    isShiftRequired: true, 
    shiftStart: '08:00', 
    shiftEnd: '16:00', 
    workplace: 'المبنى A - الطابق 1',
    workplaceLat: 24.7136,
    workplaceLng: 46.6753
  },
  { 
    id: '101_id', 
    name: 'أحمد محمود', 
    role: 'رئيس قسم الصيانة', 
    userRole: UserRole.DEPT_HEAD, 
    phone: '0501112222', 
    password: '123', 
    avatar: 'https://i.pravatar.cc/150?u=101', 
    departmentId: 'dept_1', 
    isShiftRequired: false, 
    workplace: 'الموقع الرئيسي' 
  },
];

export const MOCK_REPORTS: ReportEntry[] = [
  { id: 'r1', employeeId: '123_id', employeeName: 'موظف تجريبي', content: 'تم الانتهاء من فحص معدات الطابق الثاني.', timestamp: new Date().toISOString(), departmentId: 'dept_1', type: 'text' },
];

export const MOCK_CHATS: ChatMessage[] = [
  { id: 'c1', senderId: 'ADMIN', senderName: 'الإدارة', text: 'مرحباً بالجميع، يرجى الالتزام بمواعيد الوردية الصباحية.', timestamp: '08:00 AM', type: 'group', departmentId: 'all' }
];

export const TRANSLATIONS = {
  ar: {
    title: 'نظام متابعة العمال',
    login: 'تسجيل الدخول',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    wrongPassword: 'كلمة المرور خاطئة!',
    attendance: 'الحضور',
    reports: 'التقارير',
    chat: 'الدردشة',
    profile: 'هويتي',
    announcements: 'الإعلانات',
    departments: 'الأقسام',
    checkIn: 'تسجيل حضور',
    checkOut: 'تسجيل انصراف',
    shift: 'الوردية',
    shiftStart: 'البداية',
    shiftEnd: ' النهاية',
    verified: 'موثق',
    workersManagement: 'إدارة الموظفين',
    overview: 'نظرة عامة',
    search: 'بحث...',
    logout: 'خروج'
  },
  en: {
    title: 'Workforce System',
    login: 'Login',
    phone: 'Phone',
    password: 'Password',
    wrongPassword: 'Wrong password!',
    attendance: 'Attendance',
    reports: 'Reports',
    chat: 'Chat',
    profile: 'Profile',
    announcements: 'Notices',
    departments: 'Depts',
    checkIn: 'Check In',
    checkOut: 'Check Out',
    shift: 'Shift',
    shiftStart: 'Start',
    shiftEnd: 'End',
    verified: 'Verified',
    workersManagement: 'Staff Mgmt',
    overview: 'Overview',
    search: 'Search...',
    logout: 'Logout'
  }
};

export const WORK_SITE_LOCATION = { lat: 24.7136, lng: 46.6753 };
export const ALLOWED_RADIUS_METERS = 500;
