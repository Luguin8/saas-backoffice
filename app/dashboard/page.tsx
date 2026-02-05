import { getDashboardStats } from '@/app/actions/get-dashboard-stats';
import PrivacyToggle from '@/components/dashboard/PrivacyToggle';
import StatsCards from '@/components/dashboard/StatsCards'; // Lo creamos abajo
import { Plus, Minus } from 'lucide-react';

export default async function DashboardPage() {
    // 1. Obtenemos datos del servidor (Server Side)
    const stats = await getDashboardStats();

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* Header: Título + Botón de Privacidad */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Resumen Financiero</h1>
                    <p className="text-slate-500">Estado de caja actual y movimientos del mes.</p>
                </div>
                <PrivacyToggle />
            </div>

            {/* Tarjetas de Totales (Client Component para reaccionar al toggle) */}
            <StatsCards stats={stats} />

            {/* Accesos Rápidos (Centro de Acción - Fase 4 Placeholder) */}
            <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center justify-center gap-2 p-6 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors group">
                    <div className="p-3 bg-emerald-200 rounded-full text-emerald-800 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-emerald-900">Ingresar Dinero</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 p-6 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors group">
                    <div className="p-3 bg-rose-200 rounded-full text-rose-800 group-hover:scale-110 transition-transform">
                        <Minus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-rose-900">Retirar Dinero</span>
                </button>
            </div>

        </div>
    );
}