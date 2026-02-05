'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';
import { useDashboard } from '@/app/dashboard/context/DashboardContext';

export default function PrivacyToggle() {
    const { showRealNumbers, togglePrivacy, canViewRealNumbers } = useDashboard();

    if (!canViewRealNumbers) {
        // Si no es dueño, mostramos un candado o nada.
        return (
            <div className="flex items-center gap-2 text-slate-400 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium cursor-not-allowed" title="Solo el dueño puede ver la caja real">
                <Lock className="w-3 h-3" />
                <span>Vista Fiscal</span>
            </div>
        );
    }

    return (
        <button
            onClick={togglePrivacy}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border
        ${showRealNumbers
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
        >
            {showRealNumbers ? (
                <>
                    <Eye className="w-4 h-4" />
                    <span>Modo Real (Visible)</span>
                </>
            ) : (
                <>
                    <EyeOff className="w-4 h-4" />
                    <span>Modo Fiscal (Privado)</span>
                </>
            )}
        </button>
    );
}