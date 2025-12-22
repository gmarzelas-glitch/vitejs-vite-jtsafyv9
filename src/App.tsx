import React, { useState } from 'react';
import { generatePDF } from './utils/pdfGenerator';
import { Upload, Scan, FileText, Mail } from 'lucide-react';

export default function App() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [reportInfo] = useState({
    name: 'DIMITRIOS ATHANASIOU',
    project: 'STRONGER VOICES',
    date: '2025-12-22'
  });
  const manualID = "5001";

  // Λειτουργία για Manual Attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImages(prev => [...prev, reader.result as string]);
        alert("Η απόδειξη προστέθηκε επιτυχώς!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async () => {
    if (expenses.length === 0) {
      alert("Παρακαλώ προσθέστε έξοδα πρώτα.");
      return;
    }

    // 1. Παραγωγή και αυτόματη αποθήκευση του PDF
    const { total } = await generatePDF(expenses, receiptImages, reportInfo, manualID);

    // 2. Ρύθμιση στοιχείων Email
    const recipient = "finance@duchennedatafoundation.org";
    const subject = `Expense Report ${manualID} - ${reportInfo.project} - ${reportInfo.name}`;
    const body = `Dear Finance Team,\n\nPlease find attached the expense report for the project: ${reportInfo.project}.\n\nClaimant: ${reportInfo.name}\nTotal Amount: ${total.toFixed(2)} EUR\n\nKind regards,\n${reportInfo.name}`;

    // 3. Άνοιγμα του email client (Outlook/Gmail)
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    alert('Το PDF κατέβηκε! Παρακαλώ επισυνάψτε το στο email που άνοιξε.');
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-2xl font-black tracking-tight">REIMBURSEMENTS</h1>
          <div className="flex gap-3">
            {/* Κουμπί για Manual Upload */}
            <label className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl cursor-pointer hover:bg-slate-700 transition shadow-md">
              <Upload size={18} /> ATTACH FILE
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>
            <button className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition shadow-md">
              <Scan size={18} /> SCAN RECEIPT
            </button>
          </div>
        </header>

        {/* Εδώ συνεχίζει ο κώδικας για τον πίνακα εξόδων σου */}

        <footer className="mt-8">
          <button 
            onClick={handleFinalSubmit}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
          >
            <Mail size={22} /> GENERATE & EMAIL TO FINANCE
          </button>
        </footer>
      </div>
    </div>
  );
}