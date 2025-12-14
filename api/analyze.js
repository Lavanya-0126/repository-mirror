export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { repoUrl } = req.body;

    if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
      return res.status(400).json({
        score: 0,
        summary: "Invalid GitHub URL",
        roadmap: ["Enter a valid GitHub repository URL"]
      });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("Missing GROQ_API_KEY");
    }

    const prompt = `
Analyze this GitHub repository: ${repoUrl}

Return STRICT JSON ONLY in this format:
{
  "score": number (0-100),
  "summary": "short summary",
  "roadmap": ["point 1", "point 2", "point 3"]
}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3
        })
      }
    );

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty Groq response");

    const parsed = JSON.parse(content);

    return res.status(200).json(parsed);

  } catch (error) {
    console.error(error);
    return res.status(200).json({
      score: 0,
      summary: "Analysis failed",
      roadmap: ["Check API key", "Verify repo URL"]
    });
  }
}
