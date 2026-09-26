/**
 * Vite dev-server middleware that intercepts POST /api/analyze-document
 * and handles it directly in Node — bypasses the SSR route which 404s in plain vite dev.
 */
import type { Plugin, ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";

// Load .env manually so GROQ_API_KEY is available in process.env inside the plugin
function loadDotenv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch { /* .env not found, skip */ }
}
loadDotenv();

const _require = createRequire(import.meta.url);

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseBoundary(contentType: string): string {
  const m = contentType.match(/boundary=([^\s;]+)/i);
  return m ? m[1] : "";
}

interface ParsedFile {
  name: string;
  type: string;
  data: Buffer;
  size: number;
  lastModified: number;
}

function parseMultipart(body: Buffer, boundary: string): ParsedFile | null {
  const sep = Buffer.from("--" + boundary);
  let start = 0;
  while (true) {
    const idx = body.indexOf(sep, start);
    if (idx === -1) break;
    const next = body.indexOf(sep, idx + sep.length);
    const part = body.subarray(idx + sep.length, next === -1 ? body.length : next);
    if (part.length <= 4) { start = idx + sep.length; continue; }

    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) { start = idx + sep.length; continue; }

    const headers = part.subarray(0, headerEnd).toString("utf8");
    const data = part.subarray(headerEnd + 4, part.length - 2);

    const nameM = headers.match(/name="([^"]+)"/i);
    const fnameM = headers.match(/filename="([^"]+)"/i);
    const ctM = headers.match(/Content-Type:\s*([^\r\n]+)/i);

    if (nameM?.[1] === "file" && fnameM) {
      return {
        name: fnameM[1],
        type: ctM?.[1]?.trim() ?? "application/octet-stream",
        data,
        size: data.length,
        lastModified: Date.now(),
      };
    }
    start = idx + sep.length;
    if (next === -1) break;
  }
  return null;
}

async function extractText(file: ParsedFile): Promise<string> {
  if (file.type === "application/pdf") {
    try {
      const pdfParse = _require("pdf-parse");
      const result = await pdfParse(file.data);
      const text = result.text?.trim();
      if (text && text.length > 10) return text;
      return "PDF text extraction returned empty content. Analyze metadata only.";
    } catch (e) {
      console.error("[vite-api] PDF parse error:", e);
      return "Document text unreadable. Analyze metadata only.";
    }
  }
  return (
    `Document Name: ${file.name}\n` +
    `MIME Type: ${file.type}\n` +
    `File Size: ${file.size} bytes\n` +
    `Last Modified: ${new Date(file.lastModified).toISOString()}\n\n` +
    `This is an image-type document submitted for Indian loan application fraud analysis. ` +
    `Analyze typical fraud signals for this file type based on metadata.`
  );
}

function jsonError(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}

export function analyzeDocumentPlugin(): Plugin {
  return {
    name: "analyze-document-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/api/analyze-document",
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.method !== "POST") return next();

          const apiKey = process.env.GROQ_API_KEY ?? "";
          if (!apiKey) {
            return jsonError(res, 500, "GROQ_API_KEY not configured in .env");
          }

          try {
            const ct = req.headers["content-type"] ?? "";
            const boundary = parseBoundary(ct);
            if (!boundary) return jsonError(res, 400, "Missing multipart boundary");

            const body = await readBody(req);
            const file = parseMultipart(body, boundary);
            if (!file) return jsonError(res, 400, "No file field found in form data");

            let text = await extractText(file);
            if (text.length > 14000) text = text.substring(0, 14000) + "\n...[truncated]";

            // Call Groq REST API directly (avoids ESM/CJS issues)
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                temperature: 0.1,
                response_format: { type: "json_object" },
                messages: [
                  {
                    role: "system",
                    content:
                      `You are an expert Loan Document Fraud Analyst for an Indian bank.\n` +
                      `Analyze the provided document text or metadata for signs of tampering, forgery, or fraud.\n` +
                      `Return ONLY a valid JSON object — no markdown, no extra text — matching this exact schema:\n` +
                      `{\n` +
                      `  "tamperScore": <integer 1-100, where 100 = definitely tampered>,\n` +
                      `  "flags": [<short label strings, e.g. "Income Mismatch", "Font Anomaly", "Metadata Edited">],\n` +
                      `  "reasons": [<detailed sentence for each flag>\n` +
                      `]`,
                  },
                  { role: "user", content: text },
                ],
              }),
            });

            if (!groqRes.ok) {
              const errText = await groqRes.text();
              console.error("[vite-api] Groq responded with error:", groqRes.status, errText);
              return jsonError(res, 502, `Groq API error: ${groqRes.status}`);
            }

            const groqData = await groqRes.json() as any;
            const rawContent: string = groqData.choices?.[0]?.message?.content ?? "{}";

            // Strip markdown fences if model added them despite json_object mode
            const cleaned = rawContent.replace(/```(?:json)?|```/g, "").trim();

            let parsed: any = {};
            try {
              parsed = JSON.parse(cleaned);
            } catch {
              parsed = {
                tamperScore: 50,
                flags: ["Parse Error"],
                reasons: ["AI response could not be parsed. Manual review recommended."],
              };
            }

            const safe = {
              tamperScore:
                typeof parsed.tamperScore === "number"
                  ? Math.max(1, Math.min(100, Math.round(parsed.tamperScore)))
                  : 50,
              flags: Array.isArray(parsed.flags)
                ? parsed.flags.filter((f: any) => typeof f === "string")
                : [],
              reasons: Array.isArray(parsed.reasons)
                ? parsed.reasons.filter((r: any) => typeof r === "string")
                : [],
            };

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(safe));
          } catch (err: any) {
            console.error("[vite-api] Unhandled error:", err);
            return jsonError(res, 500, err?.message ?? "Internal server error");
          }
        }
      );
    },
  };
}
