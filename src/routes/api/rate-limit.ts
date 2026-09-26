import { createAPIFileRoute } from "@tanstack/start/api";

const ipRequests = new Map<string, { count: number; resetTime: number }>();

export const APIRoute = createAPIFileRoute("/api/rate-limit")({
  GET: async ({ request }: { request: Request }) => {
    // In a real app we would use headers like x-forwarded-for, but for this mock we'll use a fixed key
    const ip = request.headers.get("x-forwarded-for") || "local-ip";
    const now = Date.now();

    let record = ipRequests.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + 60 * 1000 };
    }

    record.count++;
    ipRequests.set(ip, record);

    if (record.count > 10) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, count: record.count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
