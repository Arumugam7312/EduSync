import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight, Shield, BookOpen, Users, Compass, BookOpenCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (user: { id: string; email: string; name: string; role: string; avatarUrl?: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { email: 'admin@edusync.com', pass: 'admin123', label: 'Admin (Arthur)', role: 'ADMIN', color: 'bg-blue-50 text-blue-700 border-blue-150' },
    { email: 'john.doe@edusync.com', pass: 'john123', label: 'Teacher (Dr. John)', role: 'TEACHER', color: 'bg-teal-50 text-teal-700 border-teal-150' },
    { email: 'emma.watson@edusync.com', pass: 'emma123', label: 'Student (Emma)', role: 'STUDENT', color: 'bg-emerald-50 text-emerald-700 border-emerald-150' },
    { email: 'parent.jane@edusync.com', pass: 'jane123', label: 'Parent (Jane Watson)', role: 'PARENT', color: 'bg-amber-50 text-amber-700 border-amber-150' },
    { email: 'accountant@edusync.com', pass: 'thomas123', label: 'Staff (Accountant)', role: 'STAFF', color: 'bg-rose-50 text-rose-700 border-rose-150' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Authentication failed');
      }

      const data = await response.json();
      
      if (rememberMe) {
        localStorage.setItem('edusync_remembered_email', email);
      } else {
        localStorage.removeItem('edusync_remembered_email');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Feel free to use quick-selector accounts.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (demo: typeof demoAccounts[0]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setError('');
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden grid md:grid-cols-12 min-h-[600px]">
        
        {/* Left pane: Aesthetic branding */}
        <div className="hidden md:flex md:col-span-5 bg-slate-900 p-8 flex-col justify-between text-white relative">
          {/* Subtle graphic accent */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14B8A6_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2.5 bg-teal-500 rounded-xl text-slate-900 shadow-lg shadow-teal-500/20">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-wider text-teal-400">EduSync</span>
            </div>

            <div className="space-y-6 mt-12">
              <h1 className="font-display text-3xl font-semibold tracking-tight leading-tight">
                Enterprise School Management.
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect administrators, teachers, students, parents, and support staff in a unified high-fidelity academic portal.
              </p>
            </div>
          </div>

          <div className="relative z-10 border-t border-slate-800 pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <Shield className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span>Role-Based Permissions & Strict Security</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <BookOpenCheck className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span>Real-time Academics, Marks & Attendance</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-6">
              EduSync Academy v1.4 • Certified WCAG 2.2 AA Compliance
            </p>
          </div>
        </div>

        {/* Right pane: Login form */}
        <div className="col-span-12 md:col-span-7 p-6 md:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto space-y-6">
            
            {/* Mobile Header */}
            <div className="flex md:hidden items-center gap-2 mb-4 justify-center">
              <div className="p-2 bg-teal-500 rounded-lg text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-lg text-slate-900">EduSync</span>
            </div>

            <div className="space-y-2 text-center md:text-left">
              <h2 className="font-display text-2xl font-semibold text-slate-900">Institution Login</h2>
              <p className="text-slate-500 text-sm">Welcome back. Enter your school credentials below.</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs text-left font-medium"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700" htmlFor="email-input">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700" htmlFor="password-input">Password</label>
                  <button
                    type="button"
                    onClick={() => alert("For testing, please use the quick-selector account tags below to pre-populate.")}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400 uppercase tracking-wider font-semibold">Sandbox Quick Entry</span></div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400 text-center mb-3 font-medium">Click any role to auto-populate credentials:</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => selectDemoAccount(account)}
                    className={`p-2.5 text-xs text-left border rounded-xl hover:shadow-sm hover:scale-[1.01] transition-all duration-150 flex flex-col justify-between font-medium cursor-pointer ${account.color}`}
                  >
                    <span>{account.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">{account.role}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
