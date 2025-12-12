"use client";
import { useCallback, useState } from "react";
import { GeneratedUiImage } from "@/components/GeneratedUiImage";
import { GenerateUiImageButton } from "@/components/GenerateUiImageButton";

export default function UiAnalyzePage() {
  const [analysis, setAnalysis] = useState<any>(null);

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  /**
   * ファイル選択
   */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;

      setGenLoading(false);
      setGenError(null);
      setImgSrc(null);
      setAnalysis(null);

      try {
        const fd = new FormData();
        fd.append("file", f);

        const res = await fetch("/api/analyze-ui", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error ?? `analyze failed: ${res.status}`);
        }

        // 返却形式に合わせてどっちか
        // setAnalysis(json);
        setAnalysis(json.analysis ?? json);
      } catch (err: any) {
        setGenError(err?.message ?? "unknown");
        setAnalysis(null);
      } finally {
        // 同じファイルを選び直した時も onChange が発火するように
        e.target.value = "";
      }
    },
    []
  );

  /**
   * 生成
   */
  const handleGenerate = useCallback(async () => {
    if (!analysis) return;

    setGenLoading(true);
    setGenError(null);
    setImgSrc(null);

    try {
      const res = await fetch("/api/generate-ui-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, device: "desktop" }),
      });

      const json = await res.json();
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error ?? `generate failed: ${res.status}`);
      }

      setImgSrc(`data:${json.mime};base64,${json.imageBase64}`);
    } catch (err: any) {
      setGenError(err?.message ?? "unknown");
    } finally {
      setGenLoading(false);
    }
  }, [analysis]);

  return (
    <div style={{ padding: 16 }}>
      {/* 画像アップロード → UI解析 */}
      <input type="file" accept="image/*" onChange={handleFileChange} />

      {/* 生成ボタン（別コンポーネント） */}
      <GenerateUiImageButton
        disabled={!analysis}
        loading={genLoading}
        onClick={handleGenerate}
      />

      {/* 生成画像表示（別コンポーネント） */}
      <GeneratedUiImage
        title="生成結果"
        src={imgSrc}
        loading={genLoading}
        error={genError}
      />

      {/* デバッグ用 */}
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>
        {analysis ? JSON.stringify(analysis, null, 2) : ""}
      </pre>
    </div>
  );
}
