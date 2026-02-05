import { getTransactions } from '@/app/actions/get-transactions';
import { getCommonData } from '@/app/actions/get-common-data'; // Solo si necesitas nombres, pero getTransactions ya trae relaciones
import FinancialCharts from '@/components/dashboard/FinancialCharts';
import ExportButton from '@/components/dashboard/ExportButton'; // Lo creamos abajo
import PrivacyToggle from '@/components/dashboard/PrivacyToggle';

export default async function ReportsPage() {
    // Traemos muchísimos datos para los reportes (ej: 500)
    const transactions = await getTransactions(500);

    return (
        <div className="max-w-7xl mx-auto pb-20">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Reportes y Análisis</h1>
                    <p className="text-slate-500">Visualiza el rendimiento y exporta para contabilidad.</p>
                </div>
                <div className="flex items-center gap-3">
                    <PrivacyToggle />
                    <ExportButton transactions={transactions} />
                </div>
            </div>

            {/* Gráficos */}
            <FinancialCharts transactions={transactions} />

            {/* Aquí podrías agregar tablas de resumen o KPIs adicionales */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 text-sm">
                💡 <strong>Nota:</strong> Los reportes se generan basándose en los datos cargados. Recuerda que al exportar para el contador (Botón "Exportar PDF"), el sistema excluirá automáticamente cualquier movimiento no fiscal.
            </div>

        </div>
    );
}