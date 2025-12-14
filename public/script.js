fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ repo: repoUrl })
})
.then(res => res.text())
.then(data => {
  output.innerText = data;
});
