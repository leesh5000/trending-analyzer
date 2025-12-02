import { VideoItem, SocialItem } from '@/types';
// @ts-ignore
import youtubesearchapi from 'youtube-search-api';

export async function getVideos(query: string): Promise<VideoItem[]> {
    try {
        const data = await youtubesearchapi.GetListByKeyword(query, false, 3);
        if (data && data.items) {
            return data.items.map((item: any) => ({
                id: item.id,
                title: item.title,
                thumbnail: item.thumbnail && item.thumbnail.thumbnails ? item.thumbnail.thumbnails[0].url : '',
                channelTitle: item.channelTitle,
                link: `https://www.youtube.com/watch?v=${item.id}`
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
    }
}

export async function getRedditPosts(query: string): Promise<SocialItem[]> {
    // Reddit is blocking server IPs (403), so we disable automated fetching.
    // We provide a Quick Search link in the UI instead.
    return [];

    /* 
    try {
        const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=3`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TrendAnalyzer/1.0; +http://localhost:3000)'
            }
        });

        if (!res.ok) {
            console.error('Reddit API Error:', res.status, res.statusText);
            return [];
        }

        const data = await res.json();
        if (data.data && data.data.children) {
            return data.data.children.map((child: any) => ({
                title: child.data.title,
                link: `https://www.reddit.com${child.data.permalink}`,
                platform: 'Reddit',
                author: child.data.author,
                score: child.data.score
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching Reddit posts:', error);
        return [];
    }
    */
}
