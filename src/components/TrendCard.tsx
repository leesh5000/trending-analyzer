'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ExternalLink, Youtube, MessageCircle, Search, Info, Loader2, Newspaper, Sparkles } from 'lucide-react';
import { TrendItem, NewsItem, VideoItem, SocialItem } from '@/types';

interface TrendCardProps {
    trend: TrendItem;
    rank: number;
    geo: string;
}

export default function TrendCard({ trend, rank, geo }: TrendCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    // @ts-ignore - mismatch in NewsItem type between RSS parser and our type
    const [news, setNews] = useState<NewsItem[]>(trend.articles || []);
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [social, setSocial] = useState<SocialItem[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleExpand = async () => {
        if (!isExpanded) {
            // Use pre-fetched summary if available
            if (trend.aiSummary && !summary) {
                setSummary(trend.aiSummary);
            }

            // Use pre-fetched videos/social if available
            const hasContext = (trend.videos && trend.videos.length > 0) || (trend.social && trend.social.length > 0);

            if (hasContext) {
                if (videos.length === 0 && trend.videos) setVideos(trend.videos);
                if (social.length === 0 && trend.social) setSocial(trend.social);
            }

            // Only fetch context if not already loaded AND we don't have pre-fetched data
            // Or if we don't have a summary yet (and no pre-fetched summary)
            if (!summary && !trend.aiSummary && !hasContext) {
                setLoading(true);
                try {
                    // Fetch context (news, videos, social)
                    const contextRes = await fetch(`/api/context?keyword=${encodeURIComponent(trend.title.query)}&geo=${geo}`);
                    const contextData = await contextRes.json();

                    // Fetch AI Summary
                    // Use the fetched headlines for better context
                    const headlines = contextData.news ? contextData.news.map((n: any) => n.title) : trend.articles.map(a => a.title);

                    const summaryRes = await fetch('/api/summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ keyword: trend.title.query, headlines, geo }),
                    });
                    const summaryData = await summaryRes.json();
                    setSummary(summaryData.summary || 'Could not generate summary.');

                    const fetchedNews = contextData.news || [];
                    setNews(fetchedNews);
                    setVideos(contextData.videos || []);
                    setSocial(contextData.social || []);
                } catch (error) {
                    console.error('Failed to load context', error);
                    setSummary('Failed to load insights.');
                } finally {
                    setLoading(false);
                }
            } else if (!hasContext && videos.length === 0) {
                // Even if we have summary, we might want to fetch videos/news lazily if not present
                // But for now, let's just rely on what we have or fetch silently
                setLoading(true);
                try {
                    const contextRes = await fetch(`/api/context?keyword=${encodeURIComponent(trend.title.query)}&geo=${geo}`);
                    const contextData = await contextRes.json();
                    setNews(contextData.news || []);
                    setVideos(contextData.videos || []);
                    setSocial(contextData.social || []);
                } catch (e) {
                    console.error("Failed to fetch extra context", e);
                } finally {
                    setLoading(false);
                }
            }
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <motion.div
            layout
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
        >
            <div
                onClick={toggleExpand}
                className={`p-4 cursor-pointer flex items-center gap-4 rounded-xl ${isExpanded ? 'rounded-b-none' : ''} transition-all`}
            >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300">
                    {rank}
                </div>

                <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {trend.title.query}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        <span>{trend.formattedTraffic}</span>
                        {trend.trendScore && (
                            <div className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium group relative">
                                <span>Score: {trend.trendScore.total}</span>
                                <Info size={12} />

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                    <div className="font-bold mb-2 border-b border-zinc-600 pb-1 text-zinc-100">Score Breakdown</div>
                                    <div className="flex justify-between items-center text-zinc-300">
                                        <span>Base Score:</span>
                                        <span className="font-mono text-white">{trend.trendScore.breakdown.newsRank ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-300">
                                        <span>Social:</span>
                                        <span className="font-mono text-white">+{trend.trendScore.breakdown.social ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-300">
                                        <span>Video:</span>
                                        <span className="font-mono text-white">+{trend.trendScore.breakdown.video ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-zinc-300">
                                        <span>Search:</span>
                                        <span className="font-mono text-white">+{trend.trendScore.breakdown.searchInterest ?? 0}</span>
                                    </div>
                                    <div className="mt-2 pt-1 border-t border-zinc-600 flex justify-between items-center font-bold text-white">
                                        <span>Total:</span>
                                        <span>{trend.trendScore.total}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 text-zinc-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden rounded-b-xl"
                    >
                        <div className="p-4 space-y-6">
                            {/* AI Summary Section */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/20">
                                <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                                    <Sparkles size={16} />
                                    <span className="text-sm font-medium">AI Insight</span>
                                </div>
                                {loading && !summary ? (
                                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                        <Loader2 size={14} className="animate-spin" />
                                        Analyzing trend...
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                        {summary}
                                    </p>
                                )}
                            </div>

                            {/* Videos Section */}
                            {videos.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3 text-zinc-500 dark:text-zinc-400">
                                        <Youtube size={16} />
                                        <span className="text-sm font-medium">Related Videos</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {videos.map((video) => (
                                            <a
                                                key={video.id}
                                                href={video.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group block"
                                            >
                                                <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden mb-2 relative">
                                                    {video.thumbnail ? (
                                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                            <Youtube size={24} />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        <div className="bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                            <Youtube size={16} className="text-white fill-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                    {video.title}
                                                </h4>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Social & News Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* News Column */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3 text-zinc-500 dark:text-zinc-400">
                                        <Newspaper size={16} />
                                        <span className="text-sm font-medium">News</span>
                                    </div>
                                    <div className="space-y-2">
                                        {loading && news.length === 0 ? (
                                            [1, 2].map(i => <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" />)
                                        ) : (
                                            news.slice(0, 3).map((item, idx) => (
                                                <a
                                                    key={idx}
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                                                >
                                                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                                                        {item.title}
                                                    </h4>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-zinc-500">{item.source}</span>
                                                        <ExternalLink size={12} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </a>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Social Column */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3 text-zinc-500 dark:text-zinc-400">
                                        <MessageCircle size={16} />
                                        <span className="text-sm font-medium">Social Buzz</span>
                                    </div>
                                    <div className="space-y-2">
                                        {loading && social.length === 0 ? (
                                            [1, 2].map(i => <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" />)
                                        ) : social.length > 0 ? (
                                            social.map((item, idx) => (
                                                <a
                                                    key={idx}
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors group"
                                                >
                                                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 line-clamp-2">
                                                        {item.title}
                                                    </h4>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                            {item.platform} • u/{item.author}
                                                        </span>
                                                        <ExternalLink size={12} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </a>
                                            ))
                                        ) : (
                                            <div className="text-sm text-zinc-400 italic p-2">No recent discussions found.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                <span className="text-xs font-medium text-zinc-500 py-1">Search on:</span>
                                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(trend.title.query)}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors">YouTube</a>
                                <a href={`https://www.reddit.com/search/?q=${encodeURIComponent(trend.title.query)}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 transition-colors">Reddit</a>
                                <a href={`https://twitter.com/search?q=${encodeURIComponent(trend.title.query)}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded-md bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/30 transition-colors">X (Twitter)</a>
                                <a href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(trend.title.query)}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded-md bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 dark:hover:bg-fuchsia-900/30 transition-colors">Instagram</a>
                                <a href={`https://www.threads.net/search?q=${encodeURIComponent(trend.title.query)}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded-md bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-colors">Threads</a>
                                <a href={`https://www.tiktok.com/search?q=${encodeURIComponent(trend.title.query)}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded-md bg-pink-50 text-pink-600 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:hover:bg-pink-900/30 transition-colors">TikTok</a>
                                <a href={`https://www.google.com/search?q=${encodeURIComponent(trend.title.query)}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors">Google</a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence >
        </motion.div >
    );
}
