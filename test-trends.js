const googleTrends = require('google-trends-api');

async function testTrends() {
    console.log('Fetching trends for US...');
    try {
        const results = await googleTrends.dailyTrends({ geo: 'US' });
        console.log('Raw result length:', results.length);
        const data = JSON.parse(results);
        console.log('Parsed data keys:', Object.keys(data));
        if (data.default && data.default.trendingSearchesDays) {
            console.log('Trending days count:', data.default.trendingSearchesDays.length);
            if (data.default.trendingSearchesDays.length > 0) {
                console.log('First day trends count:', data.default.trendingSearchesDays[0].trendingSearches.length);
                console.log('Sample trend:', data.default.trendingSearchesDays[0].trendingSearches[0]);
            }
        } else {
            console.log('Unexpected structure:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Error fetching trends:', error);
    }
}

testTrends();
