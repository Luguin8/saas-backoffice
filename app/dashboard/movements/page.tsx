import { getTransactions } from '@/app/actions/get-transactions';
import { getCommonData } from '@/app/actions/get-common-data';
import MovementsTable from '@/components/dashboard/MovementsTable';
import PrivacyToggle from '@/components/dashboard/PrivacyToggle';

export default async function MovementsPage() {
    // Fetch paralelo
    const [transactions, commonData] = await Promise.all([
        getTransactions(100), // Traemos los últimos 100 por defecto
        getCommonData()
    ]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Movimientos</h1>
                    <p className="text-slate-500">Historial completo de operaciones.</p>
                </div>
                <PrivacyToggle />
            </div>

            <MovementsTable
                transactions={transactions}
                categories={commonData.categories}
                payees={commonData.payees}
            />

        </div>
    );
}