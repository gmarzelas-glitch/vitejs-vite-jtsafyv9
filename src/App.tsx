import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Camera, FileText, Trash2, Plus, CheckCircle2, X, Upload } from 'lucide-react';
import { analyzeReceipt } from './services/gemini';
import { generatePDF } from './utils/pdfGenerator';

const toGreeklish = (t: string) => {
  const m: any = {'Α':'A','Β':'B','Γ':'G','Δ':'D','Ε':'E','Ζ':'Z','Η':'H','Θ':'TH','Ι':'I','Κ':'K','Λ':'L','Μ':'M','Ν':'N','Ξ':'X','Ο':'O','Π':'P','Ρ':'R','Σ':'S','Τ':'T','Υ':'Y','Φ':'F','Χ':'CH','Ψ':'PS','Ω':'O','α':'a','β':'b','γ':'g','δ':'d','ε':'e','ζ':'z','η':'h','θ':'th','ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s','τ':'t','υ':'y','φ':'f','χ':'ch','ψ':'ps','ω':'o','ά':'a','έ':'e','ή':'h','ί':'i','ό':'o','ύ':'y','ώ':'o'};
  return t ? t.split('').map(c => m[c] || c).join('') : "";
};

export default function App() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentEntry, setCurrentEntry] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    merchantName: '', 
    totalAmount: '', 
    category: 'GENERAL', 
    receiptImage: '' 
  });

  const [employees] = useState([
    { id: '1000', name: 'NICOLETTA MADIA' },
    { id: '2000', name: 'PARASKEVI SAKELLARIOU' },
    { id: '3000', name: 'SIMINUC SERGIU' },
    { id: '4000', name: 'GEORGIOS PALIOURAS' },
    { id: '5000', name: 'DIMITRIOS ATHANASIOU' },
    { id: '6000', name: 'GEORGIOS MARZELAS' }
  ]);
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);
  const [projects] = useState(['BIND', 'MAGIC', 'ERDERA', 'NEW DDR', 'NEW MAP', 'STRONGER VOICES', 'GENERAL COST']);
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [reportCount, setReportCount] = useState(parseInt(employees[0].id) + 1);

  useEffect(() => { setReportCount(parseInt(selectedEmployee.id) + 1); }, [selectedEmployee]);

  const handleScan = async (imageData: string) => {
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
      setShowReviewForm(true);
    } finally { setIsAnalyzing(false); }
  };

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCurrentEntry({ ...currentEntry, receiptImage: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const confirmAndAdd = () => {
    if (!currentEntry.merchantName || !currentEntry.totalAmount || !currentEntry.receiptImage) {
      alert("Please fill all fields and upload a receipt image.");
      return;
    }
    setExpenses(prev => [...prev, { ...currentEntry, id: Date.now().toString() }]);
    setShowReviewForm(false);
  };

  const handleFinalSubmit = async () => {
    const res = await generatePDF(expenses, expenses.map(e => e.receiptImage), {...selectedEmployee, city: 'ATHENS', date: new Date().toISOString().split('T')[0], project: selectedProject}, reportCount.toString());
    const to = "finance@duchennedatafoundation.org; ddf@elvyonline.nl";
    const subject = encodeURIComponent(`Report #${reportCount} - ${selectedEmployee.name}`);
    const body = encodeURIComponent(`Dear Team,\n\nPlease find attached my reimbursement report.\n\nNote: Please manually attach the downloaded PDF to this email.\n\nTotal: ${res.total.toFixed(2)} EUR`);
    
    setTimeout(() => {
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    }, 1500);
    setReportCount(prev => prev + 1);
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden text-slate-900">
      <aside className="w-64 bg-slate-950 text-white p-6 shadow-2xl flex-shrink-0">
        <div className="mb-12"><h1 className="text-3xl font-black text-red-600 italic">DDF</h1></div>
        <div className="p-3 bg-red-600 rounded-xl font-bold flex gap-3 shadow-lg shadow-red-600/20"><LayoutDashboard size={18}/> Dashboard</div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto bg-slate-50 relative">
        <div className="max-w-5xl mx-auto">
          
          {showReviewForm && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border-t-[12px] border-red-600 animate-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Receipt Details</h3>
                  <button onClick={() => setShowReviewForm(false)} className="text-slate-300 hover:text-slate-950"><X size={24}/></button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Merchant Name</label>
                    <input className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-black text-slate-950" value={currentEntry.merchantName} onChange={e => setCurrentEntry({...currentEntry, merchantName: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date</label>
                      <input type="date" className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-black text-slate-950 text-sm" value={currentEntry.date} onChange={e => setCurrentEntry({...currentEntry, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Amount (€)</label>
                      <input type="number" step="0.01" className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-black text-slate-950" value={currentEntry.totalAmount} onChange={e => setCurrentEntry({...currentEntry, totalAmount: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Receipt Attachment</label>
                    <div className="mt-2 flex items-center gap-4">
                      <button onClick={() => document.getElementById('manualFile')?.click()} className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-xl font-bold text-xs border-2 border-dashed border-slate-300 text-slate-500 hover:bg-slate-200">
                        <Upload size={16}/> {currentEntry.receiptImage ? 'Image Ready' : 'Upload Receipt'}
                      </button>
                      <input id="manualFile" type="file" accept="image/*" className="hidden" onChange={handleManualImageUpload} />
                      {currentEntry.receiptImage && <CheckCircle2 className="text-green-500" size={20}/>}
                    </div>
                  </div>

                  <button onClick={confirmAndAdd} className="w-full bg-red-600 text-white p-5 rounded-2xl font-black uppercase italic shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all mt-6">Confirm & Add</button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between border-b pb-6 mb-8 text-[11px] font-bold uppercase bg-white p-6 rounded-2xl shadow-sm">
            <div><span className="text-slate-400 block mb-1 tracking-widest italic">Claimant</span>
              <select className="bg-transparent font-black" value={selectedEmployee.id} onChange={e => setSelectedEmployee(employees.find(emp => emp.id === e.target.value) || employees[0])}>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            </div>
            <div><span className="text-slate-400 block mb-1 tracking-widest italic">Report No</span><input type="number" className="bg-transparent font-black w-20" value={reportCount} onChange={e => setReportCount(parseInt(e.target.value))} /></div>
            <div><span className="text-slate-400 block mb-1 tracking-widest italic">Project</span>
              <select className="bg-transparent font-black" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>{projects.map(p => <option key={p} value={p}>{p}</option>)}</select>
            </div>
            <div><span className="text-slate-400 block mb-1 tracking-widest italic">Date</span><span className="block font-black uppercase tracking-tighter">{currentEntry.date}</span></div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-black uppercase border-l-[10px] border-red-600 pl-6 italic tracking-tighter">Reimbursements</h2>
            <div className="flex gap-4">
              <button onClick={() => { setCurrentEntry({ date: new Date().toISOString().split('T')[0], merchantName: '', totalAmount: '', category: 'GENERAL', receiptImage: '' }); setShowReviewForm(true); }} className="bg-white text-slate-950 border-2 border-slate-950 px-6 py-4 rounded-2xl font-black text-[10px] flex items-center gap-3 uppercase tracking-widest hover:bg-slate-50 transition-all">
                <Plus size={16} /> Manual Add
              </button>
              <button onClick={() => document.getElementById('scanInput')?.click()} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-[10px] flex items-center gap-3 shadow-2xl hover:bg-red-600 transition-all uppercase tracking-widest">
                <Camera size={20} className="text-red-600"/> {isAnalyzing ? 'Analyzing...' : 'Scan Receipt'}
              </button>
              <input id="scanInput" type="file" accept="image/*" className="hidden" onChange={e => {const f = e.target.files?.[0]; if(f){const r = new FileReader(); r.onload = () => handleScan(r.result as string); r.readAsDataURL(f);}}}/>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-950 rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest border-b-2 border-red-600">
                <tr><th className="p-6 w-[15%] text-center">Date</th><th className="p-6 w-[60%]">Merchant & Category</th><th className="p-6 w-[15%] text-right">Amount</th><th className="p-6 w-[10%] text-center">-</th></tr>
              </thead>
              <tbody className="divide-y text-[11px]">
                {expenses.length ===