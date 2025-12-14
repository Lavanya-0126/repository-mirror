export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { repoUrl } = req.body;

    if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
      return res.status(400).json({
        score: 0,
        summary: "Invalid GitHub URL",
        roadmap: ["Provide a valid GitHub repository URL"]
      });
    }

    const prompt = `
Analyze the GitHub repository: ${repoUrl}

Return ONLY valid JSON in this format:
{
  "score": number (0-100),
  "summary": "short summary",
  "roadmap": ["step 1", "step 2", "step 3"]
}
`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4
      })
    });

    const groqData = await groqRes.json();

    const text = groqData.choices?.[0]?.message?.content;

    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      score: 0,
      summary: "Analysis failed",
      roadmap: ["Check API key", "Verify repo URL"]
    });
  }
}
