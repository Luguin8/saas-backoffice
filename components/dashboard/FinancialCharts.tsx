'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useDashboard } from '@/app/dashboard/context/DashboardContext';
import { formatMoney } from '@/lib/utils/format'; // <--- IMPORTAR

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FinancialCharts({ transactions }: { transactions: any[] }) {
    const { showRealNumbers } = useDashboard();

    const visibleData = transactions.filter(t => showRealNumbers || t.is_fiscal);

    const expensesByCategory: Record<string, number> = {};

    visibleData
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const catName = t.categories?.name || 'Otros';
            if (t.currency === 'ARS') {
                expensesByCategory[catName] = (expensesByCategory[catName] || 0) + Number(t.amount);
            }
        });

    const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

    const balanceData = [
        {
            name: 'Total',
            Ingresos: visibleData.filter(t => t.type === 'income' && t.currency === 'ARS').reduce((acc, curr) => acc + Number(curr.amount), 0),
            Egresos: visibleData.filter(t => t.type === 'expense' && t.currency === 'ARS').reduce((acc, curr) => acc + Number(curr.amount), 0),
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 w-full text-left">Gastos por Categoría (ARS)</h3>
                {pieData.length > 0 ? (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatMoney(Number(value), 'ARS')} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">Sin datos suficientes</div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Balance General (ARS)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={balanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: any) => formatMoney(Number(value), 'ARS')} />
                            <Legend />
                            <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Egresos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}