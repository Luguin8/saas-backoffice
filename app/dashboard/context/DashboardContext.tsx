'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type OrganizationType = {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    organization_modules?: any[];
}

type ProfileType = {
    id: string;
    full_name: string;
    role: string;
    email?: string;
}

type DashboardContextType = {
    organization: OrganizationType | null;
    profile: ProfileType | null;
    showRealNumbers: boolean;
    togglePrivacy: () => void;
    canViewRealNumbers: boolean;
    // NUEVO: Estado del menú móvil
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({
    children,
    organization,
    profile,
    userRole
}: {
    children: ReactNode;
    organization: any;
    profile: any;
    userRole: string;
}) {
    const canViewRealNumbers = userRole === 'owner';
    const [showRealNumbers, setShowRealNumbers] = useState(false);

    // NUEVO: Estado del Sidebar Móvil
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const togglePrivacy = () => {
        if (canViewRealNumbers) setShowRealNumbers((prev) => !prev);
    };

    // NUEVAS FUNCIONES
    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <DashboardContext.Provider value={{
            organization,
            profile,
            showRealNumbers: canViewRealNumbers ? showRealNumbers : false,
            togglePrivacy,
            canViewRealNumbers,
            isMobileMenuOpen,
            toggleMobileMenu,
            closeMobileMenu
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard debe usarse dentro de un DashboardProvider');
    }
    return context;
};