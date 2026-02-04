'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Save, Building, Loader2, DollarSign, Palette, User, Mail } from 'lucide-react';
import { fetchModules, uploadLogo, type Module } from '@/lib/services/companies'; // Reusamos uploadLogo
import { createOrganizationAction } from '@/app/actions/create-organization'; // Importamos la acción nueva
import { useRouter } from 'next/navigation';

type FormValues = {
    name: string;
    slug: string;
    maintenanceFee: number;
    primaryColor: string;
    secondaryColor: string;
    logo: FileList;
    ownerEmail: string; // <--- NUEVO CAMPO
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
            primaryColor: '#0f172a',
            secondaryColor: '#3b82f6'
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

    const primaryColor = watch('primaryColor');
    const secondaryColor = watch('secondaryColor');

    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        try {
            // 1. Subir logo primero (Client Side)
            let logoUrl = null;
            if (data.logo && data.logo.length > 0) {
                logoUrl = await uploadLogo(data.logo[0], data.slug);
            }

            // 2. Preparar datos para el servidor
            const selectedModuleKeys = Object.entries(data.modules || {})
                .filter(([_, isSelected]) => isSelected)
                .map(([key]) => key);

            const payload = {
                name: data.name,
                slug: data.slug,
                maintenanceFee: Number(data.maintenanceFee),
                primaryColor: data.primaryColor,
                secondaryColor: data.secondaryColor,
                logoUrl: logoUrl, // Pasamos la URL ya subida
                selectedModules: selectedModuleKeys,
                ownerEmail: data.ownerEmail // <--- Pasamos el email
            };

            // 3. Llamar a la Server Action
            const result = await createOrganizationAction(payload);

            if (!result.success) throw new Error(result.message);

            alert('Organización y Dueño creados exitosamente');
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
                <p className="text-slate-500 mt-1">Configura empresa, branding y crea el usuario dueño.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* COLUMNA IZQUIERDA */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Identidad */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 text-slate-800">Identidad Corporativa</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Logo (igual que antes) */}
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Logotipo</label>
                                    <div className="relative w-full aspect-video bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:bg-slate-100">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-slate-400" />
                                        )}
                                        <input type="file" accept="image/*" {...register('logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                                <div className="col-span-1 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial</label>
                                        <input type="text" {...register('name', { required: true })} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Ej. AgroSistemas" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                                        <input type="text" {...register('slug')} readOnly className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NUEVO: Usuario Dueño */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-slate-900">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-5 h-5 text-slate-700" />
                                <h2 className="text-lg font-semibold text-slate-800">Usuario Administrador (Dueño)</h2>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Se creará un usuario automáticamente con este correo. La contraseña se generará y se mostrará en el listado de empresas.</p>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico del Dueño</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        {...register('ownerEmail', { required: "El correo es obligatorio" })}
                                        className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900"
                                        placeholder="dueño@empresa.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Branding (Igual que antes) */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2"><Palette className="w-5 h-5" /> Branding</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Color Principal</label>
                                    <div className="flex items-center gap-3">
                                        <input type="color" {...register('primaryColor')} className="h-10 w-20 p-1 rounded border cursor-pointer" />
                                        <div className="text-xs text-slate-500 font-mono">{primaryColor}</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Color Secundario</label>
                                    <div className="flex items-center gap-3">
                                        <input type="color" {...register('secondaryColor')} className="h-10 w-20 p-1 rounded border cursor-pointer" />
                                        <div className="text-xs text-slate-500 font-mono">{secondaryColor}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Módulos (Igual que antes) */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 text-slate-800">Módulos</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {modulesList.map((module) => (
                                    <label key={module.key} className="flex items-start gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
                                        <input type="checkbox" {...register(`modules.${module.key}`)} className="mt-1 w-4 h-4 text-slate-900 rounded focus:ring-slate-900" />
                                        <div>
                                            <span className="text-sm font-medium text-slate-900 block capitalize">{module.name}</span>
                                            {(module.monthly_price_adder || 0) > 0 && <span className="text-xs font-semibold text-emerald-600 block mt-1">+ ${module.monthly_price_adder}</span>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA (Submit) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm sticky top-6">
                            {/* ... Inputs de costo igual que antes ... */}
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mantenimiento Base</label>
                            <input type="number" step="0.01" {...register('maintenanceFee')} className="w-full px-3 py-2 border border-slate-300 rounded-md text-right font-mono mb-4" />

                            <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Crear Empresa y Usuario
                            </button>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}