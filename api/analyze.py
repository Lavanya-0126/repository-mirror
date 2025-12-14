import json
import requests

def handler(request):
    try:
        body = request.json()
        repo_url = body.get("repo")

        if not repo_url:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "No repo URL provided"})
            }

        parts = repo_url.rstrip("/").split("/")
        owner, repo = parts[-2], parts[-1]

        api_url = f"https://api.github.com/repos/{owner}/{repo}"
        contents_url = f"{api_url}/contents"

        repo_res = requests.get(api_url)
        contents_res = requests.get(contents_url)

        if repo_res.status_code != 200:
            return {
                "statusCode": 404,
                "body": json.dumps({"error": "Repository not found"})
            }

        contents = contents_res.json()

        files = len(contents) if isinstance(contents, list) else 0
        has_readme = any("readme" in f["name"].lower() for f in contents if "name" in f)
        has_tests = any("test" in f["name"].lower() for f in contents if "name" in f)

        result = {
            "files": files,
            "has_readme": has_readme,
            "has_tests": has_tests
        }

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(result)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
