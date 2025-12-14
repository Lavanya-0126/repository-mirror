export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { repoUrl } = req.body;

  const prompt = `
Analyze this GitHub repository: ${repoUrl}

Return STRICT JSON ONLY:
{
  "score": number (0-100),
  "summary": string,
  "roadmap": [string, string, string]
}
`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    })
  });

  const data = await groqRes.json();

  const text = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch {
    return res.status(500).json({
      score: 0,
      summary: "Failed to analyze repository",
      roadmap: []
    });
  }
}
