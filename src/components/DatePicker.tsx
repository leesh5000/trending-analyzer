'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';

interface DatePickerProps {
    value: string; // ISO string
    onChange: (value: string) => void;
    onClear: () => void;
}

export function DatePicker({ value, onChange, onClear }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Internal state for manual selection
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedHour, setSelectedHour] = useState('00');

    useEffect(() => {
        if (value) {
            const d = new Date(value);
            setSelectedDate(d.toISOString().split('T')[0]);
            setSelectedHour(String(d.getHours()).padStart(2, '0'));
        } else {
            // Default to now if no value
            const now = new Date();
            setSelectedDate(now.toISOString().split('T')[0]);
            setSelectedHour(String(now.getHours()).padStart(2, '0'));
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleQuickSelect = (daysAgo: number) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);

        // If "Now" (daysAgo === 0), keep current hour but reset minutes/seconds
        // If past days, maybe default to same time or start of day? 
        // User request specifically for "Now" -> "current time minus minutes (on the hour)"
        // For others, let's keep it consistent or just reset minutes
        d.setMinutes(0, 0, 0);

        const iso = d.toISOString();
        onChange(iso);
        setIsOpen(false);
    };

    const handleApply = () => {
        if (!selectedDate) return;
        const d = new Date(`${selectedDate}T${selectedHour}:00:00`);
        onChange(d.toISOString());
        setIsOpen(false);
    };

    const formatDisplay = (iso: string) => {
        if (!iso) return 'Live Trends';
        return new Date(iso).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', hour12: true
        });
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={clsx(
                        "flex items-center gap-2 px-3 py-2 border rounded-lg shadow-sm transition-colors text-sm font-medium",
                        value
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                >
                    <Calendar size={16} className="shrink-0" />
                    <span className="whitespace-nowrap">{formatDisplay(value)}</span>
                    <ChevronDown size={14} className={clsx("transition-transform shrink-0", isOpen && "rotate-180")} />
                </button>

                {value && (
                    <button
                        onClick={onClear}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        title="Return to Live"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 z-50 w-72 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden p-4"
                    >
                        <div className="space-y-4">
                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleQuickSelect(0)} className="px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 transition-colors">
                                    Now
                                </button>
                                <button onClick={() => handleQuickSelect(1)} className="px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 transition-colors">
                                    Yesterday
                                </button>
                                <button onClick={() => handleQuickSelect(7)} className="px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 transition-colors">
                                    1 Week Ago
                                </button>
                                <button onClick={() => handleQuickSelect(30)} className="px-3 py-2 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 transition-colors">
                                    1 Month Ago
                                </button>
                            </div>

                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                            {/* Manual Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Custom Date</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800 border-none rounded-md text-sm px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="relative w-20">
                                        <select
                                            value={selectedHour}
                                            onChange={(e) => setSelectedHour(e.target.value)}
                                            className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800 border-none rounded-md text-sm pl-3 pr-8 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                                        >
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <option key={i} value={String(i).padStart(2, '0')}>
                                                    {String(i).padStart(2, '0')}:00
                                                </option>
                                            ))}
                                        </select>
                                        <Clock size={14} className="absolute right-2.5 top-2.5 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleApply}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
