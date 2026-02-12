import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
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
    if (authError || !user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    const { data: organization } = await supabase
        .from('organizations')
        .select(`*, organization_modules (module_key, is_enabled)`)
        .eq('id', profile.organization_id)
        .single()

    if (!organization) redirect('/login')

    if (organization.status === 'suspended') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Cuenta Suspendida</h1>
                </div>
            </div>
        )
    }

    return (
        <ToastProvider>
            <DashboardProvider organization={organization} profile={profile} userRole={profile.role}>
                {/* CORRECCIÓN: Aseguramos h-screen y fondo gris para contraste */}
                <div className="flex h-screen w-full bg-slate-50 overflow-hidden">

                    <Sidebar />

                    <div className="flex-1 flex flex-col min-w-0 h-full relative">
                        <MobileHeader />

                        {/* CORRECCIÓN: Padding global para que el contenido no toque los bordes */}
                        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                            <div className="max-w-7xl mx-auto w-full space-y-6">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </DashboardProvider>
        </ToastProvider>
    )
}