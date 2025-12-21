export interface Expense {
  id: string;
  date: string;
  merchantName: string;
  category: string;
  totalAmount: number;
}

export interface User {
  name: string;
  email: string;
  iban?: string;
  bankName?: string;
}

export interface Settings {
  organizationName: string;
}
