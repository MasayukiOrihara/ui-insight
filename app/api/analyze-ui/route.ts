// app/api/analyze-ui/route.ts
import {
  ANALYZE_PROMPT,
  UI_ANALYZE_PROMPT,
} from "@/contents/prompts/analyze.prompt";
import OpenAI from "openai";

// OpenAIクライアントの初期化
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// edgeだとFormData/Buffer周りが面倒なことがある
export const runtime = "nodejs";

/**
 * 画像を受け取ってUI分析を行うAPIエンドポイント
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  try {
    console.log("1. 分析開始します...");

    const form = await req.formData();
    const file = form.get("file");
    // ガード
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "file is required" }), {
        status: 400,
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mime = file.type || "image/png";

    // const prompt = ANALYZE_PROMPT.trim();
    const prompt = UI_ANALYZE_PROMPT.trim();
    console.log("2. データ準備完了 !");

    console.log("3. LLM で処理を行います...");
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
              detail: "auto", // "low" | "high" | "auto"
            },
          ],
        },
      ],
    });
    console.log("4. 処理完了 !");

    const text = res.output_text; // 返ってきたテキスト（JSONのはず）

    console.log("5. 分析完了 !");
    console.log("text: \n" + text);
    return new Response(text, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error: any) {
    console.log("error", error?.message ?? "unknown");
    console.error(error);
  }
}
