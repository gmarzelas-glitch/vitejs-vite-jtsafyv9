import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Camera, FileText, Trash2, X, Settings as SettingsIcon, Save, Paperclip, Loader2, AlertCircle, MapPin, Briefcase, User as UserIcon, FolderOpen, Send 
} from 'lucide-react';
import { analyzeReceipt } from './services/gemini';
import { generatePDF } from './utils/pdfGenerator';
import { Expense, User } from './types';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const CATEGORIES: Expense['category'][] = ['Meals', 'Transportation', 'Accommodation', 'Subscriptions & Memberships', 'Other Cost'];

const toGreeklish = (t: string) => {
  const m: any = {'Α':'A','Β':'B','Γ':'G','Δ':'D','Ε':'E','Ζ':'Z','Η':'H','Θ':'TH','Ι':'I','Κ':'K','Λ':'L','Μ':'M','Ν':'N','Ξ':'X','Ο':'O','Π':'P','Ρ':'R','Σ':'S','Τ':'T','Υ':'Y','Φ':'F','Χ':'CH','Ψ':'PS','Ω':'O','α':'a','β':'b','γ':'g','δ':'d','ε':'e','ζ':'z','η':'h','θ':'th','ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s','τ':'t','υ':'y','φ':'f','χ':'ch','ψ':'ps','ω':'o','ά':'a','έ':'e','ή':'h','ί':'i','ό':'o','ύ':'y','ώ':'o'};
  return t ? t.split('').map(c => m[c] || c).join('') : "";
};

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supportingDocs, setSupportingDocs] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  
  const [destination, setDestination] = useState(() => localStorage.getItem('ddf_destination') || "");
  const [purpose, setPurpose] = useState(() => localStorage.getItem('ddf_purpose') || "");
  const [project, setProject] = useState(() => localStorage.getItem('ddf_project') || "STRONGER VOICES");
  const [reportCounter, setReportCounter] = useState(() => localStorage.getItem('ddf_counter') || "5001");

  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('ddf_user');
    return saved ? JSON.parse(saved) : { id: "5000", name: "NICOLETTA MADIA", email: "finance@duchennedatafoundation.org", iban: "", bankName: "" };
  });

  const [currentEntry, setCurrentEntry] = useState<Omit<Expense, 'id'>>({ 
    date: '', merchantName: '', totalAmount: 0, category: 'Other Cost', receiptImage: '' 
  });

  useEffect(() => {
    localStorage.setItem('ddf_user', JSON.stringify(user));
    localStorage.setItem('ddf_project', project);
    localStorage.setItem('ddf_destination', destination);
    localStorage.setItem('ddf_purpose', purpose);
    localStorage.setItem('ddf_counter', reportCounter);
  }, [user, project, destination, purpose, reportCounter]);

  const convertPdfToImages = async (file: File): Promise<string[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      images.push(canvas.toDataURL('image/jpeg', 0.8));
    }
    return images;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const imageList = file.type === "application/pdf" ? await convertPdfToImages(file) : [await new Promise<string>((res) => {
        const reader = new FileReader(); reader.onload = () => res(reader.result as string); reader.readAsDataURL(file);
      })];

      const result = await analyzeReceipt(imageList[0]);
      if (!result) throw new Error("AI failed");

      const exists = expenses.find(exp => 
        exp.merchantName === result.merchantName && 
        exp.totalAmount === parseFloat(result.totalAmount) &&
        exp.date === result.date
      );
      if (exists) setDuplicateWarning(true);

      setCurrentEntry({
        date: result?.date || new Date().toISOString().split('T')[0],
        merchantName: (result?.merchantName || '').toUpperCase(),
        totalAmount: parseFloat(result?.totalAmount) || 0,
        category: (result?.category as Expense['category']) || 'Other Cost',
        receiptImage: imageList[0]
      });
      if (imageList.length > 1) setSupportingDocs(prev => [...prev, ...imageList.slice(1)]);
      setShowReviewForm(true);
    } catch (err) { alert("AI Scan Error. Try again."); } finally { setIsAnalyzing(false); }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const images = file.type === "application/pdf" ? await convertPdfToImages(file) : [await new Promise<string>((res) => {
        const reader = new FileReader(); reader.onload = () => res(reader.result as string); reader.readAsDataURL(file);
      })];
      setSupportingDocs(prev => [...prev, ...images]);
      alert("Attachment added.");
    } catch (err) { alert("Failed to add doc."); }
  };

  const handleSendMail = () => {
    const total = expenses.reduce((s, e) => s + e.totalAmount, 0).toFixed(2);
    const body = `Expense Report #${reportCounter}\nUser: ${user.name}\nProject: ${project}\nTotal Claim: ${total} EUR`;
    window.location.href = `mailto:finance@duchennedatafoundation.org?subject=Expense Report ${reportCounter} - ${user.name}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden text-slate-900 text-[11px]">
      <aside className="w-64 bg-[#0f172a] text-white p-6 flex-shrink-0 flex flex-col border-r border-slate-800">
        <div className="mb-12 text-4xl font-black text-[#dc2626] italic uppercase tracking-tighter">DDF</div>
        <nav className="space-y-2 flex-1 text-[10px] tracking-widest font-black uppercase italic">
          <div className="p-4 bg-[#dc2626] rounded-2xl flex gap-3 shadow-xl cursor-default items-center"><LayoutDashboard size={18}/> Dashboard</div>
          <button onClick={() => setShowSettings(true)} className="w-full p-4 hover:bg-slate-900 rounded-2xl flex gap-3 transition-all items-center"><SettingsIcon size={18}/> Bank Details</button>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto relative">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[#dc2626] font-black italic uppercase tracking-[0.3em] mb-2">Reporting Tool</p>
              <h2 className="text-6xl font-black uppercase tracking-tighter border-l-[15px] border-[#dc2626] pl-8 italic leading-none text-[#0f172a]">Expenses <span className="text-slate-300">#{reportCounter}</span></h2>
            </div>
            <div className="flex gap-4">
              <button onClick={() => document.getElementById('uInput')?.click()} className="bg-[#dc2626] text-white px-8 py-5 rounded-[2rem] font-black shadow-xl hover:bg-slate-950 transition-all flex items-center gap-3 uppercase text-[10px] tracking-widest italic">{isAnalyzing ? <Loader2 className="animate-spin" size={20}/> : <Camera size={20}/>} Scan Expense</button>
              <button onClick={() => document.getElementById('docInput')?.click()} className="bg-[#0f172a] text-white px-8 py-5 rounded-[2rem] font-black shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 uppercase text-[10px] tracking-widest italic"><Paperclip size={20}/> Add Doc</button>
            </div>
          </div>

          {/* Identity Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8 bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm font-black italic uppercase tracking-tighter">
             <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[9px] text-slate-400 px-1"><UserIcon size={12}/> Employee</label>
                <input className="bg-slate-50 p-4 rounded-2xl outline-none text-slate-950 border-b-4 border-slate-200 focus:border-[#dc2626] transition-all" value={user.name} onChange={e => setUser({...user, name: e.target.value.toUpperCase()})}/>
             </div>
             <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[9px] text-slate-400 px-1"><FolderOpen size={12}/> Project</label>
                <input className="bg-slate-50 p-4 rounded-2xl outline-none text-slate-950 border-b-4 border-slate-200 focus:border-[#dc2626] transition-all" value={project} onChange={e => setProject(e.target.value.toUpperCase())}/>
             </div>
             <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[9px] text-slate-400 px-1"><MapPin size={12}/> Destination</label>
                <input className="bg-slate-50 p-4 rounded-2xl outline-none text-slate-950 border-b-4 border-slate-200 focus:border-[#dc2626] transition-all" value={destination} onChange={e => setDestination(e.target.value.toUpperCase())}/>
             </div>
             <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[9px] text-slate-400 px-1"><Briefcase size={12}/> Purpose</label>
                <input className="bg-slate-50 p-4 rounded-2xl outline-none text-slate-950 border-b-4 border-slate-200 focus:border-[#dc2626] transition-all" value={purpose} onChange={e => setPurpose(e.target.value.toUpperCase())}/>
             </div>
          </div>

          <div className="bg-white border-[6px] border-[#0f172a] rounded-[3.5rem] overflow-hidden mb-8 shadow-2xl">
            <table className="w-full text-left font-black uppercase tracking-widest text-[10px] italic">
              <thead className="bg-[#0f172a] text-white border-b-[6px] border-[#dc2626]">
                <tr><th className="p-8 text-xs">Date</th><th className="p-8 text-xs">Category</th><th className="p-8 text-xs">Vendor</th><th className="p-8 text-right text-xs">Amount</th><th className="p-8 text-center text-xs">X</th></tr>
              </thead>
              <tbody className="divide-y-4 divide-slate-50">
                {expenses.length === 0 ? <tr><td colSpan={5} className="p-32 text-center text-slate-200 italic text-2xl font-black uppercase opacity-40 tracking-tighter">No Expenses Added</td></tr> : 
                  expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-8 text-slate-400 font-bold">{e.date}</td>
                      <td className="p-8"><span className="bg-slate-100 px-3 py-1 rounded-full text-[8px] border border-slate-200">{e.category}</span></td>
                      <td className="p-8 text-xs">{toGreeklish(e.merchantName)}</td>
                      <td className="p-8 text-right text-xl text-[#0f172a]">€{e.totalAmount.toFixed(2)}</td>
                      <td className="p-8 text-center"><button onClick={() => setExpenses(expenses.filter(x => x.id !== e.id))} className="text-slate-200 hover:text-[#dc2626] transition-all"><Trash2 size={24}/></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-6 italic uppercase font-black tracking-tighter">
            <button onClick={() => generatePDF(expenses, [...expenses.map(e=>e.receiptImage||''), ...supportingDocs], user, reportCounter, destination, purpose)} disabled={expenses.length === 0} className="bg-[#0f172a] text-white p-8 rounded-[3rem] text-2xl shadow-2xl hover:bg-slate-800 transition-all border-b-[10px] border-slate-950 flex items-center justify-center gap-6 disabled:opacity-20 group">
              <FileText size={32} className="group-hover:scale-110 transition-transform"/> Generate PDF
            </button>
            <button onClick={handleSendMail} disabled={expenses.length === 0} className="bg-[#dc2626] text-white p-8 rounded-[3rem] text-2xl shadow-2xl hover:bg-[#b91c1c] transition-all border-b-[10px] border-[#991b1b] flex items-center justify-center gap-6 disabled:opacity-20 group">
              <Send size={32} className="group-hover:scale-110 transition-transform"/> Send Report
            </button>
          </div>
        </div>

        {/* Modal Settings */}
        {showSettings && (
          <div className="fixed inset-0 bg-[#0f172a]/98 backdrop-blur-3xl z-[60] flex items-center justify-center p-6 animate-in">
            <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl font-black italic uppercase tracking-tighter">
              <div className="flex items-center justify-between mb-10 border-b-4 border-slate-100 pb-6"><h3 className="text-4xl text-[#0f172a]">Bank Account</h3><button onClick={() => setShowSettings(false)} className="bg-slate-100 p-4 rounded-full hover:bg-red-100"><X size={32}/></button></div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">IBAN Number</label><input className="w-full bg-transparent outline-none text-xl text-[#0f172a]" value={user.iban} onChange={e => setUser({...user, iban: e.target.value.toUpperCase()})}/></div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">Bank Name</label><input className="w-full bg-transparent outline-none text-xl text-[#0f172a]" value={user.bankName} placeholder="EUROBANK" onChange={e => setUser({...user, bankName: e.target.value.toUpperCase()})}/></div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">Report Counter</label><input type="number" className="w-full bg-transparent outline-none text-xl text-[#0f172a]" value={reportCounter} onChange={e => setReportCounter(e.target.value)}/></div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-[#0f172a] text-white p-8 rounded-[2.5rem] mt-10 hover:bg-[#dc2626] transition-all border-b-8 border-slate-800 flex items-center justify-center gap-4 shadow-xl text-xl"><Save size={24}/> Save Bank Info</button>
            </div>
          </div>
        )}

        {/* Modal Review */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-in">
            <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full border-t-[20px] border-[#dc2626] shadow-2xl font-black italic uppercase tracking-tighter">
              {duplicateWarning && <div className="absolute top-[-60px] left-0 right-0 bg-yellow-400 p-4 rounded-2xl flex items-center gap-3 text-[10px] shadow-2xl animate-bounce"><AlertCircle size={20}/> Duplicate Entry Found!</div>}
              <div className="flex items-center justify-between mb-8"><h3 className="text-3xl text-[#0f172a]">Confirm Expense</h3><button onClick={() => setShowReviewForm(false)}><X size={32}/></button></div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">Merchant / Vendor</label><input className="w-full bg-transparent outline-none text-2xl text-[#0f172a]" value={currentEntry.merchantName} onChange={e => setCurrentEntry({...currentEntry, merchantName: e.target.value.toUpperCase()})}/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">Amount (EUR)</label><input type="number" step="0.01" className="w-full bg-transparent outline-none text-2xl text-[#0f172a]" value={currentEntry.totalAmount} onChange={e => setCurrentEntry({...currentEntry, totalAmount: parseFloat(e.target.value) || 0})}/></div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">Category</label><select className="w-full bg-transparent outline-none text-lg text-[#0f172a] appearance-none" value={currentEntry.category} onChange={e => setCurrentEntry({...currentEntry, category: e.target.value as Expense['category']})}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <button onClick={() => {setExpenses([...expenses, {...currentEntry, id: Date.now().toString()}]); setShowReviewForm(false);}} className="w-full bg-[#dc2626] text-white p-8 rounded-[2.5rem] shadow-2xl text-2xl mt-4 border-b-[10px] border-[#b91c1c] active:scale-95 transition-all tracking-widest">Add To Report</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <input id="uInput" type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload}/>
      <input id="docInput" type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocUpload}/>
    </div>
  );
}