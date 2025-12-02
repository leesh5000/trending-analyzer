import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { keyword, headlines, geo } = await request.json();

    if (!keyword || !headlines || !Array.isArray(headlines)) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
        return NextResponse.json({ summary: 'AI API Key not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to .env.local' });
    }

    // Force summary to be in Korean as per user request
    const targetLang = 'Korean';

    try {
        const prompt = `
      Keyword: ${keyword}
      Headlines:
      ${headlines.join('\n')}
      
      Based on these headlines, explain why "${keyword}" is trending right now.
      Provide a concise, one-sentence explanation in ${targetLang}.
    `;

        const { text } = await generateText({
            model: google('gemini-2.0-flash'),
            prompt: prompt,
        });

        return NextResponse.json({ summary: text });
    } catch (error) {
        console.error('AI generation error:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
