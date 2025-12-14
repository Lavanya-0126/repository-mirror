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

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not set in environment variables");
    }

    // Create analysis prompt
    const prompt = `Analyze this GitHub repository and provide a quality assessment:

Repository: ${repoData.name}
Description: ${repoData.description || 'No description'}
Stars: ${repoData.stargazers_count}
Forks: ${repoData.forks_count}
Open Issues: ${repoData.open_issues_count}
License: ${repoData.license?.name || 'No license'}
Languages: ${Object.keys(languages).join(', ') || 'Unknown'}
Created: ${repoData.created_at}
Last Updated: ${repoData.updated_at}
Has README: ${hasReadme ? 'Yes' : 'No'}
README Length: ${readmeContent.length} characters

Root Files/Folders: ${contents.map(c => c.name).slice(0, 15).join(', ')}

Recent Commit Messages:
${commits.slice(0, 5).map(c => `- ${c.commit.message}`).join('\n')}

Evaluate based on:
- Documentation quality (README, code comments)
- Project structure and organization  
- Commit history and maintenance
- Community engagement (stars, forks, issues)
- Best practices and standards

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "score": <number 0-100>,
  "summary": "<1-2 sentence technical evaluation>",
  "roadmap": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
}`;

    console.log("Calling Groq API...");

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // ✅ UPDATED MODEL
          messages: [
            {
              role: "system",
              content: "You are a GitHub repository analyzer. Always return ONLY valid JSON without markdown code blocks."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API Error:", errorText);
      throw new Error(`Groq API failed: ${groqResponse.status} - ${errorText}`);
    }

    const data = await groqResponse.json();
    let text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      throw new Error("No response from Groq");
    }

    console.log("Raw AI response:", text);

    // Clean up response - remove markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(text);
    
    // Validate structure
    if (typeof parsed.score !== 'number' || !parsed.summary || !Array.isArray(parsed.roadmap)) {
      throw new Error('Invalid response format');
    }

    console.log("Analysis successful!");
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