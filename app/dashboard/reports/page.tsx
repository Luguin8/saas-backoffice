import { getTransactions } from '@/app/actions/get-transactions';
import FinancialCharts from '@/components/dashboard/FinancialCharts';
import ExportButton from '@/components/dashboard/ExportButton';
import PrivacyToggle from '@/components/dashboard/PrivacyToggle';
import { formatMoney } from '@/lib/utils/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building2 } from 'lucide-react';

// Palabras clave para identificar cobros de subalquilantes
const SUBALQUILER_KEYWORDS = ['subalquil', 'subalq', 'sublocatario', 'subloc']

function isSubalquilerTransaction(transaction: any): boolean {
    const catName = (transaction.categories?.name ?? '').toLowerCase()
    const desc = (transaction.description ?? '').toLowerCase()
    return SUBALQUILER_KEYWORDS.some(kw => catName.includes(kw) || desc.includes(kw))
}

export default async function ReportsPage() {
    const transactions = await getTransactions(500);
    const subalquilerTx = transactions.filter(isSubalquilerTransaction)
    const subalquilerTotal = subalquilerTx.reduce((acc, t) => {
        return t.currency === 'ARS' ? acc + Number(t.amount) : acc
    }, 0)

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

            {/* Sección Subalquilantes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Building2 size={18} className="text-violet-500" />
                        Cobros de Subalquilantes
                    </h3>
                    {subalquilerTotal > 0 && (
                        <span className="text-sm font-bold text-emerald-600">
                            Total: {formatMoney(subalquilerTotal, 'ARS')}
                        </span>
                    )}
                </div>
                {subalquilerTx.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        No hay cobros de subalquilantes registrados.
                        <p className="mt-1 text-xs">Para que aparezcan aquí, usá categorías o descripciones que contengan la palabra <strong>subalquil</strong>.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {subalquilerTx.map(tx => (
                            <div key={tx.id} className="px-5 py-3 flex justify-between items-center hover:bg-slate-50">
                                <div>
                                    <div className="font-medium text-slate-900 text-sm">
                                        {tx.categories?.name ?? 'Sin categoría'}
                                        {tx.payees?.name && <span className="text-slate-400 font-normal"> · {tx.payees.name}</span>}
                                    </div>
                                    {tx.description && <div className="text-xs text-slate-400">{tx.description}</div>}
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        {format(new Date(tx.transaction_date), "dd MMM yyyy", { locale: es })}
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-emerald-600">
                                    {formatMoney(Number(tx.amount), tx.currency)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 text-sm">
                💡 <strong>Nota:</strong> Al exportar para el contador (Botón &quot;Exportar PDF&quot;), el sistema excluirá automáticamente cualquier movimiento no fiscal.
            </div>

        </div>
    );
}