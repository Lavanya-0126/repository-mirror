import json
from repo_analyzer import clone_repo, analyze_repo
from llm_analyzer import run_llm

def handler(request):
    body = json.loads(request.body)
    repo_url = body["repo_url"]

    path = clone_repo(repo_url)
    stats = analyze_repo(path)

    result = run_llm(repo_url, stats)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": result
    }
