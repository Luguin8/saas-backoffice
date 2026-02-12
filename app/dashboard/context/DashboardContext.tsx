'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Definimos tipos flexibles para no pelear con TypeScript ahora
type OrganizationType = {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    organization_modules?: any[]; // Importante para detectar el turnero
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
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({
    children,
    organization,
    profile,
    userRole
}: {
    children: ReactNode;
    organization: any; // Recibimos la data desde el layout
    profile: any;      // Recibimos la data desde el layout
    userRole: string;
}) {
    // Solo el owner puede ver números reales
    const canViewRealNumbers = userRole === 'owner';
    const [showRealNumbers, setShowRealNumbers] = useState(false);

    const togglePrivacy = () => {
        if (canViewRealNumbers) {
            setShowRealNumbers((prev) => !prev);
        }
    };

    return (
        <DashboardContext.Provider value={{
            organization,
            profile,
            showRealNumbers: canViewRealNumbers ? showRealNumbers : false,
            togglePrivacy,
            canViewRealNumbers
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