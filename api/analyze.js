import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
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
Analyze the GitHub repository below.

Give output ONLY in this JSON format:

{
  "score": number,
  "summary": "short honest summary",
  "roadmap": ["step1","step2","step3"]
}

Repository:
${repoUrl}
          `,
        },
      ],
    });

    const text = completion.choices[0].message.content;
    const json = JSON.parse(text);

    return res.status(200).json(json);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
