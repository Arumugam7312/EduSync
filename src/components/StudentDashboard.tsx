import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Clock, Sparkles, Award, FileDown, UploadCloud, CheckCircle2, DollarSign, Bookmark, FileSpreadsheet, ListTodo, Download
} from 'lucide-react';
import { motion } from 'motion/react';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  onTriggerAI: (mode: 'HOMEWORK' | 'COMMENTS' | 'INSIGHTS' | 'SUMMARY', context?: any) => void;
}

export default function StudentDashboard({ user, onLogout, onTriggerAI }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMETABLE' | 'HOMEWORK' | 'REPORT' | 'FEES' | 'MATERIALS'>('OVERVIEW');
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Homework submission state
  const [activeHomeworkSubmit, setActiveHomeworkSubmit] = useState('');
  const [submitText, setSubmitText] = useState('');
  const [submitFile, setSubmitFile] = useState('solution_draft.pdf');

  // Fee payment simulations
  const [payingFeeId, setPayingFeeId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'ONLINE'>('ONLINE');

  const fetchDB = async () => {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      setDb(data);
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
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Find student profile associated with user
  const student = db.students?.find((s: any) => s.userId === user.id);
  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-rose-600">Student profile not found. Please relogin.</p>
      </div>
    );
  }

  const studentClass = db.classes?.find((c: any) => c.id === student.classId)?.name;
  const studentSection = db.sections?.find((s: any) => s.id === student.sectionId)?.name;

  // 1. Calculate attendance percentage
  const myAttendance = db.attendance?.filter((a: any) => a.studentId === student.id) || [];
  const presentSessions = myAttendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'EXCUSED').length;
  const attendancePercentage = myAttendance.length > 0 
    ? Math.round((presentSessions / myAttendance.length) * 100) 
    : 100;

  // 2. Class assignments list
  const classAssignments = db.assignments?.filter((a: any) => a.classId === student.classId) || [];

  // 3. Marks list
  const examSubjects = db.examSubjects?.filter((es: any) => es.classId === student.classId) || [];
  const myMarks = db.marks?.filter((m: any) => m.studentId === student.id) || [];

  // Calculate grade average
  const totalObtainedMarks = myMarks.reduce((acc: number, m: any) => acc + m.marksObtained, 0);
  const marksAverage = myMarks.length > 0 ? Math.round(totalObtainedMarks / myMarks.length) : 0;

  // Handle assignment submission
  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitText || !activeHomeworkSubmit) return;

    try {
      await fetch('/api/db/assignmentSubmissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: activeHomeworkSubmit,
          studentId: student.id,
          submissionDate: new Date().toISOString().split('T')[0],
          fileUrl: '#',
          fileName: submitFile,
          submittedText: submitText,
          status: 'SUBMITTED',
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });

      alert("Homework file submitted successfully to teacher.");
      setSubmitText('');
      setActiveHomeworkSubmit('');
      fetchDB();
    } catch (e) {
      alert("Submission failed");
    }
  };

  // Pay Fee simulation
  const handlePayFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFeeId) return;

    const structure = db.feeStructures?.find((f: any) => f.id === payingFeeId);
    if (!structure) return;

    try {
      // Create payment log
      const payRes = await fetch('/api/db/feePayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          feeStructureId: structure.id,
          amountPaid: structure.amount,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod,
          status: 'PAID',
          transactionId: `TXN${Date.now()}`,
          discount: 0,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      const payment = await payRes.json();

      // Create Receipt log
      await fetch('/api/db/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          receiptNumber: `REC-2026-${Math.floor(Math.random()*900)+100}`,
          issuedDate: new Date().toISOString().split('T')[0],
          issuedBy: 'Online Gateway',
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });

      alert("Simulated transaction complete! Fee invoice is marked PAID and receipt generated.");
      setPayingFeeId('');
      fetchDB();
    } catch (e) {
      alert("Failed to pay invoice");
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
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase border border-slate-700">Student</span>
          </div>

          <div className="space-y-1.5 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'OVERVIEW' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Bookmark className="h-4 w-4" />
              My Overview
            </button>
            <button 
              onClick={() => setActiveTab('TIMETABLE')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'TIMETABLE' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Calendar className="h-4 w-4" />
              My Timetable
            </button>
            <button 
              onClick={() => setActiveTab('HOMEWORK')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'HOMEWORK' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <ListTodo className="h-4 w-4" />
              Homework Task
            </button>
            <button 
              onClick={() => setActiveTab('REPORT')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'REPORT' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Award className="h-4 w-4" />
              My Report Card
            </button>
            <button 
              onClick={() => setActiveTab('FEES')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'FEES' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <DollarSign className="h-4 w-4" />
              Fee Invoices
            </button>
            <button 
              onClick={() => setActiveTab('MATERIALS')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition cursor-pointer ${activeTab === 'MATERIALS' ? 'bg-teal-500 text-slate-950 font-semibold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Download className="h-4 w-4" />
              Study Materials
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-left">
          <div className="flex items-center gap-2">
            <img 
              src={user.avatarUrl || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120"} 
              alt="avatar" 
              className="h-8 w-8 rounded-full border border-slate-800"
            />
            <div>
              <p className="font-semibold text-slate-200">{user.name}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{studentClass} - {studentSection}</p>
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{student.rollNumber} • {studentClass}</span>
            <h1 className="font-display font-bold text-2xl text-slate-950 mt-1">
              {activeTab === 'OVERVIEW' && 'Academic Student Desk'}
              {activeTab === 'TIMETABLE' && 'Weekly Class Timetable'}
              {activeTab === 'HOMEWORK' && 'Coursework Assignments'}
              {activeTab === 'REPORT' && 'Active Term Report Folder'}
              {activeTab === 'FEES' && 'Accounts & Fee Invoices'}
              {activeTab === 'MATERIALS' && 'Academic Courseware Downloads'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'REPORT' && (
              <button 
                onClick={() => onTriggerAI('SUMMARY', {
                  studentName: student.name,
                  classAndSection: `${studentClass} - ${studentSection}`,
                  attendancePercentage: String(attendancePercentage),
                  grades: myMarks.map((m: any) => {
                    const subName = db.subjects?.find((s: any) => s.id === db.examSubjects?.find((es: any) => es.id === m.examSubjectId)?.subjectId)?.name;
                    return `${subName}: ${m.marksObtained}/100`;
                  }).join(', '),
                  assignments: 'No outstanding pending tasks'
                })}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md hover:opacity-90 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                Analyze Report Card (AI)
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
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attendance Rate</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{attendancePercentage}%</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Assignments</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{classAssignments.length}</p>
                </div>
              </div>
              <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-xs">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Midterm Average</p>
                  <p className="font-display font-semibold text-xl text-slate-900 mt-0.5">{marksAverage}%</p>
                </div>
              </div>
            </div>

            {/* Timetable schedule preview */}
            <div className="grid md:grid-cols-12 gap-6">
              
              <div className="col-span-12 md:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-900">Today's Lectures</h3>
                <div className="space-y-2.5">
                  {db.timetables?.filter((tt: any) => tt.classId === student.classId).map((slot: any) => {
                    const subName = db.subjects?.find((s: any) => s.id === slot.subjectId)?.name;
                    const teaName = db.teachers?.find((t: any) => t.id === slot.teacherId)?.name;
                    return (
                      <div key={slot.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-xs font-semibold">
                        <div className="space-y-1">
                          <p className="text-slate-900">{subName}</p>
                          <p className="text-slate-400 font-normal">{teaName} • {slot.roomNumber}</p>
                        </div>
                        <p className="text-slate-500 font-mono text-[11px] bg-slate-200/60 px-2 py-0.5 rounded font-bold">{slot.startTime} - {slot.endTime}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bulletins notices */}
              <div className="col-span-12 md:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-900">School Noticeboard</h3>
                <div className="space-y-3">
                  {db.notifications?.filter((n: any) => !n.targetRole || n.targetRole === 'STUDENT').map((n: any) => (
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

        {/* Tab 2: Timetable */}
        {activeTab === 'TIMETABLE' && (
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs text-left space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-900">Full Lecture Timetable</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => {
                const dayLectures = db.timetables?.filter((tt: any) => tt.classId === student.classId && tt.dayOfWeek === day) || [];
                return (
                  <div key={day} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 min-h-[150px]">
                    <h4 className="font-bold text-[11px] text-slate-500 tracking-wider uppercase border-b border-slate-200 pb-1.5">{day}</h4>
                    {dayLectures.length > 0 ? (
                      dayLectures.map((slot: any) => {
                        const subName = db.subjects?.find((s: any) => s.id === slot.subjectId)?.name;
                        return (
                          <div key={slot.id} className="p-2 bg-white border border-slate-150 rounded text-xs space-y-1">
                            <p className="font-bold text-slate-800">{subName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{slot.startTime} - {slot.endTime}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No scheduled lectures</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Homework Submissions */}
        {activeTab === 'HOMEWORK' && (
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Left Homework list */}
            <div className="col-span-12 md:col-span-6 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs text-left space-y-4">
              <h3 className="font-display font-semibold text-sm text-slate-950 border-b border-slate-50 pb-2">Homework Deliverables</h3>
              <div className="space-y-3.5 text-xs">
                {classAssignments.map((a: any) => {
                  const submission = db.assignmentSubmissions?.find((sub: any) => sub.assignmentId === a.id && sub.studentId === student.id);
                  const subStatus = submission?.status || 'PENDING';
                  return (
                    <div key={a.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                      <div className="flex justify-between font-bold text-slate-900">
                        <p>{a.title}</p>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${subStatus === 'GRADED' ? 'bg-green-100 text-green-700' : subStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>{subStatus}</span>
                      </div>
                      <p className="text-slate-500 leading-relaxed">{a.description}</p>
                      <p className="text-[10px] text-slate-400 font-bold">DUE DATE: {a.dueDate} • MAX MARKS: {a.maxMarks}</p>
                      
                      {submission && (
                        <div className="border-t border-slate-200 pt-2 mt-2 bg-white/50 p-2 rounded text-[11px] space-y-1">
                          <p className="text-slate-600 font-semibold">Your submission: "{submission.submittedText}"</p>
                          {submission.status === 'GRADED' && (
                            <p className="text-teal-700 font-bold">Grade Marks Obtained: {submission.marksObtained}/{a.maxMarks} • Feedback: {submission.feedback}</p>
                          )}
                        </div>
                      )}

                      {!submission && (
                        <button
                          onClick={() => setActiveHomeworkSubmit(a.id)}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded font-bold cursor-pointer transition"
                        >
                          Submit Homework
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Form pane */}
            <div className="col-span-12 md:col-span-6 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs text-left">
              {activeHomeworkSubmit ? (
                <form onSubmit={handleSubmitHomework} className="space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-sm text-slate-950">Submit Active Homework</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Please provide textbook exercises solutions in the response space.</p>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-700">Solution Answer / Notes</label>
                    <textarea 
                      required placeholder="Write detailed solutions or text answers here..." value={submitText} onChange={e => setSubmitText(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl h-44 text-xs"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700">Simulate PDF File Attachment</label>
                    <input 
                      type="text" value={submitFile} onChange={e => setSubmitFile(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button type="button" onClick={() => setActiveHomeworkSubmit('')} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg">Lock Submission</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 h-full text-slate-400 gap-3 border border-dashed border-slate-250 rounded-2xl">
                  <UploadCloud className="h-10 w-10 text-slate-300" />
                  <p className="text-xs font-semibold">Select a homework assignment on the left to activate submission pane.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 4: Academic Report */}
        {activeTab === 'REPORT' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Marks Obtained</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Grade Points</th>
                    <th className="p-4">Remarks Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {myMarks.map((m: any) => {
                    const examSubject = db.examSubjects?.find((es: any) => es.id === m.examSubjectId);
                    const subName = db.subjects?.find((s: any) => s.id === examSubject?.subjectId)?.name;
                    
                    // Derive grade
                    const gradeRecord = db.grades?.find((g: any) => m.marksObtained >= g.minPercentage && m.marksObtained <= g.maxPercentage) || { name: 'F', gradePoints: 0.0 };

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{subName}</td>
                        <td className="p-4 font-mono font-bold">{m.marksObtained} / 100</td>
                        <td className="p-4"><span className="px-2.5 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 rounded-full font-bold">{gradeRecord.name}</span></td>
                        <td className="p-4 font-mono font-bold">{gradeRecord.gradePoints}</td>
                        <td className="p-4 text-slate-500">{m.remarks || 'No remarks recorded'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Fee invoices */}
        {activeTab === 'FEES' && (
          <div className="grid md:grid-cols-12 gap-6 text-left">
            
            <div className="col-span-12 md:col-span-7 bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-display font-semibold text-sm text-slate-900">Term Invoice Statements</h3>
              <div className="space-y-3.5 text-xs">
                {db.feeStructures?.filter((fs: any) => fs.classId === student.classId).map((fs: any) => {
                  const payment = db.feePayments?.find((fp: any) => fp.feeStructureId === fs.id && fp.studentId === student.id);
                  const status = payment?.status || 'PENDING';
                  
                  return (
                    <div key={fs.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">{fs.name}</p>
                        <p className="text-slate-400 font-bold">Invoiced Amount: ${fs.amount} • Due Date: {fs.dueDate}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                          {status}
                        </span>
                        {status === 'PENDING' && (
                          <button
                            onClick={() => setPayingFeeId(fs.id)}
                            className="px-3 py-1.5 bg-slate-990 hover:bg-slate-800 text-white rounded font-bold transition"
                          >
                            Pay Online
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-span-12 md:col-span-5 bg-white border border-slate-150 rounded-2xl p-6 shadow-xs text-left">
              {payingFeeId ? (
                <form onSubmit={handlePayFee} className="space-y-4">
                  <h3 className="font-display font-semibold text-sm text-slate-950">Simulated Payment Gateway</h3>
                  <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1">
                    <p className="font-bold">Total Payable: ${db.feeStructures?.find((f: any) => f.id === payingFeeId)?.amount}</p>
                    <p className="text-[11px] text-slate-600">Simulates real payment dispatch with active receipts logs.</p>
                  </div>
                  <div className="space-y-1.5 text-xs font-semibold">
                    <label className="text-slate-700">Payment Channel</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button" onClick={() => setPaymentMethod('ONLINE')}
                        className={`p-2.5 border rounded-lg ${paymentMethod === 'ONLINE' ? 'bg-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}
                      >
                        Credit/Debit Card
                      </button>
                      <button 
                        type="button" onClick={() => setPaymentMethod('BANK_TRANSFER')}
                        className={`p-2.5 border rounded-lg ${paymentMethod === 'BANK_TRANSFER' ? 'bg-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}
                      >
                        Direct Bank Wire
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button type="button" onClick={() => setPayingFeeId('')} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg">Checkout Payment</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 h-full text-slate-400 gap-2 border border-dashed border-slate-200 rounded-2xl">
                  <DollarSign className="h-8 w-8 text-slate-300" />
                  <p className="text-xs font-semibold">Select an unpaid statement from invoice panel to open gateway.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 6: Study Materials */}
        {activeTab === 'MATERIALS' && (
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs text-left space-y-4">
            <h3 className="font-display font-semibold text-sm text-slate-900 border-b border-slate-50 pb-2">Academic Download Folder</h3>
            <div className="grid md:grid-cols-2 gap-4 text-xs font-semibold">
              {db.studyMaterials?.filter((sm: any) => sm.classId === student.classId).map((sm: any) => (
                <div key={sm.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-900 font-bold">{sm.title}</p>
                    <p className="text-slate-400 font-normal">{sm.fileName} • {sm.fileType.toUpperCase()}</p>
                  </div>
                  <button 
                    onClick={() => alert(`Initiating mock download: ${sm.fileName}`)}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
