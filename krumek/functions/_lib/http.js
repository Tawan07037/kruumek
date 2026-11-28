export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

export function errorResponse(message, status = 400, code = "BAD_REQUEST") {
  return jsonResponse({ success: false, error: { code, message } }, status);
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("Origin");
  const expectedOrigin = new URL(request.url).origin;

  // Browser state-changing requests must provide an exact same-origin Origin.
  if (!origin || origin !== expectedOrigin) {
    const error = new Error("คำขอไม่ได้มาจากเว็บไซต์เดียวกัน");
    error.status = 403;
    error.code = "ORIGIN_REJECTED";
    throw error;
  }
}

export async function readJson(request, maxBytes = 16_000) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const error = new Error("ต้องส่งข้อมูลแบบ application/json");
    error.status = 415;
    error.code = "UNSUPPORTED_MEDIA_TYPE";
    throw error;
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > maxBytes) {
    const error = new Error("ข้อมูลมีขนาดใหญ่เกินกำหนด");
    error.status = 413;
    error.code = "PAYLOAD_TOO_LARGE";
    throw error;
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    const error = new Error("ข้อมูลมีขนาดใหญ่เกินกำหนด");
    error.status = 413;
    error.code = "PAYLOAD_TOO_LARGE";
    throw error;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    const error = new Error("รูปแบบ JSON ไม่ถูกต้อง");
    error.status = 400;
    error.code = "INVALID_JSON";
    throw error;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    const error = new Error("ข้อมูลที่ส่งมาต้องเป็น JSON Object");
    error.status = 400;
    error.code = "INVALID_BODY";
    throw error;
  }
  return data;
}

export function cleanText(value, maxLength) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > maxLength) return null;
  return text;
}

export function makeId() {
  return crypto.randomUUID();
}
