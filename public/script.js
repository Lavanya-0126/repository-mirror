async function analyze() {
  const repo = document.getElementById("repo").value;

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo })
  });

  const text = await res.text();
  console.log(text); // <-- ADD THIS
  document.getElementById("result").innerText = text;
}
