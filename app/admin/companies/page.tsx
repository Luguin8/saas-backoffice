'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Building, MoreVertical, Trash2, Edit, ExternalLink } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr'; // <--- USAMOS LA LIBRERÍA OFICIAL
import { deleteOrganization } from '@/app/actions/delete-organization'; // <--- NOMBRE CORREGIDO

// Definición de tipos para la UI
type Company = {
    id: string;
    name: string;
    slug: string;
    owner_email: string;
    status: string;
    created_at: string;
    base_maintenance_fee: number;
    logo_url: string | null;
};

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Creamos el cliente del navegador aquí mismo
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch inicial de empresas
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setCompanies(data || []);
            } catch (err) {
                console.error('Error cargando empresas:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Filtrado
    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.owner_email && company.owner_email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que quieres borrar esta empresa? Esta acción es irreversible.')) return;

        // Llamada a server action de borrado
        const res = await deleteOrganization(id); // <--- NOMBRE CORREGIDO
        if (res.success) {
            setCompanies(companies.filter(c => c.id !== id));
        } else {
            alert('Error al borrar: ' + res.message);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Building className="w-6 h-6" />
                        Empresas
                    </h1>
                    <p className="text-slate-500 mt-1">Gestión de clientes y facturación.</p>
                </div>
                <Link
                    href="/admin/companies/new"
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-lg shadow-slate-900/20"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Empresa
                </Link>
            </div>

            {/* Buscador */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4">Slug / URL</th>
                                <th className="px-6 py-4">Dueño</th>
                                <th className="px-6 py-4 text-right">Fee Mensual</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        Cargando empresas...
                                    </td>
                                </tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No se encontraron empresas.
                                    </td>
                                </tr>
                            ) : (
                                filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200">
                                                    {company.logo_url ? (
                                                        <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{company.name}</div>
                                                    <div className="text-xs text-slate-400">ID: {company.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                /{company.slug}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {company.owner_email || 'Sin asignar'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-sm text-slate-700">
                                            ${company.base_maintenance_fee?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                {company.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 relative">
                                                <Link
                                                    href={`/admin/companies/${company.id}/edit`}
                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(company.id)}
                                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Borrar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}