'use client';

import { FileText } from 'lucide-react';
import { exportToPDF } from '@/lib/utils/export-helper';

export default function ExportButton({ transactions }: { transactions: any[] }) {

    const handleExport = () => {
        // Nombre de empresa hardcodeado o podrías pasarlo como prop
        exportToPDF(transactions, "Mi Empresa");
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
            title="Generar PDF solo con movimientos fiscales"
        >
            <FileText className="w-4 h-4" />
            <span>Exportar Fiscal</span>
        </button>
    );
}