'use client';

import Link from 'next/link';
import { Building, Plus, CreditCard, Users, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Panel de Control</h1>
                    <p className="text-slate-500">Bienvenido, Superadmin. Aquí tienes el resumen de tu SaaS.</p>
                </div>
                <Link
                    href="/admin/companies/new"
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Empresa
                </Link>
            </div>

            {/* KPIs / Métricas Rápidas (Hardcodeadas por ahora, luego las conectamos) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Building className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Empresas Activas</p>
                            <h3 className="text-2xl font-bold text-slate-900">12</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">MRR (Mensual)</p>
                            <h3 className="text-2xl font-bold text-slate-900">$450.000</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Usuarios Totales</p>
                            <h3 className="text-2xl font-bold text-slate-900">84</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accesos Directos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tarjeta: Gestión de Empresas */}
                <Link href="/admin/companies" className="group block">
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full border-l-4 border-l-slate-900">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    Listado de Empresas (Vista Excel)
                                </h3>
                                <p className="text-slate-500 leading-relaxed">
                                    Accede a la tabla detallada con deudas, módulos activados, usuarios y estado de cada cliente.
                                </p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </Link>

                {/* Tarjeta: Configuración (Placeholder) */}
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-gray-300 opacity-75">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Configuración Global</h3>
                    <p className="text-slate-500">
                        Gestión de precios de módulos, plantillas de correo y ajustes del sistema. (Próximamente)
                    </p>
                </div>
            </div>
        </div>
    );
}