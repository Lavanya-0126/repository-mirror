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

    console.log("=== Analyzing repository:", repoUrl, "===");

    // Extract repo info
    const parts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace('.git', '');

    if (!owner || !repo) {
      throw new Error('Invalid repository URL format');
    }

    // Fetch GitHub data
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

    // Fetch commits
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`);
    const commits = commitsResponse.ok ? await commitsResponse.json() : [];

    // Fetch languages
    const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    const languages = languagesResponse.ok ? await languagesResponse.json() : {};

    // Fetch contents
    const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
    const contents = contentsResponse.ok ? await contentsResponse.json() : [];

    // Check for important files
    const fileNames = contents.map(c => c.name.toLowerCase());
    const hasTests = fileNames.some(f => f.includes('test') || f === '.github');
    const hasCI = fileNames.some(f => f === '.github' || f === '.travis.yml' || f === '.circleci');
    const hasContributing = fileNames.some(f => f === 'contributing.md' || f === 'contributing');
    const hasLicense = !!repoData.license;
    const hasDescription = !!repoData.description && repoData.description.length > 20;

    // Calculate last update days
    const lastUpdate = new Date(repoData.updated_at);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not set in environment variables");
    }

    // Create STRICT analysis prompt
    const prompt = `You are a STRICT GitHub repository quality analyzer. Be critical and realistic with scoring.

Repository Analysis:
- Name: ${repoData.name}
- Description: ${repoData.description || '❌ NO DESCRIPTION'}
- Stars: ${repoData.stargazers_count}
- Forks: ${repoData.forks_count}
- Open Issues: ${repoData.open_issues_count}
- Watchers: ${repoData.watchers_count}
- License: ${repoData.license?.name || '❌ NO LICENSE'}
- Languages: ${Object.keys(languages).join(', ') || 'Unknown'}
- Created: ${repoData.created_at}
- Last Updated: ${daysSinceUpdate} days ago
- Has README: ${hasReadme ? '✅ Yes (' + readmeContent.length + ' chars)' : '❌ NO'}
- Has Tests: ${hasTests ? '✅ Yes' : '❌ NO'}
- Has CI/CD: ${hasCI ? '✅ Yes' : '❌ NO'}
- Has Contributing Guide: ${hasContributing ? '✅ Yes' : '❌ NO'}
- Has Good Description: ${hasDescription ? '✅ Yes' : '❌ NO'}

Root Files: ${fileNames.slice(0, 20).join(', ')}

Recent Commits (last 5):
${commits.slice(0, 5).map(c => `- "${c.commit.message}"`).join('\n')}

SCORING RULES (BE STRICT):
- 90-100: World-class projects (React, Vue, Next.js level) - VERY RARE
- 75-89: Professional, well-maintained projects with excellent docs
- 60-74: Good projects with decent structure and some documentation
- 40-59: Basic projects with minimal documentation or maintenance issues
- 20-39: Poor structure, outdated, or minimal effort
- 0-19: Abandoned or severely lacking

DEDUCT POINTS FOR:
- No README or very short README (< 500 chars): -15 points
- No license: -10 points
- No description: -5 points
- No tests visible: -10 points
- No CI/CD: -5 points
- Updated > 180 days ago: -15 points
- Updated > 90 days ago: -8 points
- Open issues > 100: -10 points
- Poor commit messages (generic like "update", "fix"): -5 points
- < 10 stars and < 5 forks: -10 points

ADD POINTS FOR:
- Excellent README (> 2000 chars): +10 points
- Active maintenance (< 30 days): +10 points
- Good commit messages: +5 points
- Tests present: +10 points
- CI/CD setup: +5 points
- Contributing guide: +5 points
- High community engagement (stars > 1000): +10 points

Respond with ONLY valid JSON (no markdown):
{
  "score": <realistic number 0-100>,
  "summary": "<critical 1-2 sentence evaluation mentioning specific weaknesses or strengths>",
  "roadmap": ["<specific, actionable improvement>", "<another specific improvement>", "<third specific improvement>"]
}`;

    console.log("Calling Groq API with strict scoring...");

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a CRITICAL GitHub repository analyzer. Score strictly - most repos should get 40-70. Only exceptional projects deserve 80+. Return ONLY valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API Error:", errorText);
      throw new Error(`Groq API failed: ${groqResponse.status}`);
    }

    const data = await groqResponse.json();
    let text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      throw new Error("No response from Groq");
    }

    console.log("Raw AI response:", text);

    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(text);
    
    // Validate structure
    if (typeof parsed.score !== 'number' || !parsed.summary || !Array.isArray(parsed.roadmap)) {
      throw new Error('Invalid response format');
    }

    // Extra validation: cap unrealistic scores
    if (repoData.stargazers_count < 100 && parsed.score > 80) {
      parsed.score = Math.min(parsed.score, 75);
      console.log("Score capped due to low community engagement");
    }

    console.log("Analysis successful! Score:", parsed.score);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(200).json({
      score: 0,
      summary: `Analysis failed: ${error.message}`,
      roadmap: [
        "Verify GROQ_API_KEY is set in Vercel",
        "Ensure repository is public",
        "Check Vercel function logs for details"
      ]
    });
  }
}