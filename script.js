async function analyzeRepo() {
  const repo = document.getElementById("repo").value;

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo })
  });

  const data = await res.json();

  document.getElementById("output").innerText =
    JSON.stringify(data, null, 2);
}
