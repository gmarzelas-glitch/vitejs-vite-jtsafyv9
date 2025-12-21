import React from 'react';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';

interface SignatureModalProps {
  totalAmount: string;
  currency: string;
  expenseCount: number;
  onConfirm: (signatureData: string) => void;
  onCancel: () => void;
  isGenerating?: boolean; // Προαιρετικό για συμβατότητα
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  totalAmount,
  currency,
  expenseCount,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = () => {
    // Στέλνουμε απλά ένα "κλειδί" ότι εγκρίθηκε. Το PDF θα βάλει τα στοιχεία.
    onConfirm('DIGITAL_CERT_ENABLED');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="text-green-600" />
            Certify & Submit
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 uppercase mb-2">
              Summary
            </h3>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-blue-700">Total Items:</span>
              <span className="font-medium text-blue-900">{expenseCount}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-blue-700">Total Claim:</span>
              <span className="text-blue-900">
                {totalAmount} {currency}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-3">
            <p>By clicking "Certify & Submit", I hereby certify that:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>These expenses were incurred for business purposes.</li>
              <li>The attached receipts are authentic.</li>
              <li>
                I am applying my <strong>Digital Signature</strong> to this
                document.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
          >
            <CheckCircle size={20} />
            Certify & Submit
          </button>
        </div>
      </div>
    </div>
  );
};
