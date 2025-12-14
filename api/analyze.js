export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "Repository URL is required" });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a GitHub repository analyzer. Always respond in valid JSON only."
          },
          {
            role: "user",
            content: `
Analyze this GitHub repository: ${repoUrl}

Return STRICT JSON in this format:
{
  "score": number (0-100),
  "summary": "short summary",
  "roadmap": ["point1", "point2", "point3"]
}
`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await groqRes.json();

    const content = data.choices[0].message.content;

    // Parse LLM JSON safely
    const parsed = JSON.parse(content);

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({
      error: "Analysis failed",
      details: error.message
    });
  }
}
