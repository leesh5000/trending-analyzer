import Parser from 'rss-parser';
import { NewsItem } from '@/types';

const parser = new Parser();

export async function getNews(query: string, geo: string = 'US'): Promise<NewsItem[]> {
    // Map geo to simple language/region codes for Google News
    // This is a simplification.
    const lang = geo === 'KR' ? 'ko' : 'en';
    const region = geo === 'KR' ? 'KR' : 'US';

    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}-${region}&gl=${region}&ceid=${region}:${lang}`;

    try {
        const feed = await parser.parseURL(url);
        return feed.items.slice(0, 5).map(item => ({
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate || '',
            source: item.contentSnippet || item.creator || 'Google News'
        }));
    } catch (error) {
        console.error('Error fetching news:', error);
        return [];
    }
}
