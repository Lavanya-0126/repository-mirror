import requests

def analyze_repo(repo_url):
    parts = repo_url.rstrip("/").split("/")
    owner, repo = parts[-2], parts[-1]

    api_url = f"https://api.github.com/repos/{owner}/{repo}"

    repo_data = requests.get(api_url).json()
    contents = requests.get(api_url + "/contents").json()

    files = len(contents)
    has_readme = any("readme" in f["name"].lower() for f in contents)
    has_tests = any("test" in f["name"].lower() for f in contents)

    return {
        "files": files,
        "has_readme": has_readme,
        "has_tests": has_tests
    }
