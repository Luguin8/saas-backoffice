'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ArrowRightLeft,
    PieChart,
    Users,
    Settings,
    LogOut,
    CalendarDays
} from 'lucide-react'
import { useDashboard } from '@/app/dashboard/context/DashboardContext'
import CompanyLogo from './CompanyLogo'

export default function Sidebar() {
    const pathname = usePathname()
    const { organization, profile } = useDashboard()

    if (!organization) return null

    // Verificar módulos activos
    const modules = organization.organization_modules || []
    const stockModule = modules.find((m: any) => m.module_key === 'stock' && m.is_enabled)
    const turneroModule = modules.find((m: any) => m.module_key === 'turnero' && m.is_enabled)

    const menuItems = [
        {
            name: 'Panel Principal',
            href: '/dashboard',
            icon: LayoutDashboard,
            exact: true
        },
        {
            name: 'Movimientos',
            href: '/dashboard/movements',
            icon: ArrowRightLeft
        },
        {
            name: 'Reportes',
            href: '/dashboard/reports',
            icon: PieChart
        },
        {
            name: 'Equipo',
            href: '/dashboard/teams',
            icon: Users
        },
        {
            name: 'Configuración',
            href: '/admin/settings',
            icon: Settings
        }
    ]

    // Inyectar módulo de Turnos si está activo
    if (turneroModule) {
        // Insertamos después de Movimientos (índice 2)
        menuItems.splice(2, 0, {
            name: 'Turnos',
            href: '/dashboard/appointments',
            icon: CalendarDays
        })
    }

    // Lógica de Stock (si existiera en el futuro)
    if (stockModule) {
        // Lógica futura
    }

    return (
        <div className="h-full flex flex-col bg-white border-r border-slate-200 w-64">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-100">
                <CompanyLogo
                    name={organization.name}
                    url={organization.logo_url}
                // Eliminamos 'color' porque el componente CompanyLogo no lo usa
                />
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }
              `}
                        >
                            <item.icon
                                size={20}
                                className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}
                            />
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {profile?.full_name || 'Usuario'}
                        </p>
                        <p className="text-xs text-slate-500 truncate capitalize">
                            {profile?.role === 'owner' ? 'Dueño' : 'Equipo'}
                        </p>
                    </div>
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}