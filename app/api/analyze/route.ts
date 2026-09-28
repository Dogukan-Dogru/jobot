import { NextRequest, NextResponse } from "next/server";
import { buildAnalysisSystemPrompt, runHeuristicAnalysis } from "@/lib/aiService";
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
      const fallback = runHeuristicAnalysis(job, profile);
      return NextResponse.json({ analysis: fallback });
    }

    const systemPrompt = buildAnalysisSystemPrompt(profile);
    const userPrompt = `Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Country: ${job.country}
Work Model: ${job.workModel}
Platform: ${job.platform}
Description:
${job.rawDescription}

Please perform the 10-step analysis and return strictly JSON.`;

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
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      });

      if (!res.ok) {
        console.warn("Gemini API error status:", res.status);
        return NextResponse.json({ analysis: runHeuristicAnalysis(job, profile) });
      }

      const geminiData = await res.json();
      const contentText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (contentText) {
        const parsed = JSON.parse(contentText);
        parsed.analyzedAt = new Date().toISOString();
        return NextResponse.json({ analysis: parsed });
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
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });

      if (!res.ok) {
        console.warn("OpenAI API error status:", res.status);
        return NextResponse.json({ analysis: runHeuristicAnalysis(job, profile) });
      }

      const openaiData = await res.json();
      const contentText = openaiData.choices?.[0]?.message?.content;
      if (contentText) {
        const parsed = JSON.parse(contentText);
        parsed.analyzedAt = new Date().toISOString();
        return NextResponse.json({ analysis: parsed });
      }
    }

    // Fallback if provider not matched or failed
    return NextResponse.json({ analysis: runHeuristicAnalysis(job, profile) });
  } catch (err: unknown) {
    console.error("Analysis API exception:", err);
    return NextResponse.json({ error: "Analysis failed", details: String(err) }, { status: 500 });
  }
}
