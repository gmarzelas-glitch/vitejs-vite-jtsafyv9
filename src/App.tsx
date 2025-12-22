import React, { useState } from 'react';
import { generatePDF } from './utils/pdfGenerator';
import { Upload, Scan, Mail, Trash2, FileText, ChevronRight } from 'lucide-react';

export default function App() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [reportInfo] = useState({
    name: 'DIMITRIOS ATHANASIOU',
    project: 'STRONGER VOICES',
    date: '2025-12-22'
  });
  const manualID = "5001";

  // Λειτουργία για Manual Attachment χωρίς να χάνεται τίποτα
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImages(prev => [...prev, reader.result as string]);
        const newExpense = {
          id: Math.random().toString(),
          date: new Date().toISOString().split('T')[0],
          merchantName: file.name.toUpperCase(),
          category: 'ATTACHMENT',
          totalAmount: 0
        };
        setExpenses(prev => [...prev, newExpense]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async () => {
    if (expenses.length === 0) return alert("No expenses to report.");
    const { total } = await generatePDF(expenses, receiptImages, reportInfo, manualID);
    const recipient = "finance@duchennedatafoundation.org";
    const subject = `Expense Report ${manualID} - ${reportInfo.project} - ${reportInfo.name}`;
    const body = `Dear Finance Team,\n\nPlease find attached the expense report.\n\nProject: ${reportInfo.project}\nTotal: ${total.toFixed(2)} EUR\n\nKind regards,\n${reportInfo.name}`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans antialiased">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-red-600 rounded-full"></div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">REIMBURSEMENTS</h1>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <label className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl cursor-pointer hover:bg-slate-800 transition shadow-lg font-bold text-sm">
              <Upload size={18} /> ATTACH FILE
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl hover:bg-red-700 transition shadow-lg font-bold text-sm">
              <Scan size={18} /> SCAN RECEIPT
            </button>
          </div>
        </header>

        {/* Expenses Table */}
        <main className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                  <th className="p-6">Date</th>
                  <th className="p-6">Merchant & Category</th>
                  <th className="p-6 text-right">Amount</th>
                  <th className="p-6 text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-slate-300 font-medium italic">
                      No receipts scanned yet. Start by scanning or attaching a file.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6 text-slate-400 text-xs font-bold">{exp.date}</td>
                      <td className="p-6">
                        <div className="font-black text-slate-800 tracking-tight text-base uppercase">{exp.merchantName}</div>
                        <div className="text-[10px] font-black text-red-600 uppercase italic tracking-wider flex items-center gap-1">
                          <ChevronRight size={10} /> {exp.category}
                        </div>
                      </td>
                      <td className="p-6 text-right font-black text-slate-900 text-lg">
                        {Number(exp.totalAmount).toFixed(2)}
                      </td>
                      <td className="p-6 text-center">
                        <button 
                          onClick={() => deleteExpense(exp.id)}
                          className="text-slate-200 hover:text-red-600 transition-colors p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Breakdown & Total Section */}
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest border-b-2 border-red-600 w-fit">Breakdown</span>
              <div className="flex gap-4">
                <div className="text-xs font-bold text-slate-500 uppercase">
                  {expenses.length} Receipts <span className="mx-2 text-slate-300">|</span> 
                  Project: <span className="text-slate-900">{reportInfo.project}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-red-600 p-8 rounded-[2rem] text-white shadow-[0_20px_50px_rgba(225,29,72,0.3)] min-w-[260px] relative overflow-hidden group">
              <div className="relative z-10 text-right">
                <div className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">Total Claim Amount</div>
                <div className="text-5xl font-black italic tracking-tighter flex items-center justify-end gap-2">
                  {expenses.reduce((sum, e) => sum + Number(e.totalAmount), 0).toFixed(2)} 
                  <span className="text-xl not-italic opacity-80">EUR</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>
        </main>

        {/* Final Action Button */}
        <button 
          onClick={handleFinalSubmit}
          disabled={expenses.length === 0}
          className="w-full mt-8 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-400 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Mail size={24} className="group-hover:scale-110 transition-transform" /> 
          GENERATE & EMAIL TO FINANCE
        </button>
      </div>
    </div>
  );
}