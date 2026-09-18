import { analyzeQuestion, type AnalyzeResult } from "@/lib/demo";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let question = "";
  try {
    const body = (await request.json()) as { question?: string };
    question = body.question ?? "";
  } catch {
    return NextResponse.json(
      { error: "Send JSON { question: string }." },
      { status: 400 }
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 650));
  const result: AnalyzeResult = analyzeQuestion(question);
  return NextResponse.json(result);
}
