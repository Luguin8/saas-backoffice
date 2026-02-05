import { getDashboardStats } from '@/app/actions/get-dashboard-stats';
import { getCommonData } from '@/app/actions/get-common-data'; // <--- Import nuevo
import PrivacyToggle from '@/components/dashboard/PrivacyToggle';
import StatsCards from '@/components/dashboard/StatsCards';
import ActionCenter from '@/components/dashboard/ActionCenter'; // <--- Import nuevo

export default async function DashboardPage() {
    // Fetch paralelo de datos (Rápido y eficiente)
    const [stats, commonData] = await Promise.all([
        getDashboardStats(),
        getCommonData()
    ]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Resumen Financiero</h1>
                    <p className="text-slate-500">Estado de caja actual y movimientos del mes.</p>
                </div>
                <PrivacyToggle />
            </div>

            {/* Tarjetas */}
            <StatsCards stats={stats} />

            {/* Centro de Acción (Fase 4) */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Acciones Rápidas</h3>
                <ActionCenter categories={commonData.categories} payees={commonData.payees} />
            </div>

        </div>
    );
}