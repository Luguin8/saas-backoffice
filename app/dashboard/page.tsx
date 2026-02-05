export default function DashboardHome() {
    return (
        <div className="space-y-6">
            {/* Header de Bienvenida */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">Vista General</h1>
                <p className="text-slate-500 mt-2">
                    Bienvenido a tu panel de gestión. Aquí verás un resumen de tu actividad.
                </p>

                <div className="mt-6">
                    <button
                        className="px-4 py-2 text-white rounded-lg shadow-sm transition-opacity hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-secondary)' }}
                    >
                        Nueva Acción Rápida
                    </button>
                </div>
            </div>

            {/* Grid de Widgets (Esqueleto) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Widget 1 */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center text-slate-400">
                    Widget de Métricas (Próximamente)
                </div>
                {/* Widget 2 */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center text-slate-400">
                    Accesos Directos
                </div>
                {/* Widget 3 */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 flex items-center justify-center text-slate-400">
                    Estado del Sistema
                </div>
            </div>
        </div>
    );
}