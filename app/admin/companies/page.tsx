'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchCompaniesSummary, type CompanySummary } from '@/lib/services/companies';
import { Plus, Search, MoreHorizontal, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function CompaniesListPage() {
    const [companies, setCompanies] = useState<CompanySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCompaniesSummary()
            .then(setCompanies)
            .catch((err) => alert(err.message))
            .finally(() => setLoading(false));
    }, []);

    // Filtrado simple en cliente
    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>;

    return (
        <div className="max-w-7xl mx-auto p-8">

            {/* Header con Buscador y Botón Crear */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6" />
                        Gestión de Empresas
                    </h1>
                    <p className="text-sm text-slate-500">Vista detallada de clientes y facturación.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                        <input
                            type="text"
                            placeholder="Buscar empresa..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Link
                        href="/admin/companies/new"
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Nueva</span>
                    </Link>
                </div>
            </div>

            {/* Tabla "Excel" */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Empresa / Slug</th>
                                <th className="px-6 py-4">Usuario Admin</th>
                                <th className="px-6 py-4 text-center">Módulos</th>
                                <th className="px-6 py-4 text-right">Mantenimiento Base</th>
                                <th className="px-6 py-4 text-right">Total a Cobrar</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {company.logo_url ? (
                                                <img src={company.logo_url} alt="" className="w-8 h-8 rounded object-cover border" />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {company.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-slate-900">{company.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{company.slug}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-700 font-medium">{company.owner_email}</span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                ●●●●●●●●
                                                <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">Encrypted</span>
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {company.modules_count} Activos
                                        </div>
                                        {/* Tooltip simple con titles */}
                                        <div className="text-xs text-slate-400 mt-1 truncate max-w-[150px] mx-auto" title={company.modules_names.join(', ')}>
                                            {company.modules_names.slice(0, 2).join(', ')} {company.modules_count > 2 && '...'}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                                        ${company.base_maintenance_fee.toLocaleString()}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <span className="font-bold text-emerald-600 font-mono">
                                            ${company.total_monthly_cost.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block">/ mes</span>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${company.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}
                    `}>
                                            {company.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-200 transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {filteredCompanies.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-500">
                                        No se encontraron empresas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}