export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { repo } = req.body;

  if (!repo) {
    return res.status(400).send("Missing repo URL");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "user",
            content: `Analyze this GitHub repository and give a score, summary, and roadmap:\n${repo}`
          }
        ]
      })
    });

    const data = await response.json();

    return res.status(200).send(data.choices[0].message.content);

  } catch (error) {
    return res.status(500).send(error.toString());
  }
}
