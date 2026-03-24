export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { korean, english } = req.body;
  if (!korean || !english) return res.status(400).json({ error: 'No text provided' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

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
          content: `You are a warm, encouraging writing mentor for 희규, a Korean architect preparing to study at Harvard GSD's MDes program. He is practicing English journal writing to improve his academic English before matriculating in Fall 2026.

Evaluate the English translation below and provide feedback. Then produce a fully revised final version incorporating all your suggestions.

Korean original:
${korean}

English translation:
${english}

Return ONLY a raw JSON object (no markdown fences, no explanation):
{
  "stars": <integer 1-5>,
  "comment": "2-3 sentence overall comment in Korean (따뜻하고 격려하는 톤으로). Mention what works well and the general quality.",
  "suggestions": [
    {
      "original": "a phrase or sentence from the English text that could be improved",
      "improved": "your improved version",
      "reason": "왜 이게 더 나은지 한국어로 짧게 설명"
    },
    {
      "original": "...",
      "improved": "...",
      "reason": "..."
    },
    {
      "original": "...",
      "improved": "...",
      "reason": "..."
    }
  ],
  "revised": "The complete final English text with ALL suggestions applied. This should read as a polished, natural, academic-quality journal entry. Same tone and content as the original, just refined."
}

Star rating guide:
5 = Excellent, natural and expressive, ready for GSD
4 = Good, minor improvements possible
3 = Decent, some awkward phrasing
2 = Needs work, frequent unnatural expressions
1 = Significant improvement needed`
        }]
      })
    });

    const data = await response.json();
    console.log('Anthropic feedback status:', response.status);

    if (!response.ok) {
      console.error('Anthropic API error:', JSON.stringify(data));
      return res.status(500).json({ error: `Anthropic error: ${data?.error?.message || response.status}` });
    }

    if (!data.content?.[0]?.text) {
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
