'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Save, Building, Loader2, DollarSign } from 'lucide-react'; // Agregamos DollarSign
import { fetchModules, createOrganization, type Module } from '@/lib/services/companies';
import { useRouter } from 'next/navigation';

type FormValues = {
    name: string;
    slug: string;
    maintenanceFee: number; // <--- Nuevo campo
    logo: FileList;
    modules: Record<string, boolean>;
};

export default function NewCompanyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [modulesList, setModulesList] = useState<Module[]>([]);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
        defaultValues: {
            maintenanceFee: 0 // Valor por defecto
        }
    });

    // ... (Los useEffect de Cargar módulos, Slug y Logo se mantienen igual) ...
    // REPLICA AQUÍ EL useEffect DE CARGA Y DE SLUG QUE YA TIENES
    useEffect(() => {
        fetchModules().then(setModulesList).catch(console.error);
    }, []);

    const nameValue = watch('name');
    useEffect(() => {
        if (nameValue) {
            const autoSlug = nameValue.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
            setValue('slug', autoSlug);
        }
    }, [nameValue, setValue]);

    const logoFiles = watch('logo');
    useEffect(() => {
        if (logoFiles && logoFiles.length > 0) {
            setLogoPreview(URL.createObjectURL(logoFiles[0]));
        }
    }, [logoFiles]);
    // ... (Fin de lógica repetida) ...


    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        try {
            const selectedModuleKeys = Object.entries(data.modules || {})
                .filter(([_, isSelected]) => isSelected)
                .map(([key]) => key);

            await createOrganization({
                name: data.name,
                slug: data.slug,
                maintenanceFee: Number(data.maintenanceFee), // Asegurar que sea número
                logoFile: data.logo[0],
                selectedModules: selectedModuleKeys,
            });

            alert('Organización creada exitosamente');
            router.push('/admin/companies');
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-8 border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Building className="w-6 h-6" />
                    Nueva Organización
                </h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* Sección Identidad y Costos */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800">Datos Principales</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ... (Input de Logo se mantiene igual) ... */}
                        <div className="col-span-1">
                            {/* Pega aquí tu input de Logo existente */}
                            <label className="block text-sm font-medium text-slate-700 mb-2">Logotipo</label>
                            <input type="file" accept="image/*" {...register('logo')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100" />
                            {logoPreview && <img src={logoPreview} className="mt-2 h-20 w-auto rounded object-contain border" />}
                        </div>

                        <div className="col-span-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial</label>
                                <input type="text" {...register('name', { required: true })} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Ej. AgroSistemas" />
                            </div>

                            {/* NUEVO: Costo de Mantenimiento */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Costo Mantenimiento Base</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('maintenanceFee')}
                                        className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Costo fijo mensual a cobrar a este cliente.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                                <input type="text" {...register('slug')} readOnly className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección Módulos */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800">Módulos Contratados</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {modulesList.map((module) => (
                            <label key={module.key} className="flex items-start gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" {...register(`modules.${module.key}`)} className="mt-1 w-4 h-4 text-slate-900 rounded border-gray-300 focus:ring-slate-900" />
                                <div>
                                    <span className="text-sm font-medium text-slate-900 block capitalize">{module.name}</span>
                                    {module.description && <span className="text-xs text-slate-500 block">{module.description}</span>}
                                    {(module.monthly_price_adder || 0) > 0 && (
                                        <span className="text-xs font-semibold text-emerald-600 block mt-1">
                                            + ${module.monthly_price_adder} / mes
                                        </span>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Botones (Igual que antes) */}
                <div className="flex justify-end gap-4">
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50">
                        {loading ? 'Guardando...' : 'Crear Organización'}
                    </button>
                </div>
            </form>
        </div>
    );
}