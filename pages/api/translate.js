export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { korean } = req.body;
  if (!korean) return res.status(400).json({ error: 'No text provided' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are an expert Korean-to-English translator and English teacher for an architecture student entering Harvard GSD's MDes program.

Translate the Korean journal entry below into natural, fluent English. The tone should be reflective, personal, and intellectually engaged — like a thoughtful graduate student's journal. Avoid overly formal or robotic language.

Then extract 7–10 key vocabulary items or phrases from your English translation that would be valuable for a Korean architecture student learning academic English.

Return ONLY a raw JSON object (no markdown fences, no explanation):
{
  "english": "full English translation",
  "vocabulary": [
    {
      "word": "word or phrase",
      "type": "noun | verb | adjective | adverb | phrase | expression",
      "meaning": "한국어 의미",
      "example": "example sentence from the translation",
      "note": "사용 팁이나 뉘앙스 (Korean)"
    }
  ]
}

Korean journal entry:
${korean}`
        }]
      })
    });

    const data = await response.json();

    // Log full response for debugging
    console.log('Anthropic response status:', response.status);
    console.log('Anthropic response body:', JSON.stringify(data));

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(500).json({ error: `Anthropic error: ${data?.error?.message || response.status}` });
    }

    if (!data.content?.[0]?.text) {
      console.error('No content in response:', data);
      return res.status(500).json({ error: 'No content returned' });
    }

    const raw = data.content[0].text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(raw);
    res.status(200).json(parsed);
  } catch (e) {
    console.error('Unexpected error:', e);
    res.status(500).json({ error: e.message });
  }
}
