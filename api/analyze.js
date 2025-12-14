import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  try {
    // 1️⃣ Allow only POST
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    // 2️⃣ Read body
    const { repo } = req.body;

    if (!repo) {
      return res.status(400).send("Missing repo URL");
    }

    // 3️⃣ Call Groq
    const chatCompletion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: `Analyze this GitHub repository and explain what it does:\n${repo}`,
        },
      ],
    });

    // 4️⃣ Send response
    res.status(200).send(chatCompletion.choices[0].message.content);

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error: " + error.message);
  }
}
