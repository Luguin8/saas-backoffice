'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import TransactionModal from './TransactionModal';
import { useRouter } from 'next/navigation';

type Props = {
    categories: any[];
    payees: any[];
};

export default function ActionCenter({ categories, payees }: Props) {
    const router = useRouter();
    const [modalOpen, setModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');

    const openModal = (type: 'income' | 'expense') => {
        setTransactionType(type);
        setModalOpen(true);
    };

    const handleSuccess = () => {
        router.refresh();
    };

    return (
        <>
            {/* CAMBIO: grid-cols-1 en móvil (botones anchos), grid-cols-2 en tablet/pc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => openModal('income')}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all hover:shadow-md group active:scale-[0.98]"
                >
                    <div className="p-3 bg-emerald-200 rounded-full text-emerald-800 group-hover:scale-110 transition-transform shadow-sm">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-emerald-900 text-lg">Ingresar Dinero</span>
                </button>

                <button
                    onClick={() => openModal('expense')}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all hover:shadow-md group active:scale-[0.98]"
                >
                    <div className="p-3 bg-rose-200 rounded-full text-rose-800 group-hover:scale-110 transition-transform shadow-sm">
                        <Minus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-rose-900 text-lg">Retirar Dinero</span>
                </button>
            </div>

            <TransactionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                type={transactionType}
                categories={categories}
                payees={payees}
                onSuccess={handleSuccess}
            />
        </>
    );
}