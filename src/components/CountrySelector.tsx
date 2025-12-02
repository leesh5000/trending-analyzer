'use client';

import { Globe } from 'lucide-react';

interface CountrySelectorProps {
    value: string;
    onChange: (value: string) => void;
}

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'KR', name: 'South Korea' },
    { code: 'JP', name: 'Japan' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
];

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
    return (
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Globe size={16} className="text-zinc-500" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
                {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                        {country.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
