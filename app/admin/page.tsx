'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building, Plus, CreditCard, Users, ArrowRight, Loader2 } from 'lucide-react';
import { fetchDashboardStats, type DashboardStats } from '@/lib/services/companies';

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        activeCompanies: 0,
        mrr: 0,
        totalUsers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats()
            .then(setStats)
            .catch((err) => console.error("Error cargando estadísticas:", err))
            .finally(() => setLoading(false));
    }, []);

    // Formateador de moneda
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Panel de Control</h1>
                    <p className="text-slate-500">Bienvenido, Superadmin. Aquí tienes el resumen real de tu SaaS.</p>
                </div>
                <Link
                    href="/admin/companies/new"
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Empresa
                </Link>
            </div>

            {/* KPIs / Métricas Reales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

                {/* Card 1: Empresas */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Building className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Empresas Activas</p>
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-1" />
                            ) : (
                                <h3 className="text-2xl font-bold text-slate-900">{stats.activeCompanies}</h3>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card 2: MRR */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">MRR (Mensual)</p>
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-1" />
                            ) : (
                                <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.mrr)}</h3>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card 3: Usuarios */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Usuarios Totales</p>
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-1" />
                            ) : (
                                <h3 className="text-2xl font-bold text-slate-900">{stats.totalUsers}</h3>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Accesos Directos (Sin cambios lógicos, solo visuales) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/admin/companies" className="group block">
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full border-l-4 border-l-slate-900">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    Listado de Empresas
                                </h3>
                                <p className="text-slate-500 leading-relaxed">
                                    Accede a la tabla detallada con deudas, módulos activados y estado de cada cliente.
                                </p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </Link>

                {/* Tarjeta: Configuración Global */}
                <Link href="/admin/settings" className="group block">
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full border-l-4 border-l-slate-500">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Configuración Global</h3>
                        <p className="text-slate-500">
                            Gestión de precios de módulos y ajustes del sistema.
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}