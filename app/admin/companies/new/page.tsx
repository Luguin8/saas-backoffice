'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Save, Building, Loader2, DollarSign, Palette } from 'lucide-react';
import { fetchModules, createOrganization, type Module } from '@/lib/services/companies';
import { useRouter } from 'next/navigation';

type FormValues = {
    name: string;
    slug: string;
    maintenanceFee: number;
    primaryColor: string;   // <--- Color Principal
    secondaryColor: string; // <--- Color Secundario
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
            maintenanceFee: 0,
            primaryColor: '#0f172a',  // Default: Slate-900 (Oscuro profesional)
            secondaryColor: '#3b82f6' // Default: Blue-500 (Azul vibrante)
        }
    });

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

    // Variables para previsualizar colores en tiempo real
    const primaryColor = watch('primaryColor');
    const secondaryColor = watch('secondaryColor');

    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        try {
            const selectedModuleKeys = Object.entries(data.modules || {})
                .filter(([_, isSelected]) => isSelected)
                .map(([key]) => key);

            await createOrganization({
                name: data.name,
                slug: data.slug,
                maintenanceFee: Number(data.maintenanceFee),
                primaryColor: data.primaryColor,
                secondaryColor: data.secondaryColor,
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
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8 border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Building className="w-6 h-6" />
                    Nueva Organización
                </h1>
                <p className="text-slate-500 mt-1">Configura la empresa, sus módulos y su identidad visual.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* COLUMNA IZQUIERDA: Datos Principales */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Datos Generales */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 text-slate-800">Identidad Corporativa</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Logotipo</label>
                                    <div className="flex flex-col gap-3">
                                        <div className="relative w-full aspect-video bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:bg-slate-100 transition-colors">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                    <span className="text-xs text-slate-500">Subir imagen</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" {...register('logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-1 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial</label>
                                        <input type="text" {...register('name', { required: true })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900" placeholder="Ej. AgroSistemas" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                                        <input type="text" {...register('slug')} readOnly className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-500 font-mono text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Personalización & Branding (NUEVO) */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Palette className="w-5 h-5 text-slate-700" />
                                <h2 className="text-lg font-semibold text-slate-800">Personalización & Branding</h2>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Define los colores que verá el cliente al entrar a su panel.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Color Principal (Sidebar / Fondos)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            {...register('primaryColor')}
                                            className="h-10 w-20 p-1 rounded border border-slate-300 cursor-pointer"
                                        />
                                        <div className="text-xs text-slate-500 font-mono">{primaryColor}</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Color Secundario (Botones / Acentos)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            {...register('secondaryColor')}
                                            className="h-10 w-20 p-1 rounded border border-slate-300 cursor-pointer"
                                        />
                                        <div className="text-xs text-slate-500 font-mono">{secondaryColor}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Pequeña Previsualización */}
                            <div className="mt-6 p-4 rounded-lg border border-slate-200">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Vista Previa Botón</span>
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded text-white font-medium text-sm shadow-sm transition-all"
                                    style={{ backgroundColor: secondaryColor }}
                                >
                                    Botón de Acción
                                </button>
                            </div>
                        </div>

                        {/* 3. Módulos */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 text-slate-800">Módulos Contratados</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {modulesList.map((module) => (
                                    <label key={module.key} className="flex items-start gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer transition-colors has-[:checked]:border-slate-400 has-[:checked]:bg-slate-50">
                                        <input type="checkbox" {...register(`modules.${module.key}`)} className="mt-1 w-4 h-4 text-slate-900 rounded border-gray-300 focus:ring-slate-900" />
                                        <div>
                                            <span className="text-sm font-medium text-slate-900 block capitalize">{module.name}</span>
                                            {(module.monthly_price_adder || 0) > 0 && (
                                                <span className="text-xs font-semibold text-emerald-600 block mt-1">+ ${module.monthly_price_adder} / mes</span>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* COLUMNA DERECHA: Costos y Resumen */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm sticky top-6">
                            <h2 className="text-lg font-semibold mb-4 text-slate-800">Facturación</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mantenimiento Base</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('maintenanceFee')}
                                            className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-500 focus:border-slate-500 text-right font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 text-right">Cobro mensual fijo.</p>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all shadow-md font-medium"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Crear Empresa
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}