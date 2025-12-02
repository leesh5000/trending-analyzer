import { TrendItem } from '@/types';

export interface TrendScore {
    total: number;
    breakdown: {
        newsRank: number;
        social: number;
        video: number;
        searchInterest: number;
    };
}

export function calculateTrendScore(
    rank: number,
    socialCount: number = 0,
    videoCount: number = 0,
    searchInterest: number = 0
): TrendScore {
    // 1. Base Score from News Rank (Max 50)
    // Rank 1 = 50, Rank 50 = 1
    const newsRankScore = Math.max(0, 51 - rank);

    // 2. Social Bonus (Disabled due to Reddit API blocking)
    const socialScore = 0;

    // 3. Video Bonus (Max 20)
    // Cap video count at 20 for max score
    const videoScore = Math.min(20, videoCount * 2);

    // 4. Search Interest Bonus (Max 20)
    // Normalized 0-100 interest from Google Trends
    const interestScore = Math.ceil(searchInterest / 5);

    const total = newsRankScore + socialScore + videoScore + interestScore;

    return {
        total,
        breakdown: {
            newsRank: newsRankScore,
            social: socialScore,
            video: videoScore,
            searchInterest: interestScore
        }
    };
}
