// app/api/analyze-ui/route.ts
import OpenAI from "openai";

export const runtime = "nodejs"; // edgeだとFormData/Buffer周りが面倒なことがある

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "file is required" }), { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mime = file.type || "image/png";

  const prompt = `
あなたはUI/UXレビュアーです。入力はアプリ画面のスクリーンショットです。
次のJSONだけを返してください（余計な文章禁止）。

{
  "screen_summary": "画面の目的を1文",
  "detected_elements": [
    {"type":"button|text|input|nav|icon|image|other","label":"見えている文言","position":"top/middle/bottom/left/right","notes":""}
  ],
  "issues": [
    {"severity":"high|medium|low","title":"","why":"","evidence":"画像上の根拠(見えている文言や配置)","fix":""}
  ],
  "copy_extraction": {
    "all_text": ["画面内の文言をできるだけ列挙"]
  }
}
`.trim();

  const res = await client.responses.create({
    model: "gpt-4.1-mini", // 例：コスト重視。品質重視なら上位モデルへ
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          {
            type: "input_image",
            image_url: `data:${mime};base64,${base64}`,
            detail: "auto", // ←これを足す（"low" | "high" | "auto"）
          },
        ],
      },
    ],
  });

  const text = res.output_text; // 返ってきたテキスト（JSONのはず）
  return new Response(text, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
