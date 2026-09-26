import { createAPIFileRoute } from "@tanstack/start/api";

// Dynamic import to avoid crashing in non-Node environments
async function getGroq() {
  const { Groq } = await import("groq-sdk");
  const apiKey = (process.env as any).GROQ_API_KEY ?? (globalThis as any).GROQ_API_KEY ?? "";
  return new Groq({ apiKey });
}

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // @ts-ignore
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const data = await pdfParse(buffer);
    return data.text ?? "";
  } catch (e) {
    console.error("[analyze-document] PDF parse failed:", e);
    return "Document text unreadable, analyze metadata only.";
  }
}

function cleanJsonResponse(raw: string): string {
  // Strip markdown code fences and trim
  return raw.replace(/```(?:json)?|```/g, "").trim();
}

export const APIRoute = createAPIFileRoute("/api/analyze-document")({
  POST: async ({ request }: { request: Request }) => {
    try {
      // ── Safe FormData extraction ─────────────────────────────────────────
      let file: File | null = null;
      try {
        const formData = await request.formData();
        file = formData.get("file") as File | null;
      } catch (fdErr) {
        console.error("[analyze-document] FormData parse error:", fdErr);
        return new Response(
          JSON.stringify({ error: "Could not parse multipart form data." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!file || typeof file === "string") {
        return new Response(
          JSON.stringify({ error: "No file provided in form data." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // ── Text extraction ──────────────────────────────────────────────────
      let extractedText = "";

      if (file.type === "application/pdf") {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          extractedText = await parsePdf(buffer);
        } catch (e) {
          extractedText = "Document text unreadable, analyze metadata only.";
        }
      } else {
        // Image / unknown — provide rich metadata for Groq to reason on
        extractedText =
          `Document Name: ${file.name}\n` +
          `MIME Type: ${file.type}\n` +
          `File Size: ${file.size} bytes\n` +
          `Last Modified: ${new Date(file.lastModified).toISOString()}\n\n` +
          `This appears to be an image document submitted as part of a verification case. ` +
          `Analyze likely fraud signals based on file metadata and typical patterns for this document type.`;
      }

      // Truncate to stay within token limits
      if (extractedText.length > 14000) {
        extractedText = extractedText.substring(0, 14000) + "\n...[truncated]";
      }

      // ── Groq API call ────────────────────────────────────────────────────
      let groq: any;
      try {
        groq = await getGroq();
      } catch (initErr: any) {
        console.error("[analyze-document] Groq init failed:", initErr);
        return new Response(
          JSON.stringify({ error: "Groq client initialization failed: " + initErr.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      let rawContent = "{}";
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an expert case Document Fraud Analyst for an Indian bank.
Analyze the provided document text or metadata for inconsistencies, tampering, or fraud signals.
You MUST return ONLY a valid JSON object matching this exact schema — no markdown, no extra text:
{
  "tamperScore": <integer 1-100, higher = more suspicious>,
  "flags": [<short label strings like "Income Mismatch", "Metadata Edited", "Font Anomaly">],
  "reasons": [<detailed sentences explaining each flag>]
}`,
            },
            {
              role: "user",
              content: extractedText,
            },
          ],
        });
        rawContent = completion.choices[0]?.message?.content ?? "{}";
      } catch (apiErr: any) {
        console.error("[analyze-document] Groq API call failed:", apiErr);
        return new Response(
          JSON.stringify({ error: "Groq API call failed: " + apiErr.message }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      // ── Safe JSON parse with markdown strip ──────────────────────────────
      let result: any = {};
      try {
        const cleaned = cleanJsonResponse(rawContent);
        result = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("[analyze-document] JSON parse failed. Raw:", rawContent);
        // Return a safe fallback so the client doesn't hang
        result = {
          tamperScore: 50,
          flags: ["Parse Error"],
          reasons: ["The AI response could not be parsed. The document may still warrant manual review."],
        };
      }

      // Validate and sanitize the result shape
      const safe = {
        tamperScore: typeof result.tamperScore === "number"
          ? Math.max(1, Math.min(100, Math.round(result.tamperScore)))
          : 50,
        flags: Array.isArray(result.flags)
          ? result.flags.filter((f: any) => typeof f === "string")
          : [],
        reasons: Array.isArray(result.reasons)
          ? result.reasons.filter((r: any) => typeof r === "string")
          : [],
      };

      return new Response(JSON.stringify(safe), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error: any) {
      // Final catch-all — never hang the client
      console.error("[analyze-document] Unhandled error:", error);
      return new Response(
        JSON.stringify({ error: error?.message ?? "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
