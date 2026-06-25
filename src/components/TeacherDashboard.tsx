import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Clock, Sparkles, Send, CheckCircle2, AlertCircle, FilePlus, Eye, ArrowRight, MessageSquare, ClipboardList, CalendarCheck, HelpCircle, Award
} from 'lucide-react';
import { motion } from 'motion/react';

interface TeacherDashboardProps {
  user: any;
  onLogout: () => void;
  onTriggerAI: (mode: 'HOMEWORK' | 'COMMENTS' | 'INSIGHTS' | 'SUMMARY', context?: any) => void;
}

export default function TeacherDashboard({ user, onLogout, onTriggerAI }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ATTENDANCE' | 'MARKS' | 'ASSIGNMENTS' | 'MESSAGES' | 'LEAVE'>('OVERVIEW');
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mark Attendance State
  const [attClassId, setAttClassId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState<any[]>([]);

  // Marks Entry State
  const [marksExamId, setMarksExamId] = useState('');
  const [marksClassId, setMarksClassId] = useState('');
  const [marksSubjectId, setMarksSubjectId] = useState('');
  const [marksList, setMarksList] = useState<any[]>([]);

  // Assignments & Study materials creators
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    classId: '', sectionId: '', subjectId: '', title: '', description: '', dueDate: '', maxMarks: 50
  });

  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    classId: '', subjectId: '', title: '', description: '', fileName: 'calculus_fundamentals.pdf', fileType: 'pdf' as any
  });

  // Messaging state
  const [activeThreadParent, setActiveThreadParent] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Leave Request State
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const fetchDB = async () => {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      setDb(data);

      // Pre-select defaults
      if (data.classes?.length > 0 && !attClassId) setAttClassId(data.classes[0].id);
      if (data.exams?.length > 0 && !marksExamId) setMarksExamId(data.exams[0].id);
      if (data.classes?.length > 0 && !marksClassId) setMarksClassId(data.classes[0].id);
      if (data.subjects?.length > 0 && !marksSubjectId) setMarksSubjectId(data.subjects[0].id);
    } catch (e) {
      console.error("Failed to load db state", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDB();
  }, []);

  // Fetch active message thread
  useEffect(() => {
    if (activeThreadParent && user && db) {
      const parentUser = db.users?.find((u: any) => u.id === activeThreadParent);
      if (parentUser) {
        fetch(`/api/messages/thread/${user.id}/${parentUser.id}`)
          .then(res => res.json())
          .then(data => setChatMessages(data))
          .catch(err => console.error(err));
      }
    }
  }, [activeThreadParent, db]);

  // Load students for attendance grid
  const loadAttendanceStudents = () => {
    if (!db) return;
    const studentsInClass = db.students?.filter((st: any) => st.classId === attClassId) || [];
    const records = studentsInClass.map((st: any) => {
      const existing = db.attendance?.find((a: any) => a.studentId === st.id && a.date === attDate);
      return {
        studentId: st.id,
        name: st.name,
        rollNumber: st.rollNumber,
        status: existing?.status || 'PRESENT',
        remarks: existing?.remarks || ''
      };
    });
    setAttRecords(records);
  };

  // Trigger loading attendance list when inputs change
  useEffect(() => {
    if (attClassId && attDate && db) {
      loadAttendanceStudents();
    }
  }, [attClassId, attDate, db]);

  // Load students for marks entry
  const loadMarksStudents = () => {
    if (!db) return;
    const examSubject = db.examSubjects?.find((es: any) => 
      es.examId === marksExamId && es.classId === marksClassId && es.subjectId === marksSubjectId
    );

    const studentsInClass = db.students?.filter((st: any) => st.classId === marksClassId) || [];
    const records = studentsInClass.map((st: any) => {
      const existing = examSubject ? db.marks?.find((m: any) => m.examSubjectId === examSubject.id && m.studentId === st.id) : null;
      return {
        studentId: st.id,
        name: st.name,
        rollNumber: st.rollNumber,
        marksObtained: existing?.marksObtained || 0,
        remarks: existing?.remarks || ''
      };
    });
    setMarksList(records);
  };

  // Trigger loading marks entry list when inputs change
  useEffect(() => {
    if (marksExamId && marksClassId && marksSubjectId && db) {
      loadMarksStudents();
    }
  }, [marksExamId, marksClassId, marksSubjectId, db]);

  if (loading || !db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Get current teacher profile
  const teacherProfile = db.teachers?.find((t: any) => t.userId === user.id);
  const assignedClasses = teacherProfile?.assignedClasses || [];

  // Derived calculations
  const totalMyAssignments = db.assignments?.filter((a: any) => a.teacherId === teacherProfile?.id).length || 0;
  const submissionsPendingGrade = db.assignmentSubmissions?.filter((sub: any) => {
    const isMyAssignment = db.assignments?.find((a: any) => a.id === sub.assignmentId)?.teacherId === teacherProfile?.id;
    return isMyAssignment && sub.status === 'SUBMITTED';
  }).length || 0;

  // Handle batch attendance submit
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: attDate,
          attendanceList: attRecords,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      alert(`Attendance recorded successfully for date ${attDate}`);
      fetchDB();
    } catch (e) {
      alert("Error saving attendance");
    }
  };

  // Handle batch marks submit
  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    const examSubject = db.examSubjects?.find((es: any) => 
      es.examId === marksExamId && es.classId === marksClassId && es.subjectId === marksSubjectId
    );
    if (!examSubject) {
      alert("Please ensure an exam schedule exists for this subject/class inside Academics.");
      return;
    }

    const payload = marksList.map(m => ({
      examSubjectId: examSubject.id,
      studentId: m.studentId,
      marksObtained: Number(m.marksObtained),
      remarks: m.remarks
    }));

    try {
      await fetch('/api/marks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marksList: payload,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      alert("Grades and exam marks recorded successfully!");
      fetchDB();
    } catch (e) {
      alert("Error saving marks");
    }
  };

  // Create Homework Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.classId) return;

    try {
      await fetch('/api/db/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAssignment,
          teacherId: teacherProfile?.id,
          createdAt: new Date().toISOString().split('T')[0],
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      setShowAddAssignment(false);
      setNewAssignment({ classId: '', sectionId: '', subjectId: '', title: '', description: '', dueDate: '', maxMarks: 50 });
      fetchDB();
    } catch (e) {
      alert("Error saving assignment");
    }
  };

  // Create Study Material
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title || !newMaterial.classId) return;

    try {
      await fetch('/api/db/studyMaterials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMaterial,
          teacherId: teacherProfile?.id,
          uploadedAt: new Date().toISOString().split('T')[0],
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      setShowAddMaterial(false);
      setNewMaterial({ classId: '', subjectId: '', title: '', description: '', fileName: 'calculus_fundamentals.pdf', fileType: 'pdf' });
      fetchDB();
    } catch (e) {
      alert("Error saving study material");
    }
  };

  // Submit leave request
  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveReason) return;

    try {
      await fetch('/api/db/leaveRequests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: user.id,
          role: 'TEACHER',
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: leaveReason,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      alert("Leave application sent successfully to School Office.");
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      fetchDB();
    } catch (e) {
      alert("Error submitting request");
    }
  };

  // Send messaging thread
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText || !activeThreadParent) return;

    const parentUser = db?.users?.find((u: any) => u.id === activeThreadParent);
    if (!parentUser) return;

    try {
      const res = await fetch('/api/db/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: parentUser.id,
          content: newMessageText,
          timestamp: new Date().toISOString(),
          isRead: false,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      setNewMessageText('');
      // Optimistically add
      const savedMsg = await res.json();
      setChatMessages([...chatMessages, savedMsg]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 shrink-0">
        <div className="p-5 text-left">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-1.5 bg-teal-500 rounded-lg text-slate-950">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider text-teal-400">EduSync</span>
            <span className="text-[10px] bg-teal-950/40 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full uppercase">Faculty</span>
          </div>

          <div className="space-y-1.5 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'OVERVIEW' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <ClipboardList className="h-4 w-4" />
              My Overview
            </button>
            <button 
              onClick={() => setActiveTab('ATTENDANCE')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'ATTENDANCE' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <CalendarCheck className="h-4 w-4" />
              Daily Attendance
            </button>
            <button 
              onClick={() => setActiveTab('MARKS')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'MARKS' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Award className="h-4 w-4" />
              Marks & Grade Entry
            </button>
            <button 
              onClick={() => setActiveTab('ASSIGNMENTS')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'ASSIGNMENTS' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <FilePlus className="h-4 w-4" />
              Homework & Study
            </button>
            <button 
              onClick={() => setActiveTab('MESSAGES')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'MESSAGES' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <MessageSquare className="h-4 w-4" />
              Teacher Messaging
            </button>
            <button 
              onClick={() => setActiveTab('LEAVE')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'LEAVE' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Clock className="h-4 w-4" />
              Leave Requests
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-left">
          <div className="flex items-center gap-2">
            <img 
              src={user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"} 
              alt="avatar" 
              className="h-8 w-8 rounded-full border border-slate-800"
            />
            <div>
              <p className="font-semibold text-slate-200">{user.name}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Faculty Teacher</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full text-left">
        
        {/* Header Title */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{teacherProfile?.qualification || 'Department of Academics'}</span>
            <h1 className="font-display font-bold text-2xl text-slate-950 mt-1">
              {activeTab === 'OVERVIEW' && 'Faculty Advisor Board'}
              {activeTab === 'ATTENDANCE' && 'Daily Attendance Tracking'}
              {activeTab === 'MARKS' && 'Report Grade Folder'}
              {activeTab === 'ASSIGNMENTS' && 'Academic Courseware'}
              {activeTab === 'MESSAGES' && 'Parent-Teacher Private Chat'}
              {activeTab === 'LEAVE' && 'Leave Applications'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'ASSIGNMENTS' && (
              <button 
                onClick={() => onTriggerAI('HOMEWORK', { topic: 'Quadratic Equations', classLevel: 'Grade 10' })}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md hover:opacity-90 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                Co-Draft Homework (AI)
              </button>
            )}
          </div>
        </header>

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assigned Classes</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{assignedClasses.length}</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Homework</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{totalMyAssignments}</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Grading</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{submissionsPendingGrade}</p>
                </div>
              </div>
            </div>

            {/* Timetable schedule */}
            <div className="grid md:grid-cols-12 gap-6">
              
              <div className="col-span-12 md:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-900">Weekly Lecture Schedule</h3>
                <div className="space-y-2.5">
                  {db.timetables?.filter((tt: any) => tt.teacherId === teacherProfile?.id).map((slot: any) => {
                    const clName = db.classes?.find((c: any) => c.id === slot.classId)?.name;
                    const secName = db.sections?.find((s: any) => s.id === slot.sectionId)?.name;
                    const subName = db.subjects?.find((s: any) => s.id === slot.subjectId)?.name;
                    return (
                      <div key={slot.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-xs font-semibold">
                        <div className="space-y-1">
                          <p className="text-slate-900">{subName}</p>
                          <p className="text-slate-400 font-normal">{clName} ({secName}) • {slot.roomNumber}</p>
                        </div>
                        <div className="text-right text-slate-500 font-mono text-[11px] space-y-1">
                          <p className="bg-slate-200/60 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">{slot.dayOfWeek}</p>
                          <p className="text-slate-400">{slot.startTime} - {slot.endTime}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notice Bulletins */}
              <div className="col-span-12 md:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-900">Faculty Notices</h3>
                <div className="space-y-3">
                  {db.notifications?.filter((n: any) => !n.targetRole || n.targetRole === 'TEACHER').map((n: any) => (
                    <div key={n.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-slate-800">{n.title}</p>
                      <p className="text-slate-500 leading-relaxed">{n.content}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Attendance Roll */}
        {activeTab === 'ATTENDANCE' && (
          <form onSubmit={handleSaveAttendance} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Choose Grade Class</label>
                <select 
                  value={attClassId} onChange={e => setAttClassId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold"
                >
                  {db.classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Attendance Session Date</label>
                <input 
                  type="date" value={attDate} onChange={e => setAttDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="space-y-3">
                {attRecords.map((rec, idx) => (
                  <div key={rec.studentId} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">{rec.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{rec.rollNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((status) => (
                        <button
                          key={status} type="button"
                          onClick={() => {
                            const updated = [...attRecords];
                            updated[idx].status = status;
                            setAttRecords(updated);
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wide cursor-pointer transition ${rec.status === status ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 text-xs border-t border-slate-100">
              <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl cursor-pointer shadow">
                Lock Attendance Record
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Marks Entry */}
        {activeTab === 'MARKS' && (
          <form onSubmit={handleSaveMarks} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Exam Campaign</label>
                <select 
                  value={marksExamId} onChange={e => setMarksExamId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                >
                  {db.exams?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Grade Class</label>
                <select 
                  value={marksClassId} onChange={e => setMarksClassId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                >
                  {db.classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Subject</label>
                <select 
                  value={marksSubjectId} onChange={e => setMarksSubjectId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                >
                  {db.subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="space-y-3">
                {marksList.map((m, idx) => (
                  <div key={m.studentId} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{m.rollNumber}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Marks Obtained</label>
                        <input 
                          type="number" max={100} value={m.marksObtained}
                          onChange={e => {
                            const updated = [...marksList];
                            updated[idx].marksObtained = e.target.value;
                            setMarksList(updated);
                          }}
                          className="w-24 p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1 text-left flex-1 min-w-[200px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Progress Comment</label>
                        <div className="relative">
                          <input 
                            type="text" value={m.remarks}
                            onChange={e => {
                              const updated = [...marksList];
                              updated[idx].remarks = e.target.value;
                              setMarksList(updated);
                            }}
                            placeholder="Consistent student..."
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => onTriggerAI('COMMENTS', {
                              studentName: m.name,
                              subject: db.subjects?.find((s: any) => s.id === marksSubjectId)?.name || 'Mathematics',
                              grade: m.marksObtained >= 90 ? 'A+' : m.marksObtained >= 80 ? 'A' : 'B',
                              remarks: m.remarks
                            })}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-teal-600 hover:bg-slate-100 rounded"
                            title="Generate comments using AI"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 text-xs border-t border-slate-100">
              <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl cursor-pointer shadow">
                Post Exam Marks
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Assignments */}
        {activeTab === 'ASSIGNMENTS' && (
          <div className="space-y-6">
            
            <div className="flex gap-2 text-xs font-semibold">
              <button 
                onClick={() => setShowAddAssignment(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow cursor-pointer"
              >
                Create Homework Assignment
              </button>
              <button 
                onClick={() => setShowAddMaterial}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Upload Study Guides
              </button>
            </div>

            {showAddAssignment && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreateAssignment}
                className="p-5 bg-white border border-slate-200 rounded-2xl text-xs text-left space-y-4 shadow-sm"
              >
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900">New Homework Assignment</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Title</label>
                    <input 
                      type="text" required placeholder="Quadratic algebra sheet..." value={newAssignment.title}
                      onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Class</label>
                    <select 
                      required value={newAssignment.classId}
                      onChange={e => {
                        const sec = db.sections?.find((s: any) => s.classId === e.target.value);
                        setNewAssignment({...newAssignment, classId: e.target.value, sectionId: sec?.id || ''});
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Choose Class --</option>
                      {db.classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Subject</label>
                    <select 
                      required value={newAssignment.subjectId}
                      onChange={e => setNewAssignment({...newAssignment, subjectId: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Choose Subject --</option>
                      {db.subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Target Due Date</label>
                    <input 
                      type="date" required value={newAssignment.dueDate}
                      onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Maximum Marks</label>
                    <input 
                      type="number" value={newAssignment.maxMarks}
                      onChange={e => setNewAssignment({...newAssignment, maxMarks: Number(e.target.value)})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-3 space-y-1">
                    <label className="font-bold text-slate-700">Detailed Instructions</label>
                    <textarea 
                      required placeholder="Write detailed step-by-step instructions here..." value={newAssignment.description}
                      onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-24"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddAssignment(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg">Save Homework Assignment</button>
                </div>
              </motion.form>
            )}

            {/* Existing Assignments & submissions */}
            <div className="grid md:grid-cols-2 gap-6">
              
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs text-left space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-950 border-b border-slate-50 pb-2">Course Assignments</h3>
                <div className="space-y-3 text-xs">
                  {db.assignments?.filter((a: any) => a.teacherId === teacherProfile?.id).map((a: any) => {
                    const clName = db.classes?.find((c: any) => c.id === a.classId)?.name;
                    return (
                      <div key={a.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                        <div className="flex justify-between font-bold text-slate-900">
                          <p>{a.title}</p>
                          <span className="text-slate-400">{clName}</span>
                        </div>
                        <p className="text-slate-500 leading-relaxed">{a.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold">DUE DATE: {a.dueDate}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submissions review pane */}
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs text-left space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-950 border-b border-slate-50 pb-2">Student Homework Deliverables</h3>
                <div className="space-y-3 text-xs">
                  {db.assignmentSubmissions?.map((sub: any) => {
                    const assign = db.assignments?.find((a: any) => a.id === sub.assignmentId);
                    const isMyAssignment = assign?.teacherId === teacherProfile?.id;
                    if (!isMyAssignment) return null;
                    const stName = db.students?.find((s: any) => s.id === sub.studentId)?.name;

                    return (
                      <div key={sub.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                        <div className="flex justify-between font-bold text-slate-900">
                          <p>{assign?.title}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${sub.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{sub.status}</span>
                        </div>
                        <p className="text-slate-600 font-semibold">Submitted by: {stName}</p>
                        <p className="text-slate-500 italic bg-white p-2 rounded border border-slate-200">"{sub.submittedText}"</p>
                        {sub.status === 'GRADED' ? (
                          <p className="text-[10px] text-slate-500 font-bold">Marks: {sub.marksObtained}/{assign?.maxMarks} • Feedback: {sub.feedback}</p>
                        ) : (
                          <div className="flex gap-2 pt-1.5">
                            <input 
                              type="number" placeholder="Grade" id={`grade-${sub.id}`}
                              className="w-16 p-1.5 bg-white border border-slate-200 rounded font-bold"
                            />
                            <input 
                              type="text" placeholder="Add Feedback" id={`feed-${sub.id}`}
                              className="flex-1 p-1.5 bg-white border border-slate-200 rounded"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const marks = (document.getElementById(`grade-${sub.id}`) as HTMLInputElement)?.value;
                                const feedback = (document.getElementById(`feed-${sub.id}`) as HTMLInputElement)?.value;
                                if (!marks) return;

                                try {
                                  await fetch(`/api/db/assignmentSubmissions/${sub.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      status: 'GRADED',
                                      marksObtained: Number(marks),
                                      feedback: feedback || '',
                                      operatorId: user.id,
                                      operatorName: user.name,
                                      operatorRole: user.role
                                    })
                                  });
                                  alert("Deliverable graded successfully!");
                                  fetchDB();
                                } catch (e) {
                                  alert("Failed to grade submission");
                                }
                              }}
                              className="px-3 bg-slate-900 text-white rounded font-bold"
                            >
                              Grade
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 5: Messages */}
        {activeTab === 'MESSAGES' && (
          <div className="grid md:grid-cols-12 gap-6 min-h-[500px]">
            
            {/* Left list of parents */}
            <div className="col-span-12 md:col-span-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs text-left">
              <h3 className="font-display font-semibold text-xs uppercase text-slate-400 tracking-wider mb-3">Guardians List</h3>
              <div className="space-y-1 text-xs">
                {db.parents?.map((parent: any) => (
                  <button
                    key={parent.id} type="button"
                    onClick={() => setActiveThreadParent(parent.userId)}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left font-semibold transition cursor-pointer ${activeThreadParent === parent.userId ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    <div>
                      <p>{parent.name}</p>
                      <p className={`text-[10px] ${activeThreadParent === parent.userId ? 'text-slate-400' : 'text-slate-500'}`}>{parent.occupation || 'Parent'}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-50" />
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Box */}
            <div className="col-span-12 md:col-span-8 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs">
              {activeThreadParent ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50 text-left">
                    <p className="font-semibold text-xs uppercase text-slate-400">Discussion Thread</p>
                    <p className="font-bold text-slate-800 text-sm">{db.users?.find((u: any) => u.id === activeThreadParent)?.name}</p>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[350px]">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-xl text-xs max-w-[75%] ${msg.senderId === user.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
                          <p>{msg.content}</p>
                          <span className={`block text-[8px] mt-1 text-right ${msg.senderId === user.id ? 'text-slate-400' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2">
                    <input 
                      type="text" value={newMessageText} onChange={e => setNewMessageText(e.target.value)}
                      placeholder="Type your message to parent..."
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                    />
                    <button type="submit" className="p-2.5 bg-slate-900 text-white rounded-xl">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 p-10">
                  <MessageSquare className="h-8 w-8 text-slate-300" />
                  <p className="text-xs font-semibold">Select a parent on the left to start a thread.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 6: Leave requests */}
        {activeTab === 'LEAVE' && (
          <div className="grid md:grid-cols-12 gap-6 text-left">
            
            {/* Left submit leave request */}
            <form onSubmit={handleRequestLeave} className="col-span-12 md:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-semibold text-sm text-slate-900">Apply for Personal Leave</h3>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Start Date</label>
                    <input 
                      type="date" required value={leaveStart} onChange={e => setLeaveStart(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">End Date</label>
                    <input 
                      type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Reason / Details</label>
                  <textarea 
                    required placeholder="Attending symposium or medical..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg h-24"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-slate-900 text-white font-semibold rounded-lg">
                  Submit Leave Request
                </button>
              </div>
            </form>

            {/* Right List of personal leaves */}
            <div className="col-span-12 md:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-semibold text-sm text-slate-900 border-b border-slate-50 pb-2">Leave Records</h3>
              <div className="space-y-2.5 text-xs">
                {db.leaveRequests?.filter((l: any) => l.applicantId === user.id).map((l: any) => (
                  <div key={l.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">{l.reason}</p>
                      <p className="text-slate-400 font-semibold">Start: {l.startDate} {l.endDate ? `• End: ${l.endDate}` : ''}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${l.status === 'APPROVED' ? 'bg-green-100 text-green-700' : l.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
