export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "Repository URL is required" });
  }

  // TEMP: Static analysis (later you can add GitHub API / AI)
  const analysis = {
    score: 85,
    summary: "Well-structured repository with good documentation and active maintenance.",
    roadmap: [
      "Add more automated tests",
      "Improve contributor guidelines",
      "Enhance CI/CD pipeline"
    ]
  };

  return res.status(200).json(analysis);
}
