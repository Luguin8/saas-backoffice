'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchCompaniesSummary, type CompanySummary } from '@/lib/services/companies';
import { deleteOrganizationAction } from '@/app/actions/delete-organization';
import { Plus, Search, MoreVertical, FileSpreadsheet, Loader2, Trash2, Edit, Key } from 'lucide-react';

export default function CompaniesListPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<CompanySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        fetchCompaniesSummary()
            .then(setCompanies)
            .catch((err) => alert(err.message))
            .finally(() => setLoading(false));
    }, []);

    // Cerrar menú si clickeo afuera
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm('⚠️ ¿Estás seguro? Esto borrará la empresa Y TODOS SUS USUARIOS permanentemente.')) return;

        // Optimistic UI update: lo quitamos de la lista visualmente mientras se borra
        const previousCompanies = [...companies];
        setCompanies(prev => prev.filter(c => c.id !== id));

        const res = await deleteOrganizationAction(id);

        if (res.success) {
            alert('Empresa eliminada.');
            router.refresh();
        } else {
            alert('Error al eliminar: ' + res.message);
            // Rollback si falló
            setCompanies(previousCompanies);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Contraseña copiada');
    };

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>;

    return (
        <div className="max-w-7xl mx-auto p-8">

            {/* Header */}
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
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Link
                        href="/admin/companies/new"
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Nueva</span>
                    </Link>
                </div>
            </div>

            {/* Tabla Container */}
            {/* Fix: min-h-[500px] asegura espacio vertical. pb-24 da aire abajo para que el último menú no se corte. */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[500px] relative">
                <div className="overflow-x-auto pb-24">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4 w-[250px]">Empresa</th>
                                <th className="px-6 py-4 w-[200px]">Acceso Dueño</th>
                                <th className="px-6 py-4 text-center">Módulos</th>
                                <th className="px-6 py-4 text-right">Base</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50 transition-colors group">

                                    {/* 1. Empresa */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {company.logo_url ? (
                                                <img src={company.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain border bg-white" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {company.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-slate-900 truncate max-w-[150px]" title={company.name}>{company.name}</div>
                                                <div className="text-xs text-slate-400 font-mono truncate max-w-[150px]">{company.slug}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. Acceso */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-slate-700 font-medium text-xs truncate max-w-[180px]" title={company.owner_email}>
                                                {company.owner_email || 'No asignado'}
                                            </div>

                                            {company.initial_password ? (
                                                <button
                                                    onClick={() => copyToClipboard(company.initial_password!)}
                                                    className="flex items-center gap-2 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 hover:bg-yellow-100 transition-colors w-fit"
                                                    title="Click para copiar contraseña"
                                                >
                                                    <Key className="w-3 h-3" />
                                                    <span className="font-mono font-bold blur-[3px] hover:blur-0 transition-all duration-300">
                                                        {company.initial_password}
                                                    </span>
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Pass no guardada</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* 3. Módulos */}
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {company.modules_count} Activos
                                        </div>
                                    </td>

                                    {/* 4. Costos */}
                                    <td className="px-6 py-4 text-right font-mono text-slate-500">
                                        ${company.base_maintenance_fee.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-bold text-emerald-600 font-mono text-base">
                                            ${company.total_monthly_cost.toLocaleString()}
                                        </span>
                                    </td>

                                    {/* 5. Estado */}
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                      ${company.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-700 border-gray-200'}
                    `}>
                                            {company.status}
                                        </span>
                                    </td>

                                    {/* 6. Acciones */}
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === company.id ? null : company.id);
                                            }}
                                            className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-slate-200 transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        {/* Menú Flotante con Z-Index Alto */}
                                        {openMenuId === company.id && (
                                            <div className="absolute right-8 top-0 w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100">
                                                <div className="py-1">
                                                    {/* Nota: Asegúrate de haber creado la página de edición en [id]/edit/page.tsx */}
                                                    <Link
                                                        href={`/admin/companies/${company.id}/edit`}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Edit className="w-4 h-4 text-slate-400" /> Editar
                                                    </Link>

                                                    <button
                                                        onClick={() => handleDelete(company.id)}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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