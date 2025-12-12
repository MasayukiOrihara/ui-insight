"use client";
import { useState } from "react";

export default function UiAnalyzePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ padding: 16 }}>
      <input
        type="file"
        accept="image/*"
        disabled={loading}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;

          setLoading(true);
          setResult(null);

          const fd = new FormData();
          fd.append("file", f);

          const res = await fetch("/api/analyze-ui", {
            method: "POST",
            body: fd,
          });

          const json = await res.json();
          setResult(json);
          setLoading(false);
        }}
      />

      {loading && <p>解析中…</p>}

      {/* ▼ 生JSON（デバッグ用） */}
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>
        {result ? JSON.stringify(result, null, 2) : ""}
      </pre>
    </div>
  );
}
