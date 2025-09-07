// src/lib/pdf-generator.ts

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { Load } from '@prisma/client'; // Prisma se generated 'Load' type import karein

// Yeh ek mock function hai current user ki details ke liye.
// Asli app me, aap session (jaise NextAuth) se user data lenge.
const getCurrentUser = async () => ({
  username: 'sudo', // Yahan dynamically user ka role/name aayega
});

export async function generateLoadDocuments(load: Load, isUpdate: boolean = false) {
  const currentUser = await getCurrentUser();
  const timestamp = new Date().getTime();
  
  // Update hone par file name me naya version add ho jayega
  const versionSuffix = isUpdate ? `-v${timestamp}` : '';

  const lrFileName = `LR-${load.id}${versionSuffix}.pdf`;
  const invoiceFileName = `INVOICE-${load.id}${versionSuffix}.pdf`;

  // Files save karne ka exact path jo aapne bataya
  // Note: Local development me '/Users/yash/...' path chalega, lekin server par relative path use karna behtar hai.
  // process.cwd() project ki root directory deta hai.
  const dirPath = path.join(process.cwd(), `public/uploads/LRInvoice/${currentUser.username}`);
  const lrDirPath = path.join(dirPath, 'LR');
  const invoiceDirPath = path.join(dirPath, 'Invoice');
  
  // Ensure karein ki directories bani hui hain
  await fs.mkdir(lrDirPath, { recursive: true });
  await fs.mkdir(invoiceDirPath, { recursive: true });

  const lrFilePath = path.join(lrDirPath, lrFileName);
  const invoiceFilePath = path.join(invoiceDirPath, invoiceFileName);

  // --- Lorry Receipt (LR) PDF Banayein ---
  const lrPdfDoc = await PDFDocument.create();
  const lrPage = lrPdfDoc.addPage();
  const { height: lrHeight } = lrPage.getSize();
  const font = await lrPdfDoc.embedFont(StandardFonts.Helvetica);
  
  lrPage.drawText('Lorry Receipt (LR)', { x: 50, y: lrHeight - 50, font, size: 24 });
  lrPage.drawText(`Load ID: ${load.id}`, { x: 50, y: lrHeight - 100, font, size: 12 });
  lrPage.drawText(`LR Number: ${load.lrNumber}`, { x: 50, y: lrHeight - 120, font, size: 12 });
  lrPage.drawText(`Date: ${new Date(load.loadDate).toLocaleDateString('en-IN')}`, { x: 50, y: lrHeight - 140, font, size: 12 });
  lrPage.drawText(`Vendor: ${load.vendorName || 'N/A'}`, { x: 50, y: lrHeight - 160, font, size: 12 });
  // Yahan aur details add kar sakte hain...

  const lrPdfBytes = await lrPdfDoc.save();
  await fs.writeFile(lrFilePath, lrPdfBytes);

  // --- Invoice PDF Banayein ---
  const invoicePdfDoc = await PDFDocument.create();
  const invoicePage = invoicePdfDoc.addPage();
  const { height: invHeight } = invoicePage.getSize();
  
  invoicePage.drawText('Invoice', { x: 50, y: invHeight - 50, font, size: 24 });
  invoicePage.drawText(`Invoice No: ${load.invoiceNumber}`, { x: 50, y: invHeight - 100, font, size: 12 });
  invoicePage.drawText(`Load ID: ${load.id}`, { x: 50, y: invHeight - 120, font, size: 12 });
  invoicePage.drawText(`Total Amount: Rs. ${load.totalAmount || 0}`, { x: 50, y: invHeight - 140, font, size: 14 });
  // Yahan aur details add kar sakte hain...
  
  const invoicePdfBytes = await invoicePdfDoc.save();
  await fs.writeFile(invoiceFilePath, invoicePdfBytes);

  // Files ka public URL return karein, jisse frontend me access kar sakein
  return {
    lorryReceiptFile: `/uploads/LRInvoice/${currentUser.username}/LR/${lrFileName}`,
    invoiceFile: `/uploads/LRInvoice/${currentUser.username}/Invoice/${invoiceFileName}`,
  };
}