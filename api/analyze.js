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

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return res.status(500).json({
        score: 0,
        summary: "Missing API key",
        roadmap: ["Set GROQ_API_KEY in Vercel Environment Variables"]
      });
    }

    const prompt = `
Analyze the GitHub repository: ${repoUrl}

Return STRICT JSON in this format only:

{
  "score": number (0-100),
  "summary": "short summary",
  "roadmap": ["step 1", "step 2", "step 3"]
}
`;

    const groqResponse = await fetch(
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

    const groqData = await groqResponse.json();

    const content = groqData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from Groq");
    }

    const parsed = JSON.parse(content);

    return res.status(200).json(parsed);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      score: 0,
      summary: "Analysis failed",
      roadmap: ["Check API key", "Verify repo URL"]
    });
  }
}
