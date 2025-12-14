export default async function handler(req, res) {
  const logs = [];
  
  try {
    logs.push("🔍 Step 1: Checking for GROQ_API_KEY...");
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return res.status(500).json({ 
        success: false,
        error: "GROQ_API_KEY not found",
        message: "Please add GROQ_API_KEY in Vercel Settings → Environment Variables",
        logs
      });
    }
    
    logs.push(`✅ API Key found: ${GROQ_API_KEY.substring(0, 15)}...`);
    logs.push("");
    logs.push("🔍 Step 2: Testing Groq API connection...");

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
              role: "user", 
              content: "Reply with exactly this JSON and nothing else: {\"status\": \"working\", \"message\": \"Groq is operational!\"}" 
            }
          ],
          temperature: 0.1,
          max_tokens: 100
        })
      }
    );

    logs.push(`Response Status: ${groqResponse.status} ${groqResponse.statusText}`);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      logs.push(`❌ Error Response: ${errorText}`);
      
      return res.status(500).json({
        success: false,
        error: "Groq API returned an error",
        statusCode: groqResponse.status,
        errorDetails: errorText,
        logs
      });
    }

    const data = await groqResponse.json();
    logs.push("✅ Groq API responded successfully!");
    logs.push("");
    logs.push("📦 Full Response:");
    logs.push(JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;
    logs.push("");
    logs.push("💬 AI Response:");
    logs.push(content);

    return res.status(200).json({
      success: true,
      message: "✅ Groq is working perfectly!",
      apiResponse: content,
      fullData: data,
      logs
    });

  } catch (error) {
    logs.push(`❌ Exception: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      logs
    });
  }
}