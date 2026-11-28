import { jsonResponse, errorResponse } from "../../_lib/http.js";

export async function onRequestGet({ env }) {
  if (!env.DB) {
    return errorResponse("ฐานข้อมูลยังไม่ได้เชื่อมต่อ", 503, "DATABASE_NOT_CONFIGURED");
  }

  try {
    const result = await env.DB.prepare(`
      SELECT id, title, content, published_at
      FROM announcements
      WHERE status = ?
      ORDER BY published_at DESC
      LIMIT 50
    `).bind("published").all();

    return jsonResponse({ success: true, data: result.results || [] });
  } catch {
    return errorResponse("ไม่สามารถโหลดประกาศได้", 500, "DATABASE_ERROR");
  }
}
