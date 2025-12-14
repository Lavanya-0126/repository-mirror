from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def run_llm(repo_url, stats):
    prompt = f"""
You are an AI coding mentor.

Analyze the GitHub repository and produce:
1. Score out of 100
2. Short honest summary
3. Actionable improvement roadmap

Repository URL:
{repo_url}

Repository stats:
- Total files: {stats['files']}
- README present: {stats['has_readme']}
- Tests present: {stats['has_tests']}

Respond ONLY in valid JSON in this exact format:
{{
  "score": 0-100,
  "summary": "string",
  "roadmap": ["item1", "item2", "item3"]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content
