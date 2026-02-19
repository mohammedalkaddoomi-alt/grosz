import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction } from '../types';

/**
 * Report Service for Cenny Grosz
 * Handles generation and sharing of CSV and PDF reports.
 */

export const reportService = {
    /**
     * Generates a JSON export from transactions
     */
    generateJSON: async (transactions: Transaction[]): Promise<void> => {
        const payload = {
            exported_at: new Date().toISOString(),
            total_transactions: transactions.length,
            transactions,
        };
        const fileName = `Export_Grosz_${new Date().getTime()}.json`;
        const filePath = `${(FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory}${fileName}`;

        try {
            await FileSystem.writeAsStringAsync(filePath, JSON.stringify(payload, null, 2), {
                encoding: (FileSystem as any).EncodingType.UTF8,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'application/json',
                    dialogTitle: 'Eksportuj dane (JSON)',
                    UTI: 'public.json',
                });
            }
        } catch (e) {
            console.error('Błąd podczas generowania JSON:', e);
            throw e;
        }
    },

    /**
     * Generates a CSV report from transactions
     */
    generateCSV: async (transactions: Transaction[]): Promise<void> => {
        const header = 'Data,Opis,Kategoria,Portfel,Typ,Kwota\n';
        const rows = transactions.map(tx => {
            const date = new Date(tx.created_at).toLocaleDateString('pl-PL');
            return `${date},"${tx.note || ''}","${tx.category}","${(tx as any).wallet_name || 'Główny'}",${tx.type},${tx.amount}`;
        }).join('\n');

        const csvContent = header + rows;
        const fileName = `Export_Grosz_${new Date().getTime()}.csv`;
        const filePath = `${(FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory}${fileName}`;

        try {
            await FileSystem.writeAsStringAsync(filePath, csvContent, {
                encoding: (FileSystem as any).EncodingType.UTF8,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Eksportuj transakcje',
                    UTI: 'public.comma-separated-values-text',
                });
            }
        } catch (e) {
            console.error('Błąd podczas generowania CSV:', e);
            throw e;
        }
    },

    /**
     * Generates a simple text-based summary (mocking PDF for demo)
     */
    generatePDF: async (transactions: Transaction[]): Promise<void> => {
        // For a real PDF we'd use expo-print or similar, 
        // but for the demo we'll generate a formatted summary text file.
        let content = 'RAPORT FINANSOWY CENNY GROSZ\n';
        content += '===============================\n\n';

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        content += `Suma przychodów: ${totalIncome.toFixed(2)} PLN\n`;
        content += `Suma wydatków: ${totalExpense.toFixed(2)} PLN\n`;
        content += `Bilans: ${(totalIncome - totalExpense).toFixed(2)} PLN\n\n`;

        content += 'LISTA TRANSAKCJI:\n';
        content += '-----------------\n';

        transactions.forEach(tx => {
            const date = new Date(tx.created_at).toLocaleDateString('pl-PL');
            content += `${date} | ${tx.amount.toFixed(2)} PLN | ${tx.category} | ${tx.note || ''}\n`;
        });

        const fileName = `Raport_Grosz_${new Date().getTime()}.txt`;
        const filePath = `${(FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory}${fileName}`;

        try {
            await FileSystem.writeAsStringAsync(filePath, content);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'text/plain',
                    dialogTitle: 'Podgląd raportu',
                });
            }
        } catch (e) {
            console.error('Błąd podczas generowania raportu:', e);
            throw e;
        }
    }
};
