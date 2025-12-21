import { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Expense } from '../types/expense';
import { analyzeReceipt } from '../services/gemini';

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
}

export function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    // Μετατροπή File σε Base64
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

    try {
      // ΚΑΛΟΥΜΕ ΤΟ AI ΜΕ ΤΟ BASE64 STRING
      const result = await analyzeReceipt(base64String);

      // ************************************************************
      // *** ΔΕΝ ΧΡΕΙΑΖΕΤΑΙ ΠΛΕΟΝ TRANSLATION LAYER ***
      // *** Το AI πρέπει να απαντήσει με τις σωστές κατηγορίες.
      // ************************************************************

      const expense: Expense = {
        id: Date.now().toString(),
        date: result.date,
        merchantName: result.merchantName,
        category: result.category, // ΠΕΡΙΜΕΝΟΥΜΕ ΣΩΣΤΗ ΚΑΤΗΓΟΡΙΑ ΑΠΟ ΤΟ AI
        totalAmount: result.totalAmount,
      };

      onAddExpense(expense);
    } catch (error) {
      console.error('Receipt analysis error:', error);

      // Προσθήκη κενού εξόδου με την σωστή default κατηγορία
      onAddExpense({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        merchantName: 'Manual Entry (AI Failed)',
        totalAmount: 0,
        category: 'Other Cost',
      });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={handleButtonClick}
        disabled={isAnalyzing}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-lg"
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            Analyzing Receipt...
          </>
        ) : (
          <>
            <Camera size={24} />
            Scan Receipt
            <Upload size={20} className="opacity-75" />
          </>
        )}
      </button>
    </div>
  );
}
