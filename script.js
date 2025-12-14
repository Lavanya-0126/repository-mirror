function analyze() {
  const repoUrl = document.getElementById("repo").value;

  fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_url: repoUrl })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("output").innerHTML = `
      <h2>Score: ${data.score}/100</h2>
      <p><b>Summary:</b> ${data.summary}</p>
      <h3>Roadmap</h3>
      <ul>${data.roadmap.map(r => `<li>${r}</li>`).join("")}</ul>
    `;
  });
}
