import fetch from "node-fetch";

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

Return STRICT JSON in this format:
{
  "score": number (0-100),
  "summary": "short evaluation",
  "roadmap": ["point 1", "point 2", "point 3"]
}
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;

    res.status(200).json(JSON.parse(text));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
