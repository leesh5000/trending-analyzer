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

        // Extract keywords using AI for ALL items to ensure consistent formatting
        let keywords: string[] = [];
        let summaries: string[] = [];
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            try {
                const { object } = await generateObject({
                    model: google('gemini-2.0-flash'),
                    schema: z.object({
                        items: z.array(z.object({
                            keyword: z.string().describe('Extracted keyword'),
                            summary: z.string().describe('One sentence summary explaining why this is trending')
                        })).describe('List of extracted keywords and summaries')
                    }),
                    prompt: `
            Analyze these news headlines and extract:
            1. Main topic/keyword (1-3 words).
            2. A short, one-sentence summary explaining WHY it is trending (based on the headline).
            
            Return them in the exact same order.
            
            IMPORTANT:
            - ALWAYS translate the extracted keyword to KOREAN (Hangul).
            - ALWAYS translate the summary to KOREAN (Hangul).
            - Even if the source is English, Japanese, or Chinese, the output MUST be in Korean.
            
            Target Country: ${geo}
            
            Headlines:
            ${allItems.map((item: any, i: number) => `${i + 1}. ${item.title}`).join('\n')}
          `,
                });
                keywords = object.items.map(i => i.keyword);
                summaries = object.items.map(i => i.summary);
            } catch (e) {
                console.error('AI keyword extraction failed:', e);
            }
        }

        // Deduplicate and Group by Keyword
        // Algorithm:
        // 1. Iterate through all items and their AI-extracted keywords.
        // 2. Use a Map to group items by "Keyword".
        // 3. If a keyword repeats, merge the new article into the existing group (Aggregation).
        // 4. This ensures unique titles in the final list and consolidates related news.
        const uniqueItemsMap = new Map<string, {
            originalIndex: number;
            keyword: string;
            summary: string;
            rssItems: any[];
        }>();

        allItems.forEach((item, index) => {
            const keyword = keywords[index] || item.title?.split(' - ')[0] || item.title || 'Unknown Trend';
            const summary = summaries[index] || '';

            if (!uniqueItemsMap.has(keyword)) {
                uniqueItemsMap.set(keyword, {
                    originalIndex: index,
                    keyword,
                    summary,
                    rssItems: [item]
                });
            } else {
                uniqueItemsMap.get(keyword)?.rssItems.push(item);
            }
        });

        const uniqueTrendsList = Array.from(uniqueItemsMap.values());

        // Process UNIQUE items in batches
        const BATCH_SIZE = 5;
        const processedItems: TrendItem[] = [];

        for (let i = 0; i < uniqueTrendsList.length; i += BATCH_SIZE) {
            const batch = uniqueTrendsList.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(batch.map(async (group, batchIndex) => {
                const { keyword, summary, rssItems, originalIndex } = group;
                const finalQuery = keyword;

                // Fetch Social & Video Stats for Ranking (Only for top 20 unique items)
                // We use the index in the UNIQUE list to decide "Top Tier", preserving relative order
                const isTopTier = (i + batchIndex) < 20;

                let socialCount = 0;
                let videoCount = 0;
                let searchInterest = 0;

                let videos: any[] = [];
                let redditPosts: any[] = [];

                if (isTopTier) {
                    try {
                        const [v, r] = await Promise.all([
                            getVideos(finalQuery).catch(() => []),
                            getRedditPosts(finalQuery).catch(() => [])
                        ]);
                        videos = v;
                        redditPosts = r;
                        videoCount = videos.length;
                        socialCount = redditPosts.reduce((acc: any, post: any) => acc + (post.score || 0), 0);
                    } catch (e) {
                        console.error(`Error fetching social stats for ${finalQuery}`, e);
                    }

                    // Try Google Trends API for Interest
                    try {
                        const trendsData = await googleTrends.interestOverTime({ keyword: finalQuery, geo: region });
                        const parsedData = JSON.parse(trendsData);
                        if (parsedData.default && parsedData.default.timelineData && parsedData.default.timelineData.length > 0) {
                            const latestPoint = parsedData.default.timelineData[parsedData.default.timelineData.length - 1];
                            searchInterest = latestPoint.value[0] || 0;
                        }
                    } catch (e) {
                        // console.warn(`Google Trends API failed for ${finalQuery}:`, e);
                    }
                }

                // Calculate score
                // Use the original index as a proxy for "News Rank" since RSS feed is ordered by importance
                const rank = originalIndex + 1;
                const trendScore = calculateTrendScore(rank, socialCount, videoCount, searchInterest);

                return {
                    title: { query: finalQuery },
                    formattedTraffic: 'Trending Now',
                    relatedQueries: [],
                    // Map ALL aggregated RSS items to articles
                    articles: rssItems.map(item => ({
                        title: item.title || '',
                        url: item.link || '',
                        source: item.contentSnippet || item.creator || 'Google News'
                    })),
                    shareUrl: rssItems[0].link || '',
                    trendScore,
                    aiSummary: summary,
                    videos: isTopTier ? videos : [],
                    social: isTopTier ? redditPosts : []
                };
            }));
            processedItems.push(...batchResults);
        }

        // Sort by Trend Score (Top 20 might shuffle, others will likely stay in order of rank)
        processedItems.sort((a, b) => (b.trendScore?.total || 0) - (a.trendScore?.total || 0));

        return processedItems;

    } catch (error) {
        console.error('Error fetching trends from RSS:', error);
        return [];
    }
}
