'use client';

import { useDashboard } from '@/app/dashboard/context/DashboardContext';
import type { FinancialStats } from '@/app/actions/get-dashboard-stats';
import { Wallet, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCards({ stats }: { stats: FinancialStats }) {
    const { showRealNumbers } = useDashboard();

    // Función auxiliar para formatear moneda
    const formatMoney = (amount: number, currency: 'ARS' | 'USD') => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* TARJETA ARS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-500">PESOS (ARS)</span>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-slate-500 font-medium">Dinero en Caja</p>
                    <h2 className="text-3xl font-bold text-slate-900">
                        {showRealNumbers
                            ? formatMoney(stats.ars.realBalance, 'ARS')
                            : formatMoney(stats.ars.fiscalBalance, 'ARS')
                        }
                    </h2>

                    {/* Diferencia en Negro (Solo visible si el ojo está abierto y hay diferencia) */}
                    {showRealNumbers && (stats.ars.realBalance !== stats.ars.fiscalBalance) && (
                        <div className="mt-2 text-xs font-mono text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            Fiscal: {formatMoney(stats.ars.fiscalBalance, 'ARS')}
                            <span className="text-amber-500 font-bold ml-1">
                                (+{formatMoney(stats.ars.realBalance - stats.ars.fiscalBalance, 'ARS')} B)
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* TARJETA USD */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-500">DÓLARES (USD)</span>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-slate-500 font-medium">Dinero en Caja</p>
                    <h2 className="text-3xl font-bold text-slate-900">
                        {showRealNumbers
                            ? formatMoney(stats.usd.realBalance, 'USD')
                            : formatMoney(stats.usd.fiscalBalance, 'USD')
                        }
                    </h2>

                    {showRealNumbers && (stats.usd.realBalance !== stats.usd.fiscalBalance) && (
                        <div className="mt-2 text-xs font-mono text-slate-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            Fiscal: {formatMoney(stats.usd.fiscalBalance, 'USD')}
                            <span className="text-amber-500 font-bold ml-1">
                                (+{formatMoney(stats.usd.realBalance - stats.usd.fiscalBalance, 'USD')} B)
                            </span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}