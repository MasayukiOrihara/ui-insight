"use client";
import { useState } from "react";

export default function UiAnalyzePage() {
  const [result, setResult] = useState<any>(null);

  return (
    <div style={{ padding: 16 }}>
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const fd = new FormData();
          fd.append("file", f);

          const res = await fetch("/api/analyze-ui", { method: "POST", body: fd });
          const json = await res.json();
          setResult(json);
        }}
      />
      <pre style={{ whiteSpace: "pre-wrap" }}>{result ? JSON.stringify(result, null, 2) : ""}</pre>
    </div>
  );
}
