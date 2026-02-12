'use client'

import { Menu } from 'lucide-react'
import { useDashboard } from '@/app/dashboard/context/DashboardContext'
import CompanyLogo from './CompanyLogo'

// Ya no recibimos props complicadas, usamos el contexto
export default function MobileHeader() {
    const { toggleMobileMenu, organization } = useDashboard()

    return (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            {/* Botón Hamburguesa */}
            <button
                onClick={toggleMobileMenu}
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <Menu size={24} />
            </button>

            {/* Logo Central */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
                {organization && (
                    <CompanyLogo
                        name={organization.name}
                        url={organization.logo_url}
                    />
                )}
            </div>

            {/* Espaciador para equilibrar (o botón de perfil futuro) */}
            <div className="w-8"></div>
        </div>
    )
}