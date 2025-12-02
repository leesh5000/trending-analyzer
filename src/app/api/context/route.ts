import { NextResponse } from 'next/server';
import { getNews } from '@/lib/news';
import { getVideos, getRedditPosts } from '@/lib/social';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const geo = searchParams.get('geo') || 'US';

    if (!keyword) {
        return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    try {
        const [news, videos, social] = await Promise.all([
            getNews(keyword, geo),
            getVideos(keyword),
            getRedditPosts(keyword)
        ]);

        return NextResponse.json({ news, videos, social });
    } catch (error) {
        console.error('Context fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
    }
}

