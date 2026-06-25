import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Calendar, ShieldAlert, DollarSign, Award, BookOpen, Settings, ListCollapse, Plus, Edit, Trash2, Save, FileSpreadsheet, FileDown, Sparkles, CheckSquare, Clock
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
  onTriggerAI: (mode: 'HOMEWORK' | 'COMMENTS' | 'INSIGHTS' | 'SUMMARY', context?: any) => void;
}

export default function AdminDashboard({ user, onLogout, onTriggerAI }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ACADEMICS' | 'STUDENTS' | 'TEACHERS' | 'AUDIT' | 'SETTINGS'>('OVERVIEW');
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '', email: '', rollNumber: '', classId: '', sectionId: '', parentId: '',
    gender: 'Female', dateOfBirth: '2011-01-01', phone: '', address: '', bloodGroup: 'A+', medicalInfo: '', previousSchool: ''
  });

  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', startDate: '', endDate: '', description: '' });

  const [settingsForm, setSettingsForm] = useState<any>(null);

  // Fetch full DB state from Express
  const fetchDB = async () => {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      setDb(data);
      if (data.settings && !settingsForm) {
        setSettingsForm(data.settings);
      }
    } catch (e) {
      console.error("Failed to load db state", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDB();
  }, []);

  if (loading || !db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-500 font-medium">Loading school database...</span>
        </div>
      </div>
    );
  }

  // Derived dashboard metrics
  const totalStudents = db.students?.length || 0;
  const totalTeachers = db.teachers?.length || 0;
  const totalParents = db.parents?.length || 0;
  const totalStaff = db.staff?.length || 0;

  // Calculate attendance rate for today
  const attendanceToday = db.attendance?.filter((a: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return a.date === todayStr;
  }) || [];
  const totalPresentToday = attendanceToday.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const attendanceRate = attendanceToday.length > 0 
    ? Math.round((totalPresentToday / attendanceToday.length) * 100) 
    : 92; // fallback

  // Sum pending fees
  const totalFeesRequired = db.feeStructures?.reduce((acc: number, f: any) => acc + (f.amount * totalStudents), 0) || 0;
  const totalFeesPaid = db.feePayments?.reduce((acc: number, f: any) => acc + f.amountPaid, 0) || 0;
  const pendingFees = totalFeesRequired - totalFeesPaid;

  // Revenue chart dataset
  const revenueData = [
    { name: 'Sep', Target: 12000, Collected: 9800 },
    { name: 'Oct', Target: 12000, Collected: 11200 },
    { name: 'Nov', Target: 12000, Collected: 11800 },
    { name: 'Dec', Target: 12000, Collected: 8900 },
    { name: 'Jan', Target: 15000, Collected: 14200 },
    { name: 'Feb', Target: 15000, Collected: 15100 },
    { name: 'Mar', Target: 15000, Collected: totalFeesPaid > 15000 ? 15000 : totalFeesPaid || 12300 },
  ];

  // Attendance Trend Dataset
  const attendanceTrendData = [
    { day: 'Mon', Rate: 94 },
    { day: 'Tue', Rate: 96 },
    { day: 'Wed', Rate: 95 },
    { day: 'Thu', Rate: 89 },
    { day: 'Fri', Rate: 93 },
  ];

  // Admissions handler
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.rollNumber) return;

    try {
      // 1. Create User account first
      const userRes = await fetch('/api/db/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newStudent.email || `${newStudent.name.toLowerCase().replace(/\s+/g, '')}@school.edu`,
          name: newStudent.name,
          role: 'STUDENT',
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      const createdUser = await userRes.json();

      // 2. Create student profile
      await fetch('/api/db/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStudent,
          userId: createdUser.id,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });

      setShowAddStudent(false);
      setNewStudent({
        name: '', email: '', rollNumber: '', classId: '', sectionId: '', parentId: '',
        gender: 'Female', dateOfBirth: '2011-01-01', phone: '', address: '', bloodGroup: 'A+', medicalInfo: '', previousSchool: ''
      });
      fetchDB();
    } catch (e) {
      alert("Error adding student profile");
    }
  };

  // Holiday creation
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.startDate) return;

    try {
      await fetch('/api/db/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newHoliday,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      setShowAddHoliday(false);
      setNewHoliday({ name: '', startDate: '', endDate: '', description: '' });
      fetchDB();
    } catch (e) {
      alert("Error saving holiday");
    }
  };

  // Settings update
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/db/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settingsForm,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      alert("School settings updated successfully!");
      fetchDB();
    } catch (e) {
      alert("Error saving settings");
    }
  };

  // Export tables as simulated download
  const handleExportCSV = (table: string, data: any[]) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + data.map(e => headers.map(h => `"${String(e[h] || '').replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `edusync_export_${table}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 shrink-0">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-1.5 bg-teal-500 rounded-lg text-slate-950">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider text-teal-400">EduSync</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase border border-slate-700">Admin</span>
          </div>

          <div className="space-y-1.5 text-left text-sm font-medium">
            <button 
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'OVERVIEW' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Users className="h-4 w-4" />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('STUDENTS')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'STUDENTS' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Users className="h-4 w-4" />
              Student Profiles
            </button>
            <button 
              onClick={() => setActiveTab('TEACHERS')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'TEACHERS' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Users className="h-4 w-4" />
              Teachers & Staff
            </button>
            <button 
              onClick={() => setActiveTab('ACADEMICS')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'ACADEMICS' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Calendar className="h-4 w-4" />
              Academics & Terms
            </button>
            <button 
              onClick={() => setActiveTab('AUDIT')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'AUDIT' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <ShieldAlert className="h-4 w-4" />
              Audit Logs
            </button>
            <button 
              onClick={() => setActiveTab('SETTINGS')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'SETTINGS' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Settings className="h-4 w-4" />
              School Settings
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-left">
          <div className="flex items-center gap-2">
            <img 
              src={user.avatarUrl || "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120"} 
              alt="avatar" 
              className="h-8 w-8 rounded-full border border-slate-800"
            />
            <div>
              <p className="font-semibold text-slate-200">{user.name}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Header Block */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 text-left">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{db.settings?.schoolName || 'EduSync Academy'}</span>
            <h1 className="font-display font-bold text-2xl tracking-tight text-slate-950 mt-1">
              {activeTab === 'OVERVIEW' && 'Administrative Overview'}
              {activeTab === 'STUDENTS' && 'Student Enrollment Directory'}
              {activeTab === 'TEACHERS' && 'Faculty & Operations Staff'}
              {activeTab === 'ACADEMICS' && 'Academic Calendar & Terms'}
              {activeTab === 'AUDIT' && 'Institutional Audit Trails'}
              {activeTab === 'SETTINGS' && 'System Profile & Core Config'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Trigger to Co-pilot */}
            <button 
              onClick={() => onTriggerAI('INSIGHTS', {
                totalStudents,
                presentCount: totalPresentToday,
                absentCount: attendanceToday.filter((a: any) => a.status === 'ABSENT').length,
                lateCount: attendanceToday.filter((a: any) => a.status === 'LATE').length,
                classBreakdowns: { "Grade 9": "92%", "Grade 10": "96%" }
              })}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-md hover:opacity-90 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analyze Today's Attendance (AI)
            </button>
          </div>
        </header>

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-100 shadow-xs rounded-2xl flex items-center gap-4 text-left">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Enrolled</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{totalStudents}</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-100 shadow-xs rounded-2xl flex items-center gap-4 text-left">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Teachers</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{totalTeachers}</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-100 shadow-xs rounded-2xl flex items-center gap-4 text-left">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Today's Attendance</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{attendanceRate}%</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-100 shadow-xs rounded-2xl flex items-center gap-4 text-left">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Fees</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">${pendingFees.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-12 gap-6">
              
              {/* Fee collection Bar chart */}
              <div className="col-span-12 md:col-span-8 p-6 bg-white border border-slate-100 shadow-xs rounded-2xl text-left">
                <h3 className="font-display font-semibold text-sm text-slate-900 mb-4 flex items-center justify-between">
                  Fee Collection Revenue Summary
                  <span className="text-xs text-slate-400 font-normal">Active Term (2025-26)</span>
                </h3>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Target" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="Collected" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Attendance line chart */}
              <div className="col-span-12 md:col-span-4 p-6 bg-white border border-slate-100 shadow-xs rounded-2xl text-left">
                <h3 className="font-display font-semibold text-sm text-slate-900 mb-4">Weekly Attendance Rates</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                      <YAxis domain={[80, 100]} stroke="#94A3B8" fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Rate" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Admissions Summary
                  </p>
                  <p>Average daily attendance complies with our 90% benchmark. Total active student files: **{totalStudents}**.</p>
                </div>
              </div>

            </div>

            {/* Quick Lists */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Recent audit activity */}
              <div className="p-6 bg-white border border-slate-100 shadow-xs rounded-2xl text-left">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-sm text-slate-900">Recent Institutional Activity</h3>
                  <button onClick={() => setActiveTab('AUDIT')} className="text-xs text-blue-600 hover:underline">View All Logs</button>
                </div>
                <div className="divide-y divide-slate-100">
                  {db.auditLogs?.slice(0, 4).map((log: any) => (
                    <div key={log.id} className="py-2.5 flex items-start gap-3 text-xs justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{log.action}</p>
                        <p className="text-slate-500">{log.details}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium text-slate-700">{log.userName}</p>
                        <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Noticeboard list */}
              <div className="p-6 bg-white border border-slate-100 shadow-xs rounded-2xl text-left">
                <h3 className="font-display font-semibold text-sm text-slate-900 mb-4">Institutional Bulletins</h3>
                <div className="space-y-3">
                  {db.notifications?.slice(0, 3).map((notice: any) => (
                    <div key={notice.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                      <p className="font-semibold text-xs text-slate-800">{notice.title}</p>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{notice.content}</p>
                      <p className="text-[10px] text-slate-400 mt-2">{new Date(notice.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Students */}
        {activeTab === 'STUDENTS' && (
          <div className="space-y-6 text-left">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowAddStudent(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Admit New Student
                </button>
                <button 
                  onClick={() => handleExportCSV('students', db.students)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {showAddStudent && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleAddStudent}
                className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm"
              >
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-display font-semibold text-sm text-slate-950">New Student Intake Form</h4>
                  <p className="text-xs text-slate-500">Intake triggers automatic user profile creation with credentials.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Student Name</label>
                    <input 
                      type="text" required value={newStudent.name}
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      placeholder="e.g. Alice Cooper"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Official Email</label>
                    <input 
                      type="email" value={newStudent.email}
                      onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      placeholder="alice@school.edu"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Roll/Admission Number</label>
                    <input 
                      type="text" required value={newStudent.rollNumber}
                      onChange={e => setNewStudent({...newStudent, rollNumber: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      placeholder="ST-2026-004"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Assigned Grade</label>
                    <select 
                      required value={newStudent.classId}
                      onChange={e => setNewStudent({...newStudent, classId: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Choose Class --</option>
                      {db.classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Section Assignment</label>
                    <select 
                      required value={newStudent.sectionId}
                      onChange={e => setNewStudent({...newStudent, sectionId: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Choose Section --</option>
                      {db.sections?.filter((s: any) => s.classId === newStudent.classId).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.roomNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Guardian Association</label>
                    <select 
                      required value={newStudent.parentId}
                      onChange={e => setNewStudent({...newStudent, parentId: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Choose Parent --</option>
                      {db.parents?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Gender</label>
                    <select 
                      value={newStudent.gender}
                      onChange={e => setNewStudent({...newStudent, gender: e.target.value as any})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Date of Birth</label>
                    <input 
                      type="date" value={newStudent.dateOfBirth}
                      onChange={e => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Blood Group</label>
                    <input 
                      type="text" value={newStudent.bloodGroup}
                      onChange={e => setNewStudent({...newStudent, bloodGroup: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      placeholder="A+, O-, B+"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button 
                    type="button" onClick={() => setShowAddStudent(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg"
                  >
                    Finalize Admissions Process
                  </button>
                </div>
              </motion.form>
            )}

            {/* Students Table */}
            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Grade / Section</th>
                    <th className="p-4">Parent / Guardian</th>
                    <th className="p-4">DOB</th>
                    <th className="p-4">Blood Group</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {db.students?.map((student: any) => {
                    const grade = db.classes?.find((c: any) => c.id === student.classId)?.name;
                    const section = db.sections?.find((s: any) => s.id === student.sectionId)?.name;
                    const guardian = db.parents?.find((p: any) => p.id === student.parentId)?.name;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-semibold text-slate-900">{student.rollNumber}</td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-900">{student.name}</p>
                          <p className="text-[10px] text-slate-400">{student.email}</p>
                        </td>
                        <td className="p-4">{grade} - {section}</td>
                        <td className="p-4">{guardian || 'Not Assigned'}</td>
                        <td className="p-4">{student.dateOfBirth}</td>
                        <td className="p-4"><span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-mono">{student.bloodGroup || 'N/A'}</span></td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => onTriggerAI('SUMMARY', {
                              studentName: student.name,
                              classAndSection: `${grade} - ${section}`,
                              attendancePercentage: '96',
                              grades: 'Mathematics: A, Science: A+, English: B+',
                              assignments: '1 pending quadratic equation assignment'
                            })}
                            className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition mr-1.5 cursor-pointer"
                            title="Generate AI Student Summary"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 3: Teachers */}
        {activeTab === 'TEACHERS' && (
          <div className="space-y-6 text-left">
            <h3 className="font-display font-semibold text-sm text-slate-950">Assigned Subject Teachers</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {db.teachers?.map((t: any) => (
                <div key={t.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs flex items-start gap-4">
                  <img src={t.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"} className="h-12 w-12 rounded-full object-cover border border-slate-200" />
                  <div className="space-y-1 flex-1">
                    <p className="font-display font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{t.qualification}</p>
                    <p className="text-xs text-slate-600">Specialization: <strong className="text-slate-800">{t.specialization}</strong></p>
                    <p className="text-[10px] text-slate-400">Salary Package: ${t.salary}/month</p>
                    <div className="pt-2 flex flex-wrap gap-1">
                      {t.assignedClasses?.map((cl: any, i: number) => {
                        const clName = db.classes?.find((c: any) => c.id === cl.classId)?.name;
                        const subName = db.subjects?.find((s: any) => s.id === cl.subjectId)?.name;
                        return (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 font-semibold">
                            {clName}: {subName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-display font-semibold text-sm text-slate-950 mb-4">Operations & Support Staff</h3>
              <div className="grid md:grid-cols-4 gap-4">
                {db.staff?.map((st: any) => (
                  <div key={st.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs text-center space-y-2">
                    <img src={st.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"} className="h-12 w-12 rounded-full mx-auto object-cover border border-slate-200" />
                    <div>
                      <p className="font-semibold text-slate-900 text-xs">{st.name}</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-50 border border-teal-100 rounded-full text-[9px] font-bold text-teal-700 uppercase tracking-wide">
                        {st.department}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">{st.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Academics */}
        {activeTab === 'ACADEMICS' && (
          <div className="space-y-6 text-left">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Classes list */}
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <h3 className="font-display font-semibold text-sm text-slate-950 mb-3 border-b border-slate-50 pb-2">Institution Classes</h3>
                <div className="space-y-2 text-xs">
                  {db.classes?.map((c: any) => {
                    const sectionsInClass = db.sections?.filter((s: any) => s.classId === c.id);
                    return (
                      <div key={c.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-slate-500 mt-0.5">{sectionsInClass?.length || 0} active sections</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subjects List */}
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <h3 className="font-display font-semibold text-sm text-slate-950 mb-3 border-b border-slate-50 pb-2">Academic Curriculum</h3>
                <div className="space-y-2 text-xs font-mono">
                  {db.subjects?.map((sub: any) => (
                    <div key={sub.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex justify-between">
                      <span className="font-sans font-semibold text-slate-800">{sub.name}</span>
                      <span className="text-slate-400 font-bold text-[11px]">{sub.code}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Term holidays calendar */}
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <h3 className="font-display font-semibold text-sm text-slate-950">Active Term Holidays</h3>
                  <button 
                    onClick={() => setShowAddHoliday(true)} 
                    className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {showAddHoliday && (
                  <form onSubmit={handleAddHoliday} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs">
                    <input 
                      type="text" required placeholder="Holiday Name" value={newHoliday.name}
                      onChange={e => setNewHoliday({...newHoliday, name: e.target.value})}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-md"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date" required value={newHoliday.startDate}
                        onChange={e => setNewHoliday({...newHoliday, startDate: e.target.value})}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-[11px]"
                      />
                      <input 
                        type="date" value={newHoliday.endDate}
                        onChange={e => setNewHoliday({...newHoliday, endDate: e.target.value})}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-[11px]"
                      />
                    </div>
                    <button type="submit" className="w-full py-1.5 bg-slate-900 text-white font-medium rounded-lg text-[10px]">
                      Add Term Holiday
                    </button>
                  </form>
                )}

                <div className="space-y-2 text-xs">
                  {db.holidays?.map((h: any) => (
                    <div key={h.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                      <p className="font-semibold text-slate-800">{h.name}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{h.startDate} {h.endDate ? `to ${h.endDate}` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 5: Audit logs */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-6 text-left">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-950 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs">Security, Accountability & Activity Logger</h4>
                <p className="text-[11px] mt-0.5 leading-relaxed text-slate-700">
                  EduSync enforces deep transparency. Every database intake, grading batch, setting update, or student intake is logged automatically with operator identification stamps.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Action Event</th>
                    <th className="p-4">operator</th>
                    <th className="p-4">Impact Details</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 font-mono">
                  {db.auditLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-slate-900 font-semibold">{log.action}</td>
                      <td className="p-4 font-sans">
                        <p className="font-semibold text-slate-900">{log.userName}</p>
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500 font-bold uppercase tracking-wider">{log.userRole}</span>
                      </td>
                      <td className="p-4 font-sans text-slate-600">{log.details}</td>
                      <td className="p-4 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Settings */}
        {activeTab === 'SETTINGS' && settingsForm && (
          <form onSubmit={handleUpdateSettings} className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6 text-left space-y-6">
            <h3 className="font-display font-semibold text-sm text-slate-950 border-b border-slate-50 pb-2">Institution Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">School Name</label>
                <input 
                  type="text" required value={settingsForm.schoolName}
                  onChange={e => setSettingsForm({...settingsForm, schoolName: e.target.value})}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Official Logo Address (Unsplash URL)</label>
                <input 
                  type="text" value={settingsForm.logoUrl}
                  onChange={e => setSettingsForm({...settingsForm, logoUrl: e.target.value})}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Active Academic Session</label>
                <input 
                  type="text" required value={settingsForm.academicYear}
                  onChange={e => setSettingsForm({...settingsForm, academicYear: e.target.value})}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  placeholder="2025-2026"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Inbound Phone Contact</label>
                <input 
                  type="text" value={settingsForm.phone}
                  onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Institution Address</label>
                <input 
                  type="text" value={settingsForm.address}
                  onChange={e => setSettingsForm({...settingsForm, address: e.target.value})}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Admin Support Email</label>
                <input 
                  type="email" value={settingsForm.email}
                  onChange={e => setSettingsForm({...settingsForm, email: e.target.value})}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2 text-xs">
              <button 
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Commit Administrative Changes
              </button>
            </div>
          </form>
        )}

      </main>

    </div>
  );
}
