export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const pdfOptions = {
  isEvalSupported: false,
  cMapUrl: `${basePath}/pdf-assets/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${basePath}/pdf-assets/standard_fonts/`,
  wasmUrl: `${basePath}/pdf-assets/wasm/`,
};
export async function getPDFEngine() {
  const { pdfjs } = await import('react-pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.mjs`;
  return pdfjs;
}
export async function inspectPDF(file) {
  if (!file || !/\.pdf$/i.test(file.name) || !file.size)
    throw new Error('Choose a non-empty PDF file.');
  if (file.size > 100 * 1024 * 1024)
    throw new Error('Choose a PDF smaller than 100 MB.');
  const pdfjs = await getPDFEngine();
  const task = pdfjs.getDocument({
    data: await file.arrayBuffer(),
    ...pdfOptions,
  });
  try {
    const pdf = await task.promise;
    const page = await pdf.getPage(1);
    const original = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 300 / original.width });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport })
      .promise;
    return {
      coverImage: canvas.toDataURL('image/jpeg', 0.8),
      numPages: pdf.numPages,
    };
  } catch (error) {
    if (error.name === 'PasswordException')
      throw new Error('This PDF is password protected. Add an unlocked copy.');
    throw new Error(
      'This PDF could not be read. Try a different or repaired PDF.',
    );
  } finally {
    await task.destroy();
  }
}
