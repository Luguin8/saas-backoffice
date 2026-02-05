import { getDashboardStats } from '@/app/actions/get-dashboard-stats';
import { getCommonData } from '@/app/actions/get-common-data';
import PrivacyToggle from '@/components/dashboard/PrivacyToggle';
import StatsCards from '@/components/dashboard/StatsCards';
import ActionCenter from '@/components/dashboard/ActionCenter';
import { Sparkles } from 'lucide-react';

export default async function DashboardPage() {
    const [stats, commonData] = await Promise.all([
        getDashboardStats(),
        getCommonData()
    ]);

    // Lógica simple para saber si está "vacío"
    const isEmpty = stats.ars.income === 0 && stats.usd.income === 0;

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

            {/* Stats Cards (Siempre visibles para ver los ceros) */}
            <StatsCards stats={stats} />

            {/* ZERO STATE BANNER: Solo visible si está vacío */}
            {isEmpty && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Sparkles className="w-6 h-6 text-yellow-300" />
                            </div>
                            <h2 className="text-2xl font-bold">¡Bienvenido a Cajix!</h2>
                        </div>
                        <p className="text-blue-100 max-w-lg text-lg">
                            Todo está listo. Tu caja está segura, pero vacía. <br />
                            Comienza registrando tu primer ingreso o gasto abajo.
                        </p>
                    </div>

                    {/* Flecha visual decorativa (solo en desktop) */}
                    <div className="hidden md:block text-4xl animate-bounce">👇</div>
                </div>
            )}

            {/* Action Center */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    Acciones Rápidas
                    {isEmpty && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">Empieza aquí</span>}
                </h3>
                <ActionCenter categories={commonData.categories} payees={commonData.payees} />
            </div>

        </div>
    );
}