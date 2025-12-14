import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { repo } = req.body;

    if (!repo) {
      return res.status(400).send("Missing repo URL");
    }

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: `Analyze this GitHub repository and explain what it does:\n${repo}`,
        },
      ],
    });

    // ✅ SAFE extraction
    const output =
      completion.choices?.[0]?.message?.content ||
      completion.choices?.[0]?.delta?.content;

    if (!output) {
      return res.status(500).send("No response from Groq");
    }

    res.status(200).send(output);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
}
