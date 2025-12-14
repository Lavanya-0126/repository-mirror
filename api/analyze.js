import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: "repoUrl is required" });
    }

    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `
You are an AI code reviewer.

Analyze this GitHub repository URL:

${repoUrl}

Return ONLY valid JSON in this exact format:

{
  "score": number,
  "summary": "short honest summary",
  "roadmap": [
    "step 1",
    "step 2",
    "step 3"
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content;

    const parsed = JSON.parse(raw); // VERY IMPORTANT

    return res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
