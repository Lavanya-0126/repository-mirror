import json
import os
from repo_analyzer import analyze_repo
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")

def handler(request):
    if request.method != "POST":
        return {
            "statusCode": 405,
            "body": json.dumps({"error": "POST only"})
        }

    body = json.loads(request.body)
    repo_url = body.get("repo")

    stats = analyze_repo(repo_url)

    prompt = f"""
Analyze this GitHub repository.

Stats:
Files: {stats['files']}
README: {stats['has_readme']}
Tests: {stats['has_tests']}

Return JSON only:
{{
  "score": number,
  "summary": "short summary",
  "roadmap": ["step1","step2","step3"]
}}
"""

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    return {
        "statusCode": 200,
        "body": response.choices[0].message.content
    }
