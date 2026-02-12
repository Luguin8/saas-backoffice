'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { deleteOrganization } from '@/app/actions/delete-organization'; // Asegúrate que este import sea correcto
import { Plus, Search, Trash2, Edit, Building2 } from 'lucide-react';

export default function CompaniesListPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Cargar empresas
    const loadCompanies = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCompanies(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    // --- CORRECCIÓN AQUÍ ---
    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta empresa? Se borrarán TODOS sus datos (usuarios, turnos, caja, etc).')) {
            return;
        }

        try {
            // La acción ahora lanza un error si falla, o hace redirect si funciona.
            // Por eso usamos try/catch y no if(res.success)
            await deleteOrganization(id);

            // Si por alguna razón no redirecciona (ej. comportamiento de next), recargamos la lista
            loadCompanies();
        } catch (error: any) {
            // Si el redirect es interpretado como error, lo ignoramos, sino mostramos alerta
            if (error.message !== 'NEXT_REDIRECT') {
                alert('Error al eliminar: ' + error.message);
            }
        }
    };
    // -----------------------

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
                    <p className="text-slate-500">Gestiona tus clientes</p>
                </div>
                <Link
                    href="/admin/companies/new"
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    <Plus size={20} />
                    Nueva Empresa
                </Link>
            </div>

            {/* Buscador */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar empresa..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando empresas...</div>
                ) : filteredCompanies.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No se encontraron empresas.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                            <tr>
                                <th className="p-4 font-medium">Empresa</th>
                                <th className="p-4 font-medium">Slug</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                {company.logo_url ? (
                                                    <img src={company.logo_url} className="w-full h-full object-contain rounded-lg" />
                                                ) : (
                                                    <Building2 size={20} />
                                                )}
                                            </div>
                                            <span className="font-semibold text-slate-900">{company.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">{company.slug}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {company.status === 'active' ? 'Activo' : 'Suspendido'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/admin/companies/${company.id}/edit`}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar y Gestionar Personal"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(company.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar Empresa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}