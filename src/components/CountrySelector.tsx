'use client';

import { CustomDropdown } from './ui/CustomDropdown';

interface CountrySelectorProps {
    value: string;
    onChange: (value: string) => void;
}

const COUNTRIES = [
    { value: 'US', label: 'United States', icon: '🇺🇸' },
    { value: 'JP', label: 'Japan', icon: '🇯🇵' },
    { value: 'KR', label: 'South Korea', icon: '🇰🇷' },
    { value: 'CN', label: 'China', icon: '🇨🇳' },
    { value: 'TW', label: 'Taiwan', icon: '🇹🇼' },
];

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
    return (
        <CustomDropdown
            options={COUNTRIES.map(c => ({ ...c, icon: <span className="text-base">{c.icon}</span> }))}
            value={value}
            onChange={onChange}
            className="w-48"
        />
    );
}
