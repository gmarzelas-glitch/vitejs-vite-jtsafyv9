import { jsPDF } from 'jspdf';

const toGreeklish = (text: string) => {
  const map: any = {
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
  return text
    ? text
        .split('')
        .map((char) => map[char] || char)
        .join('')
    : '';
};

export const generatePDF = async (
  expenses: any[],
  receiptImages: string[],
  reportInfo: any,
  reportCount: number
) => {
  const doc = new jsPDF();
  const total = expenses.reduce((sum, exp) => sum + Number(exp.totalAmount), 0);
  const formattedID = String(reportCount).padStart(4, '0');

  // Υπολογισμός Συνόλων ανά Κατηγορία
  const categoryTotals = expenses.reduce((acc: any, exp: any) => {
    const cat = toGreeklish(exp.category || 'GENERAL').toUpperCase();
    acc[cat] = (acc[cat] || 0) + Number(exp.totalAmount);
    return acc;
  }, {});

  // Κόκκινο Header
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, 210, 65, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('DDF REIMBURSEMENTS FORM', 105, 18, { align: 'center' });
  doc.setFontSize(14);
  doc.text(toGreeklish(reportInfo.project).toUpperCase(), 105, 30, {
    align: 'center',
  });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`DATE: ${reportInfo.date} | REPORT ID: ${formattedID}`, 105, 42, {
    align: 'center',
  });

  // Στοιχεία Υπαλλήλου
  doc.setTextColor(0, 0, 0);
  let y = 75;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(toGreeklish(reportInfo.name).toUpperCase(), 15, y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text(
    `IBAN: ${reportInfo.iban} | BANK: ${toGreeklish(
      reportInfo.bank
    ).toUpperCase()}`,
    15,
    y
  );

  // Πίνακας Εξόδων
  y = 95;
  doc.setFillColor(220, 38, 38);
  doc.rect(15, y - 5, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE', 18, y);
  doc.text('VENDOR & CATEGORY', 50, y);
  doc.text('AMOUNT', 192, y, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  y += 10;
  expenses.forEach((exp) => {
    doc.setFont('helvetica', 'normal');
    doc.text(exp.date, 18, y);
    doc.setFont('helvetica', 'bold');
    const merchant = toGreeklish(exp.merchantName).toUpperCase();
    doc.text(merchant, 50, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(toGreeklish(exp.category || 'GENERAL').toUpperCase(), 50, y + 4);
    doc.setFontSize(10);
    doc.text(Number(exp.totalAmount).toFixed(2), 192, y, { align: 'right' });
    y += 12;
  });

  // CATEGORY BREAKDOWN - Τώρα σε ΚΟΚΚΙΝΟ
  y += 5;
  doc.setFillColor(220, 38, 38);
  doc.rect(120, y, 75, Object.keys(categoryTotals).length * 7 + 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('CATEGORY BREAKDOWN', 125, y + 6);
  doc.setFont('helvetica', 'normal');
  let breakY = y + 13;
  Object.entries(categoryTotals).forEach(([cat, val]: any) => {
    doc.text(`${cat}:`, 125, breakY);
    doc.text(`${val.toFixed(2)}`, 190, breakY, { align: 'right' });
    breakY += 7;
  });

  // GRAND TOTAL CLAIM
  y = breakY + 5;
  doc.setFillColor(220, 38, 38);
  doc.rect(15, y, 180, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL CLAIM', 20, y + 8);
  doc.text(`${total.toFixed(2)} EUR`, 190, y + 8, { align: 'right' });

  // ΧΡΟΝΟΣΦΡΑΓΙΔΑ ΤΟΝΙΣΜΕΝΗ
  y += 25;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bolditalic');
  doc.setTextColor(180, 0, 0); // Σκούρο κόκκινο για έμφαση
  doc.text(
    `DIGITALLY GENERATED & AUDIT VERIFIED: ${new Date().toLocaleString(
      'el-GR'
    )}`,
    15,
    y
  );

  // Εικόνες Αποδείξεων
  receiptImages.forEach((img, i) => {
    doc.addPage();
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(14);
    doc.text(`ATTACHMENT RECEIPT #${i + 1}`, 15, 15);
    doc.addImage(img, 'JPEG', 15, 20, 180, 240);
  });

  doc.save(`DDF_Report_${formattedID}.pdf`);
};
