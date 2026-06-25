import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Clock, DollarSign, Users, Bookmark, FileSpreadsheet, Plus, HelpCircle, UserPlus, BookCheck, Bus, MapPin, Receipt, CheckCircle, Trash2
} from 'lucide-react';
import { motion } from 'motion/react';

interface StaffDashboardProps {
  user: any;
  onLogout: () => void;
  onTriggerAI: (mode: 'HOMEWORK' | 'COMMENTS' | 'INSIGHTS' | 'SUMMARY', context?: any) => void;
}

export default function StaffDashboard({ user, onLogout, onTriggerAI }: StaffDashboardProps) {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Forms states
  // Reception Forms
  const [showAddVisitor, setShowAddVisitor] = useState(false);
  const [newVisitor, setNewVisitor] = useState({ name: '', phone: '', purpose: '', checkIn: '09:00 AM', hostName: '' });

  // Accounting Forms
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const [newPaymentInput, setNewPaymentInput] = useState({ studentId: '', feeStructureId: '', amountPaid: 450, paymentMethod: 'CASH' as any });

  // Library Forms
  const [showIssueBook, setShowIssueBook] = useState(false);
  const [newBookIssue, setNewBookIssue] = useState({ bookId: '', studentId: '', issueDate: '', dueDate: '' });

  const fetchDB = async () => {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      setDb(data);

      if (data.books?.length > 0 && !newBookIssue.bookId) {
        setNewBookIssue(prev => ({ ...prev, bookId: data.books[0].id }));
      }
      if (data.students?.length > 0 && !newBookIssue.studentId) {
        setNewBookIssue(prev => ({ ...prev, studentId: data.students[0].id }));
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
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Get staff department profile
  const staffProfile = db.staff?.find((s: any) => s.userId === user.id);
  const dept = staffProfile?.department || 'RECEPTION'; // fallback

  // 1. RECEPTION ACTIONS
  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitor.name || !newVisitor.phone) return;

    try {
      await fetch('/api/db/visitorLog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVisitor,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      setShowAddVisitor(false);
      setNewVisitor({ name: '', phone: '', purpose: '', checkIn: '10:00 AM', hostName: '' });
      fetchDB();
    } catch (e) {
      alert("Error saving visitor check-in");
    }
  };

  // 2. ACCOUNTING ACTIONS
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaymentInput.studentId || !newPaymentInput.feeStructureId) return;

    try {
      const payRes = await fetch('/api/db/feePayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPaymentInput,
          amountPaid: Number(newPaymentInput.amountPaid),
          paymentDate: new Date().toISOString().split('T')[0],
          status: 'PAID',
          transactionId: `TXN-CASH-${Date.now()}`,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });
      const payment = await payRes.json();

      // Issue Receipt log
      await fetch('/api/db/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          receiptNumber: `REC-CASH-${Date.now().toString().slice(-4)}`,
          issuedDate: new Date().toISOString().split('T')[0],
          issuedBy: user.name,
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });

      setShowAddReceipt(false);
      fetchDB();
      alert("Inward payment checked in & printable PDF receipt issued!");
    } catch (e) {
      alert("Error checking in payment");
    }
  };

  // 3. LIBRARY ACTIONS
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookIssue.bookId || !newBookIssue.studentId) return;

    try {
      await fetch('/api/db/bookIssues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBookIssue,
          status: 'ISSUED',
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role
        })
      });

      // Update book available count
      const book = db.books?.find((b: any) => b.id === newBookIssue.bookId);
      if (book) {
        await fetch(`/api/db/books/${book.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            available: Math.max(0, book.available - 1),
            operatorId: user.id,
            operatorName: user.name,
            operatorRole: user.role
          })
        });
      }

      setShowIssueBook(false);
      fetchDB();
      alert("Book issued successfully!");
    } catch (e) {
      alert("Issue failed");
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
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full uppercase">Staff Desk</span>
          </div>

          <div className="mb-4 p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Department</p>
            <p className="text-xs font-semibold text-teal-400 mt-1 uppercase tracking-wider">{dept}</p>
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
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{dept} Desk Coordinator</p>
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Department Operations Console</span>
            <h1 className="font-display font-bold text-2xl text-slate-950 mt-1">
              {dept === 'RECEPTION' && 'Inward Visitor Logs & Admission Inquiries'}
              {dept === 'ACCOUNTING' && 'Inward Accounts Ledger & Receipts Registry'}
              {dept === 'LIBRARY' && 'Academic Catalog & Circulation Logs'}
              {dept === 'TRANSPORT' && 'School Bus Routes & Vehicle Dispatches'}
            </h1>
          </div>
        </header>

        {/* 1. RECEPTION MODULE */}
        {dept === 'RECEPTION' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddVisitor(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow cursor-pointer text-xs font-semibold"
              >
                Log Visitor Check-In
              </button>
            </div>

            {showAddVisitor && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleAddVisitor}
                className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-4 shadow-xs"
              >
                <div className="border-b border-slate-100 pb-1.5"><h4 className="font-bold text-slate-900 text-sm">Visitor Entry Checklist</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Visitor Name</label>
                    <input 
                      type="text" required placeholder="Marcus Brody" value={newVisitor.name}
                      onChange={e => setNewVisitor({...newVisitor, name: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Phone</label>
                    <input 
                      type="text" required placeholder="+1 (555) 019..." value={newVisitor.phone}
                      onChange={e => setNewVisitor({...newVisitor, phone: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Check-In Time</label>
                    <input 
                      type="text" required value={newVisitor.checkIn}
                      onChange={e => setNewVisitor({...newVisitor, checkIn: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Purpose / Meeting Host</label>
                    <input 
                      type="text" required placeholder="Admissions inquiry for son, meeting Giles Rupert" value={newVisitor.purpose}
                      onChange={e => setNewVisitor({...newVisitor, purpose: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddVisitor(false)} className="px-4 py-2 bg-slate-100 rounded-lg font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-bold rounded-lg cursor-pointer">Commit Check-In</button>
                </div>
              </motion.form>
            )}

            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Visitor Name</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4">Purpose / Inquiries</th>
                    <th className="p-4">Check-In</th>
                    <th className="p-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {db.visitorLog?.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{v.name}</td>
                      <td className="p-4 font-mono font-bold text-slate-600">{v.phone}</td>
                      <td className="p-4 text-slate-600">{v.purpose}</td>
                      <td className="p-4 font-semibold text-slate-500 flex items-center gap-1.5 mt-2.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {v.checkIn}
                      </td>
                      <td className="p-4 text-slate-400 italic">{v.remarks || 'No remarks recorded'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. ACCOUNTING MODULE */}
        {dept === 'ACCOUNTING' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddReceipt(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow cursor-pointer text-xs font-semibold"
              >
                Check In Inward Payment
              </button>
            </div>

            {showAddReceipt && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreatePayment}
                className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-4 shadow-xs"
              >
                <div className="border-b border-slate-100 pb-1.5"><h4 className="font-bold text-slate-900 text-sm">Receipt & Payment Check-In</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Select Student File</label>
                    <select 
                      required value={newPaymentInput.studentId}
                      onChange={e => setNewPaymentInput({...newPaymentInput, studentId: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Choose Student --</option>
                      {db.students?.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Associated Fee Structure</label>
                    <select 
                      required value={newPaymentInput.feeStructureId}
                      onChange={e => {
                        const amount = db.feeStructures?.find((f: any) => f.id === e.target.value)?.amount || 450;
                        setNewPaymentInput({...newPaymentInput, feeStructureId: e.target.value, amountPaid: amount});
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Choose Structure --</option>
                      {db.feeStructures?.map((f: any) => <option key={f.id} value={f.id}>{f.name} (${f.amount})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Amount Collected ($)</label>
                    <input 
                      type="number" required value={newPaymentInput.amountPaid}
                      onChange={e => setNewPaymentInput({...newPaymentInput, amountPaid: Number(e.target.value)})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Collection Channel</label>
                    <select 
                      value={newPaymentInput.paymentMethod}
                      onChange={e => setNewPaymentInput({...newPaymentInput, paymentMethod: e.target.value as any})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                    >
                      <option>CASH</option>
                      <option>CARD</option>
                      <option>BANK_TRANSFER</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddReceipt(false)} className="px-4 py-2 bg-slate-100 rounded-lg font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-bold rounded-lg cursor-pointer">Commit Collection</button>
                </div>
              </motion.form>
            )}

            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Receipt Number</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Term Statement</th>
                    <th className="p-4">Collected Amount</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Processing Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 font-mono">
                  {db.feePayments?.map((p: any) => {
                    const studentName = db.students?.find((s: any) => s.id === p.studentId)?.name;
                    const structureName = db.feeStructures?.find((f: any) => f.id === p.feeStructureId)?.name;
                    const receipt = db.receipts?.find((r: any) => r.paymentId === p.id);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-900 font-semibold">{receipt?.receiptNumber || 'SYS-GATEWAY'}</td>
                        <td className="p-4 font-sans font-semibold text-slate-900">{studentName}</td>
                        <td className="p-4 font-sans text-slate-600">{structureName}</td>
                        <td className="p-4 text-slate-900 font-bold">${p.amountPaid}</td>
                        <td className="p-4 font-sans"><span className="px-2 py-0.5 bg-slate-100 rounded-full font-bold">{p.paymentMethod}</span></td>
                        <td className="p-4 text-slate-400">{p.paymentDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. LIBRARY MODULE */}
        {dept === 'LIBRARY' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowIssueBook(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow cursor-pointer text-xs font-semibold"
              >
                Issue Catalog Book
              </button>
            </div>

            {showIssueBook && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleIssueBook}
                className="p-5 bg-white border border-slate-200 rounded-2xl text-xs space-y-4 shadow-xs"
              >
                <div className="border-b border-slate-100 pb-1.5"><h4 className="font-bold text-slate-900 text-sm">Circulation Issue Form</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Catalog Book</label>
                    <select 
                      value={newBookIssue.bookId}
                      onChange={e => setNewBookIssue({...newBookIssue, bookId: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {db.books?.map((b: any) => <option key={b.id} value={b.id}>{b.title} ({b.available} available)</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Borrower Student</label>
                    <select 
                      value={newBookIssue.studentId}
                      onChange={e => setNewBookIssue({...newBookIssue, studentId: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {db.students?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Issue Date</label>
                    <input 
                      type="date" required value={newBookIssue.issueDate}
                      onChange={e => setNewBookIssue({...newBookIssue, issueDate: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Due Back Date</label>
                    <input 
                      type="date" required value={newBookIssue.dueDate}
                      onChange={e => setNewBookIssue({...newBookIssue, dueDate: e.target.value})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowIssueBook(false)} className="px-4 py-2 bg-slate-100 rounded-lg font-bold">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-bold rounded-lg cursor-pointer">Log Circulation Issue</button>
                </div>
              </motion.form>
            )}

            <div className="grid md:grid-cols-12 gap-6">
              
              {/* Books List catalog */}
              <div className="col-span-12 md:col-span-7 bg-white border border-slate-150 rounded-2xl p-5 shadow-xs text-left space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-900 border-b border-slate-50 pb-2">Academic Books Catalog</h3>
                <div className="divide-y divide-slate-100">
                  {db.books?.map((b: any) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{b.title}</p>
                        <p className="text-slate-500 mt-0.5">Author: {b.author} • Location: {b.location}</p>
                      </div>
                      <span className="font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                        {b.available} / {b.quantity} Available
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Borrowing log checklist */}
              <div className="col-span-12 md:col-span-5 bg-white border border-slate-150 rounded-2xl p-5 shadow-xs text-left space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-900 border-b border-slate-50 pb-2">Outstanding Library Issues</h3>
                <div className="space-y-3 text-xs">
                  {db.bookIssues?.map((bi: any) => {
                    const studentName = db.students?.find((s: any) => s.id === bi.studentId)?.name;
                    const bookName = db.books?.find((b: any) => b.id === bi.bookId)?.title;
                    return (
                      <div key={bi.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <p>{bookName}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${bi.status === 'ISSUED' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{bi.status}</span>
                        </div>
                        <p className="text-slate-500">Student: {studentName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">DUE BACK: {bi.dueDate}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 4. TRANSPORT MODULE */}
        {dept === 'TRANSPORT' && (
          <div className="space-y-6 text-left">
            <div className="grid md:grid-cols-2 gap-6 font-semibold">
              
              <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-xs text-left space-y-4">
                <h3 className="font-display font-semibold text-sm text-slate-900 border-b border-slate-50 pb-2">Institutional Bus Routes</h3>
                <div className="space-y-3.5 text-xs">
                  {db.transportRoutes?.map((route: any) => (
                    <div key={route.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between font-bold text-slate-900 text-sm">
                        <p className="flex items-center gap-1.5">
                          <Bus className="h-4 w-4 text-teal-600 animate-pulse" />
                          {route.routeName}
                        </p>
                        <span className="text-[11px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">{route.vehicleNumber}</span>
                      </div>
                      <p className="text-slate-500">Route loop: <strong className="text-slate-800">{route.startPoint} ➔ {route.endPoint}</strong></p>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-200">
                        <p>Driver: {route.driverName} ({route.driverPhone})</p>
                        <p>Load Capacity: {route.capacity} seats</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transit checklist card */}
              <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-xs text-left space-y-4 text-xs font-semibold">
                <h3 className="font-display font-semibold text-sm text-slate-900">Transit Logs</h3>
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 space-y-1">
                  <h4 className="font-bold flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-700" />
                    All Routes Operational
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                    Both dispatch circles East Loop and North Van routes started on schedule. Next terminal inspection on Friday morning.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
