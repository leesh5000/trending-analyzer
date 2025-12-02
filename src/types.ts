export interface TrendItem {
    title: { query: string };
    formattedTraffic: string;
    relatedQueries: { query: string }[];
    articles: { title: string; url: string; source: string }[];
    shareUrl: string;
    trendScore?: {
        total: number;
        breakdown: {
            newsRank: number;
            social: number;
            video: number;
            searchInterest: number;
        };
    };
}

export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
}

export interface VideoItem {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    link: string;
}

export interface SocialItem {
    title: string;
    link: string;
    platform: 'Reddit' | 'Twitter' | 'TikTok';
    author?: string;
    score?: number;
}
