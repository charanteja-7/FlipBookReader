export const extractCover = async (file) => {
    try {
        const { pdfjs } = await import('react-pdf');
        if (typeof window !== 'undefined' && 'Worker' in window) {
            pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1.5 }); // Reasonable scale for thumbnail
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;

        return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
        console.error('Error extracting cover:', error);
        return null; // Return default cover or null
    }
};
