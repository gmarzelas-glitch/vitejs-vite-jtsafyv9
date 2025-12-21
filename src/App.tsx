import React, { useState } from 'react';
import {
  LayoutDashboard,
  Settings,
  Camera,
  FileText,
  Plus,
  X,
} from 'lucide-react';
import { analyzeReceipt } from './services/gemini';
import { generatePDF } from './utils/pdfGenerator';

const toGreeklish = (t: string) => {
  const m: any = {
    Α: 'A',
    Β: 'B',
    Γ: 'G',
    Δ: 'D',
    Ε: 'E',
    Ζ: 'Z',
    Η: 'H',
    Θ: 'TH',
    Ι: 'I',
    Κ: 'K',
    Λ: 'L',
    Μ: 'M',
    Ν: 'N',
    Ξ: 'X',
    Ο: 'O',
    Π: 'P',
    Ρ: 'R',
    Σ: 'S',
    Τ: 'T',
    Υ: 'Y',
    Φ: 'F',
    Χ: 'CH',
    Ψ: 'PS',
    Ω: 'O',
    α: 'a',
    β: 'b',
    γ: 'g',
    δ: 'd',
    ε: 'e',
    ζ: 'z',
    η: 'h',
    θ: 'th',
    ι: 'i',
    κ: 'k',
    λ: 'l',
    μ: 'm',
    ν: 'n',
    ξ: 'x',
    ο: 'o',
    π: 'p',
    ρ: 'r',
    σ: 's',
    τ: 't',
    υ: 'y',
    φ: 'f',
    χ: 'ch',
    ψ: 'ps',
    ω: 'o',
    ά: 'a',
    έ: 'e',
    ή: 'h',
    ί: 'i',
    ό: 'o',
    ύ: 'y',
    ώ: 'o',
  };
  return t
    ? t
        .split('')
        .map((c) => m[c] || c)
        .join('')
    : '';
};

