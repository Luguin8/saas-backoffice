'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Save, Building, Loader2, CheckSquare, Square } from 'lucide-react';
import { fetchModules, createOrganization, type Module } from '@/lib/services/companies';
import { useRouter } from 'next/navigation';

// Definición del formulario para React Hook Form
type FormValues = {
    name: string;
    slug: string;
    logo: FileList;
    modules: Record<string, boolean>; // Mapeo key -> boolean
};

export default function NewCompanyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [modulesList, setModulesList] = useState<Module[]>([]);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Inicialización de RHF
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>();

    // Cargar módulos al iniciar
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchModules();
                setModulesList(data);
            } catch (error) {
                console.error("Error cargando módulos", error);
                alert("Error cargando catálogo de módulos");
            }
        };
        loadData();
    }, []);

    // Auto-generación de Slug
    const nameValue = watch('name');
    useEffect(() => {
        if (nameValue) {
            const autoSlug = nameValue
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue('slug', autoSlug);
        }
    }, [nameValue, setValue]);

    // Manejo de preview de imagen
    const logoFiles = watch('logo');
    useEffect(() => {
        if (logoFiles && logoFiles.length > 0) {
            const file = logoFiles[0];
            const url = URL.createObjectURL(file);
            setLogoPreview(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [logoFiles]);

    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        try {
            // Transformar el objeto de módulos { stock: true, finance: false } a array ['stock']
            const selectedModuleKeys = Object.entries(data.modules || {})
                .filter(([_, isSelected]) => isSelected)
                .map(([key]) => key);

            await createOrganization({
                name: data.name,
                slug: data.slug,
                logoFile: data.logo[0], // Puede ser undefined
                selectedModules: selectedModuleKeys,
            });

            alert('Organización creada exitosamente');
            router.push('/admin/companies'); // Redirigir (ajusta según tu ruta real)

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
                <p className="text-slate-500 mt-1">Da de alta una nueva empresa cliente en el sistema.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* Sección 1: Datos Generales */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800">Identidad Corporativa</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo Upload */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Logotipo</label>
                            <div className="flex items-center gap-4">
                                <div className="relative w-24 h-24 bg-slate-100 rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-slate-400" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        {...register('logo')}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <div className="text-xs text-slate-500">
                                    <p>Click para subir imagen.</p>
                                    <p>Max 2MB. PNG, JPG.</p>
                                </div>
                            </div>
                        </div>

                        {/* Nombre y Slug */}
                        <div className="col-span-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial</label>
                                <input
                                    type="text"
                                    {...register('name', { required: "El nombre es obligatorio" })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                                    placeholder="Ej. AgroSistemas S.A."
                                />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                                <input
                                    type="text"
                                    {...register('slug', { required: "El slug es obligatorio" })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-600 font-mono text-sm"
                                />
                                {errors.slug && <span className="text-red-500 text-xs">{errors.slug.message}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección 2: Módulos */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800">Asignación de Módulos</h2>
                    <p className="text-sm text-slate-500 mb-4">Selecciona los módulos a los que esta empresa tendrá acceso.</p>

                    {modulesList.length === 0 ? (
                        <div className="text-center py-4 text-slate-400">Cargando módulos...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {modulesList.map((module) => (
                                <label
                                    key={module.key}
                                    className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        {...register(`modules.${module.key}`)}
                                        className="w-4 h-4 text-slate-600 rounded focus:ring-slate-500 border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-slate-700 capitalize">
                                        {module.name.replace(/_/g, ' ')}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Crear Organización
                    </button>
                </div>

            </form>
        </div>
    );
}