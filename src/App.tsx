import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Camera, FileText, Trash2, Plus, CheckCircle2, X } from 'lucide-react';
import { analyzeReceipt } from './services/gemini';
import { generatePDF } from './utils/pdfGenerator';
import * as pdfjsLib from 'pdfjs-dist';

// Ρύθμιση του worker για το PDF.js από CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const toGreeklish = (t: string) => {
  const m: any = {'Α':'A','Β':'B','Γ':'G','Δ':'D','Ε':'E','Ζ':'Z','Η':'H','Θ':'TH','Ι':'I','Κ':'K','Λ':'L','Μ':'M','Ν':'N','Ξ':'X','Ο':'O','Π':'P','Ρ':'R','Σ':'S','Τ':'T','Υ':'Y','Φ':'F','Χ':'CH','Ψ':'PS','Ω':'O','α':'a','β':'b','γ':'g','δ':'d','ε':'e','ζ':'z','η':'h','θ':'th','ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s','τ':'t','υ':'y','φ':'f','χ':'ch','ψ':'ps','ω':'o','ά':'a','έ':'e','ή':'h','ί':'i','ό':'o','ύ':'y','ώ':'o'};
  return t ? t.split('').map(c => m[c] || c).join('') : "";
};

export default function App() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentEntry, setCurrentEntry] = useState({ date: '', merchantName: '', totalAmount: '', category: 'GENERAL', receiptImage: '' });

  const [employees] = useState([
    { id: '1000', name: 'NICOLETTA MADIA' },
    { id: '2000', name: 'PARASKEVI SAKELLARIOU' },
    { id: '3000', name: 'SIMINUC SERGIU' },
    { id: '4000', name: 'GEORGIOS PALIOURAS' },
    { id: '5000', name: 'DIMITRIOS ATHANASIOU' },
    { id: '6000', name: 'GEORGIOS MARZELAS' }
  ]);
  const [selectedEmployee] = useState(employees[4]); // Προεπιλογή Dimitrios Athanasiou
  const [selectedProject] = useState('STRONGER VOICES');
  const [reportCount, setReportCount] = useState(5001);

  const convertPdfToImage = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context!, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      let imageData: string;
      if (file.type === "application/pdf") {
        imageData = await convertPdfToImage(file);
      } else {
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      const result = await analyzeReceipt(imageData);
      setCurrentEntry({
        date: result?.date || new Date().toISOString().split('T')[0],
        merchantName: result?.merchantName || '',
        totalAmount: result?.totalAmount || '',
        category: result?.category || 'GENERAL',
        receiptImage: imageData
      });
      setShowReviewForm(true);
    } catch (error) {
      alert("Scan failed. Enter data manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmAndAdd = () => {
    setExpenses(prev => [...prev, { ...currentEntry, id: Date.now().toString() }]);
    setShowReviewForm(false);
  };

  const handleFinalSubmit = async () => {
    await generatePDF(expenses, expenses.map(e => e.receiptImage), {...selectedEmployee, city: 'ATHENS', date: new Date().toISOString().split('T')[0], project: selectedProject}, reportCount.toString());
    window.location.href = `mailto:finance@duchennedatafoundation.org?subject=Report ${reportCount}`;
    setReportCount(prev => prev + 1);
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden text-slate-900 text-[11px]">
      <aside className="w-64 bg-slate-950 text-white p-6 shadow-2xl flex-shrink-0">
        <div className="mb-12 text-4xl font-black text-red-600 italic tracking-tighter uppercase">DDF</div>
        <div className="p-4 bg-red-600 rounded-2xl font-black flex gap-3 shadow-xl italic uppercase tracking-widest leading-none"><LayoutDashboard size={18}/> Dashboard</div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto bg-slate-50 relative">
        <div className="max-w-5xl mx-auto">
          {showReviewForm && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border-t-[15px] border-red-600 animate-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-8 italic uppercase font-black">
                  <h3 className="text-3xl tracking-tighter text-slate-950">Confirm Scan</h3>
                  <button onClick={() => setShowReviewForm(false)} className="text-slate-950"><X size={24}/></button>
                </div>
                <div className="space-y-4 font-black text-slate-950">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-950">
                    <label className="text-[9px] text-slate-400 block mb-1 uppercase">Merchant</label>
                    <input className="w-full bg-transparent outline-none text-lg uppercase text-slate-950" value={currentEntry.merchantName} onChange={e => setCurrentEntry({...currentEntry, merchantName: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase">Amount</label>
                      <input type="number" step="0.01" className="w-full bg-transparent outline-none text-lg text-slate-950" value={currentEntry.totalAmount} onChange={e => setCurrentEntry({...currentEntry, totalAmount: e.target.value})} />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase">Date</label>
                      <input type="date" className="w-full bg-transparent outline-none text-xs text-slate-950" value={currentEntry.date} onChange={e => setCurrentEntry({...currentEntry, date: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={confirmAndAdd} className="w-full bg-red-600 text-white p-6 rounded-[2rem] font-black uppercase italic shadow-2xl text-xl mt-4">Confirm & Add</button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-12">
            <h2 className="text-5xl font-black uppercase tracking-tighter border-l-[15px] border-red-600 pl-8 italic text-slate-950">Expenses</h2>
            <button onClick={() => document.getElementById('unifiedInput')?.click()} className="bg-slate-950 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-red-600 transition-all uppercase tracking-widest flex items-center gap-3 active:scale-95 text-[10px]">
              <Camera size={22} className="text-red-600"/> {isAnalyzing ? 'Analyzing...' : 'Scan File (PDF/IMG)'}
            </button>
            <input id="unifiedInput" type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload}/>
          </div>

          <div className="bg-white border-4 border-slate-950 rounded-[3rem] overflow-hidden mb-12 shadow-2xl font-black uppercase tracking-widest">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-white border-b-4 border-red-600 italic text-[9px]">
                <tr><th className="p-8">Date</th><th className="p-8">Vendor</th><th className="p-8 text-right">Amount</th><th className="p-8 text-center">X</th></tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-slate-950 text-[10px]">
                {expenses.length === 0 ? <tr><td colSpan={4} className="p-24 text-center text-slate-200 italic text-xl">Upload to begin</td></tr> : 
                  expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-8 text-center text-slate-400 font-bold tracking-normal italic">{e.date}</td>
                      <td className="p-8 font-black uppercase text-slate-950">{toGreeklish(e.merchantName)}</td>
                      <td className="p-8 text-right text-lg italic tracking-tighter text-slate-950">{Number(e.totalAmount).toFixed(2)}</td>
                      <td className="p-8 text-center"><button onClick={() => setExpenses(expenses.filter(x => x.id !== e.id))} className="text-slate-200 hover:text-red-600 transition-all"><Trash2 size={24}/></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleFinalSubmit} disabled={expenses.length === 0} className="w-full bg-slate-950 text-white p-12 rounded-[3rem] font-black text-4xl uppercase italic shadow-2xl hover:bg-red-600 transition-all border-b-8 border-slate-800 active:scale-95 flex items-center justify-center gap-8">
            <FileText size={48}/> Generate Report
          </button>
        </div>
      </main>
    </div>
  );
}