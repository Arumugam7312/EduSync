import React, { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Check, BookOpen, UserCheck, HelpCircle, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AICanvasProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'HOMEWORK' | 'COMMENTS' | 'INSIGHTS' | 'SUMMARY';
  contextData?: any;
}

export default function AICanvas({ isOpen, onClose, initialMode = 'HOMEWORK', contextData }: AICanvasProps) {
  const [activeTab, setActiveTab] = useState<'HOMEWORK' | 'COMMENTS' | 'INSIGHTS' | 'SUMMARY'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState('');

  // Homework Generator State
  const [hwTopic, setHwTopic] = useState(contextData?.topic || 'Quadratic Equations');
  const [hwDifficulty, setHwDifficulty] = useState('Intermediate');
  const [hwClass, setHwClass] = useState('Grade 10');

  // Report Card Comment State
  const [commentStudent, setCommentStudent] = useState(contextData?.studentName || 'Emma Watson');
  const [commentSubject, setCommentSubject] = useState(contextData?.subject || 'Mathematics');
  const [commentGrade, setCommentGrade] = useState(contextData?.grade || 'A+');
  const [commentRemarks, setCommentRemarks] = useState(contextData?.remarks || 'Consistently top marks, attentive, helps peers');

  // Student Summary State
  const [summaryStudent, setSummaryStudent] = useState(contextData?.studentName || 'Daniel Watson');
  const [summaryClass, setSummaryClass] = useState(contextData?.classAndSection || 'Grade 9 - Section A');
  const [summaryAttendance, setSummaryAttendance] = useState(contextData?.attendancePercentage || '92');
  const [summaryGrades, setSummaryGrades] = useState(contextData?.grades || 'Math: B, Science: B+, English: A');
  const [summaryAssignments, setSummaryAssignments] = useState(contextData?.assignments || '1 completed, 2 pending');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAIContent = async (type: string) => {
    setLoading(true);
    setOutput('');
    try {
      let endpoint = '';
      let payload = {};

      if (type === 'HOMEWORK') {
        endpoint = '/api/ai/homework-generator';
        payload = { topic: hwTopic, difficulty: hwDifficulty, classLevel: hwClass };
      } else if (type === 'COMMENTS') {
        endpoint = '/api/ai/report-comments';
        payload = { studentName: commentStudent, subject: commentSubject, currentGrade: commentGrade, gradeRemarks: commentRemarks };
      } else if (type === 'SUMMARY') {
        endpoint = '/api/ai/student-summary';
        payload = { 
          studentName: summaryStudent, 
          classAndSection: summaryClass, 
          attendancePercentage: summaryAttendance, 
          examGrades: summaryGrades.split(',').map((g: string) => g.trim()), 
          activeAssignments: summaryAssignments 
        };
      } else if (type === 'INSIGHTS') {
        endpoint = '/api/ai/attendance-insights';
        payload = {
          totalStudents: contextData?.totalStudents || 3,
          presentCount: contextData?.presentCount || 2,
          absentCount: contextData?.absentCount || 1,
          lateCount: contextData?.lateCount || 0,
          classBreakdowns: contextData?.classBreakdowns || { "Grade 9": "92%", "Grade 10": "100%" }
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setOutput(data.text);
    } catch (err) {
      setOutput('An error occurred during AI generation. Please check that the server is running properly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col h-full overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-500 rounded-lg text-slate-950">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">EduSync AI Copilot</h3>
                  <p className="text-[10px] text-teal-400">Powered by Gemini 2.5 Flash</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white text-sm px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>

            {/* Menu Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1 text-xs">
              <button
                onClick={() => { setActiveTab('HOMEWORK'); setOutput(''); }}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${activeTab === 'HOMEWORK' ? 'bg-white text-slate-900 shadow-xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Homework Gen
              </button>
              <button
                onClick={() => { setActiveTab('COMMENTS'); setOutput(''); }}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${activeTab === 'COMMENTS' ? 'bg-white text-slate-900 shadow-xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="h-3.5 w-3.5" />
                Comments
              </button>
              <button
                onClick={() => { setActiveTab('SUMMARY'); setOutput(''); }}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${activeTab === 'SUMMARY' ? 'bg-white text-slate-900 shadow-xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Student AI
              </button>
              <button
                onClick={() => { setActiveTab('INSIGHTS'); setOutput(''); }}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${activeTab === 'INSIGHTS' ? 'bg-white text-slate-900 shadow-xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Insights
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-left text-sm">
              
              {activeTab === 'HOMEWORK' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Create custom assignments with exercises & teacher answer guidelines instantly.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Assignment Topic</label>
                        <input 
                          type="text" 
                          value={hwTopic} 
                          onChange={(e) => setHwTopic(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Difficulty</label>
                        <select 
                          value={hwDifficulty} 
                          onChange={(e) => setHwDifficulty(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        >
                          <option>Introductory</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                          <option>College-Prep</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Class/Level</label>
                        <select 
                          value={hwClass} 
                          onChange={(e) => setHwClass(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        >
                          <option>Grade 8</option>
                          <option>Grade 9</option>
                          <option>Grade 10</option>
                          <option>Grade 11</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => generateAIContent('HOMEWORK')}
                    disabled={loading}
                    className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loading ? 'Analyzing topic...' : 'Generate Homework Assignment'}
                  </button>
                </div>
              )}

              {activeTab === 'COMMENTS' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Write personalized, encouraging comments for reports card and student folders.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Student Name</label>
                        <input 
                          type="text" 
                          value={commentStudent} 
                          onChange={(e) => setCommentStudent(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Subject</label>
                        <input 
                          type="text" 
                          value={commentSubject} 
                          onChange={(e) => setCommentSubject(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Grade</label>
                        <input 
                          type="text" 
                          value={commentGrade} 
                          onChange={(e) => setCommentGrade(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Performance Cues</label>
                        <input 
                          type="text" 
                          value={commentRemarks} 
                          onChange={(e) => setCommentRemarks(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                          placeholder="e.g. Participates well, weak algebra speed"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => generateAIContent('COMMENTS')}
                    disabled={loading}
                    className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loading ? 'Drafting remarks...' : 'Generate Report Card Comments'}
                  </button>
                </div>
              )}

              {activeTab === 'SUMMARY' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-2">Synthesize attendance, grading folders, and homework records into a rich parent summary.</p>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Student Name</label>
                        <input 
                          type="text" 
                          value={summaryStudent} 
                          onChange={(e) => setSummaryStudent(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Class & Section</label>
                        <input 
                          type="text" 
                          value={summaryClass} 
                          onChange={(e) => setSummaryClass(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Attendance %</label>
                        <input 
                          type="text" 
                          value={summaryAttendance} 
                          onChange={(e) => setSummaryAttendance(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Active Exams/Grades</label>
                        <input 
                          type="text" 
                          value={summaryGrades} 
                          onChange={(e) => setSummaryGrades(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Assignments status</label>
                        <input 
                          type="text" 
                          value={summaryAssignments} 
                          onChange={(e) => setSummaryAssignments(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => generateAIContent('SUMMARY')}
                    disabled={loading}
                    className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loading ? 'Synthesizing...' : 'Generate Student Performance Summary'}
                  </button>
                </div>
              )}

              {activeTab === 'INSIGHTS' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-950">
                    <h4 className="font-semibold text-xs flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-amber-700" />
                      Dynamic Attendance Analytics
                    </h4>
                    <p className="text-[11px] mt-1 text-slate-700 leading-relaxed">
                      Triggers full-school analytics covering average daily attendance rates, transportation lateness patterns, and grade-by-grade engagement trends.
                    </p>
                  </div>
                  <button
                    onClick={() => generateAIContent('INSIGHTS')}
                    disabled={loading}
                    className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {loading ? 'Mining insights...' : 'Generate Daily Insights'}
                  </button>
                </div>
              )}

              {/* AI Response Output Block */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin text-teal-500" />
                  <span className="text-xs font-medium">Drafting response using Gemini...</span>
                </div>
              )}

              {output && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Co-Pilot Draft</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={copyToClipboard}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-50 transition flex items-center gap-1 text-[11px]"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Generated response card */}
                  <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner max-h-[350px] overflow-y-auto">
                    {output}
                  </div>
                </motion.div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 text-[10px] text-center text-slate-400 bg-slate-50">
              This sandbox interface mimics actual model triggers safely. Copied results can be drop-inserted directly into student forms.
            </div>

          </div>
        </>
      )}
    </AnimatePresence>
  );
}
