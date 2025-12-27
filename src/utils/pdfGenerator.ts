import { jsPDF } from 'jspdf';
import { Expense, User } from '../types';

const toGreeklish = (text: string) => {
  const map: any = {'Α':'A','Β':'B','Γ':'G','Δ':'D','Ε':'E','Ζ':'Z','Η':'H','Θ':'TH','Ι':'I','Κ':'K','Λ':'L','Μ':'M','Ν':'N','Ξ':'X','Ο':'O','Π':'P','Ρ':'R','Σ':'S','Τ':'T','Υ':'Y','Φ':'F','Χ':'CH','Ψ':'PS','Ω':'O','α':'a','β':'b','γ':'g','δ':'d','ε':'e','ζ':'z','η':'h','θ':'th','ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s','τ':'t','υ':'y','φ':'f','χ':'ch','ψ':'ps','ω':'o','ά':'a','έ':'e','ή':'h','ί':'i','ό':'o','ύ':'y','ώ':'o'};
  return text ? text.split('').map(char => map[char] || char).join('') : "";
};

export const generatePDF = async (expenses: Expense[], images: string[], user: User, reportId: string, dest: string, purp: string) => {
  const doc = new jsPDF();
  const total = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const formattedID = reportId.padStart(4, '0');
  const catTotals = expenses.reduce((acc:any, e) => {
    const c = toGreeklish(e.category).toUpperCase();
    acc[c] = (acc[c] || 0) + e.totalAmount;
    return acc;
  }, {});

  // Header Banner
  doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 85, 'F');
  doc.setTextColor(220, 38, 38); doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
  doc.text('DDF', 15, 22);
  doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('EXPENSE REIMBURSEMENT SYSTEM', 15, 30);
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(`REPORT ID: #${formattedID}`, 195, 30, { align: 'right' });

  // Sidebar Data (Identity)
  doc.setFontSize(9);
  doc.text(`ACTIVE USER: ${toGreeklish(user.name).toUpperCase()}`, 15, 38);
  doc.text(`PROJECT: ${toGreeklish(localStorage.getItem('ddf_project') || 'N/A').toUpperCase()}`, 15, 44);
  doc.text(`DESTINATION: ${toGreeklish(dest || 'N/A').toUpperCase()}`, 15, 50);
  doc.text(`PURPOSE: ${toGreeklish(purp || 'N/A').toUpperCase()}`, 15, 56);

  // Spacing for Metadata
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(`GENERATED ON: ${new Date().toLocaleDateString('el-GR')}`, 15, 68); 
  doc.text(`TIMESTAMP: ${new Date().toLocaleTimeString('el-GR')}`, 15, 73);

  // Table
  let y = 95;
  doc.setFillColor(15, 23, 42); doc.rect(15, y - 6, 180, 10, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text('DATE', 18, y); doc.text('CATEGORY / VENDOR', 50, y); doc.text('AMOUNT (EUR)', 192, y, { align: 'right' });

  doc.setTextColor(15, 23, 42); y += 10;
  expenses.forEach(e => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'normal'); doc.text(e.date, 18, y);
    doc.setFont('helvetica', 'bold'); doc.text(toGreeklish(e.merchantName).toUpperCase(), 50, y);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
    doc.text(toGreeklish(e.category).toUpperCase(), 50, y + 4);
    doc.setTextColor(15, 23, 42); doc.setFontSize(10); doc.text(e.totalAmount.toFixed(2), 192, y, { align: 'right' });
    y += 14;
  });

  // Totals & Bank
  y += 5;
  doc.setFillColor(15, 23, 42); doc.rect(15, y, 180, 10, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.text('GRAND TOTAL CLAIM', 20, y + 6.5);
  doc.text(`${total.toFixed(2)} EUR`, 192, y + 6.5, { align: 'right' });

  y += 35; doc.setTextColor(15, 23, 42); doc.setFontSize(9);
  doc.text(`BANK: ${toGreeklish(user.bankName || 'N/A').toUpperCase()}`, 15, y);
  y += 6; doc.text(`IBAN: ${user.iban || 'PENDING'}`, 15, y);

  images.forEach((img, i) => {
    doc.addPage();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 10, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(7);
    doc.text(`ATTACHMENT #${i + 1} - REPORT ID: ${formattedID}`, 105, 6.5, { align: 'center' });
    doc.addImage(img, 'JPEG', 15, 15, 180, 250, undefined, 'FAST');
  });

  doc.save(`DDF_Report_${formattedID}.pdf`);
};