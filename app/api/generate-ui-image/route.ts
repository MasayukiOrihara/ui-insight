import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Analysis = {
  screen_summary?: string;
  detected_elements?: {
    type: string;
    label: string;
    position?: string;
    notes?: string;
  }[];
  issues?: {
    severity: string;
    title: string;
    why?: string;
    evidence?: string;
    fix?: string;
  }[];
  copy_extraction?: { all_text?: string[] };
};

function pickTexts(analysis: Analysis) {
  const all = analysis.copy_extraction?.all_text ?? [];
  // 再現用途：全部突っ込むと破綻しやすいので “重要そうなもの”だけ残す
  const keywords = [
    "学習ロードマップ一覧",
    "新着お知らせ",
    "操作マニュアル",
    "ログアウト",
    "AI学習コンテンツ",
    "カリキュラム一覧",
    "学習を進める",
    "NEXT",
    "CodeMastar",
  ];

  const picked = all.filter((t) => keywords.some((k) => t.includes(k)));

  // お知らせ2件などは入れたいので、日付っぽいものも少し拾う
  const dates = all.filter((t) => /^\d{4}\/\d{2}\/\d{2}/.test(t)).slice(0, 2);

  return Array.from(new Set([...picked, ...dates])).slice(0, 30);
}

function buildReproPrompt(analysis: Analysis, device: "desktop" | "mobile") {
  const screenSummary = analysis.screen_summary ?? "";
  const elements = (analysis.detected_elements ?? []).slice(0, 25);
  const fixedTexts = pickTexts(analysis);

  // レイアウト指示は英語、日本語は“表示テキストとして固定”
  return `
You are generating a realistic UI screenshot mock.

Goal:
Reproduce the CURRENT UI as closely as possible (approximate). Do NOT redesign, do NOT improve.

Device:
${device === "desktop" ? "Desktop web app UI" : "Mobile web app UI"}

Screen summary (Japanese):
${screenSummary}

Layout guidance (from detected elements):
${elements
  .map(
    (e) =>
      `- ${e.type} "${e.label}" at ${e.position ?? "unknown"} (${
        e.notes ?? ""
      })`
  )
  .join("\n")}

Text constraints:
- All visible UI text must be in Japanese.
- Do NOT translate or paraphrase.
- Include these exact strings somewhere appropriate in the UI:
${fixedTexts.map((t) => `  - "${t}"`).join("\n")}

Style:
- Modern business SaaS dashboard
- Clean grid layout, readable typography, subtle shadows
- Keep it looking like a real product screenshot (not a wireframe)

Hard constraints:
- Single screen only
- No extra decorative illustrations
- No English UI text
- No “improved” version (reproduction mode)
`.trim();
}

async function callOpenAIImage({
  prompt,
  size,
}: {
  prompt: string;
  size: "1024x1024" | "1536x1024" | "1024x1536";
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  // 互換性重視で REST を直叩き（SDKバージョン差異で壊れにくい）
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // ここは環境に合わせて変更してください（例: "gpt-image-1" 等）
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
      prompt,
      // n: 1, // 複数候補が欲しければ増やす
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Image API error: ${res.status} ${text}`);
  }

  const json = (await res.json()) as any;
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned (b64_json missing)");
  return b64 as string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      analysis: Analysis;
      device?: "desktop" | "mobile";
    };

    const device = body.device ?? "desktop";
    const prompt = buildReproPrompt(body.analysis, device);

    // Desktopっぽい横長
    const size = device === "desktop" ? "1536x1024" : "1024x1536";

    const b64 = await callOpenAIImage({ prompt, size });

    return NextResponse.json({
      ok: true,
      imageBase64: b64,
      mime: "image/png",
      promptUsed: prompt, // デバッグ用（不要なら消してOK）
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
