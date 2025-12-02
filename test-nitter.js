const Parser = require('rss-parser');
const parser = new Parser();

async function testNitter() {
    const instances = [
        'https://nitter.net',
        'https://nitter.cz',
        'https://nitter.it',
        'https://nitter.privacydev.net'
    ];

    for (const instance of instances) {
        try {
            console.log(`Testing ${instance}...`);
            const feed = await parser.parseURL(`${instance}/search/rss?q=korea`);
            console.log(`Success! Found ${feed.items.length} items from ${instance}`);
            console.log('Sample:', feed.items[0].title);
            return; // Found a working one
        } catch (e) {
            console.log(`Failed ${instance}: ${e.message}`);
        }
    }
    console.log('All Nitter instances failed.');
}

testNitter();
