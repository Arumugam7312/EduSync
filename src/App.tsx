import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import StaffDashboard from './components/StaffDashboard';
import AICanvas from './components/AICanvas';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'HOMEWORK' | 'COMMENTS' | 'INSIGHTS' | 'SUMMARY'>('HOMEWORK');
  const [aiContext, setAiContext] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('edusync_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    localStorage.setItem('edusync_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('edusync_user');
  };

  const handleTriggerAI = (mode: 'HOMEWORK' | 'COMMENTS' | 'INSIGHTS' | 'SUMMARY', context?: any) => {
    setAiMode(mode);
    if (context) {
      setAiContext(context);
    }
    setAiDrawerOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans selection:bg-teal-500 selection:text-slate-900">
      
      {/* 1. Unauthenticated Login Screen */}
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {/* 2. Authenticated Dashboard Screens */}
          {user.role === 'ADMIN' && (
            <AdminDashboard user={user} onLogout={handleLogout} onTriggerAI={handleTriggerAI} />
          )}

          {user.role === 'TEACHER' && (
            <TeacherDashboard user={user} onLogout={handleLogout} onTriggerAI={handleTriggerAI} />
          )}

          {user.role === 'STUDENT' && (
            <StudentDashboard user={user} onLogout={handleLogout} onTriggerAI={handleTriggerAI} />
          )}

          {user.role === 'PARENT' && (
            <ParentDashboard user={user} onLogout={handleLogout} onTriggerAI={handleTriggerAI} />
          )}

          {user.role === 'STAFF' && (
            <StaffDashboard user={user} onLogout={handleLogout} onTriggerAI={handleTriggerAI} />
          )}

          {/* Floating AI Canvas Assistant Button */}
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="fixed bottom-6 right-6 p-4 bg-slate-900 text-teal-400 hover:text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 border border-slate-800 flex items-center justify-center cursor-pointer group"
            title="Open EduSync AI Copilot"
            id="floating-ai-copilot-btn"
          >
            <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-xs uppercase tracking-wider pl-0 group-hover:pl-2">
              AI Copilot
            </span>
          </button>

          {/* AI Canvas Side Drawer */}
          <AICanvas 
            isOpen={aiDrawerOpen} 
            onClose={() => {
              setAiDrawerOpen(false);
              setAiContext(null);
            }} 
            initialMode={aiMode}
            contextData={aiContext}
          />
        </>
      )}

    </div>
  );
}
