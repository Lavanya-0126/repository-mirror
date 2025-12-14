import json
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def handler(request, context):
    try:
        body = json.loads(request.body or "{}")
        repo = body.get("repo")

        if not repo:
            return {
                "statusCode": 400,
                "body": "Missing repo URL"
            }

        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze this GitHub repository:\n{repo}"
                }
            ]
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "text/plain"},
            "body": response.choices[0].message.content
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": str(e)
        }
