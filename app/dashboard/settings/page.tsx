'use client'

import { useDashboard } from '@/app/dashboard/context/DashboardContext'
import { Save } from 'lucide-react'

export default function CompanySettingsPage() {
    const { organization } = useDashboard()

    if (!organization) return null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Configuración de Empresa</h1>
                <p className="text-slate-500">Administra la identidad de tu negocio</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Negocio</label>
                        <input
                            type="text"
                            defaultValue={organization.name}
                            className="w-full p-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50 cursor-not-allowed"
                            disabled
                            title="Contacta a soporte para cambiar el nombre legal"
                        />
                        <p className="text-xs text-slate-400 mt-1">Para cambiar el nombre, contacta a soporte.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Color Principal</label>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full border border-slate-200" style={{ backgroundColor: organization.primary_color || '#000' }}></div>
                                <span className="text-sm text-slate-600">{organization.primary_color}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                            <input
                                type="text"
                                defaultValue={organization.logo_url || ''}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <Save size={18} />
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}