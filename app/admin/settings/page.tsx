'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr'; // Usamos browser client para updates directos simples
import { Save, Loader2, DollarSign, Package } from 'lucide-react';

type Module = {
    key: string;
    name: string;
    description: string | null;
    monthly_price_adder: number;
    is_active: boolean;
};

export default function GlobalSettingsPage() {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        const { data, error } = await supabase
            .from('modules')
            .select('*')
            .order('key');

        if (data) setModules(data);
        setLoading(false);
    };

    const handleUpdatePrice = async (key: string, newPrice: number) => {
        setSaving(key);
        try {
            const { error } = await supabase
                .from('modules')
                .update({ monthly_price_adder: newPrice })
                .eq('key', key);

            if (error) throw error;

            // Actualizar estado local
            setModules(prev => prev.map(m => m.key === key ? { ...m, monthly_price_adder: newPrice } : m));
        } catch (err: any) {
            alert('Error actualizando precio: ' + err.message);
        } finally {
            setSaving(null);
        }
    };

    const toggleModuleStatus = async (key: string, currentStatus: boolean) => {
        setSaving(key);
        try {
            const { error } = await supabase
                .from('modules')
                .update({ is_active: !currentStatus })
                .eq('key', key);
            if (error) throw error;
            setModules(prev => prev.map(m => m.key === key ? { ...m, is_active: !currentStatus } : m));
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-slate-400" /></div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Configuración Global</h1>
                <p className="text-slate-500">Gestiona el catálogo de servicios y precios base de tu SaaS.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Package className="w-5 h-5" /> Catálogo de Módulos
                    </h2>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Módulo (Key)</th>
                            <th className="px-6 py-4">Nombre Público</th>
                            <th className="px-6 py-4">Precio Adicional (Mensual)</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {modules.map((mod) => (
                            <tr key={mod.key} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-500">{mod.key}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{mod.name}</div>
                                    <div className="text-xs text-slate-400">{mod.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 max-w-[140px]">
                                        <div className="relative w-full">
                                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                <DollarSign className="w-3 h-3 text-slate-400" />
                                            </div>
                                            <input
                                                type="number"
                                                defaultValue={mod.monthly_price_adder}
                                                onBlur={(e) => handleUpdatePrice(mod.key, Number(e.target.value))}
                                                className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded text-right focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                            />
                                        </div>
                                        {saving === mod.key && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleModuleStatus(mod.key, mod.is_active)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${mod.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {mod.is_active ? 'Activo' : 'Inactivo'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}