const Parser = require('rss-parser');
const parser = new Parser();

async function testRSS() {
    console.log('Fetching RSS trends for US...');
    try {
        const feed = await parser.parseURL('https://trends.google.com/trends/trendingsearches/daily/rss?geo=US');
        console.log('Feed title:', feed.title);
        console.log('Item count:', feed.items.length);
        if (feed.items.length > 0) {
            console.log('First item:', feed.items[0]);
        }
    } catch (error) {
        console.error('Error fetching RSS:', error);
    }
}

testRSS();
