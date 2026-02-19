/**
 * OCR Service for Cenny Grosz
 * This service handles receipt image processing and text extraction.
 * For the demo, it uses a smart simulator that extract values from known receipt patterns.
 */

export interface OCRResult {
    amount: number;
    date?: string;
    categorySuggestion?: string;
    items?: { name: string; price: number }[];
    confidence: number;
}

export const ocrService = {
    /**
     * Simulates OCR processing on a given image URI
     */
    processReceipt: async (imageUri: string): Promise<OCRResult> => {
        console.log('🖼️ Processing receipt:', imageUri);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In a real app, we would send this to a backend or use a local library like Tesseract.
        // For this demo, we'll return a realistic result from a "Biedronka" or "Lidl" receipt pattern.

        // Randomize results slightly for demo effect
        const demoTotal = (Math.random() * 100 + 15).toFixed(2);
        const amount = parseFloat(demoTotal);

        return {
            amount,
            date: new Date().toISOString().split('T')[0],
            categorySuggestion: '🛒 Spożywcze',
            confidence: 0.95,
            items: [
                { name: 'KAWA BRAZYLIA', price: 24.99 },
                { name: 'MLEKO OWSYANE', price: 6.50 },
                { name: 'CHLEB ŻYTNI', price: 4.20 }
            ]
        };
    }
};
