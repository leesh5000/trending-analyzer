// Native fetch is available in Node 18+

async function testReddit(query) {
    try {
        console.log(`Testing Reddit RSS search for: ${query}`);
        const res = await fetch(`https://www.reddit.com/search.rss?q=${encodeURIComponent(query)}&sort=relevance&limit=3`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.error('Reddit RSS Error:', res.status, res.statusText);
            return;
        }

        const text = await res.text();
        console.log('Response length:', text.length);
        if (text.includes('<rss') || text.includes('<feed')) {
            console.log('Success! Received RSS feed.');
        } else {
            console.log('Received response but not XML:', text.substring(0, 100));
        }
    } catch (error) {
        console.error('Error fetching Reddit posts:', error);
    }
}

testReddit('Korea');
