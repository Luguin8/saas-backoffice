'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
    LayoutDashboard,
    ArrowRightLeft,
    PieChart,
    Users,
    CalendarDays,
    X,
    LifeBuoy,
    LogOut
} from 'lucide-react'
import { useDashboard } from '@/app/dashboard/context/DashboardContext'
import CompanyLogo from './CompanyLogo'

export default function Sidebar() {
    const pathname = usePathname()
    const { organization, profile, isMobileMenuOpen, closeMobileMenu } = useDashboard()

    // Efecto para inyectar los colores de la marca en toda la web
    useEffect(() => {
        if (organization?.primary_color) {
            document.documentElement.style.setProperty('--brand-primary', organization.primary_color)
        }
        if (organization?.secondary_color) {
            document.documentElement.style.setProperty('--brand-secondary', organization.secondary_color)
        }
    }, [organization])

    if (!organization) return null

    // Color de fallback si no hay nada definido
    const primaryColor = organization.primary_color || '#0f172a'

    const modules = organization.organization_modules || []
    const turneroModule = modules.find((m: any) => m.module_key === 'turnero' && m.is_enabled)

    const menuItems = [
        { name: 'Panel Principal', href: '/dashboard', icon: LayoutDashboard, exact: true },
        { name: 'Movimientos', href: '/dashboard/movements', icon: ArrowRightLeft },
        { name: 'Reportes', href: '/dashboard/reports', icon: PieChart },
        { name: 'Equipo', href: '/dashboard/teams', icon: Users },
        // SECCIÓN DE CONFIGURACIÓN ELIMINADA
    ]

    if (turneroModule) {
        // Insertar Turnos en la posición correcta
        menuItems.splice(2, 0, { name: 'Turnos', href: '/dashboard/appointments', icon: CalendarDays })
    }

    return (
        <>
            {/* Overlay Móvil */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out flex flex-col
        md:translate-x-0 md:static md:h-full
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center h-20">
                    <CompanyLogo
                        name={organization.name}
                        url={organization.logo_url}
                    />
                    <button onClick={closeMobileMenu} className="md:hidden text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Navegación */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMobileMenu}
                                style={isActive ? { backgroundColor: primaryColor, color: 'white' } : {}}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
                  ${isActive
                                        ? 'shadow-md'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }
                `}
                            >
                                <item.icon
                                    size={20}
                                    className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}
                                    // Truco: si no está activo, al hacer hover el icono toma el color de la marca
                                    style={!isActive ? { color: 'inherit' } : {}}
                                />
                                <span className={!isActive ? "group-hover:text-slate-900" : ""}>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <a href="#" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 mb-4 px-2">
                        <LifeBuoy size={14} />
                        <span>Soporte Técnico</span>
                    </a>

                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-100 shadow-sm mb-3">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">
                                {profile?.role === 'owner' ? 'Dueño' : 'Equipo'}
                            </p>
                        </div>
                        <form action="/auth/signout" method="post">
                            <button type="submit" className="text-slate-400 hover:text-red-500 transition-colors" title="Cerrar Sesión">
                                <LogOut size={16} />
                            </button>
                        </form>
                    </div>

                    <div className="text-[10px] text-center text-slate-400 font-medium">
                        Powered by <span className="text-slate-600 font-bold">Cajix</span>
                    </div>
                </div>
            </div>
        </>
    )
}