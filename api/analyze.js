import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "Repository URL required" });
  }

  try {
    const prompt = `
Analyze the GitHub repository: ${repoUrl}

Return ONLY valid JSON in this exact format:
{
  "score": number,
  "summary": "short summary",
  "roadmap": ["point 1", "point 2", "point 3"]
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

    const groqData = await groqRes.json();
    const content = groqData.choices[0].message.content;

    const parsed = JSON.parse(content);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
