import { NextRequest, NextResponse } from "next/server";
import { buildApplicationPackagePrompt, runHeuristicGenerator } from "@/lib/aiService";
import { AppSettings, JobPosting, MasterProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { job, profile, settings }: { job: JobPosting; profile: MasterProfile; settings: AppSettings } = await req.json();

    if (!job || !profile) {
      return NextResponse.json({ error: "Missing job or profile" }, { status: 400 });
    }

    const apiKey = settings?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    const provider = settings?.aiProvider || "gemini";

    if (!apiKey || provider === "demo") {
      const fallback = runHeuristicGenerator(job, profile);
      return NextResponse.json({ package: fallback });
    }

    const promptText = buildApplicationPackagePrompt(job, profile);

    if (provider === "gemini") {
      const model = settings.modelName || "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: promptText }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3
          }
        })
      });

      if (!res.ok) {
        return NextResponse.json({ package: runHeuristicGenerator(job, profile) });
      }

      const geminiData = await res.json();
      const contentText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (contentText) {
        const parsed = JSON.parse(contentText);
        parsed.generatedAt = new Date().toISOString();
        return NextResponse.json({ package: parsed });
      }
    } else if (provider === "openai") {
      const model = settings.modelName || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          temperature: 0.3,
          messages: [
            { role: "system", content: "You are a specialized career document generator that outputs strictly valid JSON." },
            { role: "user", content: promptText }
          ]
        })
      });

      if (!res.ok) {
        return NextResponse.json({ package: runHeuristicGenerator(job, profile) });
      }

      const openaiData = await res.json();
      const contentText = openaiData.choices?.[0]?.message?.content;
      if (contentText) {
        const parsed = JSON.parse(contentText);
        parsed.generatedAt = new Date().toISOString();
        return NextResponse.json({ package: parsed });
      }
    }

    return NextResponse.json({ package: runHeuristicGenerator(job, profile) });
  } catch (err: unknown) {
    console.error("Generate API exception:", err);
    return NextResponse.json({ error: "Generation failed", details: String(err) }, { status: 500 });
  }
}
