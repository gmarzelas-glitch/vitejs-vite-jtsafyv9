import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Camera, FileText, Trash2, Plus, CheckCircle2, X } from 'lucide-react';
import { analyzeReceipt } from './services/gemini';
import { generatePDF } from './utils/pdfGenerator';

const toGreeklish = (t: string) => {
  const m: any = {'Α':'A','Β':'B','Γ':'G','Δ':'D','Ε':'E','Ζ':'Z','Η':'H','Θ':'TH','Ι':'I','Κ':'K','Λ':'L','Μ':'M','Ν':'N','Ξ':'X','Ο':'O','Π':'P','Ρ':'R','Σ':'S','Τ':'T','Υ':'Y','Φ':'F','Χ':'CH','Ψ':'PS','Ω':'O','α':'a','β':'b','γ':'g','δ':'d','ε':'e','ζ':'z','η':'h','θ':'th','ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s','τ':'t','υ':'y','φ':'f','χ':'ch','ψ':'ps','ω':'o','ά':'a','έ':'e','ή':'h','ί':'i','ό':'o','ύ':'y','ώ':'o'};
  return t ? t.split('').map(c => m[c] || c).join('') : "";
};

export default function App() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // States για το Review Modal
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentEntry, setCurrentEntry] = useState({ 
    date: '', 
    merchantName: '', 
    totalAmount: '', 
    category: 'GENERAL', 
    receiptImage: '' 
  });

  const [city] = useState('ATHENS');
  const [reportDate] = useState(new Date().toISOString().split('T')[0]);
  const [projects] = useState(['BIND', 'MAGIC', 'ERDERA', 'NEW DDR', 'NEW MAP', 'STRONGER VOICES', 'GENERAL COST']);
  const [selectedProject, setSelectedProject] = useState(projects[0]);

  const [employees] = useState([
    { id: '1000', name: 'NICOLETTA MADIA' },
    { id: '2000', name: 'PARASKEVI SAKELLARIOU' },
    { id: '3000', name: 'SIMINUC SERGIU' },
    { id: '4000', name: 'GEORGIOS PALIOURAS' },
    { id: '5000', name: 'DIMITRIOS ATHANASIOU' },
    { id: '6000', name: 'GEORGIOS MARZELAS' }
  ]);
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);
  const [reportCount, setReportCount] = useState(parseInt(employees[0].id) + 1);

  useEffect(() => { setReportCount(parseInt(selectedEmployee.id) + 1); }, [selectedEmployee]);

  // Λειτουργία Σκαναρίσματος με Προεπισκόπηση
  const handleAddExpense = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeReceipt(imageData);
      setCurrentEntry({
        date: result?.date || new Date().toISOString().split('T')[0],
        merchantName: result?.merchantName || '',
        totalAmount: result?.totalAmount || '',
        category: result?.category || 'GENERAL',
        receiptImage: imageData
      });
      setShowReviewForm(true); // Άνοιγμα Modal για έλεγχο
    } finally { setIsAnalyzing(false); }
  };

  // Επιβεβαίωση και προσθήκη στη λίστα
  const confirmAndAdd = () => {
    if (!currentEntry.merchantName || !currentEntry.totalAmount) {
      alert("Please enter Merchant Name and Total Amount.");
      return;
    }
    setExpenses(prev => [...prev, { ...currentEntry, id: Date.now().toString() }]);
    setShowReviewForm(false);
  };

  const removeExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

  const handleFinalSubmit = async () => {
    const res = await generatePDF(expenses, expenses.map(e => e.receiptImage), {...selectedEmployee, city, date: reportDate, project: selectedProject}, reportCount.toString());
    const to = "finance@duchennedatafoundation.org; ddf@elvyonline.nl";
    const subject = encodeURIComponent(`Report #${reportCount} - ${selectedEmployee.name}`);
    const body = encodeURIComponent(`Dear Team,\nPlease find attached my reimbursement report.\nTotal: ${res.total.toFixed(2)} EUR`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setReportCount(prev => prev + 1);
  };

  const catTotals = expenses.reduce((acc: any, exp: any) => {
    const c = exp.category || 'General';
    acc[c] = (acc[c] || 0) + Number(exp.totalAmount);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden text-slate-900">
      <aside className="w-64 bg-slate-950 text-white p-6 shadow-2xl flex-shrink-0">
        <div className="mb-12"><h1 className="text-3xl font-black text-red-600 italic">DDF</h1></div>
        <div className="p-3 bg-red-600 rounded-xl font-bold flex gap-3"><LayoutDashboard size={18}/> Dashboard</div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto bg-slate-50 relative">
        <div className="max-w-5xl mx-auto">
          
          {/* REVIEW MODAL: Εδώ γίνεται ο έλεγχος πριν την καταχώρηση */}
          {showReviewForm && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border-t-[12px] border-red-600 animate-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-red-600" size={28} />
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Review Entry</h3>
                  </div>
                  <button onClick={() => setShowReviewForm(false)} className="text-slate-300 hover:text-slate-950"><X size={24}/></button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Merchant Name</label>
                    <input className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-black text-slate-950 focus:ring-2 ring-red-600/20" value={currentEntry.merchantName} onChange={e => setCurrentEntry({...currentEntry, merchantName: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date</label>
                      <input type="date" className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-black text-slate-950 text-sm focus:ring-2 ring-red-600/20" value={currentEntry.date} onChange={e => setCurrentEntry({...currentEntry, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Amount (€)</label>
                      <input type="number" step="0.01" className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-black text-slate-950 focus:ring-2 ring-red-600/20" value={currentEntry.totalAmount} onChange={e => setCurrentEntry({...currentEntry, totalAmount: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label>
                    <select className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-black text-slate-950 focus:ring-2 ring-red-600/20" value={currentEntry.category} onChange={e => setCurrentEntry({...currentEntry, category: e.target.value})}>
                      <option value="GENERAL">GENERAL</option>
                      <option value="MEALS">MEALS</option>
                      <option value="TRANSPORT">TRANSPORT</option>
                      <option value="ACCOMMODATION">ACCOMMODATION</option>
                      <option value="OTHER COST">OTHER COST</option>
                    </select>
                  </div>
                  <button onClick={confirmAndAdd} className="w-full bg-red-600 text-white p-5 rounded-2xl font-black uppercase italic shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all mt-4">Confirm & Add to List</button>
                </div>
              </div>
            </div>
          )}

          {/* Header Dashboard */}
          <div className="flex justify-between border-b pb-6 mb-8 text-[11px] font-bold uppercase bg-white p-6 rounded-2xl shadow-sm">
            <div><span className="text-slate-400 block mb-1">Claimant</span>
              <select className="bg-transparent font-black" value={selectedEmployee.id} onChange={e => setSelectedEmployee(employees.find(emp => emp.id === e.target.value) || employees[0])}>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            </div>
            <div><span className="text-slate-400 block mb-1">Report No</span><input type="number" className="bg-transparent font-black w-20" value={reportCount} onChange={e => setReportCount(parseInt(e.target.value))} /></div>
            <div><span className="text-slate-400 block mb-1">Project</span>
              <select className="bg-transparent font-black" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>{projects.map(p => <option key={p} value={p}>{p}</option>)}</select>
            </div>
            <div><span className="text-slate-400 block mb-1">Date</span><span className="block font-black">{reportDate}</span></div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black uppercase border-l-8 border-red-600 pl-4 italic">Reimbursements</h2>
            <div className="flex gap-4">
              {/* Νέο κουμπί Χειροκίνητης Προσθήκης */}
              <button onClick={() => { setCurrentEntry({ date: new Date().toISOString().split('T')[0], merchantName: '', totalAmount: '', category: 'GENERAL', receiptImage: '' }); setShowReviewForm(true); }} className="bg-white text-slate-950 border-2 border-slate-950 px-6 py-4 rounded-2xl font-black text-[10px] flex items-center gap-3 hover:bg-slate-50 transition-all uppercase tracking-widest">
                <Plus size={16} /> Manual Add
              </button>
              <button onClick={() => document.getElementById('fileInput')?.click()} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 shadow-2xl hover:bg-red-600 transition-all">
                <Camera size={20} className="text-red-600"/> {isAnalyzing ? 'SCANNING...' : 'SCAN RECEIPT'}
              </button>
            </div>
            <input id="fileInput" type="file" className="hidden" onChange={e => {const f = e.target.files?.[0]; if(f){const r = new FileReader(); r.onload = () => handleAddExpense(r.result as string); r.readAsDataURL(f);}}}/>
          </div>

          {/* Πίνακας Εξόδων */}
          <div className="bg-white border-2 border-slate-950 rounded-3xl overflow-hidden mb-8 shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest border-b-2 border-red-600">
                <tr><th className="p-5 w-[15%] text-center">Date</th><th className="p-5 w-[55%]">Merchant & Category</th><th className="p-5 w-[15%] text-right">Amount</th><th className="p-5 w-[10%] text-center">-</th></tr>
              </thead>
              <tbody className="divide-y text-[11px]">
                {expenses.length === 0 ? <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black italic">Ready for Scan</td></tr> : 
                  expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-5 text-center font-bold text-slate-400">{e.date}</td>
                      <td className="p-5"><div className="font-black text-xs">{toGreeklish(e.merchantName).toUpperCase()}</div><div className="text-[9px] text-red-600 italic font-black uppercase">{toGreeklish(e.category)}</div></td>
                      <td className="p-5 text-right font-black text-sm">{Number(e.totalAmount).toFixed(2)}</td>
                      <td className="p-5 text-center"><button onClick={() => removeExpense(e.id)} className="text-slate-300 hover:text-red-600"><Trash2 size={18}/></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
            
            {/* Breakdown & Total */}
            <div className="p-10 bg-slate-50 border-t-4 border-slate-950 flex justify-between items-end">
               <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-red-600 tracking-widest block mb-2 underline decoration-slate-950 underline-offset-4 italic">Breakdown</span>
                {Object.entries(catTotals).map(([cat, val]: any) => (
                  <div key={cat} className="flex justify-between w-64 text-[11px] font-black border-b border-slate-200 pb-1 uppercase text-slate-500"><span>{cat}</span><span>{val.toFixed(2)} EUR</span></div>
                ))}
              </div>
              <div className="bg-red-600 text-white p-8 rounded-[2rem] shadow-2xl border-b-8 border-red-800 text-right min-w-[280px]">
                <span className="text-[11px] font-black uppercase block opacity-80 mb-2">Total Claim</span>
                <div className="text-5xl font-black italic tracking-tighter">{expenses.reduce((s, e) => s + Number(e.totalAmount), 0).toFixed(2)} <span className="text-xl">EUR</span></div>
              </div>
            </div>
          </div>

          <button onClick={handleFinalSubmit} disabled={expenses.length === 0} className="w-full bg-slate-950 text-white p-8 rounded-3xl font-black text-2xl uppercase italic shadow-2xl hover:bg-red-600 transition-all flex items-center justify-center gap-5 active:scale-95">
            <FileText size={32}/> GENERATE & EMAIL REPORT
          </button>
        </div>
      </main>
    </div>
  );
}