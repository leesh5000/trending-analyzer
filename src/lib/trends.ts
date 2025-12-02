import Parser from 'rss-parser';
import { TrendItem } from '@/types';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { calculateTrendScore } from './ranking';
import { getVideos, getRedditPosts } from './social';
// @ts-ignore
import googleTrends from 'google-trends-api';

const parser = new Parser();

export async function getDailyTrends(geo: string = 'US'): Promise<TrendItem[]> {
    // Map geo to language/region for Google News
    const lang = geo === 'KR' ? 'ko' : 'en';
    const region = geo === 'KR' ? 'KR' : 'US';
    const topic = 'h'; // Top Stories

    const url = `https://news.google.com/rss?topic=${topic}&hl=${lang}-${region}&gl=${region}&ceid=${region}:${lang}`;

    try {
        const feed = await parser.parseURL(url);
        const allItems = feed.items.slice(0, 50); // Process top 50 items

        // Extract keywords using AI for the top 20 items (to save tokens/time)
        // We will only re-rank the top 20 for performance
        const topSlice = allItems.slice(0, 20);
        const remainingSlice = allItems.slice(20);

        let keywords: string[] = [];
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            try {
                const { object } = await generateObject({
                    model: google('gemini-2.0-flash'),
                    schema: z.object({
                        keywords: z.array(z.string()).describe('List of extracted keywords corresponding to the headlines')
                    }),
                    prompt: `
            Extract the main topic/keyword (1-3 words) from each of these news headlines.
            Return them in the exact same order.
            
            Headlines:
            ${topSlice.map((item, i) => `${i + 1}. ${item.title}`).join('\n')}
          `,
                });
                keywords = object.keywords;
            } catch (e) {
                console.error('AI keyword extraction failed:', e);
            }
        }

        // Process top items with re-ranking in batches to avoid rate limits/timeouts
        const BATCH_SIZE = 5;
        const processedTopItems: TrendItem[] = [];

        for (let i = 0; i < topSlice.length; i += BATCH_SIZE) {
            const batch = topSlice.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(batch.map(async (item, batchIndex) => {
                const index = i + batchIndex;
                const aiKeyword = keywords[index];
                const originalTitle = item.title?.split(' - ')[0] || item.title || 'Unknown Trend';
                const finalQuery = aiKeyword || originalTitle;

                // Fetch Social & Video Stats for Ranking
                let socialCount = 0;
                let videoCount = 0;
                let searchInterest = 0;

                try {
                    const [videos, redditPosts] = await Promise.all([
                        getVideos(finalQuery).catch(() => []),
                        getRedditPosts(finalQuery).catch(() => [])
                    ]);
                    videoCount = videos.length;
                    // Estimate social count based on reddit posts score/comments (simplified)
                    socialCount = redditPosts.reduce((acc, post) => acc + (post.score || 0), 0);
                } catch (e) {
                    console.error(`Error fetching social stats for ${finalQuery}`, e);
                }

                // Try Google Trends API for Interest
                try {
                    // google-trends-api interestOverTime
                    const trendsData = await googleTrends.interestOverTime({ keyword: finalQuery, geo: region });
                    const parsedData = JSON.parse(trendsData);
                    if (parsedData.default && parsedData.default.timelineData && parsedData.default.timelineData.length > 0) {
                        // Get the most recent interest value (0-100)
                        const latestPoint = parsedData.default.timelineData[parsedData.default.timelineData.length - 1];
                        searchInterest = latestPoint.value[0] || 0;
                    }
                } catch (e) {
                    // console.warn(`Google Trends API failed for ${finalQuery}:`, e);
                    // Continue without search interest score
                }

                const rank = index + 1;
                const trendScore = calculateTrendScore(rank, socialCount, videoCount, searchInterest);

                return {
                    title: { query: finalQuery },
                    formattedTraffic: 'Trending Now',
                    relatedQueries: [],
                    articles: [{
                        title: item.title || '',
                        url: item.link || '',
                        source: item.contentSnippet || item.creator || 'Google News'
                    }],
                    shareUrl: item.link || '',
                    trendScore
                };
            }));
            processedTopItems.push(...batchResults);
        }

        // Sort top items by Trend Score
        processedTopItems.sort((a, b) => (b.trendScore?.total || 0) - (a.trendScore?.total || 0));

        // Process remaining items (simple mapping, no deep scoring)
        const processedRemainingItems = remainingSlice.map((item, index) => {
            const title = item.title?.split(' - ')[0] || item.title || 'Unknown Trend';
            return {
                title: { query: title },
                formattedTraffic: 'Trending Now',
                relatedQueries: [],
                articles: [{
                    title: item.title || '',
                    url: item.link || '',
                    source: item.contentSnippet || item.creator || 'Google News'
                }],
                shareUrl: item.link || '',
                // Base score only for remaining items
                trendScore: calculateTrendScore(20 + index + 1, 0, 0, 0)
            };
        });

        return [...processedTopItems, ...processedRemainingItems];

    } catch (error) {
        console.error('Error fetching trends from RSS:', error);
        return [];
    }
}
