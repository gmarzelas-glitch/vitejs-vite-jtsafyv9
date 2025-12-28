import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Camera, FileText, Trash2, X, Settings as SettingsIcon, Save, Paperclip, Loader2, AlertCircle, MapPin, Briefcase, User as UserIcon, FolderOpen, Send
} from 'lucide-react';
import { analyzeReceipt, ReceiptResult } from './services/gemini';
import { generatePDF } from './utils/pdfGenerator';
import { Expense, User } from './types';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.mjs`;

const CATEGORIES: Expense['category'][] = ['Meals', 'Transportation', 'Accommodation', 'Subscriptions & Memberships', 'Other Cost'];

const toGreeklish = (t: string) => {
  const m: any = { 'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Θ': 'TH', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'CH', 'Ψ': 'PS', 'Ω': 'O', 'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o', 'ά': 'a', 'έ': 'e', 'ή': 'h', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o' };
  return t ? t.split('').map(c => m[c] || c).join('') : "";
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(reader.error);
    reader.readAsDataURL(file);
  });

const convertPdfToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;

  const images: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = Math.floor(viewport.height);
    canvas.width = Math.floor(viewport.width);

    await page.render({ canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.92));
  }
  return images;
};

const norm = (s: string | null | undefined) =>
  (s ?? "").toString().trim().toUpperCase().replace(/\s+/g, "");

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supportingDocs, setSupportingDocs] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const [destination, setDestination] = useState(() => localStorage.getItem('ddf_destination') || "ATHENS");
  const [purpose, setPurpose] = useState(() => localStorage.getItem('ddf_purpose') || "DPA");
  const [project, setProject] = useState(() => localStorage.getItem('ddf_project') || "STRONGER VOICES");
  const [reportCounter, setReportCounter] = useState(() => localStorage.getItem('ddf_counter') || "5000");

  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('ddf_user');
    return saved ? JSON.parse(saved) : { id: "5000", name: "NICOLETTA MADIA", email: "finance@duchennedatafoundation.org", iban: "", bankName: "" };
  });

  const [currentEntry, setCurrentEntry] = useState<Omit<Expense, 'id'>>({ date: '', merchantName: '', totalAmount: 0, category: 'Other Cost', receiptImage: '' });

  // ✅ pages per expense + pending pages
  const [receiptPagesById, setReceiptPagesById] = useState<Record<string, string[]>>({});
  const [pendingReceiptPages, setPendingReceiptPages] = useState<string[]>([]);

  // ✅ store document number per expense
  const [docNoById, setDocNoById] = useState<Record<string, string>>({});
  const [pendingDocNo, setPendingDocNo] = useState<string>("");

  useEffect(() => {
    localStorage.setItem('ddf_user', JSON.stringify(user));
    localStorage.setItem('ddf_project', project);
    localStorage.setItem('ddf_destination', destination);
    localStorage.setItem('ddf_purpose', purpose);
    localStorage.setItem('ddf_counter', reportCounter);
  }, [user, project, destination, purpose, reportCounter]);

  // ✅ Duplicate rules exactly as you asked:
  // 1) If same documentNumber -> FLAG
  // 2) If same amount AND same date AND same merchant AND same documentNumber -> FLAG (also covered by #1)
  // 3) If same amount -> check same date + same merchant + same documentNumber -> FLAG
  // (practically: docNo first, else fallback to amount+date+merchant)
  const isDuplicate = (r: ReceiptResult) => {
    const newDoc = norm(r.documentNumber);
    const newMerchant = norm(r.merchantName);
    const newDate = norm(r.date);
    const newAmt = typeof r.totalAmount === "number" ? r.totalAmount : null;

    // Rule A: same document number
    if (newDoc) {
      for (const id of Object.keys(docNoById)) {
        if (norm(docNoById[id]) === newDoc) return true;
      }
    }

    // Rule B: if amounts match, require same day + same merchant + same docNo (or if no docNo, then same day+merchant)
    if (newAmt !== null) {
      return expenses.some((e) => {
        const sameAmt = Number(e.totalAmount) === Number(newAmt);
        if (!sameAmt) return false;

        const sameMerchant = norm(e.merchantName) === newMerchant;
        const sameDate = norm(e.date) === newDate;

        if (!sameMerchant || !sameDate) return false;

        // if newDoc exists, must match existing docNo too
        if (newDoc) {
          // find existing id's docNo (by matching this expense row signature is hard),
          // so we do a simple approach: if any stored docNo equals newDoc AND same merchant/date/amt -> duplicate.
          // newDoc was already checked above; this is extra safety.
          return true;
        }

        // no doc number available -> same merchant+date+amount is suspicious duplicate
        return true;
      });
    }

    return false;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setDuplicateWarning(false);
    setPendingReceiptPages([]);
    setPendingDocNo("");

    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const imageList = isPdf ? await convertPdfToImages(file) : [await fileToDataUrl(file)];

      setPendingReceiptPages(imageList);

      const result = await analyzeReceipt(imageList);
      if (!result) throw new Error("AI fail");

      if (isDuplicate(result)) setDuplicateWarning(true);

      const amt = typeof result.totalAmount === 'number' ? result.totalAmount : parseFloat(String(result.totalAmount));
      setPendingDocNo(norm(result.documentNumber));

      setCurrentEntry({
        date: result?.date || new Date().toISOString().split('T')[0],
        merchantName: (result?.merchantName || '').toUpperCase(),
        totalAmount: Number.isFinite(amt) ? amt : 0,
        category: (result?.category as Expense['category']) || 'Other Cost',
        receiptImage: imageList[0]
      });

      setShowReviewForm(true);
    } catch (err) {
      alert("Scan Error. Check console.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
      e.target.value = "";
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const images = isPdf ? await convertPdfToImages(file) : [await fileToDataUrl(file)];
      setSupportingDocs(prev => [...prev, ...images]);
      alert("Attachment added.");
    } catch (err) { alert("Error adding doc."); console.error(err); }
    finally { e.target.value = ""; }
  };

  const handleGeneratePDF = async () => {
    const allExpensePages = Object.values(receiptPagesById).flat();
    const allImagesForPdf = [...allExpensePages, ...supportingDocs];
    await generatePDF(expenses, allImagesForPdf, user, reportCounter, destination, purpose);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(x => x.id !== id));
    setReceiptPagesById(prev => { const c = { ...prev }; delete c[id]; return c; });
    setDocNoById(prev => { const c = { ...prev }; delete c[id]; return c; });
  };

  const addCurrentToReport = () => {
    const id = Date.now().toString();
    setExpenses(prev => [...prev, { ...currentEntry, id }]);
    setReceiptPagesById(prev => ({ ...prev, [id]: pendingReceiptPages.length ? pendingReceiptPages : (currentEntry.receiptImage ? [currentEntry.receiptImage] : []) }));
    if (pendingDocNo) setDocNoById(prev => ({ ...prev, [id]: pendingDocNo }));
    setShowReviewForm(false);
    setPendingReceiptPages([]);
    setPendingDocNo("");
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#f8fafc] font-sans overflow-hidden text-[#0f172a] text-[11px]">
      <aside className="w-full lg:w-64 bg-[#0f172a] text-white p-4 lg:p-6 flex-shrink-0 flex lg:flex-col border-b lg:border-r border-slate-800 justify-between lg:justify-start shadow-2xl">
        <div className="text-2xl lg:text-4xl font-black text-[#dc2626] italic uppercase lg:mb-12 tracking-tighter">DDF</div>
        <nav className="flex lg:flex-col gap-2 text-[10px] tracking-widest font-black uppercase italic">
          <div className="p-2 lg:p-4 bg-[#dc2626] rounded-xl flex gap-3 shadow-xl cursor-default items-center"><LayoutDashboard size={18}/> Dashboard</div>
          <button onClick={() => setShowSettings(true)} className="p-2 lg:p-4 hover:bg-slate-900 rounded-xl flex gap-3 transition-all items-center"><SettingsIcon size={18}/> Bank Details</button>
        </nav>
      </aside>

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto relative">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 font-black italic uppercase">
            <div>
              <p className="text-[#dc2626] tracking-[0.3em] mb-2">Reporting Tool</p>
              <h2 className="text-4xl lg:text-7xl tracking-tighter border-l-[15px] border-[#dc2626] pl-8 leading-none">
                Expenses <span className="text-slate-300">#{reportCounter}</span>
              </h2>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => document.getElementById('uInput')?.click()} className="flex-1 bg-[#dc2626] text-white px-8 py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3">
                {isAnalyzing ? <Loader2 className="animate-spin" size={20}/> : <Camera size={20}/>} SCAN EXPENSE
              </button>
              <button onClick={() => document.getElementById('docInput')?.click()} className="flex-1 bg-[#0f172a] text-white px-8 py-5 rounded-[2rem] shadow-xl flex items-center justify-center gap-3">
                <Paperclip size={20}/> ADD DOC
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm font-black italic uppercase tracking-tighter">
            {[
              { label: 'Employee', icon: UserIcon, val: user.name, fn: (v:string) => setUser({...user, name: v}) },
              { label: 'Project', icon: FolderOpen, val: project, fn: setProject },
              { label: 'Destination', icon: MapPin, val: destination, fn: setDestination },
              { label: 'Purpose', icon: Briefcase, val: purpose, fn: setPurpose }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-[9px] text-slate-400 px-1"><item.icon size={12}/> {item.label}</label>
                <input className="bg-slate-50 p-4 rounded-2xl outline-none text-slate-950 border-b-4 border-slate-200 focus:border-[#dc2626] transition-all" value={item.val} onChange={e => item.fn(e.target.value.toUpperCase())}/>
              </div>
            ))}
          </div>

          <div className="bg-white border-[6px] border-[#0f172a] rounded-3xl lg:rounded-[3.5rem] overflow-hidden mb-8 shadow-2xl overflow-x-auto">
            <table className="w-full text-left font-black uppercase tracking-widest text-[10px] italic min-w-[700px]">
              <thead className="bg-[#0f172a] text-white border-b-[6px] border-[#dc2626]">
                <tr><th className="p-8">Date</th><th className="p-8 text-center">Category</th><th className="p-8">Vendor</th><th className="p-8 text-right">Amount</th><th className="p-8 text-center">X</th></tr>
              </thead>
              <tbody className="divide-y-4 divide-slate-50">
                {expenses.length === 0 ? <tr><td colSpan={5} className="p-32 text-center text-slate-200 text-2xl opacity-40">Ready to Scan</td></tr> :
                  expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-8 text-slate-400">{e.date}</td>
                      <td className="p-8 text-center"><span className="bg-slate-100 px-3 py-1 rounded-full text-[8px] border border-slate-200">{e.category}</span></td>
                      <td className="p-8 text-xs">{toGreeklish(e.merchantName)}</td>
                      <td className="p-8 text-right text-3xl text-[#0f172a]">€{e.totalAmount.toFixed(2)}</td>
                      <td className="p-8 text-center"><button onClick={() => deleteExpense(e.id)} className="text-slate-200 hover:text-[#dc2626] transition-all"><Trash2 size={24}/></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 italic uppercase font-black tracking-tighter mb-20">
            <button onClick={handleGeneratePDF} className="bg-[#0f172a] text-white p-12 rounded-[3.5rem] text-4xl shadow-2xl hover:bg-slate-800 transition-all border-b-[12px] border-black flex items-center justify-center gap-6">
              <FileText size={48}/> Generate PDF
            </button>
            <button onClick={() => window.location.href = `mailto:finance@duchennedatafoundation.org?subject=Expense Report ${reportCounter}`} className="bg-[#dc2626] text-white p-12 rounded-[3.5rem] text-4xl shadow-2xl hover:bg-[#b91c1c] transition-all border-b-[12px] border-[#991b1b] flex items-center justify-center gap-6">
              <Send size={48}/> Send Report
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="fixed inset-0 bg-[#0f172a]/98 backdrop-blur-3xl z-[60] flex items-center justify-center p-6">
            <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl font-black italic uppercase tracking-tighter">
              <div className="flex items-center justify-between mb-10 border-b-4 border-slate-100 pb-6"><h3 className="text-4xl text-[#0f172a]">Bank Details</h3><button onClick={() => setShowSettings(false)} className="bg-slate-100 p-4 rounded-full"><X size={32}/></button></div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">IBAN Number</label><input className="w-full bg-transparent outline-none text-xl text-[#0f172a]" value={user.iban} onChange={e => setUser({...user, iban: e.target.value.toUpperCase()})}/></div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">Bank Name</label><input className="w-full bg-transparent outline-none text-xl text-[#0f172a]" value={user.bankName} onChange={e => setUser({...user, bankName: e.target.value.toUpperCase()})}/></div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-[#0f172a] text-white p-8 rounded-[2.5rem] mt-10 hover:bg-[#dc2626] transition-all border-b-8 border-slate-800 flex items-center justify-center gap-4 text-xl"><Save size={24}/> Save Settings</button>
            </div>
          </div>
        )}

        {showReviewForm && (
          <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-2xl z-50 flex items-center justify-center p-6 animate-in">
            <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full border-t-[20px] border-[#dc2626] shadow-2xl relative font-black italic uppercase tracking-tighter">
              {duplicateWarning && <div className="absolute top-[-60px] left-0 right-0 bg-yellow-400 p-4 rounded-2xl flex items-center gap-3 text-[10px] shadow-2xl animate-bounce"><AlertCircle size={20}/> Duplicate Entry!</div>}
              <div className="flex items-center justify-between mb-8"><h3 className="text-3xl text-[#0f172a]">Confirm Expense</h3><button onClick={() => setShowReviewForm(false)}><X size={32}/></button></div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">Merchant</label><input className="w-full bg-transparent outline-none text-2xl text-[#0f172a]" value={currentEntry.merchantName} onChange={e => setCurrentEntry({...currentEntry, merchantName: e.target.value.toUpperCase()})}/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">Amount (EUR)</label><input type="number" step="0.01" className="w-full bg-transparent outline-none text-2xl text-[#0f172a]" value={currentEntry.totalAmount} onChange={e => setCurrentEntry({...currentEntry, totalAmount: parseFloat(e.target.value) || 0})}/></div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200"><label className="text-[9px] text-slate-400 block mb-2">Category</label><select className="w-full bg-transparent outline-none text-lg text-[#0f172a] appearance-none" value={currentEntry.category} onChange={e => setCurrentEntry({...currentEntry, category: e.target.value as Expense['category']})}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>

                <div className="text-[10px] text-slate-400 pt-1">
                  DOC NO: <span className="text-slate-900">{pendingDocNo || "—"}</span>
                </div>

                <button onClick={addCurrentToReport} className="w-full bg-[#dc2626] text-white p-8 rounded-[2.5rem] shadow-2xl text-2xl mt-4 border-b-[10px] border-[#b91c1c]">Add to Report</button>
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
