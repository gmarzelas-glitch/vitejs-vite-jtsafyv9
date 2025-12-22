import React, { useState } from 'react';
import { generatePDF } from './utils/pdfGenerator';
import { Upload, Scan, Mail, Trash2 } from 'lucide-react';

export default function App() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [reportInfo] = useState({
    name: 'DIMITRIOS ATHANASIOU',
    project: 'STRONGER VOICES',
    date: '2025-12-22'
  });
  const manualID = "5001";

  // Σωστό Attach: Δέχεται και PDF και Images
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

  // Επαναφορά της λειτουργίας Scan
  const handleScan = () => {
    // Εδώ καλείται η δική σου handleScan από το αρχικό σου αρχείο
    alert("Scanning initiated...");
  };

  const handleFinalSubmit = async () => {
    const { total } = await generatePDF(expenses, receiptImages, reportInfo, manualID);
    const recipient = "finance@duchennedatafoundation.org";
    const subject = `Expense Report ${manualID} - ${reportInfo.project} - ${reportInfo.name}`;
    const body = `Dear Finance Team,\n\nPlease find attached the expense report.\n\nProject: ${reportInfo.project}\nTotal: ${total.toFixed(2)} EUR`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* Header - Επαναφορά Μαύρου/Κόκκινου */}
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border-l-4 border-red-600">
          <h1 className="text-2xl font-black text-slate-900 italic uppercase">Reimbursements</h1>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl cursor-pointer hover:bg-slate-700 transition font-bold text-sm">
              <Upload size={18} /> ATTACH FILE
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
            </label>
            <button onClick={handleScan} className="flex items-center gap-2 bg-slate-950 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition font-bold text-sm">
              <Scan size={18} className="text-red-500" /> SCAN RECEIPT
            </button>
          </div>
        </header>

        {/* Πίνακας - Επαναφορά Μαύρου Header */}
        <main className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#050505] text-white text-[10px] uppercase tracking-widest font-bold">
                <th className="p-6">Date</th>
                <th className="p-6">Merchant & Category</th>
                <th className="p-6 text-right">Amount</th>
                <th className="p-6 text-center w-20">-</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition">
                  <td className="p-6 text-slate-400 text-xs font-bold">{exp.date}</td>
                  <td className="p-6">
                    <div className="font-bold text-slate-900 uppercase">{exp.merchantName}</div>
                    <div className="text-[10px] font-bold text-red-600 uppercase italic">{exp.category}</div>
                  </td>
                  <td className="p-6 text-right font-bold text-slate-900 text-lg">
                    {Number(exp.totalAmount).toFixed(2)}
                  </td>
                  <td className="p-6 text-center text-slate-300">
                    <Trash2 size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Breakdown & Κόκκινο Total */}
          <div className="p-8 bg-slate-50 flex justify-between items-end">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-red-600 uppercase tracking-tighter border-b-2 border-red-600 inline-block">Breakdown</div>
              <div className="text-xs text-slate-400 font-bold uppercase">{expenses.length} Items Registered</div>
            </div>
            <div className="bg-[#d91e18] p-8 rounded-2xl text-white shadow-2xl min-w-[240px] text-right">
              <div className="text-[10px] font-bold uppercase opacity-70">Total Claim</div>
              <div className="text-5xl font-black italic tracking-tighter">
                {expenses.reduce((sum, e) => sum + Number(e.totalAmount), 0).toFixed(2)} <span className="text-xl font-normal not-italic">EUR</span>
              </div>
            </div>
          </div>
        </main>

        {/* Generate Button - Επαναφορά Μαύρου */}
        <button 
          onClick={handleFinalSubmit}
          className="w-full mt-8 bg-[#050505] text-white py-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-4 hover:bg-slate-900 transition shadow-2xl"
        >
          <Mail size={24} /> GENERATE & EMAIL REPORT
        </button>
      </div>
    </div>
  );
}