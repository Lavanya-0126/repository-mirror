import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: "repoUrl missing" });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: `
Analyze this GitHub repository.

Repo URL: ${repoUrl}

Return ONLY valid JSON in this format:
{
  "score": number,
  "summary": "short summary",
  "roadmap": ["step1","step2","step3"]
}
`
        }
      ],
    });

    const raw = completion.choices[0].message.content;
    const json = JSON.parse(raw);

    return res.status(200).json(json);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
