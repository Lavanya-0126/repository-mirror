export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { repoUrl } = req.body;
    
    if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
      return res.status(400).json({
        score: 0,
        summary: "Invalid GitHub URL",
        roadmap: ["Provide a valid GitHub repository URL"]
      });
    }

    // Extract owner and repo from URL
    const parts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace('.git', '');

    if (!owner || !repo) {
      throw new Error('Invalid repository URL format');
    }

    // Fetch repository data from GitHub API
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    
    if (!repoResponse.ok) {
      throw new Error('Repository not found or is private');
    }

    const repoData = await repoResponse.json();

    // Fetch README
    let readmeContent = '';
    let hasReadme = false;
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        hasReadme = true;
      }
    } catch (e) {
      console.log('No README found');
    }

    // Fetch recent commits
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`);
    const commits = commitsResponse.ok ? await commitsResponse.json() : [];

    // Fetch languages
    const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    const languages = languagesResponse.ok ? await languagesResponse.json() : {};

    // Fetch repository contents
    const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
    const contents = contentsResponse.ok ? await contentsResponse.json() : [];

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("Missing GROQ_API_KEY");
    }

    // Create detailed analysis prompt
    const prompt = `Analyze this GitHub repository and provide a detailed assessment:

Repository Name: ${repoData.name}
Description: ${repoData.description || 'No description'}
Stars: ${repoData.stargazers_count}
Forks: ${repoData.forks_count}
Open Issues: ${repoData.open_issues_count}
License: ${repoData.license?.name || 'No license'}
Languages: ${Object.keys(languages).join(', ') || 'Unknown'}
Last Updated: ${repoData.updated_at}
Has README: ${hasReadme ? 'Yes' : 'No'}
README Preview: ${readmeContent.substring(0, 500)}

Root Files/Folders: ${contents.map(c => c.name).join(', ')}

Recent Commit Messages: ${commits.slice(0, 5).map(c => c.commit.message).join(' | ')}

Based on this information, analyze the repository quality considering:
- Code documentation (README quality, comments)
- Project structure and organization
- Commit message quality and consistency
- Activity and maintenance
- Best practices

Return ONLY valid JSON in this EXACT format (no markdown, no extra text):
{
  "score": <number between 0-100>,
  "summary": "<brief 1-2 sentence technical evaluation>",
  "roadmap": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
}`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are a code quality analyzer. Always return ONLY valid JSON without markdown code blocks."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      }
    );

    const data = await groqResponse.json();
    let text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      throw new Error("No response from Groq");
    }

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(text);
    
    // Validate the response structure
    if (typeof parsed.score !== 'number' || !parsed.summary || !Array.isArray(parsed.roadmap)) {
      throw new Error('Invalid response format from AI');
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("ANALYZE ERROR:", error.message);
    return res.status(200).json({
      score: 0,
      summary: "Analysis failed: " + error.message,
      roadmap: [
        "Check GROQ_API_KEY in Vercel environment variables",
        "Ensure repository is public",
        "Try a different repository URL"
      ]
    });
  }
}