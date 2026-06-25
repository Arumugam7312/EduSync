import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Clock, Sparkles, MessageSquare, Send, Award, FileSpreadsheet, CheckCircle2, Bookmark, DollarSign, ListTodo
} from 'lucide-react';
import { motion } from 'motion/react';

interface ParentDashboardProps {
  user: any;
  onLogout: () => void;
  onTriggerAI: (mode: 'HOMEWORK' | 'COMMENTS' | 'INSIGHTS' | 'SUMMARY', context?: any) => void;
}

export default function ParentDashboard({ user, onLogout, onTriggerAI }: ParentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PERFORMANCE' | 'ATTENDANCE' | 'HOMEWORK' | 'FEES' | 'CHAT'>('OVERVIEW');
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Parent profile and linked children
  const [selectedChildId, setSelectedChildId] = useState('');

  // Private messages with teacher
  const [activeTeacherId, setActiveTeacherId] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  const fetchDB = async () => {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      setDb(data);

      const parentProfile = data.parents?.find((p: any) => p.userId === user.id);
      if (parentProfile) {
        const children = data.students?.filter((s: any) => s.parentId === parentProfile.id) || [];
        if (children.length > 0) {
          setSelectedChildId(children[0].id);
        }
      }

      if (data.teachers?.length > 0) {
        setActiveTeacherId(data.teachers[0].userId);
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

  // Fetch private messages
  useEffect(() => {
    if (activeTeacherId && user) {
      fetch(`/api/messages/thread/${user.id}/${activeTeacherId}`)
        .then(res => res.json())
        .then(data => setChatMessages(data))
        .catch(err => console.error(err));
    }
  }, [activeTeacherId, db]);

  if (loading || !db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Parent profile
  const parentProfile = db.parents?.find((p: any) => p.userId === user.id);
  const myChildren = db.students?.filter((s: any) => s.parentId === parentProfile?.id) || [];

  // Currently selected child
  const selectedChild = myChildren.find((c: any) => c.id === selectedChildId);

  // Derived metrics for selected child
  const childClass = db.classes?.find((c: any) => c.id === selectedChild?.classId)?.name;
  const childSection = db.sections?.find((s: any) => s.id === selectedChild?.sectionId)?.name;

  // Selected child attendance percentage
  const childAttendance = db.attendance?.filter((a: any) => a.studentId === selectedChildId) || [];
  const presentSessions = childAttendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'EXCUSED').length;
  const childAttendanceRate = childAttendance.length > 0 
    ? Math.round((presentSessions / childAttendance.length) * 100) 
    : 100;

  // Selected child homework pending list
  const childHomework = db.assignments?.filter((a: any) => a.classId === selectedChild?.classId) || [];

  // Selected child exam marks
  const childMarks = db.marks?.filter((m: any) => m.studentId === selectedChildId) || [];

  // Handle messages submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText || !activeTeacherId) return;

    try {
      const res = await fetch('/api/db/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: activeTeacherId,
          content: newMessageText,
          timestamp: new Date().toISOString(),
          isRead: false,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      setNewMessageText('');
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
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full uppercase">Guardian</span>
          </div>

          {/* Child Selector Badge inside Sidebar */}
          <div className="mb-6 p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Child Profiles</p>
            <div className="flex flex-col gap-1">
              {myChildren.map((child: any) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-left transition cursor-pointer ${selectedChildId === child.id ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'OVERVIEW' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Bookmark className="h-4 w-4" />
              Child Profile Overview
            </button>
            <button 
              onClick={() => setActiveTab('PERFORMANCE')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'PERFORMANCE' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Award className="h-4 w-4" />
              Marks & Performance
            </button>
            <button 
              onClick={() => setActiveTab('ATTENDANCE')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'ATTENDANCE' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Attendance logs
            </button>
            <button 
              onClick={() => setActiveTab('HOMEWORK')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'HOMEWORK' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <ListTodo className="h-4 w-4" />
              Child Homework
            </button>
            <button 
              onClick={() => setActiveTab('FEES')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'FEES' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <DollarSign className="h-4 w-4" />
              Fee Receipts
            </button>
            <button 
              onClick={() => setActiveTab('CHAT')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'CHAT' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <MessageSquare className="h-4 w-4" />
              Chat with Teacher
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-left">
          <div className="flex items-center gap-2">
            <img 
              src={user.avatarUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=120"} 
              alt="avatar" 
              className="h-8 w-8 rounded-full border border-slate-800"
            />
            <div>
              <p className="font-semibold text-slate-200">{user.name}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Guardian Parent</p>
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Parent Gateway • Family Account</span>
            <h1 className="font-display font-bold text-2xl text-slate-950 mt-1">
              {activeTab === 'OVERVIEW' && `Parent Portal: ${selectedChild?.name}'s File`}
              {activeTab === 'PERFORMANCE' && `${selectedChild?.name}'s Marks Summary`}
              {activeTab === 'ATTENDANCE' && `${selectedChild?.name}'s Attendance logs`}
              {activeTab === 'HOMEWORK' && `${selectedChild?.name}'s Homework Tasks`}
              {activeTab === 'FEES' && `${selectedChild?.name}'s Invoices & Statements`}
              {activeTab === 'CHAT' && 'Parent-Teacher Private Discussion'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onTriggerAI('SUMMARY', {
                studentName: selectedChild?.name,
                classAndSection: `${childClass} - ${childSection}`,
                attendancePercentage: String(childAttendanceRate),
                grades: childMarks.map((m: any) => {
                  const subName = db.subjects?.find((s: any) => s.id === db.examSubjects?.find((es: any) => es.id === m.examSubjectId)?.subjectId)?.name;
                  return `${subName}: ${m.marksObtained}/100`;
                }).join(', '),
                assignments: `${childHomework.length} assigned tasks`
              })}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow hover:opacity-90 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Academic Progress Summary (AI)
            </button>
          </div>
        </header>

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && selectedChild && (
          <div className="space-y-6">
            
            {/* Quick Child Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attendance Rate</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{childAttendanceRate}%</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Homework Assigned</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{childHomework.length} tasks</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Midterm Reports Card</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{childMarks.length > 0 ? 'Released' : 'Pending'}</p>
                </div>
              </div>
            </div>

            {/* Timetable schedule and Notices */}
            <div className="grid md:grid-cols-12 gap-6">
              
              <div className="col-span-12 md:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4 font-semibold text-xs">
                <h3 className="font-display font-semibold text-sm text-slate-900">Child's Course Timetable ({childClass})</h3>
                <div className="space-y-2.5">
                  {db.timetables?.filter((tt: any) => tt.classId === selectedChild.classId).map((slot: any) => {
                    const subName = db.subjects?.find((s: any) => s.id === slot.subjectId)?.name;
                    const teaName = db.teachers?.find((t: any) => t.id === slot.teacherId)?.name;
                    return (
                      <div key={slot.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between font-semibold">
                        <div>
                          <p className="text-slate-900 font-bold">{subName}</p>
                          <p className="text-slate-400 font-normal mt-0.5">{teaName} • {slot.roomNumber}</p>
                        </div>
                        <p className="text-slate-500 font-mono text-[11px] bg-slate-200/60 px-2 py-0.5 rounded font-bold">{slot.startTime} - {slot.endTime}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notice Bulletins */}
              <div className="col-span-12 md:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
                <h3 className="font-display font-semibold text-sm text-slate-900">Guardian Alerts</h3>
                <div className="space-y-3">
                  {db.notifications?.filter((n: any) => !n.targetRole || n.targetRole === 'PARENT').map((n: any) => (
                    <div key={n.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
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

        {/* Tab 2: Performance details */}
        {activeTab === 'PERFORMANCE' && selectedChild && (
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs text-left">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Marks Obtained</th>
                  <th className="p-4">Grade</th>
                  <th className="p-4">Remarks Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {childMarks.map((m: any) => {
                  const examSubject = db.examSubjects?.find((es: any) => es.id === m.examSubjectId);
                  const subName = db.subjects?.find((s: any) => s.id === examSubject?.subjectId)?.name;
                  const gradeRecord = db.grades?.find((g: any) => m.marksObtained >= g.minPercentage && m.marksObtained <= g.maxPercentage) || { name: 'F' };
                  
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{subName}</td>
                      <td className="p-4 font-mono font-bold">{m.marksObtained} / 100</td>
                      <td className="p-4"><span className="px-2 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 rounded-full font-bold">{gradeRecord.name}</span></td>
                      <td className="p-4 text-slate-500">{m.remarks || 'No remarks recorded'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Attendance Logs */}
        {activeTab === 'ATTENDANCE' && selectedChild && (
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs text-left space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-900">Term Attendance Ledger</h3>
            <div className="space-y-2.5 text-xs">
              {childAttendance.map((a: any) => (
                <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{a.date}</p>
                    <p className="text-slate-400 mt-0.5">{a.remarks || 'Standard attendance recorded'}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${a.status === 'PRESENT' ? 'bg-green-100 text-green-700' : a.status === 'LATE' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Homework */}
        {activeTab === 'HOMEWORK' && selectedChild && (
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs text-left space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-900 border-b border-slate-50 pb-2">Homework Deliverables Tracking</h3>
            <div className="space-y-3.5 text-xs">
              {childHomework.map((a: any) => {
                const submission = db.assignmentSubmissions?.find((sub: any) => sub.assignmentId === a.id && sub.studentId === selectedChildId);
                const subStatus = submission?.status || 'PENDING';
                
                return (
                  <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex justify-between font-bold text-slate-900">
                      <p>{a.title}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${subStatus === 'GRADED' ? 'bg-green-100 text-green-700' : subStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>{subStatus}</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">{a.description}</p>
                    <p className="text-[10px] text-slate-400 font-bold">DUE DATE: {a.dueDate} • MAX MARKS: {a.maxMarks}</p>
                    {submission?.status === 'GRADED' && (
                      <p className="text-teal-700 font-bold bg-white p-2.5 rounded border border-slate-200">Grade Score: {submission.marksObtained}/{a.maxMarks} • Teacher feedback: "{submission.feedback}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Fee statements */}
        {activeTab === 'FEES' && selectedChild && (
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs text-left space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-900 border-b border-slate-50 pb-2">Family Invoice & Inward Receipts</h3>
            <div className="space-y-3.5 text-xs">
              {db.feeStructures?.filter((fs: any) => fs.classId === selectedChild.classId).map((fs: any) => {
                const payment = db.feePayments?.find((fp: any) => fp.feeStructureId === fs.id && fp.studentId === selectedChildId);
                const status = payment?.status || 'PENDING';
                
                return (
                  <div key={fs.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">{fs.name}</p>
                      <p className="text-slate-400 font-bold">Outstanding Statement: ${fs.amount} • Term Due Date: {fs.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Messaging Teacher */}
        {activeTab === 'CHAT' && (
          <div className="grid md:grid-cols-12 gap-6 min-h-[500px]">
            
            {/* Left teacher selections */}
            <div className="col-span-12 md:col-span-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs text-left">
              <h3 className="font-display font-semibold text-xs uppercase text-slate-400 tracking-wider mb-3">Academic Teachers</h3>
              <div className="space-y-1 text-xs font-semibold">
                {db.teachers?.map((t: any) => (
                  <button
                    key={t.id} type="button"
                    onClick={() => setActiveTeacherId(t.userId)}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left font-semibold transition cursor-pointer ${activeTeacherId === t.userId ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    <div>
                      <p>{t.name}</p>
                      <p className={`text-[10px] ${activeTeacherId === t.userId ? 'text-slate-400 font-normal' : 'text-slate-500 font-normal'}`}>{t.specialization}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Pane */}
            <div className="col-span-12 md:col-span-8 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs">
              {activeTeacherId ? (
                <>
                  <div className="p-4 border-b border-slate-100 bg-slate-50 text-left">
                    <p className="font-semibold text-xs uppercase text-slate-400">Discussion Thread</p>
                    <p className="font-bold text-slate-800 text-sm">{db.users?.find((u: any) => u.id === activeTeacherId)?.name}</p>
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
                      placeholder="Ask the teacher about your child's progress..."
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                    />
                    <button type="submit" className="p-2.5 bg-slate-900 text-white rounded-xl">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 p-10">
                  <p className="text-xs font-semibold">Select an educator on the left to start private thread.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
