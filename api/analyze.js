export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { repoUrl } = req.body;

  if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
    return res.status(400).json({
      score: 0,
      summary: "Invalid GitHub URL",
      roadmap: ["Provide a valid GitHub repository URL"]
    });
  }

  try {
    const prompt = `
Analyze the GitHub repository at this URL:
${repoUrl}

Return ONLY valid JSON in this exact format:
{
  "score": number between 0 and 100,
  "summary": "short summary of the repository",
  "roadmap": ["improvement 1", "improvement 2", "improvement 3"]
}
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error("Invalid Groq response");
    }

    const text = data.choices[0].message.content;

    // Extract JSON safely
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("Analysis error:", error);

    return res.status(500).json({
      score: 0,
      summary: "Analysis failed",
      roadmap: [
        "Check GROQ_API_KEY in Vercel",
        "Ensure repository is public",
        "Try again later"
      ]
    });
  }
}
