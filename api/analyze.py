import json
import subprocess
import tempfile
import os
import openai

openai.api_key = os.environ.get("OPENAI_API_KEY")

def analyze_repo(repo_url):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, tmp],
            check=True
        )

        files = 0
        has_readme = False
        has_tests = False

        for root, dirs, filenames in os.walk(tmp):
            for f in filenames:
                files += 1
                if f.lower().startswith("readme"):
                    has_readme = True
                if "test" in f.lower():
                    has_tests = True

        return {
            "files": files,
            "has_readme": has_readme,
            "has_tests": has_tests
        }

def run_llm(repo_url, stats):
    prompt = f"""
You are an expert GitHub repository reviewer.

Analyze the repository and provide:
1. Score out of 100
2. Short honest summary
3. Actionable roadmap

Repo URL: {repo_url}
Stats:
- Files: {stats['files']}
- README: {stats['has_readme']}
- Tests: {stats['has_tests']}

Respond ONLY in JSON:
{{
  "score": number,
  "summary": "text",
  "roadmap": ["step1","step2","step3"]
}}
"""

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    return json.loads(response.choices[0].message.content)

def handler(request):
    try:
        body = json.loads(request["body"])
        repo_url = body["repo"]

        stats = analyze_repo(repo_url)
        llm_result = run_llm(repo_url, stats)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "repo": repo_url,
                "stats": stats,
                "analysis": llm_result
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
