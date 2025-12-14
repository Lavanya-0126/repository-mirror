export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "Repo URL required" });
  }

  const prompt = `
Analyze this GitHub repository: ${repoUrl}

Return ONLY JSON in this format:
{
  "score": number (0-100),
  "summary": string,
  "roadmap": [string, string, string]
}
`;

  try {
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
    const content = data.choices[0].message.content;

    const parsed = JSON.parse(content);
    res.status(200).json(parsed);

  } catch (err) {
    res.status(500).json({
      score: 0,
      summary: "Analysis failed",
      roadmap: ["Check API key", "Verify repo URL"]
    });
  }
}
