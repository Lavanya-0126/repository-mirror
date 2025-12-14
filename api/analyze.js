import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { repo } = req.body;

    if (!repo) {
      return res.status(400).json({ error: "Repo URL is required" });
    }

    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "user",
          content: `Analyze this GitHub repository and explain what it does:\n${repo}`,
        },
      ],
    });

    // 🔐 SAFE ACCESS (this fixes your crash)
    const result =
      completion?.choices?.[0]?.message?.content ||
      "No analysis returned";

    return res.status(200).json({ result });

  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
}
