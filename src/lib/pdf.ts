// src/lib/pdf.ts
import fs from "fs";
import path from "path";

// 👉 Use pdfkit STANDALONE build (bundled fonts; no AFM on disk)
type PDFDocumentCtor = any;
async function getPDFKit(): Promise<PDFDocumentCtor> {
  const mod = await import("pdfkit/js/pdfkit.standalone.js");
  // ESM default/export interop
  return (mod as any).default || (mod as any);
}

/** ensure directory exists */
export async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}

/** Create a doc (Helvetica available without AFM) */
export async function createDoc() {
  const PDFDocument = await getPDFKit();
  const doc = new PDFDocument({ margin: 48 }); // autoFirstPage: true default
  // optional: explicitly select Helvetica (bundled in standalone)
  try { doc.font("Helvetica"); } catch {}
  return doc;
}

/** Render to file (and return file path) */
export async function renderPdfToFile(
  draw: (doc: any) => void,
  outPath: string
): Promise<string> {
  await ensureDir(path.dirname(outPath));
  const doc = await createDoc();
  const ws = fs.createWriteStream(outPath);

  return new Promise<string>((resolve, reject) => {
    ws.on("finish", () => resolve(outPath));
    ws.on("error", reject);
    doc.on("error", reject);

    doc.pipe(ws);
    draw(doc);
    doc.end();
  });
}