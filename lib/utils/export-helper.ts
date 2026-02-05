import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const exportToPDF = (transactions: any[], companyName: string) => {
    // 1. FILTRO DE SEGURIDAD (CRÍTICO)
    // Solo exportamos lo que es BLANCO (Fiscal).
    const fiscalData = transactions.filter(t => t.is_fiscal === true);

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text(`Reporte Fiscal - ${companyName}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Fecha de emisión: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 30);
    doc.text(`Total Movimientos: ${fiscalData.length}`, 14, 36);

    // Tabla
    const tableColumn = ["Fecha", "Tipo", "Categoría", "Proveedor/Cliente", "Monto (ARS)", "Monto (USD)"];
    const tableRows: any[] = [];

    fiscalData.forEach(t => {
        const transactionData = [
            format(new Date(t.transaction_date), 'dd/MM/yyyy'),
            t.type === 'income' ? 'Ingreso' : 'Egreso',
            t.categories?.name || '-',
            t.payees?.name || '-',
            t.currency === 'ARS' ? `$${t.amount}` : '-',
            t.currency === 'USD' ? `U$S${t.amount}` : '-',
        ];
        tableRows.push(transactionData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] }, // Un color verde profesional
    });

    // Guardar archivo
    doc.save(`Reporte_Contador_${format(new Date(), 'yyyy-MM')}.pdf`);
};