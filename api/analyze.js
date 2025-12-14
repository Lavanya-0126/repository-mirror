import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { repo } = req.body;

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "user",
          content: `
You are a senior GitHub repository reviewer.

Analyze this repository:
${repo}

Return ONLY this format:

Score: <0-100> / 100
Summary: <one short sentence>
Roadmap:
- <improvement 1>
- <improvement 2>
- <improvement 3>
          `,
        },
      ],
      temperature: 0.3,
    });

    res.status(200).json({
      result: completion.choices[0].message.content,
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
}
