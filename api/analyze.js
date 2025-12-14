import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { repo } = req.body;

    if (!repo) {
      return res.status(400).json({ error: "Repo URL required" });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a strict code reviewer. Respond ONLY in JSON with keys: score (number), summary (string), roadmap (array of 3 strings).",
        },
        {
          role: "user",
          content: `Analyze this GitHub repository:\n${repo}`,
        },
      ],
    });

    const raw = completion.choices[0].message.content;

    // Parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: "Invalid AI response", raw });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
