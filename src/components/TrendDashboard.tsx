'use client';

import { useState, useEffect } from 'react';
import TrendCard from './TrendCard';
import { CountrySelector } from './CountrySelector';
import { DatePicker } from './DatePicker';
import { TrendItem } from '@/types';
import { Loader2, RefreshCw, History } from 'lucide-react';

export function TrendDashboard() {
    const [geo, setGeo] = useState('US');
    const [date, setDate] = useState<string>(''); // Empty string = Live mode
    const [trends, setTrends] = useState<TrendItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [visibleCount, setVisibleCount] = useState(15);

    const fetchTrends = async () => {
        setLoading(true);
        setTrends([]); // Clear previous trends while loading
        try {
            let url = `/api/trends?geo=${geo}`;
            if (date) {
                const timestamp = new Date(date).toISOString();
                url = `/api/history?timestamp=${timestamp}&geo=${geo}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (data.trends) {
                setTrends(data.trends);
                setLastUpdated(new Date());
                setVisibleCount(15);
            } else {
                setTrends([]);
            }
        } catch (error) {
            console.error('Failed to fetch trends', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        setVisibleCount(prev => Math.min(prev + 15, trends.length));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDate(e.target.value);
    };

    const clearDate = () => {
        setDate('');
    };

    useEffect(() => {
        fetchTrends();
    }, [geo, date]);

    const isHistoryMode = !!date;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                        {isHistoryMode ? 'Trend History' : 'Global Trends'}
                        {isHistoryMode && (
                            <span className="text-xs font-normal px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                                Archive
                            </span>
                        )}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        {isHistoryMode
                            ? `Viewing snapshot from ${new Date(date).toLocaleString()}`
                            : 'Real-time insights powered by AI'
                        }
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                    <CountrySelector value={geo} onChange={setGeo} />

                    <DatePicker
                        value={date}
                        onChange={setDate}
                        onClear={clearDate}
                    />

                    <button
                        onClick={fetchTrends}
                        disabled={loading}
                        className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
                        title="Refresh trends"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                    <Loader2 size={32} className="animate-spin mb-4" />
                    <p>{isHistoryMode ? 'Retrieving historical data...' : 'Analyzing global search patterns...'}</p>
                </div>
            ) : trends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                    <History size={48} className="mb-4 opacity-20" />
                    <p>No trends found for this time.</p>
                    {isHistoryMode && (
                        <button onClick={clearDate} className="mt-4 text-blue-500 hover:underline text-sm">
                            Return to Live Trends
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {trends.slice(0, visibleCount).map((trend, index) => (
                        <TrendCard
                            key={`${trend.title.query}-${index}`}
                            trend={trend}
                            rank={index + 1}
                            geo={geo}
                        />
                    ))}

                    {visibleCount < trends.length && (
                        <div className="pt-4 flex justify-center">
                            <button
                                onClick={loadMore}
                                className="px-6 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                            >
                                Load More ({trends.length - visibleCount} remaining)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {lastUpdated && !loading && !isHistoryMode && (
                <p className="text-center text-xs text-zinc-400 mt-8">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
            )}
        </div>
    );
}
