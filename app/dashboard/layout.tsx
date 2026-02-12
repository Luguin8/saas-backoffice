import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server' // Usamos el cliente nuevo
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import { DashboardProvider } from './context/DashboardContext'
import { ToastProvider } from './context/ToastContext'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/login')
    }

    // Obtener perfil
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    // Obtener organización y SUS MÓDULOS
    const { data: organization } = await supabase
        .from('organizations')
        .select(`
      *,
      organization_modules (module_key, is_enabled)
    `)
        .eq('id', profile.organization_id)
        .single()

    if (!organization) {
        // Manejar caso sin organización si fuera necesario
        redirect('/login')
    }

    // Verificar estado
    if (organization.status === 'suspended') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Cuenta Suspendida</h1>
                    <p className="text-gray-600">Por favor contacte a soporte para regularizar su situación.</p>
                </div>
            </div>
        )
    }

    return (
        <ToastProvider>
            {/* AQUI PASAMOS LOS DATOS AL CONTEXTO */}
            <DashboardProvider
                organization={organization}
                profile={profile}
                userRole={profile.role}
            >
                <div className="flex h-screen bg-slate-50">
                    {/* Sidebar para Desktop */}
                    <div className="hidden md:block h-full">
                        <Sidebar />
                    </div>

                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        {/* Header Móvil */}
                        <MobileHeader
                            onOpen={() => { }} // MobileHeader maneja su propio estado o usa un sidebar sheet, pasamos función vacía por compatibilidad si es necesario
                            org={organization} // AQUI PASAMOS LA ORGANIZACIÓN QUE OBTUVIMOS ARRIBA
                        />
                        {/* Contenido Principal con Scroll */}
                        <main className="flex-1 overflow-y-auto">
                            {children}
                        </main>
                    </div>
                </div>
            </DashboardProvider>
        </ToastProvider>
    )
}