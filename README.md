An AI-powered tool that analyzes GitHub repositories and provides detailed quality assessments, scores, and actionable improvement roadmaps.

Features

🤖 AI-Powered Analysis - Uses Groq's LLaMA 3.3 70B model for intelligent repository evaluation
📊 Quality Scoring - Get a realistic score (0-100) based on multiple quality metrics
📝 Detailed Summary - Receive a concise technical evaluation of your repository
🗺️ Improvement Roadmap - Get specific, actionable recommendations to improve your project
🎨 Beautiful UI - Modern, responsive design with smooth animations
⚡ Fast Analysis - Results in seconds using GitHub API and Groq AI

 Demo
 https://repository-mirror-mnfc.vercel.app/

 Example Analysis
Input: https://github.com/pallets/flask
Output:
Score: 78/100
Summary: Well-established Python web framework with excellent documentation 
but some outdated dependencies and maintenance concerns.

Roadmap:
- Update dependencies to address security vulnerabilities
- Improve test coverage for edge cases
- Add more comprehensive examples in documentation

  Installation

Clone the repository

bash   git clone https://github.com/YOUR_USERNAME/repository-analyzer.git
   cd repository-analyzer

Install dependencies (if using Next.js framework)

bash   npm install

Set up environment variables
Create a .env.local file:

env   GROQ_API_KEY=your_groq_api_key_here

Get your Groq API key

Visit https://console.groq.com/
Sign up for a free account
Navigate to API Keys section
Generate a new key


Run locally (optional)

bash   vercel dev
Deploy to Vercel

Push to GitHub

bash   git add .
   git commit -m "Initial commit"
   git push origin main

Deploy on Vercel

Go to vercel.com
Import your GitHub repository
Add environment variable: GROQ_API_KEY
Deploy!



📁 Project Structure
repository-analyzer/
├── public/
│   └── index.html          # Main frontend interface
├── api/
│   ├── analyze.js          # Main analysis endpoint
│   └── test-groq.js        # API testing endpoint
├── README.md               # This file
└── vercel.json             # Vercel configuration (optional)
🔧 Configuration
Vercel Environment Variables
Add these in your Vercel project settings:
VariableDescriptionRequiredGROQ_API_KEYYour Groq API key from console.groq.com✅ Yes
API Endpoints
EndpointMethodDescription/api/analyzePOSTAnalyzes a GitHub repository/api/test-groqGETTests Groq API connection
📊 How It Works

User Input - Enter any public GitHub repository URL
Data Collection - Fetches repository metadata from GitHub API:

Stars, forks, issues, watchers
README content
Commit history
Programming languages
License information
Project structure


AI Analysis - Sends data to Groq's LLaMA model with strict scoring criteria
Results - Displays score, summary, and improvement roadmap

🎨 Technologies Used

Frontend: HTML5, CSS3,  JavaScript
Backend: Vercel Serverless Functions (Node.js)
AI Model: Groq LLaMA 3.3 70B Versatile
APIs: GitHub REST API v3, Groq API
Hosting: Vercel
Version Control: Git & GitHub

📈 Scoring Criteria
The analyzer evaluates repositories based on:
CategoryWeightCriteriaDocumentation25%README quality, length, clarity, examplesMaintenance20%Last update date, commit frequency, issue responseStructure20%Project organization, file structure, conventionsCommunity15%Stars, forks, contributors, engagementBest Practices15%License, CI/CD, tests, contributing guideCode Quality5%Commit message quality, language diversity
Score Ranges

90-100: World-class (React, Next.js, VS Code level) - VERY RARE
75-89: Professional, well-maintained with excellent docs
60-74: Good projects with decent structure
40-59: Basic projects with minimal documentation
20-39: Poor structure or outdated
0-19: Abandoned or severely lacking

🛠️ Development
Local Development
bash# Test the Groq API connection
curl https://your-app.vercel.app/api/test-groq

# Test analysis with curl
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/vercel/next.js"}'
Debugging
Check Vercel logs for detailed error messages:

Go to Vercel Dashboard
Select your project
Navigate to Deployments → Latest
Click on Functions → /api/analyze
View real-time logs


Groq for providing fast AI inference
GitHub API for repository data
Vercel for seamless deployment
Inspired by the need for automated code quality assessment
