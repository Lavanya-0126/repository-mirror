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

    console.log("=== STEP 1: Extracting repo info ===");
    const parts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace('.git', '');

    if (!owner || !repo) {
      throw new Error('Invalid repository URL format');
    }

    console.log(`Owner: ${owner}, Repo: ${repo}`);

    console.log("=== STEP 2: Fetching GitHub data ===");
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    
    if (!repoResponse.ok) {
      const errorData = await repoResponse.json();
      console.error("GitHub API Error:", errorData);
      throw new Error(`Repository not found: ${errorData.message}`);
    }

    const repoData = await repoResponse.json();
    console.log("Repo data fetched successfully");

    // Fetch README
    let readmeContent = '';
    let hasReadme = false;
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        hasReadme = true;
        console.log("README found");
      }
    } catch (e) {
      console.log('No README found');
    }

    // Fetch commits
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`);
    const commits = commitsResponse.ok ? await commitsResponse.json() : [];
    console.log(`Fetched ${commits.length} commits`);

    // Fetch languages
    const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    const languages = languagesResponse.ok ? await languagesResponse.json() : {};
    console.log("Languages:", Object.keys(languages).join(', '));

    // Fetch contents
    const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
    const contents = contentsResponse.ok ? await contentsResponse.json() : [];

    console.log("=== STEP 3: Checking Groq API key ===");
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is not set in Vercel");
    }
    console.log("API key found:", GROQ_API_KEY.substring(0, 10) + "...");

    console.log("=== STEP 4: Preparing analysis prompt ===");
    const prompt = `Analyze this GitHub repository:

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

Root Files: ${contents.map(c => c.name).join(', ')}

Recent Commits (${commits.length}):
${commits.slice(0, 5).map(c => `- ${c.commit.message}`).join('\n')}

Evaluate this repository based on:
1. Documentation quality (README, comments)
2. Code organization and structure
3. Commit history quality
4. Project maintenance and activity
5. Best practices

Respond with ONLY this JSON format (no markdown, no code blocks):
{
  "score": <number 0-100>,
  "summary": "<1-2 sentence evaluation>",
  "roadmap": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;

    console.log("=== STEP 5: Calling Groq API ===");
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
              content: "You are a GitHub repository analyzer. Return ONLY valid JSON without markdown code blocks or explanations."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      }
    );

    console.log("Groq response status:", groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API Error:", errorText);
      throw new Error(`Groq API failed: ${groqResponse.status} - ${errorText}`);
    }

    const data = await groqResponse.json();
    console.log("Groq raw response:", JSON.stringify(data, null, 2));

    let text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      console.error("No content in Groq response:", data);
      throw new Error("No response from Groq - empty content");
    }

    console.log("Raw AI response:", text);

    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    console.log("Cleaned response:", text);

    console.log("=== STEP 6: Parsing JSON ===");
    const parsed = JSON.parse(text);
    
    // Validate structure
    if (typeof parsed.score !== 'number' || !parsed.summary || !Array.isArray(parsed.roadmap)) {
      throw new Error('Invalid response format from AI');
    }

    console.log("=== SUCCESS ===");
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("=== ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return res.status(200).json({
      score: 0,
      summary: `Analysis failed: ${error.message}`,
      roadmap: [
        "Check Vercel logs for detailed error",
        "Verify GROQ_API_KEY is set correctly",
        "Ensure repository is public and accessible"
      ]
    });
  }
}