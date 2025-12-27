export interface Expense {
    id: string;
    date: string;
    merchantName: string;
    category: 'Meals' | 'Transportation' | 'Accommodation' | 'Subscriptions & Memberships' | 'Other Cost';
    totalAmount: number;
    receiptImage?: string;
  }
  
  export interface User {
    id: string;
    name: string;
    email: string;
    iban?: string;
    bankName?: string;
  }