export default function App() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reportCount, setReportCount] = useState(1);
  const [city, setCity] = useState('ATHENS');
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Διαχείριση Projects
  const [projects, setProjects] = useState([
    'DUCHENNE DATABOARD',
    'INTERNAL OPERATIONS',
  ]);
  const [selectedProject, setSelectedProject] = useState(projects[0]);

  // Διαχείριση Employees
  const [employees, setEmployees] = useState([
    {
      id: '1',
      name: 'John Doe',
      bank: 'National Bank',
      iban: 'GR1234567890',
      swift: 'ETHNGRPX',
      accNo: '12345678',
    },
  ]);
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]);

  const handleAddEmployee = () => {
    const n = prompt('Name:');
    const b = prompt('Bank:');
    const i = prompt('IBAN:');
    const s = prompt('SWIFT:');
    const a = prompt('Account No:');
    if (n && i)
      setEmployees([
        ...employees,
        {
          id: Date.now().toString(),
          name: n,
          bank: b || '',
          iban: i,
          swift: s || '',
          accNo: a || '',
        },
      ]);
  };

  const handleAddProject = () => {
    const p = prompt('New Project Name:');
    if (p) setProjects([...projects, p.toUpperCase()]);
  };

  const handleAddExpense = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeReceipt(imageData);
      if (result) {
        const isDuplicate = expenses.some(
          (e) =>
            e.merchantName === result.merchantName &&
            e.totalAmount === result.totalAmount &&
            e.date === result.date
        );
        if (isDuplicate) return alert('⚠️ DUPLICATE');
        setExpenses((prev) => [
          ...prev,
          { ...result, id: Date.now().toString(), receiptImage: imageData },
        ]);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const catTotals = expenses.reduce((acc: any, exp: any) => {
    const c = exp.category || 'General';
    acc[c] = (acc[c] || 0) + Number(exp.totalAmount);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      <aside className="w-64 bg-slate-950 text-white p-6 flex-shrink-0 shadow-2xl">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-red-600 italic tracking-tighter">
            DDF
          </h1>
        </div>
        <nav className="space-y-2">
          <button className="flex items-center space-x-3 w-full p-3 bg-red-600 rounded-lg font-bold shadow-lg">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-3 w-full p-3 text-slate-400 hover:text-white transition-all"
          >
            <Settings size={18} />
            <span>Manage Data</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Settings Panel - ΕΠΑΝΗΛΘΕ */}
          {showSettings && (
            <div className="bg-slate-900 text-white p-6 rounded-2xl mb-8 border-b-4 border-red-600 shadow-xl grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-red-600 font-black uppercase text-[10px] mb-4 flex justify-between items-center">
                  Employees{' '}
                  <button
                    onClick={handleAddEmployee}
                    className="bg-red-600 p-1 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </h3>
                <div className="space-y-2">
                  {employees.map((e) => (
                    <div
                      key={e.id}
                      className="flex justify-between items-center bg-slate-800 p-2 rounded text-[10px]"
                    >
                      <span>{e.name}</span>
                      <button
                        onClick={() =>
                          setEmployees(
                            employees.filter((emp) => emp.id !== e.id)
                          )
                        }
                        className="text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-red-600 font-black uppercase text-[10px] mb-4 flex justify-between items-center">
                  Projects{' '}
                  <button
                    onClick={handleAddProject}
                    className="bg-red-600 p-1 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </h3>
                <div className="space-y-2">
                  {projects.map((p) => (
                    <div
                      key={p}
                      className="flex justify-between items-center bg-slate-800 p-2 rounded text-[10px]"
                    >
                      <span>{p}</span>
                      <button
                        onClick={() =>
                          setProjects(projects.filter((pr) => pr !== p))
                        }
                        className="text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className="flex justify-between border-b pb-6 mb-8 text-[11px] font-bold uppercase tracking-widest">
            <div className="border-r pr-6">
              <span className="block text-[9px] text-slate-400 mb-1 italic uppercase">
                Employee
              </span>
              <select
                className="bg-transparent font-black text-slate-900 outline-none"
                value={selectedEmployee.id}
                onChange={(e) =>
                  setSelectedEmployee(
                    employees.find((emp) => emp.id === e.target.value) ||
                      employees[0]
                  )
                }
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-r pr-6 px-6">
              <span className="block text-[9px] text-slate-400 mb-1 italic uppercase">
                Project
              </span>
              <select
                className="bg-transparent font-black text-slate-900 outline-none"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-r pr-6 px-6">
              <span className="block text-[9px] text-slate-400 mb-1 italic uppercase">
                City
              </span>
              <input
                className="bg-transparent font-black text-slate-900 outline-none w-24"
                value={city}
                onChange={(e) => setCity(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 mb-1 italic uppercase">
                Date
              </span>
              <input
                type="date"
                className="bg-transparent font-black text-slate-900 outline-none"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter border-l-8 border-red-600 pl-4">
              Reimbursements Form
            </h2>
            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              className="bg-slate-950 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-red-600 transition-all shadow-lg active:scale-95"
            >
              <Camera size={18} className="text-red-600" />{' '}
              {isAnalyzing ? '...' : 'SCAN RECEIPT'}
            </button>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = () => handleAddExpense(r.result as string);
                  r.readAsDataURL(f);
                }
              }}
            />
          </div>

          {/* Table */}
          <div className="border-2 border-slate-950 rounded-2xl overflow-hidden mb-8 shadow-2xl">
            <table className="w-full text-left table-fixed">
              <thead className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="p-4 w-1/4">Date</th>
                  <th className="p-4 w-1/2">Vendor & Category</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-16 text-center text-slate-300 italic font-black text-sm uppercase tracking-widest"
                    >
                      Ready for Scan
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-slate-400 font-bold">{e.date}</td>
                      <td className="p-4">
                        <div className="font-black text-slate-900 uppercase text-xs">
                          {toGreeklish(e.merchantName)}
                        </div>
                        <div className="text-[9px] text-red-600 font-black uppercase italic mt-1 tracking-tighter">
                          {toGreeklish(e.category || 'General')}
                        </div>
                      </td>
                      <td className="p-4 text-right font-black text-slate-950 text-sm">
                        {Number(e.totalAmount).toFixed(2)} EUR
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Breakdown & Total */}
            <div className="p-8 bg-slate-50 border-t-4 border-slate-950 flex justify-between items-end">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-red-600 tracking-widest block mb-3 underline decoration-slate-950 underline-offset-4">
                  Cost Breakdown
                </span>
                {Object.entries(catTotals).map(([cat, val]: any) => (
                  <div
                    key={cat}
                    className="flex justify-between w-56 text-[10px] font-black border-b border-slate-200 pb-1 uppercase"
                  >
                    <span className="text-slate-500">{cat}</span>
                    <span className="text-slate-950">{val.toFixed(2)} EUR</span>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl border-b-8 border-red-800">
                  <span className="text-[10px] font-black uppercase opacity-80 block mb-1 tracking-widest">
                    Grand Total Claim
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black italic tracking-tighter">
                      {expenses
                        .reduce((s, e) => s + Number(e.totalAmount), 0)
                        .toFixed(2)}
                    </span>
                    <span className="text-lg font-black uppercase">EUR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              generatePDF(
                expenses,
                expenses.map((e) => e.receiptImage),
                {
                  ...selectedEmployee,
                  city,
                  date: reportDate,
                  project: selectedProject,
                },
                reportCount
              );
              setReportCount((c) => c + 1);
            }}
            disabled={expenses.length === 0}
            className="w-full bg-slate-950 text-white p-6 rounded-2xl font-black text-xl uppercase italic shadow-2xl hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-4"
          >
            <FileText size={24} /> Generate Official Report
          </button>
        </div>
      </main>
    </div>
  );
}
