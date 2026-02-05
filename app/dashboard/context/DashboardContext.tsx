'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type DashboardContextType = {
    showRealNumbers: boolean;
    togglePrivacy: () => void;
    canViewRealNumbers: boolean; // Para saber si tiene permiso de ver el botón
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({
    children,
    userRole
}: {
    children: ReactNode;
    userRole: string
}) {
    // Solo el owner puede ver números reales.
    // Por defecto arranca en false (Cerrado) por privacidad.
    const canViewRealNumbers = userRole === 'owner';
    const [showRealNumbers, setShowRealNumbers] = useState(false);

    const togglePrivacy = () => {
        if (canViewRealNumbers) {
            setShowRealNumbers((prev) => !prev);
        }
    };

    return (
        <DashboardContext.Provider value={{
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