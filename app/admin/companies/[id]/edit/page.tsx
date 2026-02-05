'use client';

import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Building, Loader2, ArrowLeft } from 'lucide-react';
import { fetchModules, uploadLogo, type Module } from '@/lib/services/companies';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Cliente para updates simples
const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
    // Desempaquetar params (Next.js 15+)
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modulesList, setModulesList] = useState<Module[]>([]);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);

    // Cargar Datos Iniciales
    useEffect(() => {
        const loadData = async () => {
            try {
                const [modulesData, { data: org, error }] = await Promise.all([
                    fetchModules(),
                    supabase.from('organizations').select(`*, organization_modules(module_key)`).eq('id', id).single()
                ]);

                if (error) throw error;

                setModulesList(modulesData);

                // Rellenar formulario
                setValue('name', org.name);
                setValue('slug', org.slug);
                setValue('maintenanceFee', org.base_maintenance_fee);
                setValue('primaryColor', org.primary_color);
                setValue('secondaryColor', org.secondary_color);
                setCurrentLogo(org.logo_url);

                // Marcar módulos activos
                if (org.organization_modules) {
                    org.organization_modules.forEach((om: any) => {
                        setValue(`modules.${om.module_key}`, true);
                    });
                }
            } catch (err) {
                alert('Error cargando empresa');
                router.push('/admin/companies');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, setValue, router]);

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            // 1. Subir nuevo logo si hay
            let logoUrl = currentLogo;
            if (data.logo && data.logo.length > 0) {
                logoUrl = await uploadLogo(data.logo[0], data.slug);
            }

            // 2. Update Organización
            const { error: orgError } = await supabase
                .from('organizations')
                .update({
                    name: data.name,
                    // slug: data.slug, // El slug mejor no tocarlo para no romper links
                    logo_url: logoUrl,
                    base_maintenance_fee: Number(data.maintenanceFee),
                    primary_color: data.primaryColor,
                    secondary_color: data.secondaryColor,
                })
                .eq('id', id);

            if (orgError) throw orgError;

            // 3. Update Módulos (Borrar todo e insertar nuevos - Estrategia simple)
            // Primero borramos
            await supabase.from('organization_modules').delete().eq('organization_id', id);

            // Luego insertamos los seleccionados
            const selectedModules = Object.entries(data.modules || {})
                .filter(([_, checked]) => checked)
                .map(([key]) => ({
                    organization_id: id,
                    module_key: key,
                    is_enabled: true
                }));

            if (selectedModules.length > 0) {
                const { error: modError } = await supabase.from('organization_modules').insert(selectedModules);
                if (modError) throw modError;
            }

            alert('Empresa actualizada correctamente');
            router.push('/admin/companies');
            router.refresh();

        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/companies" className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Editar Empresa</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
                            <input {...register('name')} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Mantenimiento ($)</label>
                            <input type="number" step="0.01" {...register('maintenanceFee')} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Color Primario</label>
                            <div className="flex items-center gap-2">
                                <input type="color" {...register('primaryColor')} className="h-10 w-20 border rounded cursor-pointer" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Color Secundario</label>
                            <div className="flex items-center gap-2">
                                <input type="color" {...register('secondaryColor')} className="h-10 w-20 border rounded cursor-pointer" />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Módulos Activos</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {modulesList.map(m => (
                                    <label key={m.key} className="flex items-center gap-2 p-3 border rounded hover:bg-slate-50">
                                        <input type="checkbox" {...register(`modules.${m.key}`)} className="rounded text-slate-900" />
                                        <span className="text-sm">{m.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button type="submit" disabled={saving} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}