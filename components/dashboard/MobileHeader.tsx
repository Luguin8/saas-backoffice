'use client';

import { Menu } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

type Props = {
    onOpen: () => void;
    org: any;
};

export default function MobileHeader({ onOpen, org }: Props) {
    return (
        <div className="md:hidden flex items-center justify-between p-4 text-white border-b border-white/10 sticky top-0 z-40 bg-[var(--brand-primary)] shadow-md">
            <div className="flex items-center gap-3">
                <button
                    onClick={onOpen}
                    className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors active:bg-white/20"
                    aria-label="Abrir menú"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="h-8 flex items-center">
                    <CompanyLogo url={org.logo_url} name={org.name} />
                </div>
            </div>
        </div>
    );
}